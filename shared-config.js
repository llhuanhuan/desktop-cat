/**
 * Desktop Cat - 共享配置模块
 *
 * 所有脚本通过此模块读取配置，避免硬编码。
 * 配置文件位置: ~/.desktop-cat/config.json
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.desktop-cat');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 默认配置
const DEFAULTS = {
  port: 18923,
  windowWidth: 300,
  windowHeight: 300,
  autoLaunch: true,
  soundEnabled: true,
  dndMode: false
};

// 配置缓存
let configCache = null;
let configMtime = 0;

// 重置缓存（用于测试）
function __resetCache() {
  configCache = null;
  configMtime = 0;
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const stat = fs.statSync(CONFIG_FILE);
      if (configCache && stat.mtimeMs === configMtime) return configCache;
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      configCache = JSON.parse(content);
      configMtime = stat.mtimeMs;
      return configCache;
    }
  } catch {
    // JSON 解析失败时清除缓存
    configCache = null;
    configMtime = 0;
  }
  return {};
}

function getConfig(key) {
  const config = loadConfig();
  return config[key] !== undefined ? config[key] : DEFAULTS[key];
}

function getAllConfig() {
  const config = loadConfig();
  return { ...DEFAULTS, ...config };
}

function saveConfig(updates) {
  const config = { ...loadConfig(), ...updates };
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    // 更新缓存
    configCache = config;
    configMtime = Date.now();
  } catch (e) {
    console.error('[Desktop Cat] Failed to save config:', e.message);
  }
}

// 清理乱码：移除控制字符和替换字符
function sanitizeText(text) {
  if (!text) return '';
  return String(text).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/g, '').trim();
}

// 格式化历史记录
function formatHistoryItem(item, index) {
  const proj = item.project ? `[${item.project}] ` : '';
  return `${index + 1}. ${item.time} ${proj}${item.detail || item.state}`;
}

module.exports = { CONFIG_DIR, CONFIG_FILE, DEFAULTS, loadConfig, getConfig, getAllConfig, saveConfig, sanitizeText, formatHistoryItem, __resetCache };

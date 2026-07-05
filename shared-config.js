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
  soundEnabled: true
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch {}
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
  } catch (e) {
    console.error('[Desktop Cat] Failed to save config:', e.message);
  }
}

module.exports = { CONFIG_DIR, CONFIG_FILE, DEFAULTS, loadConfig, getConfig, getAllConfig, saveConfig };

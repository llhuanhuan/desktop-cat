#!/usr/bin/env node
/**
 * Desktop Cat - Claude Code Hook 安装脚本
 *
 * 自动将 hook 注册到 Claude Code 的配置中
 * 运行一次即可，之后 Claude Code 会自动调用 hook
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK_SCRIPT = path.join(__dirname, 'clawd-hook.js');
const CLAUDE_SETTINGS_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_FILE = path.join(CLAUDE_SETTINGS_DIR, 'settings.json');

// 需要注册的事件列表
const EVENTS = [
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Stop',
  'StopFailure',
  'SubagentStart',
  'SubagentStop',
  'PreCompact',
  'PostCompact',
  'Notification',
  'SessionEnd'
];

function install() {
  console.log('🐱 Desktop Cat Hook 安装程序');
  console.log('================================');
  console.log(`Hook 脚本: ${HOOK_SCRIPT}`);
  console.log(`配置文件: ${SETTINGS_FILE}`);
  console.log('');

  // 确保目录存在
  if (!fs.existsSync(CLAUDE_SETTINGS_DIR)) {
    fs.mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
    console.log('✅ 创建 .claude 目录');
  }

  // 读取现有配置
  let settings = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      console.log('📄 读取现有配置');
    } catch (e) {
      console.warn('⚠️  现有配置解析失败，将创建新配置');
    }
  }

  // 确保 hooks 对象存在
  if (!settings.hooks) settings.hooks = {};

  // 注册每个事件
  let registered = 0;
  for (const event of EVENTS) {
    const hookEntry = {
      command: `node "${HOOK_SCRIPT}" ${event}`,
      timeout: 5000
    };

    // 检查是否已注册
    const existing = settings.hooks[event];
    if (Array.isArray(existing)) {
      // 检查是否已有相同的 hook
      const alreadyExists = existing.some(h => h.command && h.command.includes('clawd-hook.js'));
      if (alreadyExists) {
        console.log(`⏭️  ${event}: 已注册`);
        continue;
      }
      existing.push(hookEntry);
    } else {
      settings.hooks[event] = [hookEntry];
    }

    registered++;
    console.log(`✅ ${event}: 已注册`);
  }

  // 写入配置
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');

  console.log('');
  console.log(`🎉 完成！新注册 ${registered} 个事件`);
  console.log('');
  console.log('使用方法:');
  console.log('  1. 启动桌面猫咪: npm start');
  console.log('  2. 在 Claude Code 中执行任务');
  console.log('  3. 猫咪会自动切换状态');
}

function uninstall() {
  console.log('🐱 Desktop Cat Hook 卸载程序');
  console.log('================================');

  if (!fs.existsSync(SETTINGS_FILE)) {
    console.log('❌ 配置文件不存在');
    return;
  }

  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    console.log('❌ 配置文件解析失败');
    return;
  }

  if (!settings.hooks) {
    console.log('❌ 没有找到 hooks 配置');
    return;
  }

  let removed = 0;
  for (const event of EVENTS) {
    if (!Array.isArray(settings.hooks[event])) continue;

    const before = settings.hooks[event].length;
    settings.hooks[event] = settings.hooks[event].filter(
      h => !h.command || !h.command.includes('clawd-hook.js')
    );

    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }

    removed += before - settings.hooks[event].length;
  }

  // 如果 hooks 对象为空，删除它
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  console.log(`🗑️  已移除 ${removed} 个 hook`);
}

// 主程序
const action = process.argv[2];
if (action === 'uninstall' || action === '--uninstall') {
  uninstall();
} else {
  install();
}

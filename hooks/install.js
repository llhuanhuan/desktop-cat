#!/usr/bin/env node
/**
 * Desktop Cat - Claude Code Hook 安装脚本
 *
 * 自动将 hook 注册到 Claude Code 的配置中
 * 使用 Claude Code 新格式（matcher + hooks 数组）
 *
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

// Claude Code 新格式的 hook 条目
function makeHookEntry(event) {
  return {
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `node "${HOOK_SCRIPT}" ${event}`,
        timeout: 5000
      }
    ]
  };
}

// 检查某个条目是否包含 clawd-hook
function isClawdHook(entry) {
  // 新格式：entry.hooks 数组内有 command 包含 clawd-hook.js
  if (Array.isArray(entry.hooks)) {
    return entry.hooks.some(h => h.command && h.command.includes('clawd-hook.js'));
  }
  // 旧格式：直接有 command 字段
  return entry.command && entry.command.includes('clawd-hook.js');
}

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
    const existing = settings.hooks[event];

    if (Array.isArray(existing)) {
      // 先移除旧格式的 clawd-hook 条目（直接 command 字段的旧格式）
      const before = existing.length;
      settings.hooks[event] = existing.filter(h => !isClawdHook(h));
      const removed = before - settings.hooks[event].length;

      // 检查新格式是否已存在
      const alreadyExists = settings.hooks[event].some(h => isClawdHook(h));
      if (alreadyExists) {
        console.log(`⏭️  ${event}: 已注册`);
        continue;
      }

      // 追加新格式条目
      settings.hooks[event].push(makeHookEntry(event));
      registered++;
      console.log(`✅ ${event}: 已注册${removed > 0 ? '（清理旧格式）' : ''}`);
    } else {
      // 事件不存在，直接创建
      settings.hooks[event] = [makeHookEntry(event)];
      registered++;
      console.log(`✅ ${event}: 已注册`);
    }
  }

  // 写入配置（原子写入：先写临时文件，再重命名）
  const tmpFile = SETTINGS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(settings, null, 2), 'utf8');
  fs.renameSync(tmpFile, SETTINGS_FILE);

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
    settings.hooks[event] = settings.hooks[event].filter(h => !isClawdHook(h));

    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }

    removed += before - (settings.hooks[event] ? settings.hooks[event].length : 0);
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  // 写入配置（原子写入：先写临时文件，再重命名）
  const tmpFile = SETTINGS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(settings, null, 2), 'utf8');
  fs.renameSync(tmpFile, SETTINGS_FILE);
  console.log(`🗑️  已移除 ${removed} 个 hook`);
}

// 主程序
const action = process.argv[2];
if (action === 'uninstall' || action === '--uninstall') {
  uninstall();
} else {
  install();
}

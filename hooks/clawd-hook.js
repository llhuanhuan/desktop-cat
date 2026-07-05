#!/usr/bin/env node
/**
 * Desktop Cat - Claude Code Hook 脚本
 *
 * Claude Code 会在特定事件时调用此脚本
 * 读取 stdin 的 JSON 数据，提取事件类型，POST 到本地桌面猫咪服务器
 *
 * 用法：node clawd-hook.js <event_name>
 * stdin: JSON { "session_id": "...", ... }
 */

const http = require('http');
const { getConfig } = require('../shared-config');

const PORT = getConfig('port');
const TIMEOUT_MS = 500;

// Claude Code 事件 → 猫咪状态映射（完整版 - 8 个状态全部使用）
const STATE_MAP = {
  // 会话事件 - 使用 waking/sleeping 状态
  'SessionStart': 'waking',      // 会话开始：唤醒猫咪
  'SessionEnd': 'sleeping',      // 会话结束：猫咪睡觉

  // 用户输入 - 思考状态
  'UserPromptSubmit': 'thinking',

  // 工具调用事件 - 工作状态
  'PreToolUse': 'working',
  'PostToolUse': 'working',
  'PostToolUseFailure': 'error',

  // 任务完成事件 - 开心状态
  'Stop': 'happy',
  'StopFailure': 'error',

  // 子代理事件 - 细化状态
  'SubagentStart': 'thinking',   // 子代理开始：思考中
  'SubagentStop': 'working',     // 子代理停止：继续工作

  // 压缩事件
  'PreCompact': 'working',
  'PostCompact': 'happy',

  // 通知事件 - 使用专门的通知状态
  'Notification': 'notification',

  // API 调用 - 思考状态
  'PreApiCall': 'thinking',
  'PostApiCall': 'thinking',

  // 文件操作 - 工作状态
  'FileRead': 'working',
  'FileWrite': 'working',

  // 搜索操作 - 工作状态
  'SearchStart': 'working',
  'SearchEnd': 'working'
};

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    const timeout = setTimeout(() => resolve(data), TIMEOUT_MS);

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(data);
    });
    process.stdin.on('error', () => {
      clearTimeout(timeout);
      resolve(data);
    });
  });
}

function postState(state, eventName, detail, project) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      state,
      event: eventName,
      detail: detail || '',
      project: project || '',
      timestamp: Date.now()
    });

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/state',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 500
    }, (res) => {
      res.resume();
      resolve(true);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const eventName = process.argv[2];
  if (!eventName) return;

  const state = STATE_MAP[eventName];
  if (!state) return; // 未知事件忽略

  // 读取 stdin 获取详情
  const stdinData = await readStdin();
  let detail = '';
  let project = '';
  try {
    const data = JSON.parse(stdinData);

    // 提取有用的详情信息
    if (data.tool_name) {
      detail = data.tool_name;
    } else if (data.message) {
      detail = String(data.message).slice(0, 80);
    } else if (data.summary) {
      detail = String(data.summary).slice(0, 80);
    } else if (data.content) {
      detail = String(data.content).slice(0, 80);
    }

    // 提取项目路径 (cwd 字段)
    if (data.cwd) {
      // 只取最后一级目录名作为项目名
      const parts = data.cwd.replace(/\\/g, '/').split('/');
      project = parts[parts.length - 1] || data.cwd;
    }

    // 调试：打印接收到的数据
    console.log('[clawd-hook] Received:', JSON.stringify(data));
    console.log('[clawd-hook] Extracted:', { detail, project });
  } catch {}

  await postState(state, eventName, detail, project);
}

main().catch(() => {});

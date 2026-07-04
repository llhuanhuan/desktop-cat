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

const PORT = 18923;
const TIMEOUT_MS = 500;

// Claude Code 事件 → 猫咪状态映射
const STATE_MAP = {
  'SessionStart': 'idle',
  'UserPromptSubmit': 'thinking',
  'PreToolUse': 'working',
  'PostToolUse': 'working',
  'PostToolUseFailure': 'error',
  'Stop': 'happy',
  'StopFailure': 'error',
  'SubagentStart': 'working',
  'SubagentStop': 'working',
  'PreCompact': 'working',
  'PostCompact': 'happy',
  'Notification': 'happy',
  'SessionEnd': 'idle'
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

function postState(state, eventName, detail) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      state,
      event: eventName,
      detail: detail || '',
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
  try {
    const data = JSON.parse(stdinData);
    // 提取有用的详情信息
    if (data.tool_name) detail = data.tool_name;
    else if (data.message) detail = String(data.message).slice(0, 50);
  } catch {}

  await postState(state, eventName, detail);
}

main().catch(() => {});

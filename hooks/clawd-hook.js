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
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 200;

// Claude Code 事件 → 猫咪状态映射
const STATE_MAP = {
  'SessionStart': 'waking',
  'SessionEnd': 'sleeping',
  'UserPromptSubmit': 'thinking',
  'PreToolUse': 'working',
  'PostToolUse': 'working',
  'PostToolUseFailure': 'error',
  'Stop': 'happy',
  'StopFailure': 'error',
  'SubagentStart': 'thinking',
  'SubagentStop': 'working',
  'PreCompact': 'working',
  'PostCompact': 'happy',
  'Notification': 'notification',
  'PreApiCall': 'thinking',
  'PostApiCall': 'thinking',
  'FileRead': 'working',
  'FileWrite': 'working',
  'SearchStart': 'working',
  'SearchEnd': 'working'
};

async function readStdin() {
  return new Promise((resolve) => {
    let chunks = [];
    const timeout = setTimeout(() => resolve(Buffer.concat(chunks).toString('utf8')), TIMEOUT_MS);

    process.stdin.on('data', (chunk) => { chunks.push(Buffer.from(chunk)); });
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    process.stdin.on('error', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
}

// 清理乱码：移除非 printable 字符，保留中文、日韩、emoji 等
function sanitizeText(text) {
  if (!text) return '';
  // 保留可打印 ASCII、中文(CJK)、日韩、emoji、常用标点
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // 移除控制字符（保留 \t \n \r）
    .replace(/[\uFFFD]/g, '') // 移除 Unicode 替换字符
    .trim();
}

function postState(state, eventName, detail, project, attempt = 1) {
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
      timeout: TIMEOUT_MS
    }, (res) => {
      res.resume();
      resolve(true);
    });

    req.on('error', () => {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          postState(state, eventName, detail, project, attempt + 1).then(resolve);
        }, RETRY_DELAY_MS * attempt);
      } else {
        resolve(false);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          postState(state, eventName, detail, project, attempt + 1).then(resolve);
        }, RETRY_DELAY_MS * attempt);
      } else {
        resolve(false);
      }
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  const eventName = process.argv[2];
  if (!eventName) return;

  const state = STATE_MAP[eventName];
  if (!state) return;

  const stdinData = await readStdin();
  let detail = '';
  let project = '';
  try {
    const data = JSON.parse(stdinData);

    if (data.tool_name) {
      detail = sanitizeText(data.tool_name);
    } else if (data.message) {
      detail = sanitizeText(String(data.message).slice(0, 80));
    } else if (data.summary) {
      detail = sanitizeText(String(data.summary).slice(0, 80));
    } else if (data.content) {
      detail = sanitizeText(String(data.content).slice(0, 80));
    }

    if (data.cwd) {
      const parts = data.cwd.replace(/\\/g, '/').split('/');
      project = parts[parts.length - 1] || data.cwd;
    }
  } catch {}

  await postState(state, eventName, detail, project);
}

main().catch(() => {});

#!/usr/bin/env node
/**
 * Claude Code 钩子脚本
 * 在 Claude Code 任务完成后调用此脚本发送通知
 *
 * 使用方法：
 * 1. 直接调用：node claude-hook.js "任务完成消息"
 * 2. 配置为 Claude Code 的钩子（如果支持）
 */

const http = require('http');
const path = require('path');

const message = process.argv[2] || 'Claude Code 任务已完成！';
const project = process.argv[3] || path.basename(process.cwd());

const data = JSON.stringify({ message, project });

const options = {
  hostname: 'localhost',
  port: 18923,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString();
  });
  res.on('end', () => {
    console.log('✅ 通知已发送:', message);
  });
});

req.on('error', (err) => {
  console.error('❌ 发送失败:', err.message);
  console.log('请确保桌面宠物正在运行');
});

req.write(data);
req.end();

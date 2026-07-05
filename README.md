# Desktop Cat 🐱

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-43-blue.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)](https://github.com)
[![Build](https://github.com/llhuanhuan/desktop-cat/actions/workflows/release.yml/badge.svg)](https://github.com/llhuanhuan/desktop-cat/actions/workflows/release.yml)

> A cute pixel-art desktop cat that lives on your screen and reacts to [Claude Code](https://docs.anthropic.com/en/docs/claude-code) in real-time.

一只可爱的像素风桌面猫咪，会实时反映 Claude Code 的工作状态。

---

[English](#features) · [中文](#功能特性)

## 猫咪展示

<p align="center">
  <img src="renderer/assets/cat-showcase.png" alt="Desktop Cat" width="200">
</p>

8 种像素风橘猫状态，随 Claude Code 工作流自动切换：

| | | | |
|:---:|:---:|:---:|:---:|
| ![idle](renderer/assets/cat/processed/idle.png) | ![happy](renderer/assets/cat/processed/happy.png) | ![thinking](renderer/assets/cat/processed/thinking.png) | ![working](renderer/assets/cat/processed/working.png) |
| **idle** 空闲 | **happy** 任务完成 | **thinking** 思考中 | **working** 工作中 |
| ![sleeping](renderer/assets/cat/processed/sleeping.png) | ![waking](renderer/assets/cat/processed/waking.png) | ![error](renderer/assets/cat/processed/error.png) | ![notification](renderer/assets/cat/processed/notification.png) |
| **sleeping** 睡觉 | **waking** 唤醒 | **error** 出错 | **notification** 通知 |

## Features / 功能特性

> **English** | [中文说明见下方](#功能特性-1)

- 🐱 **8 pixel-art states** — idle, happy, sleeping, thinking, working, error, notification, waking
- 🔗 **Claude Code integration** — real-time state sync via hooks
- 🎵 **Sound effects** — meow, purr, happy sounds (right-click to toggle)
- ✨ **Particle effects** — hearts, stars, sparkles
- 💬 **Speech bubbles** — state messages with project name & details
- 🖱️ **Drag & drop** — position auto-saved
- 📌 **Click-through** — transparent areas pass clicks to windows below
- 🌙 **Do Not Disturb** — suppress bubbles & random actions
- 📋 **Notification history** — last 50 events
- 📝 **Persistent logs** — `~/.desktop-cat/logs/`
- 🚀 **Auto-launch** — toggle from tray menu
- 🔒 **Single instance** — prevents duplicate runs

### Quick Start

**Option A: Download exe (easiest)**

Download the latest `.exe` from [Releases](https://github.com/llhuanhuan/desktop-cat/releases) and run.

**Option B: Build from source**

```bash
git clone https://github.com/llhuanhuan/desktop-cat.git
cd desktop-cat
npm install
npm start

# Register Claude Code hooks (one-time)
node hooks/install.js
```

### Interaction

| Action | Effect |
|--------|--------|
| Click cat | Kiss + heart particles |
| Double-click | Toggle sleep |
| Drag cat | Move position |
| Right-click | Toggle sound |
| Hover | Show "喵？" bubble |
| Tray right-click | Menu (show/hide, test, DND, auto-launch, quit) |

---

## 功能特性

- 🐱 **8 种状态动画** — idle / happy / sleeping / thinking / working / error / notification / waking
- 🔗 **Claude Code 深度集成** — 通过 Hook 实时感知 Claude Code 的工作状态
- 🎵 **音效系统** — 猫叫、呼噜声、开心音效，右键切换开关
- ✨ **粒子效果** — 爱心、星星、闪光动画
- 💬 **气泡消息** — 状态提示 + 项目名 + 详情
- 🖱️ **拖拽移动** — 鼠标拖拽自由摆放，位置自动保存
- 📌 **点击穿透** — 默认穿透到下层窗口，悬停时才响应交互
- 🌙 **免打扰模式** — 托盘菜单切换，静默但保留动画
- 📋 **通知历史** — 记录最近 50 条通知
- 📝 **日志持久化** — 运行日志写入 `~/.desktop-cat/logs/`
- 🚀 **开机自启动** — 托盘菜单一键切换
- 🔒 **单实例锁** — 防止重复启动

## 安装

### 方式一：下载 exe（推荐）

从 [Releases](https://github.com/llhuanhuan/desktop-cat/releases) 下载最新版 `.exe` 安装包，双击运行即可。

### 方式二：源码运行

```bash
git clone https://github.com/llhuanhuan/desktop-cat.git
cd desktop-cat
npm install
npm start
```

## 使用

### 启动

```bash
npm start
```

### 配置 Claude Code Hook

```bash
# 安装 hook（推荐，只需运行一次）
node hooks/install.js

# 卸载 hook
node hooks/install.js uninstall
```

安装后，Claude Code 在执行任务时会自动通知猫咪切换状态。

### 手动发送通知

```bash
node claude-hook.js "任务描述"
```

### API 调用

```bash
# 健康检查
curl http://localhost:18923/health

# 发送状态通知
curl -X POST http://localhost:18923/state \
  -H "Content-Type: application/json" \
  -d '{"state":"happy","event":"test","detail":"测试完成","project":"my-project"}'
```

## 交互操作

| 操作 | 效果 |
|------|------|
| 点击猫咪 | 亲亲 + 爱心粒子 |
| 双击猫咪 | 切换睡眠/唤醒 |
| 拖拽猫咪 | 移动位置 |
| 右键猫咪 | 切换音效开关 |
| 悬停猫咪 | 显示 `喵？` 气泡 |
| 托盘右键 | 菜单（显示/隐藏、测试通知、免打扰、自启动、退出） |

## 配置

配置文件：`~/.desktop-cat/config.json`（首次运行自动创建）

```json
{
  "port": 18923,
  "windowWidth": 300,
  "windowHeight": 300,
  "autoLaunch": true,
  "soundEnabled": true,
  "dndMode": false
}
```

## Claude Code 事件映射

| 事件 | 猫咪状态 |
|------|---------|
| SessionStart | 🌅 waking |
| SessionEnd | 😴 sleeping |
| UserPromptSubmit | 🤔 thinking |
| PreToolUse / PostToolUse | 💻 working |
| PostToolUseFailure | ❌ error |
| Stop | 😊 happy |
| StopFailure | ❌ error |
| Notification | 📬 notification |

## 项目结构

```
desktop-cat/
├── main.js                 # Electron 主进程
├── preload.js              # 预加载脚本（IPC 桥接）
├── shared-config.js        # 共享配置模块
├── claude-hook.js          # 手动通知脚本
├── hooks/
│   ├── clawd-hook.js       # Claude Code 事件 hook（自动重试）
│   └── install.js          # Hook 安装/卸载工具
├── scripts/
│   └── generate-icon.js    # 托盘图标生成器
├── renderer/
│   ├── index.html          # 主页面
│   ├── style.css           # 样式 + 动画
│   ├── app.js              # 渲染进程逻辑
│   └── assets/
│       ├── cat/processed/  # 8 种状态 PNG
│       └── sounds/         # 音效文件
└── package.json
```

## 故障排除

### 通知不生效

1. 确认 Desktop Cat 正在运行：`curl http://localhost:18923/health`
2. 重新安装 hook：`node hooks/install.js`
3. 检查日志：`~/.desktop-cat/logs/`

### 端口被占用

修改 `~/.desktop-cat/config.json` 中的 `port` 值，或关闭占用端口的程序。

### 猫咪不在屏幕内

拖拽到可见区域，或删除 `~/.desktop-cat/config.json` 中的 `x`/`y` 字段重启。

## 许可证

MIT

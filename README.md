# Desktop Cat 🐱

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-43-blue.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)](https://github.com)

> A cute pixel-art desktop cat that lives on your screen, reacts to [Claude Code](https://docs.anthropic.com/en/docs/claude-code) in real-time, and has a rich interactive system with achievements and easter eggs.

一只可爱的像素风桌面猫咪，实时反映 Claude Code 工作状态，拥有丰富的互动系统、成就解锁和彩蛋。

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

### Core / 核心功能
- 🐱 **8 pixel-art states** — idle, happy, sleeping, thinking, working, error, notification, waking
- 🔗 **Claude Code integration** — real-time state sync via hooks
- 🎵 **Sound effects** — 21 sounds (meow, purr, happy, etc.), right-click to toggle
- ✨ **Particle effects** — hearts, stars, sparkles
- 💬 **Speech bubbles** — state messages with project name & details
- 🖱️ **Drag & drop** — position auto-saved, multi-monitor support
- 📌 **Click-through** — transparent areas pass clicks to windows below
- 🌙 **Do Not Disturb** — suppress bubbles & random actions
- 📋 **Notification history** — last 50 events
- 📝 **Persistent logs** — `~/.desktop-cat/logs/`
- 🚀 **Auto-launch** — toggle from tray menu
- 🔒 **Single instance** — prevents duplicate runs

### 🆕 Interactive System / 互动系统
- 👆 **Click zones** — head (hearts + purr) vs body (stretch + meow)
- 🔢 **Click counter** — 4 clicks = annoyed ("别摸了啦..."), 7 clicks = angry (shake animation)
- ⏱️ **Long press** — hold 1.5s to put cat to sleep
- 🖱️ **Hover tail wag** — gentle swaying animation on hover
- 🐾 **Paw prints** — mouse movement leaves paw trails that fade in 3s

### 🆕 Achievement System / 成就系统
- 🏆 **13 achievements** — task milestones, pet count streaks, time-based challenges
- 👑 **10 accessories** — crown, halo, glasses, scarf, bow, bell, coffee, fish, etc.
- 🎒 **5 accessory slots** — head, face, neck, hand, back
- 💾 **Persistent storage** — `~/.desktop-cat/achievements.json`
- 🎊 **Unlock notifications** — toast + sparkle particles

### 🆕 Animations & Effects / 动画特效
- 🔄 **State transitions** — smooth scale/fade between states
- 😴 **Sleep bob** — gentle floating when sleeping
- 🤔 **Think wobble** — slight head tilt when thinking
- 💻 **Work bounce** — subtle typing vibration
- 😸 **Happy bounce** — joyful jumping on task complete

### 🆕 Environment Awareness / 环境感知
- 🕐 **Time-based bubbles** — different messages for morning/noon/evening/late night
- 🎄 **Holiday detection** — special greetings on holidays
- 💤 **Idle detection** — cat plays/sleeps after 5 min of inactivity
- 🌙 **Ambient particles** — sparkles in daytime, stars at night

### 🆕 Easter Eggs / 彩蛋系统
- 🫠 **Liquid cat** — hold 5 seconds, cat melts into liquid
- 🥰 **Belly flop** — 10% chance on double-click, cat shows belly
- 🔥 **Perfect streak** — 10 consecutive tasks without error = fireworks
- 💕 **Pet milestone** — 100 head pats = special love message
- 🎆 **Holiday trigger** — special effects on holidays

---

## 功能特性

### 核心功能
- 🐱 **8 种状态动画** — idle / happy / sleeping / thinking / working / error / notification / waking
- 🔗 **Claude Code 深度集成** — 通过 Hook 实时感知 Claude Code 的工作状态
- 🎵 **音效系统** — 21 种音效（猫叫、呼噜声、开心音效等），右键切换开关
- ✨ **粒子效果** — 爱心、星星、闪光动画
- 💬 **气泡消息** — 状态提示 + 项目名 + 详情
- 🖱️ **拖拽移动** — 鼠标拖拽自由摆放，位置自动保存，支持多显示器
- 📌 **点击穿透** — 默认穿透到下层窗口，悬停时才响应交互
- 🌙 **免打扰模式** — 托盘菜单切换，静默但保留动画
- 📋 **通知历史** — 记录最近 50 条通知
- 📝 **日志持久化** — 运行日志写入 `~/.desktop-cat/logs/`
- 🚀 **开机自启动** — 托盘菜单一键切换
- 🔒 **单实例锁** — 防止重复启动

### 🆕 互动系统
- 👆 **分区点击** — 头部（爱心 + 呼噜）vs 身体（伸懒腰 + 喵叫）
- 🔢 **连续点击** — 4 次不耐烦（"别摸了啦..."），7 次生气（甩尾巴动画）
- ⏱️ **长按入睡** — 按住 1.5 秒进入睡眠
- 🖱️ **悬停尾巴摆动** — 鼠标悬停时轻微左右摇摆
- 🐾 **猫爪印** — 鼠标移动留下爪印，3 秒后淡出

### 🆕 成就系统
- 🏆 **13 个成就** — 任务里程碑、摸头次数、时间段挑战
- 👑 **10 个配件** — 皇冠、光环、墨镜、围巾、蝴蝶结、铃铛、咖啡杯、小鱼干等
- 🎒 **5 个装备槽** — 头部、面部、颈部、手持、背部
- 💾 **持久化存储** — `~/.desktop-cat/achievements.json`
- 🎊 **解锁通知** — Toast 提示 + 闪光粒子特效

### 🆕 动画特效
- 🔄 **状态过渡动画** — 缩放渐变切换，消除硬切
- 😴 **睡眠浮动** — 轻微上下浮动
- 🤔 **思考摇晃** — 头部轻微摇晃
- 💻 **工作抖动** — 打字时的微小振动
- 😸 **开心弹跳** — 任务完成时的欢乐跳跃

### 🆕 环境感知
- 🕐 **时间段气泡** — 早安/午安/晚安/深夜不同问候
- 🎄 **节日检测** — 春节/元旦/情人节/国庆/圣诞特别祝福
- 💤 **空闲检测** — 5 分钟无操作，猫咪自己玩耍或睡觉
- 🌙 **环境粒子** — 白天闪烁，夜晚星星

### 🆕 彩蛋系统
- 🫠 **液体猫** — 长按 5 秒，猫咪变成液体
- 🥰 **翻肚皮** — 双击 10% 概率，展示肚皮 + 彩虹粒子
- 🔥 **完美连击** — 连续 10 次任务无错误 = 烟花特效
- 💕 **摸头里程碑** — 累计摸头 100 次 = 特别爱心消息
- 🎆 **节日触发** — 节日期间自动触发特效

---

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

### 配置 Claude Code Hook

```bash
# 安装 hook（推荐，只需运行一次）
node hooks/install.js

# 卸载 hook
node hooks/install.js uninstall
```

安装后，Claude Code 在执行任务时会自动通知猫咪切换状态。

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
| 点击猫头 | ❤️ 爱心 + 呼噜声 |
| 点击猫身 | ⭐ 星星 + 伸懒腰 |
| 连续点击 4 次 | 😤 "别摸了啦..." |
| 连续点击 7 次 | 😡 生气甩尾巴 |
| 长按 1.5 秒 | 😴 进入睡眠 |
| 双击 | 🔄 切换睡眠/唤醒（10% 概率翻肚皮彩蛋） |
| 拖拽 | 🖱️ 移动位置 |
| 右键 | 🔊 切换音效开关 |
| 悬停 | 🐱 尾巴摆动 + "喵？" |
| 移动鼠标（在猫身上） | 🐾 留下爪印 |
| 托盘右键 | 菜单（显示/隐藏、找回猫咪、免打扰、自启动、退出） |

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

成就文件：`~/.desktop-cat/achievements.json`

```json
{
  "unlocked": ["first_day", "night_owl"],
  "progress": {
    "task_count": 10,
    "pet_count": 25,
    "streak_days": 3,
    "consecutive_no_error": 5
  },
  "accessories": {
    "unlocked": ["coffee", "bow_blue"],
    "equipped": { "hand": "coffee" }
  }
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

## 成就列表

| 成就 | 条件 | 奖励配件 |
|------|------|---------|
| 🎉 初来乍到 | 首次使用 | — |
| 💛 忠实伙伴 | 连续使用 7 天 | 🧣 红围巾 |
| 👑 铁杆猫奴 | 连续使用 30 天 | 👑 皇冠 |
| ⚡ 小试牛刀 | 完成 10 个任务 | — |
| 🔥 百炼成钢 | 完成 100 个任务 | 😎 墨镜 |
| 💎 代码大师 | 完成 500 个任务 | 🦸 披风 |
| ✨ 完美主义者 | 连续 10 次无错误 | 😇 光环 |
| 🤗 猫咪挚友 | 摸头 50 次 | 🎀 蓝蝴蝶结 |
| 💖 猫咪恋人 | 摸头 100 次 | 🧙 巫师帽 |
| 💕 猫咪灵魂伴侣 | 摸头 200 次 | 🔔 铃铛 |
| 🦉 夜猫子 | 凌晨 2 点写代码 | ☕ 咖啡杯 |
| 🐦 早起的鸟儿 | 早上 6 点写代码 | 🐟 小鱼干 |
| 🎊 节日精灵 | 节日期间使用 | 🧙 巫师帽 |

## 项目结构

```
desktop-cat/
├── main.js                 # Electron 主进程
├── preload.js              # 预加载脚本（IPC 桥接）
├── shared-config.js        # 共享配置模块
├── claude-hook.js          # 手动通知脚本
├── hooks/
│   ├── clawd-hook.js       # Claude Code 事件 hook（自动重试 + 编码清理）
│   └── install.js          # Hook 安装/卸载工具
├── scripts/
│   └── generate-icon.js    # 托盘图标生成器
├── renderer/
│   ├── index.html          # 主页面
│   ├── style.css           # 样式 + 动画（15+ 关键帧）
│   ├── app.js              # 渲染进程逻辑（互动/彩蛋/环境感知）
│   ├── achievements.js     # 成就系统（13 成就 + 10 配件）
│   └── assets/
│       ├── cat/processed/  # 8 种状态 PNG
│       └── sounds/         # 21 种音效文件
└── package.json
```

## 设计文档

详细的 Agent 协同设计方案见 [DESIGN-PLAN.md](DESIGN-PLAN.md)，包含：
- 7 个专业 Agent 协作矩阵
- 6 大功能的详细设计规格
- 测试验证流程（Evidence Collector + Reality Checker + Test Results Analyzer）
- 测试用例清单

## 故障排除

### 通知不生效

1. 确认 Desktop Cat 正在运行：`curl http://localhost:18923/health`
2. 重新安装 hook：`node hooks/install.js`
3. 检查日志：`~/.desktop-cat/logs/`

### 端口被占用

修改 `~/.desktop-cat/config.json` 中的 `port` 值，或关闭占用端口的程序。

### 猫咪找不到了

右键系统托盘图标 → 🔍 **找回猫咪**，一键将猫咪拉回主屏幕。

### 气泡文字乱码

已在 Hook 脚本中加入 UTF-8 编码保护和 `sanitizeText` 清理。如仍有问题，检查 Claude Code 的输出编码。

## 许可证

MIT

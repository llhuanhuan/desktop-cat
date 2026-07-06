# 🐱 Desktop Cat 趣味增强 - 设计方案 v1.0

> 基于 agency-agents 多 Agent 协同设计：7 个专业 Agent 覆盖 设计→开发→测试→验证 全流程

---

## 🤖 Agent 协作矩阵

### 开发阶段 Agents

| Agent | 角色 | 负责功能 | 核心输出 |
|-------|------|---------|---------|
| 🎭 **Whimsy Injector** | 趣味注入师 | 彩蛋系统(6)、气泡创意文案 | 彩蛋触发逻辑、创意文案库 |
| 🎨 **Frontend Developer** | 前端开发 | 互动系统(1)、过渡动画(4)、猫爪印(7) | JS 事件处理、CSS 动画、Canvas 特效 |
| 🏛️ **Software Architect** | 软件架构师 | 成就系统(3)设计 | 数据模型、持久化方案、模块拆分 |
| 🔧 **Backend Architect** | 后端架构师 | 环境感知(5) | 系统 API 接入、IPC 通道设计 |

### 测试验证阶段 Agents

| Agent | 角色 | 职责 | 核心方法论 |
|-------|------|------|-----------|
| 🔍 **Reality Checker** | 现实检验官 | 最终验证门 — 默认 "NEEDS WORK"，需压倒性证据才放行 | 截图验证、grep 检查、功能冒烟测试 |
| 📸 **Evidence Collector** | 证据收集员 | 收集测试证据 — 截图、日志、交互录屏 | "截图不会说谎"，每次实现至少找 3-5 个问题 |
| 📊 **Test Results Analyzer** | 测试结果分析师 | 分析通过/失败模式、质量风险评估 | 数据驱动：覆盖率、缺陷模式、发布就绪度 |

### 协作流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Phase 1    │    │  Phase 2    │    │  Phase 3    │    │  Phase 4    │
│  设计       │───→│  开发       │───→│  测试       │───→│  验证       │
│             │    │             │    │             │    │             │
│ Whimsy      │    │ Frontend    │    │ Evidence    │    │ Reality     │
│ Injector    │    │ Developer   │    │ Collector   │    │ Checker     │
│             │    │             │    │             │    │             │
│ Software    │    │ Backend     │    │ Test Results│    │ 发布决策    │
│ Architect   │    │ Architect   │    │ Analyzer    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 📋 功能清单

| # | 功能 | 优先级 | 复杂度 | 涉及文件 |
|---|------|--------|--------|---------|
| 1 | 猫咪互动系统 | P0 | 中 | app.js, style.css, index.html |
| 3 | 成就/外观解锁系统 | P1 | 高 | app.js, main.js, shared-config.js, 新增 assets |
| 4 | 状态过渡动画 | P1 | 中 | app.js, style.css |
| 5 | 环境感知系统 | P1 | 低 | app.js, main.js |
| 6 | 彩蛋系统 | P2 | 低 | app.js, style.css |
| 7 | 猫爪印特效 | P2 | 低 | app.js, style.css |

---

## 1. 🐱 猫咪互动系统

### 目标
让用户可以主动和猫咪互动，从"看客"变成"铲屎官"。

### 设计细节

#### 1.1 点击摸头（已有基础，需增强）
- **现状**：点击触发 `playClick()`，有 ❤️ 粒子 + 固定文案
- **增强**：
  - 区分**点击位置**：头部区域 vs 身体区域，触发不同反应
    - 头部：开心摸头反应（呼噜声 + ❤️）
    - 身体：伸懒腰反应（meow 音效 + 星星粒子）
  - 添加**连续点击计数器**：
    - 1-3 次：正常摸头
    - 4-6 次：猫咪开始不耐烦（"别摸了喵..."）
    - 7+ 次：猫咪生气彩蛋（😤 表情 + 甩尾巴动画，见功能6）
    - 5秒无点击后重置计数器

#### 1.2 长按入睡
- **触发**：鼠标按住不放超过 1.5 秒
- **效果**：
  - 猫咪切换到 sleeping 状态
  - 播放呼噜音效
  - 气泡显示 "呼噜...💤"
  - 松开后保持 sleeping 状态（双击唤醒，已有逻辑）

#### 1.3 鼠标悬停尾巴摆动
- **触发**：鼠标进入猫咪区域
- **效果**：猫咪图片轻微左右摇摆（CSS animation）
- **实现**：给 `.cat.hover` 添加 `tail-wag` 关键帧动画

### 代码改动
```javascript
// app.js 新增
let clickCount = 0;
let clickResetTimer = null;
let longPressTimer = null;
let isLongPress = false;

// 点击区域检测（头部 vs 身体）
function getClickZone(e) {
  const rect = cat.getBoundingClientRect();
  const relY = (e.clientY - rect.top) / rect.height;
  return relY < 0.5 ? 'head' : 'body';
}

// 增强点击处理
cat.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isLongPress = false;
  longPressTimer = setTimeout(() => {
    isLongPress = true;
    toggleSleep();
    sound.play('sleep');
  }, 1500);
});

cat.addEventListener('mouseup', () => {
  clearTimeout(longPressTimer);
});

// 增强点击效果
cat.addEventListener('click', (e) => {
  if (isDragging || isLongPress) return;
  
  clickCount++;
  clearTimeout(clickResetTimer);
  clickResetTimer = setTimeout(() => { clickCount = 0; }, 5000);
  
  const zone = getClickZone(e);
  if (clickCount >= 7) {
    playAngry(); // 彩蛋：生气
  } else if (clickCount >= 4) {
    showBubble('别摸了啦... >_<');
    sound.play('meow');
  } else {
    if (zone === 'head') {
      playClick(); // 已有逻辑
    } else {
      // 身体区域：伸懒腰
      cat.classList.add('stretch');
      sound.play('meow');
      showBubble('伸懒腰~ 😸');
      particles.star(...);
    }
  }
});
```

```css
/* style.css 新增 */
.cat.hover {
  animation: tail-wag 0.5s ease-in-out infinite alternate;
}

@keyframes tail-wag {
  0% { transform: translateX(-50%) rotate(-2deg); }
  100% { transform: translateX(-50%) rotate(2deg); }
}

.cat.stretch {
  animation: stretch 0.6s ease-in-out;
}

@keyframes stretch {
  0% { transform: translateX(-50%) scaleX(1) scaleY(1); }
  30% { transform: translateX(-50%) scaleX(1.15) scaleY(0.9); }
  60% { transform: translateX(-50%) scaleX(0.95) scaleY(1.05); }
  100% { transform: translateX(-50%) scaleX(1) scaleY(1); }
}
```

---

## 3. 🏆 成就/外观解锁系统

### 目标
让猫咪有"成长感"，激励用户持续使用 Claude Code。

### 数据模型

#### 3.1 成就定义
```javascript
// 新文件: renderer/achievements.js
const ACHIEVEMENTS = {
  // 使用时长类
  first_day:    { name: '初来乍到',     desc: '第一次使用 Desktop Cat',  icon: '🎉', reward: null },
  week_streak:  { name: '忠实伙伴',     desc: '连续使用 7 天',          icon: '💛', reward: 'scarf_red' },
  month_streak: { name: '铁杆猫奴',     desc: '连续使用 30 天',         icon: '👑', reward: 'crown' },

  // 代码成就类
  task_10:      { name: '小试牛刀',     desc: '完成 10 个任务',         icon: '⚡', reward: null },
  task_100:     { name: '百炼成钢',     desc: '完成 100 个任务',        icon: '🔥', reward: 'glasses' },
  task_500:     { name: '代码大师',     desc: '完成 500 个任务',        icon: '💎', reward: 'cape' },
  no_error_10:  { name: '完美主义者',   desc: '连续 10 次任务无错误',    icon: '✨', reward: 'halo' },
  
  // 互动类
  pet_50:       { name: '猫咪挚友',     desc: '摸猫咪 50 次',           icon: '🤗', reward: 'bow_blue' },
  night_owl:    { name: '夜猫子',       desc: '凌晨 2 点还在写代码',     icon: '🦉', reward: 'coffee' },
  early_bird:   { name: '早起的鸟儿',   desc: '早上 6 点就开始写代码',   icon: '🐦', reward: null },
};
```

#### 3.2 外观配件系统
```javascript
const ACCESSORIES = {
  // 头饰
  crown:     { name: '皇冠',     slot: 'head',  emoji: '👑', layer: 'front' },
  halo:      { name: '光环',     slot: 'head',  emoji: '😇', layer: 'behind' },
  glasses:   { name: '墨镜',     slot: 'face',  emoji: '😎', layer: 'front' },
  hat_wizard:{ name: '巫师帽',   slot: 'head',  emoji: '🧙', layer: 'front' },
  
  // 脖子
  scarf_red: { name: '红围巾',   slot: 'neck',  emoji: '🧣', layer: 'front' },
  bow_blue:  { name: '蓝蝴蝶结', slot: 'neck',  emoji: '🎀', layer: 'front' },
  bell:      { name: '铃铛',     slot: 'neck',  emoji: '🔔', layer: 'front' },
  
  // 手持
  coffee:    { name: '咖啡杯',   slot: 'hand',  emoji: '☕', layer: 'front' },
  fish:      { name: '小鱼干',   slot: 'hand',  emoji: '🐟', layer: 'front' },
  
  // 特殊
  cape:      { name: '披风',     slot: 'back',  emoji: '🦸', layer: 'behind' },
};
```

#### 3.3 数据持久化
```javascript
// shared-config.js 扩展
// ~/.desktop-cat/config.json 新增字段:
{
  "achievements": {
    "unlocked": ["first_day"],
    "progress": {
      "task_count": 42,
      "pet_count": 15,
      "streak_days": 3,
      "last_active_date": "2026-07-06"
    }
  },
  "accessories": {
    "unlocked": ["bow_blue"],
    "equipped": { "neck": "bow_blue" }  // slot -> accessory id
  }
}
```

#### 3.4 配件渲染
- 方案：在猫咪 PNG 图片上方叠加 emoji 层（纯 CSS 定位）
- 用 `position: absolute` + `z-index` 在 `.cat-svg-wrapper` 上方渲染
- 每个配件有固定的 CSS 偏移量（根据 slot 计算）
- 后续可替换为真正的 PNG 精灵图

```css
/* style.css 新增 */
.accessory {
  position: absolute;
  pointer-events: none;
  font-size: 24px;
  z-index: 10;
  transition: opacity 0.3s;
}
.accessory.slot-head  { top: -5px;  left: 50%; transform: translateX(-50%); }
.accessory.slot-neck  { bottom: 30%; left: 50%; transform: translateX(-50%); }
.accessory.slot-face  { top: 25%;   left: 50%; transform: translateX(-50%); }
.accessory.slot-hand  { bottom: 10%; right: -10px; }
.accessory.slot-back  { top: 10%;   left: -10px; z-index: -1; }
```

#### 3.5 成就解锁通知
- 解锁时：特殊粒子效果（🎊 confetti） + 气泡通知 "🏆 解锁成就：XXX"
- 音效：使用 `excited_cat` 音效
- 配件解锁后气泡："获得新装扮：👑 皇冠！"

---

## 4. ✨ 状态过渡动画

### 目标
消除状态切换的"硬切"感，让猫咪活起来。

### 设计

#### 4.1 图片切换过渡
```css
/* style.css 修改 */
.cat-svg-wrapper {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* 状态切换时的过渡类 */
.cat-svg-wrapper.transitioning {
  animation: state-switch 0.4s ease;
}

@keyframes state-switch {
  0%   { opacity: 1; transform: scale(1); }
  40%  { opacity: 0.3; transform: scale(0.9); }
  60%  { opacity: 0.3; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
```

#### 4.2 特定状态的专属动画
```css
/* 睡眠状态：轻微上下浮动 */
.cat-svg-wrapper.state-sleeping img {
  animation: sleep-bob 3s ease-in-out infinite;
}

@keyframes sleep-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* 思考状态：轻微摇晃 */
.cat-svg-wrapper.state-thinking img {
  animation: think-wobble 2s ease-in-out infinite;
}

@keyframes think-wobble {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}

/* 工作状态：快速小抖动 */
.cat-svg-wrapper.state-working img {
  animation: work-bounce 0.8s ease-in-out infinite;
}

@keyframes work-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* 开心状态：弹跳 */
.cat-svg-wrapper.state-happy img {
  animation: happy-bounce 0.5s ease-in-out 3;
}

@keyframes happy-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}
```

#### 4.3 app.js 改动
```javascript
// 修改 setThemeState 函数
async function setThemeState(state) {
  const url = await loadTheme(state);
  if (url && svgWrapper) {
    // 添加过渡动画
    svgWrapper.classList.add('transitioning');
    
    setTimeout(() => {
      svgWrapper.innerHTML = `<img src="${url}" alt="${state}" ...>`;
      svgWrapper.className = `cat-svg-wrapper state-${state}`;
    }, 200); // 在动画中点切换图片
  }
}
```

---

## 5. 🌤️ 环境感知系统

### 目标
让猫咪感知真实环境，增加沉浸感。

### 设计

#### 5.1 时间感知（纯前端，零依赖）
```javascript
// app.js 新增
function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9)   return { period: 'morning',  emoji: '🌅', msg: '早安喵~' };
  if (hour >= 9 && hour < 12)  return { period: 'forenoon', emoji: '☀️', msg: '上午好！' };
  if (hour >= 12 && hour < 14) return { period: 'noon',     emoji: '🍱', msg: '该吃饭了！' };
  if (hour >= 14 && hour < 18) return { period: 'afternoon',emoji: '🌤️', msg: '下午加油~' };
  if (hour >= 18 && hour < 21) return { period: 'evening',  emoji: '🌅', msg: '晚上好~' };
  if (hour >= 21 || hour < 1)  return { period: 'night',    emoji: '🌙', msg: '夜深了...' };
  return { period: 'late_night', emoji: '🦉', msg: '还不睡觉！' };
}

// 每分钟检查一次，用于调整气泡文案和背景粒子
let timeContext = getTimeContext();
setInterval(() => { timeContext = getTimeContext(); }, 60000);
```

#### 5.2 空闲检测（纯前端）
```javascript
// 检测用户是否离开电脑
let lastActivityTime = Date.now();
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 分钟

document.addEventListener('mousemove', () => { lastActivityTime = Date.now(); });
document.addEventListener('keydown', () => { lastActivityTime = Date.now(); });

function isUserIdle() {
  return Date.now() - lastActivityTime > IDLE_THRESHOLD;
}

// 空闲时猫咪自己玩耍
setInterval(() => {
  if (isUserIdle() && currentState === 'idle') {
    // 随机：追光标、打哈欠、自己玩
    const actions = ['yawn', 'play', 'groom'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    if (action === 'yawn') {
      showBubble('好无聊啊... 😴');
      setState('sleeping', 5000);
    }
  }
}, 30000); // 每 30 秒检查
```

#### 5.3 系统信息感知（通过 IPC，可选）
```javascript
// main.js - 每 30 秒发送系统状态到渲染进程
const os = require('os');

function getSystemStats() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = ((totalMem - freeMem) / totalMem * 100).toFixed(0);
  
  // CPU 使用率（简化计算）
  const cpuIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const cpuTotal = cpus.reduce((acc, cpu) => 
    acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);
  
  return { cpuIdle, cpuTotal, memUsage };
}

setInterval(() => {
  if (mainWindow) {
    mainWindow.webContents.send('system-stats', getSystemStats());
  }
}, 30000);
```

```javascript
// app.js - 监听系统状态
window.electronAPI.onSystemStats((stats) => {
  if (stats.memUsage > 90 && currentState === 'idle') {
    showBubble('你的电脑快撑不住了... 😰', 3000);
  }
});
```

#### 5.4 天气粒子效果（基于时间，无需 API）
```javascript
// 根据时间段生成不同背景粒子
function spawnAmbientParticle() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) {
    // 白天：偶尔飘过小太阳光线
    if (Math.random() < 0.1) particles.sparkle(...);
  } else {
    // 夜晚：偶尔飘过小星星
    if (Math.random() < 0.15) particles.star(...);
  }
}
```

---

## 6. 🥚 彩蛋系统

### 目标
隐藏惊喜，增加探索乐趣和社交分享。

### 彩蛋清单

| # | 触发条件 | 效果 | 稀有度 |
|---|---------|------|--------|
| E1 | 连续点击 7 次 | 😤 生气动画 + "你再摸试试！" + 甩尾巴 | 普通 |
| E2 | 双击猫咪（已有）→ 10% 概率 | 翻肚皮 + 🌈 彩虹粒子 | 稀有 |
| E3 | 凌晨 0:00 触发 | "新的一天喵~ 🌙" + 特殊粒子 | 每日一次 |
| E4 | 连续完成 10 个任务无错误 | 🎆 烟花特效 + "完美连击！" | 困难 |
| E5 | 长按猫咪超过 5 秒 | 猫咪变成"液体猫"（扁平化 CSS 动画） | 隐藏 |
| E6 | 特定节日自动触发 | 春节🧧/万圣节🎃/圣诞🎄主题 | 季节性 |
| E7 | 摸头 100 次累计 | "你真的好喜欢我呢~ 💕" + 解锁隐藏配件 | 隐藏 |

### 实现

```javascript
// app.js 新增
const EASTER_EGG_LOG = {};

function checkEasterEgg(id) {
  // 防止重复触发（每个彩蛋每天最多一次）
  const today = new Date().toDateString();
  if (EASTER_EGG_LOG[id] === today) return false;
  EASTER_EGG_LOG[id] = today;
  return true;
}

// E1: 生气彩蛋（在点击计数器 >= 7 时触发）
function playAngry() {
  setState('error', 3000);
  sound.play('error');
  showBubble('哼！不理你了！😤', 3000);
  cat.classList.add('angry-shake');
  setTimeout(() => cat.classList.remove('angry-shake'), 500);
}

// E2: 翻肚皮彩蛋（双击时 10% 概率）
cat.addEventListener('dblclick', (e) => {
  if (Math.random() < 0.10 && checkEasterEgg('belly')) {
    e.preventDefault();
    cat.classList.add('belly-flop');
    showBubble('给你看肚皮~ 🥰');
    // 彩虹粒子
    for (let i = 0; i < 8; i++) {
      setTimeout(() => particles.sparkle(...), i * 150);
    }
    setTimeout(() => cat.classList.remove('belly-flop'), 2000);
  }
});

// E5: 液体猫（长按 5 秒）
// 在长按逻辑中添加：
if (holdDuration >= 5000) {
  cat.classList.add('liquid-cat');
  showBubble('我是液体的... 🫠');
  setTimeout(() => cat.classList.remove('liquid-cat'), 3000);
}
```

```css
/* style.css 新增 */
.cat.angry-shake {
  animation: angry 0.15s ease-in-out 4;
}

@keyframes angry {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  25% { transform: translateX(-50%) rotate(-5deg); }
  75% { transform: translateX(-50%) rotate(5deg); }
}

.cat.belly-flop {
  animation: belly 2s ease-in-out;
}

@keyframes belly {
  0% { transform: translateX(-50%) scale(1) rotate(0deg); }
  30% { transform: translateX(-50%) scaleX(1.3) scaleY(0.7) rotate(10deg); }
  70% { transform: translateX(-50%) scaleX(1.3) scaleY(0.7) rotate(-5deg); }
  100% { transform: translateX(-50%) scale(1) rotate(0deg); }
}

.cat.liquid-cat {
  animation: liquid 1s ease-in-out forwards;
}

@keyframes liquid {
  0% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scaleX(1.4) scaleY(0.5); }
  100% { transform: translateX(-50%) scaleX(1.3) scaleY(0.6); }
}
```

---

## 7. 🐾 猫爪印特效

### 目标
鼠标经过的地方留下短暂的猫爪印，增加趣味和"猫咪在活动"的感觉。

### 设计

#### 7.1 触发逻辑
- 仅在猫咪处于**非 sleeping** 状态时生效
- 鼠标在猫身上移动时，在鼠标位置附近生成爪印
- 限制频率：最多每 300ms 生成一个
- 爪印在 3 秒后淡出消失

#### 7.2 实现
```javascript
// app.js 新增
let lastPawTime = 0;
const PAW_INTERVAL = 300;
const PAW_LIFETIME = 3000;

cat.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastPawTime < PAW_INTERVAL) return;
  if (currentState === 'sleeping') return;
  
  lastPawTime = now;
  
  const container = document.getElementById('cat-container').getBoundingClientRect();
  const x = e.clientX - container.left + (Math.random() - 0.5) * 20;
  const y = e.clientY - container.top + (Math.random() - 0.5) * 20;
  
  createPawPrint(x, y);
});

function createPawPrint(x, y) {
  const paw = document.createElement('div');
  paw.className = 'paw-print';
  paw.textContent = '🐾';
  paw.style.left = `${x}px`;
  paw.style.top = `${y}px`;
  paw.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg)`;
  document.getElementById('cat-container').appendChild(paw);
  setTimeout(() => paw.remove(), PAW_LIFETIME);
}
```

```css
/* style.css 新增 */
.paw-print {
  position: absolute;
  pointer-events: none;
  font-size: 12px;
  z-index: 5;
  opacity: 0.4;
  animation: paw-fade 3s ease-out forwards;
}

@keyframes paw-fade {
  0% { opacity: 0.5; transform: scale(0.8); }
  20% { opacity: 0.4; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.6); }
}
```

---

## 📁 文件改动总结

| 文件 | 改动类型 | 涉及功能 |
|------|---------|---------|
| `renderer/app.js` | 大量新增 | 1, 3, 4, 5, 6, 7 |
| `renderer/style.css` | 新增动画/样式 | 1, 4, 6, 7 |
| `renderer/index.html` | 小改（配件容器） | 3 |
| `renderer/achievements.js` | **新文件** | 3 |
| `main.js` | 小改（系统状态 IPC） | 5 |
| `preload.js` | 小改（新 IPC 通道） | 5 |
| `shared-config.js` | 扩展（成就数据） | 3 |

---

## 🔧 实施顺序建议

1. **Phase 1**：互动系统(1) + 爪印(7) + 过渡动画(4) — 纯前端改动，见效快
2. **Phase 2**：彩蛋系统(6) + 环境感知(5) — 依赖 Phase 1 的互动基础设施
3. **Phase 3**：成就系统(3) — 最复杂，需要新建数据模型和持久化

---

## 🔍 测试验证流程

### 测试 Agent 方法论

#### 📸 Evidence Collector（证据收集员）
> 核心哲学："截图不会说谎"、"默认找问题"、"证明一切"

**每个功能完成后必须收集：**
1. **现实检查命令** — grep 验证代码确实包含了声称的功能
2. **截图证据** — 启动应用，截图验证视觉效果
3. **交互测试** — 点击、悬停、拖拽、右键等每个交互路径
4. **边界测试** — 快速连点、超长文本、极端时间点

**证据报告模板：**
```markdown
## 📸 功能: [功能名]
### 现实检查
- [ ] grep 验证: [关键代码片段] 存在
- [ ] 应用启动成功
- [ ] 无控制台错误

### 视觉证据
- 截图 1: [描述]
- 截图 2: [描述]

### 交互测试
| 操作 | 预期结果 | 实际结果 | 状态 |
|------|---------|---------|------|
| 点击猫头部 | ❤️ 粒子 + 呼噜 | ... | ✅/❌ |

### 发现的问题（至少 3-5 个）
1. ...
2. ...
```

#### 🔍 Reality Checker（现实检验官）
> 核心哲学：默认 "NEEDS WORK"，需压倒性证据才放行

**验证清单（每个 Phase 完成后执行）：**
```bash
# 1. 代码存在性验证
grep -r "playAngry" renderer/          # 互动系统
grep -r "ACHIEVEMENTS" renderer/       # 成就系统
grep -r "state-sleeping" renderer/     # 过渡动画
grep -r "getTimeContext" renderer/     # 环境感知
grep -r "checkEasterEgg" renderer/     # 彩蛋系统
grep -r "paw-print" renderer/          # 猫爪印

# 2. 功能冒烟测试
# 启动应用 → 截图 → 执行每个交互 → 截图

# 3. 零问题声明 = 自动 FAIL
# "没有发现问题" 意味着测试不够深入
```

**评级标准：**
| 评级 | 条件 |
|------|------|
| A | 所有功能工作正常，有完整截图证据，仅剩微小 UI 优化 |
| B+ | 核心功能全部工作，有 1-2 个非关键 UI 问题 |
| B | 主要功能工作，有 2-3 个需要修复的问题 |
| B- | 功能基本工作但有明显的体验问题 |
| C+ | 部分功能工作，需要较多修复 |
| C 或更低 | 核心功能不可用，需要返工 |

#### 📊 Test Results Analyzer（测试结果分析师）
> 核心哲学：数据驱动，统计分析，质量优先

**分析维度：**
1. **功能覆盖率**：6 个功能中多少个完全通过？
2. **交互覆盖率**：每个功能的交互路径覆盖率
3. **缺陷模式**：问题是否集中在某个模块？
4. **回归风险**：新功能是否破坏了已有功能？

### 验证执行计划

#### 每个 Phase 完成后的验证步骤

```
Step 1: Evidence Collector 收集证据
  ├── grep 代码验证
  ├── 启动应用截图
  ├── 逐个交互测试
  └── 输出证据报告

Step 2: Test Results Analyzer 分析结果
  ├── 统计通过/失败率
  ├── 识别缺陷模式
  ├── 评估回归风险
  └── 输出质量评估

Step 3: Reality Checker 最终判定
  ├── 审查证据报告
  ├── 抽查关键功能
  ├── 评级（B+ 以上通过）
  └── 输出发布决策
```

#### 具体测试用例

**Phase 1 验证（互动 + 爪印 + 动画）：**
| 测试项 | 操作 | 预期 | 验证方式 |
|--------|------|------|---------|
| T1.1 | 点击猫头部 | ❤️ 粒子 + 呼噜音效 + 气泡 | 截图 + 音频 |
| T1.2 | 点击猫身体 | 伸懒腰动画 + 星星粒子 | 截图 |
| T1.3 | 快速点击 4 次 | 气泡 "别摸了啦..." | 截图 |
| T1.4 | 快速点击 7 次 | 生气动画 + 甩尾巴 | 截图 |
| T1.5 | 长按 1.5 秒 | 切换 sleeping 状态 | 截图 |
| T1.6 | 悬停猫身上 | 尾巴摆动动画 | 截图 |
| T1.7 | 在猫身上移动鼠标 | 🐾 爪印出现并 3 秒后消失 | 截图 |
| T1.8 | sleeping 状态移动鼠标 | 无爪印出现 | 验证 |
| T1.9 | 状态切换（idle→happy） | 缩放过渡动画，无硬切 | 截图 |
| T1.10 | sleeping 状态 | 猫咪上下浮动 | 截图 |
| T1.11 | thinking 状态 | 猫咪左右摇晃 | 截图 |
| T1.12 | 已有功能回归 | 拖拽、右键音效、气泡、DND | 全量回归 |

**Phase 2 验证（彩蛋 + 环境感知）：**
| 测试项 | 操作 | 预期 | 验证方式 |
|--------|------|------|---------|
| T2.1 | 双击猫（10%概率彩蛋） | 翻肚皮 + 彩虹粒子（多次尝试） | 截图 |
| T2.2 | 长按 5 秒 | 液体猫动画 | 截图 |
| T2.3 | 凌晨 0:00 触发 | 特殊气泡 | 日志验证 |
| T2.4 | 连续完成 10 任务无错 | 烟花特效 | 截图 |
| T2.5 | 修改系统时间到早上 6 点 | 气泡 "早安喵~" | 截图 |
| T2.6 | 空闲 5 分钟 | 猫咪自动睡觉/玩耍 | 截图 |
| T2.7 | 内存 > 90% | 气泡警告 | 日志验证 |

**Phase 3 验证（成就系统）：**
| 测试项 | 操作 | 预期 | 验证方式 |
|--------|------|------|---------|
| T3.1 | 首次启动 | 自动解锁 "初来乍到" 成就 | 截图 + config 验证 |
| T3.2 | 解锁成就 | 🎊 粒子 + 气泡通知 | 截图 |
| T3.3 | 装备配件 | emoji 显示在猫身上正确位置 | 截图 |
| T3.4 | 重启应用 | 成就/配件数据持久化 | config.json 验证 |
| T3.5 | 旧版 config.json 兼容 | 不崩溃，自动迁移 | 启动验证 |

---

## ⚠️ 注意事项

1. **性能**：爪印粒子和环境粒子要注意 DOM 节点数量，及时清理
2. **配置兼容**：成就数据写入 config.json 需向后兼容，已有配置不丢失
3. **音效状态持久化**：当前 sound.enabled 只在内存中，建议顺便持久化
4. **CSS 动画叠加**：多个动画类同时存在时需要处理优先级（用 animation 属性覆盖而非叠加）

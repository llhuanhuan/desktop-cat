# Desktop Cat — 内存泄漏分析报告

**分析时间**：2026-07-22
**分析范围**：main.js, preload.js, renderer/app.js, renderer/achievements.js, shared-config.js
**结论**：发现 6 处问题，其中 2 处严重，2 处中等，2 处轻微。

---

## 严重问题 (High)

### 1. 音效克隆节点泄漏

**文件**：`renderer/app.js:226-255`

**问题代码**：
```js
play(type) {
  // ...
  const clone = audio.cloneNode();
  clone.volume = 0.5;
  clone.play().catch(() => {});
  clone.addEventListener('ended', () => {
    clone.src = '';
    clone.remove();  // 问题在此
  });
}
```

**泄漏机制**：
- `audio.cloneNode()` 创建的新 Audio 对象**从未被添加到 DOM**。
- `clone.remove()` 是 `Element.removeChild()` 的封装，只能移除 DOM 树中的节点。对未挂载的游离对象调用 `remove()` 是**空操作**，不会触发垃圾回收。
- 更严重的是：当 `clone.play()` 返回的 Promise 被 reject（浏览器自动播放策略限制、音频加载失败等），`.catch(() => {})` 静默吞掉错误，`ended` 事件**永远不会触发**，清理回调不会执行。
- 结果：每次播放音效都可能在内存中留下一个无法回收的 Audio 对象，包含已解码的音频数据缓冲区。

**影响**：长时间运行后内存持续增长，尤其在频繁触发音效的场景（如连续点击猫咪）。

**修复建议**：
```js
play(type) {
  if (!this.enabled) return;
  if (Object.keys(this.audioCache).length === 0) this.init();

  const sounds = soundMap[type] || ['meow1'];
  const soundName = sounds[Math.floor(Math.random() * sounds.length)];
  const audio = this.audioCache[soundName];
  if (!audio) return;

  const clone = audio.cloneNode();
  clone.volume = 0.5;

  const cleanup = () => {
    clone.pause();
    clone.src = '';
    clone.removeEventListener('ended', cleanup);
    clone.removeEventListener('error', cleanup);
  };

  clone.addEventListener('ended', cleanup);
  clone.addEventListener('error', cleanup);

  clone.play().catch(cleanup);

  // 安全兜底：10秒后强制清理
  setTimeout(cleanup, 10000);
}
```

---

### 2. setInterval 未保存 ID 无法清理

**文件**：`renderer/app.js:297` 和 `renderer/app.js:827`

**问题代码**：
```js
// Line 297：成就自动保存
setInterval(() => saveAchievements(), 60000);

// Line 827：随机动作
setInterval(() => {
  if (dndMode) return;
  // ...
}, 15000);
```

**泄漏机制**：
- 两个 `setInterval` 的返回值没有被保存到变量中，因此无法通过 `clearInterval()` 清理。
- 在 Electron 中，如果渲染进程发生页面重载（如开发者工具中的 reload、热重载、或 `window.location.reload()`），旧的定时器不会被销毁，而是继续在旧页面上下文中执行。
- 每次重载都会创建新的定时器，导致定时器数量线性增长。
- 旧定时器中的回调可能引用已卸载的 DOM 元素，导致更深层的内存泄漏。

**影响**：页面重载 N 次后，会有 2N 个定时器在后台运行，内存和 CPU 占用持续增长。

**修复建议**：
```js
// 保存定时器 ID
const achievementSaveTimer = setInterval(() => saveAchievements(), 60000);
const randomActionTimer = setInterval(() => { /* ... */ }, 15000);

// 在 beforeunload 中清理
window.addEventListener('beforeunload', () => {
  revokeAllBlobURLs();
  clearInterval(achievementSaveTimer);
  clearInterval(randomActionTimer);
});
```

---

## 中等问题 (Medium)

### 3. onAchievementUnlocked 监听器无清理方法

**文件**：`preload.js:52-54`

**问题代码**：
```js
onAchievementUnlocked: (callback) => {
  ipcRenderer.on('achievement-unlocked', (event, data) => callback(data));
}
```

**问题**：
- preload 中其他监听器（`onStateChange`、`onTaskDone`、`onToggleDND`、`onShowHistory`）都有对应的 `removeXxxListener` 方法，唯独 `onAchievementUnlocked` 缺失。
- 如果渲染进程多次调用此方法（或页面重载后再次调用），监听器会累积，导致同一消息被处理多次。

**修复建议**：
在 preload.js 中补充：
```js
removeAchievementUnlockedListener: () => {
  ipcRenderer.removeAllListeners('achievement-unlocked');
}
```

---

### 4. move 事件频繁同步文件 I/O

**文件**：`main.js:94-99` + `shared-config.js:34-36, 44-54`

**问题代码**：
```js
// main.js
mainWindow.on('move', () => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    saveConfig({ x, y });  // 每次移动都写入
  }
});

// shared-config.js
function saveConfig(updates) {
  const config = { ...loadConfig(), ...updates };  // loadConfig 每次都 readFileSync + JSON.parse
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}
```

**问题**：
- `move` 事件在拖动窗口时以极高频率触发（每秒数十次）。
- 每次触发都执行：`readFileSync` → `JSON.parse` → `JSON.stringify` → `writeFileSync`，全部是同步阻塞操作。
- 这虽然不是传统内存泄漏，但会导致主进程频繁阻塞，内存中产生大量临时字符串对象，增加 GC 压力。

**修复建议**：使用防抖（debounce）：
```js
let savePositionTimer = null;
mainWindow.on('move', () => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    clearTimeout(savePositionTimer);
    savePositionTimer = setTimeout(() => saveConfig({ x, y }), 300);
  }
});
```

---

## 轻微问题 (Low)

### 5. showBubble 的 setTimeout 堆积

**文件**：`renderer/app.js:450`

```js
function showBubble(text, duration = 2000) {
  // ...
  bubble.classList.add('show');
  setTimeout(() => bubble.classList.remove('show'), duration);
}
```

**问题**：快速连续调用 `showBubble` 时会创建多个 `setTimeout`，前一个气泡可能被后一个调用创建的更短定时器提前关闭。虽然定时器会在执行后自动释放，但会导致气泡显示行为不符合预期。

**修复建议**：
```js
let bubbleTimer = null;
function showBubble(text, duration = 2000) {
  // ...
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), duration);
}
```

---

### 6. document mousemove 双重注册 + before-quit 递归

**文件**：`renderer/app.js:490,868` + `main.js:466-474`

**问题 A** — `document` 上注册了两个 `mousemove` 监听器：
- `initDrag()` 中注册一个用于拖拽（Line 490）
- 全局活动追踪注册一个用于空闲检测（Line 868）

虽然两个监听器各自有提前返回逻辑，但 `mousemove` 是超高频事件，双重监听带来不必要的开销。建议合并为一个监听器。

**问题 B** — `before-quit` 中的递归调用：
```js
app.on('before-quit', async (e) => {
  if (server) {
    e.preventDefault();
    await stopNotificationServer();
    server = null;
    app.quit();  // 再次触发 before-quit
  }
});
```
第二次 `app.quit()` 会再次触发 `before-quit`，虽然此时 `server` 已为 null 不会无限递归，但设计不够清晰。建议改用标志位：
```js
let isQuitting = false;
app.on('before-quit', async (e) => {
  if (isQuitting) return;
  if (server) {
    e.preventDefault();
    isQuitting = true;
    await stopNotificationServer();
    server = null;
    app.quit();
  }
});
```

---

## 做得好的地方

项目在以下方面已经做了正确的内存管理，值得肯定：

1. **Blob URL 管理**（app.js:134-180）：`imageCache` 缓存了 8 个状态的图片，在 `beforeunload` 时通过 `revokeAllBlobURLs()` 统一释放。
2. **通知历史上限**（app.js:75-76）：`notificationHistory` 限制 50 条，`addHistory` 中通过 `pop()` 保持上限。
3. **HTTP 请求体大小限制**（main.js:246）：`MAX_BODY_SIZE = 64KB` 防止恶意请求撑爆内存。
4. **IPC 监听器清理方法**（preload.js:57-68）：大部分 IPC 监听器都提供了对应的 `removeXxxListener` 方法。
5. **粒子元素自动清理**（app.js:354）：`setTimeout(() => el.remove(), 1200)` 确保粒子元素不会滞留 DOM。
6. **成就系统监听器模式**（achievements.js:206-211）：使用数组管理监听器，虽然未提供 `off` 方法，但在单实例 Electron 应用中影响较小。

---

## 优先级建议

| 优先级 | 问题 | 修复难度 |
|--------|------|----------|
| P0 | #1 音效克隆节点泄漏 | 低 — 替换清理逻辑 |
| P0 | #2 setInterval 未清理 | 低 — 保存 ID + beforeunload 清理 |
| P1 | #3 onAchievementUnlocked 缺清理 | 低 — 补充一个方法 |
| P1 | #4 move 事件频繁 I/O | 低 — 加防抖 |
| P2 | #5 showBubble 定时器堆积 | 低 — 保存 timer ID |
| P2 | #6 mousemove 双注册 | 低 — 合并监听器 |

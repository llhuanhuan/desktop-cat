# Desktop Cat — 代码审查报告

**审查时间**：2026-07-23
**审查范围**：main.js, preload.js, renderer/app.js, renderer/achievements.js, shared-config.js, hooks/clawd-hook.js, hooks/install.js
**结论**：2 阻断 / 8 建议 / 6 细节

---

## 总体印象

项目结构清晰，关注点分离做得好（主进程/渲染进程/preload/共享配置）。代码注释充分，易读性高。测试覆盖了关键边界场景（内存泄漏、HTTP 请求体限制、共享配置）。成就系统的数据迁移支持、状态优先级保护、DND 模式等都是精心设计的。

主要问题集中在**状态同步**和**防御性编程**两个方面。

---

## 🔴 阻断 (Blockers) — 必须修复

### 1. DND 状态未同步到渲染进程

**文件**：`main.js:451` + `renderer/app.js:13`

**问题**：渲染进程硬编码 `dndMode = false`，只在用户通过托盘菜单切换时才更新。主进程从配置恢复了 DND 状态，但没有通知渲染进程。

**影响**：用户启用 DND 后重启应用，猫咪仍然会显示气泡和播放音效，DND 设置形同虚设。

**修复建议**：
```js
// main.js — createMainWindow 中，窗口加载完成后发送初始状态
mainWindow.webContents.on('did-finish-load', () => {
  mainWindow.webContents.send('toggle-dnd', dndMode);
});
```

---

### 2. pet100 彩蛋使用未持久化的 totalPetCount

**文件**：`renderer/app.js:27, 586`

**问题**：`totalPetCount` 是一个内存变量，每次页面加载重置为 0。但 pet100 彩蛋检查 `totalPetCount === 100`，而 `achievements.recordPet()` 中有持久化的 `pet_count`。

```js
// app.js:583-591
totalPetCount++;
achievements.recordPet();
if (totalPetCount === 100 && checkEasterEgg('pet100')) {
  // 这个条件在重启后永远不会满足
}
```

**影响**：用户摸了 50 次猫后重启应用，再摸 50 次（总计 100），`totalPetCount` 只有 50，彩蛋永远无法触发。

**修复建议**：
```js
achievements.recordPet();
if (achievements.data.progress.pet_count === 100 && checkEasterEgg('pet100')) {
  // 使用持久化的计数值
}
```

---

## 🟡 建议 (Suggestions) — 应该修复

### 3. HTTP 服务器绑定所有网卡

**文件**：`main.js:314`

**问题**：`server.listen(PORT)` 默认绑定 `0.0.0.0`，局域网内任何设备都可以发送请求修改猫咪状态。虽然 CORS 限制了浏览器跨域访问，但原生 HTTP 客户端不受 CORS 限制。

**修复建议**：
```js
server.listen(PORT, '127.0.0.1', () => {
```

---

### 4. IPC 处理器缺乏输入校验

**文件**：`main.js:381, 389, 398`

**问题**：三个 IPC 处理器直接信任渲染进程传来的数据：
- `move-window`：`deltaX`/`deltaY` 可能是 `Infinity` 或 `NaN`
- `set-ignore-mouse`：`ignore` 可能是任意类型
- `save-achievements`：`data` 直接写入磁盘，无大小限制或结构校验

**修复建议**：
```js
ipcMain.on('move-window', (event, deltaX, deltaY) => {
  if (mainWindow && typeof deltaX === 'number' && typeof deltaY === 'number'
      && isFinite(deltaX) && isFinite(deltaY)) {
    // ...
  }
});

ipcMain.handle('save-achievements', async (event, data) => {
  if (!data || typeof data !== 'object') return { success: false, error: 'Invalid data' };
  const json = JSON.stringify(data, null, 2);
  if (json.length > 100 * 1024) return { success: false, error: 'Data too large' };
  // ...
});
```

---

### 5. sound.init() 预加载 20 个音频文件

**文件**：`renderer/app.js:194-228`

**问题**：页面加载时立即创建 20 个 `Audio` 对象并设置 `preload = 'auto'`，浏览器会并发下载所有音频文件。这增加了初始加载时间和内存占用。

**修复建议**：将 `preload` 改为 `'none'`，首次播放时再加载：
```js
const audio = new Audio(path);
audio.preload = 'none';  // 播放时浏览器会自动加载
this.audioCache[name] = audio;
```

---

### 6. loadConfig 每次调用都读磁盘

**文件**：`shared-config.js:25-31`

**问题**：`getConfig()` 和 `getAllConfig()` 每次调用都执行 `readFileSync` + `JSON.parse`。在高频场景下（虽然已有防抖）这是不必要的 I/O。

**修复建议**：加一个简单的内存缓存：
```js
let configCache = null;
let configMtime = 0;

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const stat = fs.statSync(CONFIG_FILE);
      if (configCache && stat.mtimeMs === configMtime) return configCache;
      configCache = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      configMtime = stat.mtimeMs;
      return configCache;
    }
  } catch {}
  return {};
}
```

---

### 7. sanitizeText 逻辑重复

**文件**：`renderer/app.js:96-98` vs `hooks/clawd-hook.js:61-68`

**问题**：两个文件各有一份 `sanitizeText`，实现略有不同（renderer 合并了 `\uFFFD` 的正则，hook 分两步替换）。

**修复建议**：将 `sanitizeText` 移入 `shared-config.js` 或创建一个新的 `shared-utils.js`。

---

### 8. install.js 直接覆写 settings.json

**文件**：`hooks/install.js:118`

**问题**：`fs.writeFileSync(SETTINGS_FILE, ...)` 直接覆写整个文件。如果 Claude Code 在并发修改配置，或写入过程中进程崩溃，配置文件可能损坏。

**修复建议**：使用原子写入模式：
```js
const tmpFile = SETTINGS_FILE + '.tmp';
fs.writeFileSync(tmpFile, JSON.stringify(settings, null, 2), 'utf8');
fs.renameSync(tmpFile, SETTINGS_FILE);
```

---

### 9. stopNotificationServer 超时竞态

**文件**：`main.js:328-338`

**问题**：`setTimeout(resolve, 2000)` 在 2 秒后强制 resolve，但 `server.close()` 的回调也可能 resolve。如果 `server.close()` 超过 2 秒，服务器引用丢失但 socket 可能未完全关闭。

**修复建议**：
```js
function stopNotificationServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    const forceTimer = setTimeout(() => {
      // 强制销毁所有连接
      server.close(() => resolve());
      server = null;
    }, 2000);
    server.close(() => {
      clearTimeout(forceTimer);
      console.log('[Desktop Cat] HTTP server closed');
      resolve();
    });
  });
}
```

---

### 10. history 格式化逻辑重复

**文件**：`renderer/app.js:128-134` vs `main.js:430-433`

**问题**：同样的 `{i}. {time} [{project}] {detail}` 格式化逻辑在两处重复。

**修复建议**：提取为共享函数或让渲染进程只发送格式化后的文本。

---

## 💭 细节 (Nits) — 可选优化

### 11. initDrag 的事件监听器未提供清理

`document` 上的 `mousemove`/`mouseup` 和 `container` 上的 `mousedown` 从未移除。在单页面 Electron 应用中影响极小，但如果未来支持热重载，会导致监听器累积。

### 12. addHistory 使用 unshift + pop 模式

`unshift` 是 O(n) 操作。对于 50 条上限来说性能影响可忽略，但用 `splice(0, 0, item)` + `length > MAX_HISTORY && pop()` 不如直接用环形缓冲区。

### 13. 彩蛋计数（consecutiveSuccessCount）未持久化

`consecutiveSuccessCount` 在页面加载时重置为 0。连续成功 10 次的彩蛋只能在同一会话内触发。这可能是设计意图（彩蛋应该是"偶遇"而非"刷取"），但如果希望跨会话保持，需要持久化。

### 14. setAutoLaunch 开发模式下 UI 可操作

托盘菜单的"开机自启动"复选框在开发模式下可以勾选，但实际不会注册。勾选状态会被保存到配置中，可能误导开发者。建议开发模式下禁用该菜单项或显示提示。

### 15. getHoliday 使用固定日期范围

春节检测使用 `1月20日-2月20日` 的固定范围。实际春节日期在 1月21日-2月20日 之间浮动，这个近似基本准确但偶尔会偏差。

### 16. AchievementSystem._listeners 无 off 方法

`on(callback)` 注册监听器但无法移除。当前单次初始化的使用方式下没问题，但如果未来支持动态重载或测试场景，缺少 `off` 方法会导致监听器泄漏。

---

## 做得好的地方

1. **关注点分离**：主进程负责窗口/托盘/HTTP/IPC，渲染进程负责 UI 交互，preload 提供安全桥接，shared-config 管理配置。架构清晰。
2. **安全意识**：`contextIsolation: true` + `nodeIntegration: false` 的 WebPreferences 配置是 Electron 安全最佳实践。CORS 限制本地访问、请求体 64KB 上限都是好的防御措施。
3. **内存管理**：Blob URL 在退出时统一 revoke、音效克隆节点的 cleanup 函数、beforeunload 中清理所有定时器——这些都体现了对内存管理的重视。
4. **状态优先级系统**：`STATE_PRIORITY` + `stateProtected` 机制防止低优先级状态（如 idle）覆盖高优先级状态（如 happy/error），设计巧妙。
5. **数据迁移**：`achievements.load()` 中的旧格式迁移（`equipped` → `accessories.equipped`）和孤儿数据清理，展示了对向后兼容的考虑。
6. **测试覆盖**：内存泄漏测试、HTTP 请求体限制测试、共享配置测试，覆盖了关键的安全和正确性场景。
7. **Hook 系统**：`clawd-hook.js` 的重试机制（3 次重试 + 指数退避）和超时控制（500ms）设计合理。
8. **日志持久化**：console 方法重写同时输出到控制台和文件，便于调试。

---

## 优先级建议

| 优先级 | # | 问题 | 修复难度 |
|--------|---|------|----------|
| P0 | 1 | DND 状态未同步 | 低 — 3 行代码 |
| P0 | 2 | pet100 彩蛋计数错误 | 低 — 改用 achievements 计数 |
| P1 | 3 | HTTP 绑定所有网卡 | 低 — 加一个参数 |
| P1 | 4 | IPC 无输入校验 | 低 — 加类型检查 |
| P1 | 8 | install.js 原子写入 | 低 — tmp + rename |
| P2 | 5 | 音频预加载 | 低 — 改 preload 属性 |
| P2 | 6 | loadConfig 缓存 | 中 — 需加 stat 检查 |
| P2 | 7 | sanitizeText 重复 | 中 — 提取共享模块 |
| P2 | 9 | stopServer 竞态 | 低 — 改回调结构 |
| P2 | 10 | history 格式化重复 | 低 — 提取函数 |
| P3 | 11-16 | 细节问题 | 低 |

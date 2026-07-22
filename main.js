// Electron 主进程
console.log('[Desktop Cat] Starting...');

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const { getConfig, getAllConfig, loadConfig, saveConfig } = require('./shared-config');

let mainWindow;
let tray;
let server;            // HTTP 服务器引用（用于优雅退出）
let dndMode = false;   // 免打扰模式
let savePositionTimer = null;  // 窗口位置保存防抖计时器
let isQuitting = false;        // 退出流程标志，防止 before-quit 递归

// ============================================
// 日志持久化
// ============================================
const LOG_DIR = path.join(os.homedir(), '.desktop-cat', 'logs');
const LOG_FILE = path.join(LOG_DIR, `desktop-cat-${new Date().toISOString().slice(0, 10)}.log`);

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {}
}

function writeLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  const line = `[${timestamp}] [${level}] ${message}`;

  // 控制台输出（使用原始方法，避免递归）
  if (level === 'ERROR') origError(line);
  else origLog(line);

  // 文件输出
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {}
}

// 重写 console 方法以同时写文件
const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;
console.log = (...args) => { writeLog('INFO', ...args); };
console.error = (...args) => { writeLog('ERROR', ...args); };
console.warn = (...args) => { writeLog('WARN', ...args); };

// ============================================
// 主窗口（透明猫咪）
// ============================================
function createMainWindow() {
  const config = getAllConfig();
  const windowOptions = {
    width: config.windowWidth,
    height: config.windowHeight,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    movable: true
  };

  // 恢复上次位置
  if (config.x !== undefined && config.y !== undefined) {
    windowOptions.x = config.x;
    windowOptions.y = config.y;
  }

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.loadFile('renderer/index.html');

  // 默认开启点击穿透（透明区域可穿透点击）
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // 主窗口关闭时退出应用
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  // 保存位置：移动结束时防抖保存（避免拖动时频繁同步 I/O）
  mainWindow.on('move', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      clearTimeout(savePositionTimer);
      savePositionTimer = setTimeout(() => saveConfig({ x, y }), 300);
    }
  });
}

// ============================================
// 系统托盘
// ============================================
function createTray() {
  // 使用处理后的猫咪图标（裁剪头部 + 高质量缩放）
  const iconPath = path.join(__dirname, 'renderer', 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const loginSettings = app.getLoginItemSettings();
  const isAutoLaunchEnabled = loginSettings.openAtLogin;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        }
      }
    },
    {
      label: '🔍 找回猫咪',
      click: () => {
        if (mainWindow) {
          const { screen } = require('electron');
          const primary = screen.getPrimaryDisplay().bounds;
          mainWindow.setPosition(primary.x + 100, primary.y + 100);
          mainWindow.show();
          saveConfig({ x: primary.x + 100, y: primary.y + 100 });
          console.log('[Desktop Cat] Cat rescued to primary display');
        }
      }
    },
    {
      label: '测试通知',
      click: () => {
        notifyStateChange('happy', 'test', '测试任务已完成！');
      }
    },
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '🌙 免打扰模式',
      type: 'checkbox',
      checked: dndMode,
      click: (menuItem) => {
        dndMode = menuItem.checked;
        saveConfig({ dndMode });
        if (mainWindow) {
          mainWindow.webContents.send('toggle-dnd', dndMode);
        }
        console.log(`[Desktop Cat] DND mode: ${dndMode ? 'ON' : 'OFF'}`);
      }
    },
    { type: 'separator' },
    {
      label: '开机自启动',
      type: 'checkbox',
      checked: isAutoLaunchEnabled,
      click: (menuItem) => {
        setAutoLaunch(menuItem.checked);
        saveConfig({ autoLaunch: menuItem.checked });
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Desktop Cat - Claude Code 助手');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

// ============================================
// 状态通知
// ============================================
function notifyStateChange(state, event, detail, project) {
  console.log(`[Desktop Cat] State change: ${state} (event: ${event}, project: ${project})`);
  if (mainWindow) {
    mainWindow.webContents.send('state-change', { state, event, detail, project });
  }
}

// ============================================
// HTTP 服务器（安全 CORS + 优雅退出）
// ============================================
function startNotificationServer() {
  const PORT = getConfig('port');

  server = http.createServer((req, res) => {
    // 安全 CORS：只允许本地访问
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const isLocal = !origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === 'null';

    if (isLocal) {
      res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 健康检查
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', dnd: dndMode }));
      return;
    }

    if (req.method === 'POST' && req.url === '/state') {
      let body = '';
      let aborted = false;
      const MAX_BODY_SIZE = 64 * 1024; // 64KB 上限，防止恶意/异常请求撑爆内存
      req.on('data', chunk => {
        if (aborted) return;
        body += chunk.toString();
        if (body.length > MAX_BODY_SIZE) {
          aborted = true;
          req.pause(); // 暂停接收数据，而非 destroy（避免 socket hang up）
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
        }
      });
      req.on('end', () => {
        if (aborted) return;
        try {
          const data = JSON.parse(body);
          const { state, event, detail, project } = data;
          const VALID_STATES = ['idle','happy','sleeping','thinking','working','error','notification','waking'];
          if (state && VALID_STATES.includes(state)) {
            notifyStateChange(state, event, detail, project);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else if (req.method === 'POST') {
      // 兼容旧的通知接口
      let body = '';
      let aborted = false;
      const MAX_BODY_SIZE_LEGACY = 64 * 1024;
      req.on('data', chunk => {
        if (aborted) return;
        body += chunk.toString();
        if (body.length > MAX_BODY_SIZE_LEGACY) {
          aborted = true;
          req.pause();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
        }
      });
      req.on('end', () => {
        if (aborted) return;
        try {
          const data = JSON.parse(body);
          let project = data.project || '';
          if (!project && data.cwd) {
            const parts = data.cwd.replace(/\\/g, '/').split('/');
            project = parts[parts.length - 1] || data.cwd;
          }
          notifyStateChange('happy', 'notification', data.message || '任务已完成！', project);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Desktop Cat Notification Server');
    }
  });

  server.listen(PORT, () => {
    console.log(`[Desktop Cat] Notification server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Desktop Cat] Port ${PORT} is already in use`);
    } else {
      console.error('[Desktop Cat] Server error:', err);
    }
  });
}

// 优雅关闭 HTTP 服务器
function stopNotificationServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => {
      console.log('[Desktop Cat] HTTP server closed');
      resolve();
    });
    // 超时强制关闭
    setTimeout(resolve, 2000);
  });
}

// ============================================
// 自启动设置
// ============================================
function setAutoLaunch(enable) {
  const execPath = process.execPath;
  const appPath = app.getAppPath();

  app.setLoginItemSettings({
    openAtLogin: enable,
    path: execPath,
    args: [appPath]
  });

  console.log(`[Desktop Cat] Auto-launch ${enable ? 'enabled' : 'disabled'}`);
}

// ============================================
// 单实例锁
// ============================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('[Desktop Cat] Another instance is already running, quitting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ============================================
// IPC 通信
// ============================================
// 窗口移动（无边界限制，自由跨屏）
ipcMain.on('move-window', (event, deltaX, deltaY) => {
  if (mainWindow) {
    const [currentX, currentY] = mainWindow.getPosition();
    mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
  }
});

// 点击穿透控制
ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// 成就系统持久化
const ACHIEVEMENTS_FILE = path.join(path.join(os.homedir(), '.desktop-cat'), 'achievements.json');

ipcMain.handle('save-achievements', async (event, data) => {
  try {
    fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    console.error('[Desktop Cat] Failed to save achievements:', e.message);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('load-achievements', async () => {
  try {
    if (fs.existsSync(ACHIEVEMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(ACHIEVEMENTS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Desktop Cat] Failed to load achievements:', e.message);
  }
  return null;
});

// 接收历史数据（用于 dialog 显示）
ipcMain.on('show-history-dialog', (event, history) => {
  if (!history || history.length === 0) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Desktop Cat - 通知历史',
      message: '暂无通知记录'
    });
    return;
  }

  const text = history.map((h, i) => {
    const proj = h.project ? `[${h.project}] ` : '';
    return `${i + 1}. ${h.time} ${proj}${h.detail || h.state}`;
  }).join('\n');

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Desktop Cat - 最近通知',
    message: '最近 10 条通知：',
    detail: text
  });
});

// ============================================
// 应用启动
// ============================================
if (gotTheLock) {
  app.whenReady().then(() => {
    console.log('[Desktop Cat] App is ready');

    // 恢复 DND 设置
    dndMode = getConfig('dndMode') || false;

    setAutoLaunch(getConfig('autoLaunch'));
    createMainWindow();
    createTray();
    startNotificationServer();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // 优雅退出：先关 HTTP 服务器，再退出
  app.on('before-quit', async (e) => {
    if (isQuitting) return;
    if (server) {
      e.preventDefault();
      isQuitting = true;
      console.log('[Desktop Cat] Shutting down...');
      await stopNotificationServer();
      server = null;
      app.quit();
    }
  });

  app.on('quit', () => {
    console.log('[Desktop Cat] Quit');
  });
}

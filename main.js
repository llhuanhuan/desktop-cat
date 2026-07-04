// Electron 主进程
console.log('[Desktop Cat] Starting...');

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

let mainWindow;
let tray;
const PORT = 18923;

// ============================================
// 位置记忆
// ============================================
const CONFIG_DIR = path.join(os.homedir(), '.desktop-cat');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveConfig(updates) {
  const config = { ...loadConfig(), ...updates };
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('[Desktop Cat] Failed to save config:', e.message);
  }
}

// ============================================
// 窗口创建
// ============================================
function createWindow() {
  const config = loadConfig();
  const windowOptions = {
    width: 300,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  };

  // 恢复上次位置
  if (config.x !== undefined && config.y !== undefined) {
    windowOptions.x = config.x;
    windowOptions.y = config.y;
  }

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.loadFile('renderer/index.html');

  // 默认开启点击穿透（透明区域穿透到下面窗口）
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 保存位置：移动结束时
  mainWindow.on('move', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      saveConfig({ x, y });
    }
  });
}

// ============================================
// 系统托盘
// ============================================
function createTray() {
  // 加载猫咪图标
  const iconPath = path.join(__dirname, 'renderer', 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const loginSettings = app.getLoginItemSettings();
  const isAutoLaunchEnabled = loginSettings.openAtLogin;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    },
    {
      label: '测试通知',
      click: () => {
        notifyStateChange('happy', 'test', '测试任务已完成！');
      }
    },
    { type: 'separator' },
    {
      label: '开机自启动',
      type: 'checkbox',
      checked: isAutoLaunchEnabled,
      click: (menuItem) => {
        setAutoLaunch(menuItem.checked);
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
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// ============================================
// 状态通知
// ============================================
function notifyStateChange(state, event, detail) {
  if (mainWindow) {
    mainWindow.webContents.send('state-change', { state, event, detail });
  }
}

// ============================================
// HTTP 服务器
// ============================================
function startNotificationServer() {
  const server = http.createServer((req, res) => {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/state') {
      // 状态更新接口
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { state, event, detail } = data;
          if (state) {
            notifyStateChange(state, event, detail);
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
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          notifyStateChange('happy', 'notification', data.message || '任务已完成！');
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

// ============================================
// 应用启动
// ============================================
if (gotTheLock) {
  app.whenReady().then(() => {
    console.log('[Desktop Cat] App is ready');

    setAutoLaunch(true);
    createWindow();
    createTray();
    startNotificationServer();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    console.log('[Desktop Cat] Quitting...');
  });
}

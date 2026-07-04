// Electron 主进程
console.log('[Desktop Cat] Starting...');

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

let mainWindow;
let anchorWindow;
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
// 锚点窗口（任务栏图标）
// ============================================
function createAnchorWindow() {
  const iconPath = path.join(__dirname, 'renderer', 'assets', 'tray-icon-flash.png');

  anchorWindow = new BrowserWindow({
    width: 300,
    height: 300,
    show: false,
    skipTaskbar: false,
    icon: iconPath,
    title: 'Desktop Cat',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 加载一个空白页面
  anchorWindow.loadURL('data:text/html,<html><body style="background:#00000000"></body></html>');

  // 关键：先显示窗口让任务栏图标出现，然后立即隐藏
  anchorWindow.once('ready-to-show', () => {
    anchorWindow.show();
    // 短暂延迟后隐藏，确保任务栏图标已注册
    setTimeout(() => {
      anchorWindow.hide();
      console.log('[Desktop Cat] Anchor window hidden, taskbar icon should persist');
    }, 100);
  });

  // 点击任务栏图标时显示主窗口
  anchorWindow.on('show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
    // 隐藏锚点窗口
    setTimeout(() => {
      if (anchorWindow) anchorWindow.hide();
    }, 50);
  });

  // 锚点窗口关闭时，同时关闭主窗口并退出应用
  anchorWindow.on('closed', () => {
    anchorWindow = null;
    if (mainWindow) {
      mainWindow.close();
    }
  });

  console.log('[Desktop Cat] Anchor window created');
}

// ============================================
// 主窗口（透明猫咪）
// ============================================
function createMainWindow() {
  const config = loadConfig();
  const windowOptions = {
    width: 300,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,  // 主窗口不在任务栏显示
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

  // 主窗口关闭时，不退出应用（锚点窗口仍在）
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 保存位置：移动结束时
  mainWindow.on('move', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();

      // 边界检测：确保窗口在可见屏幕范围内
      const { screen } = require('electron');
      const displays = screen.getAllDisplays();
      let isVisible = false;

      for (const display of displays) {
        const { x: dx, y: dy, width, height } = display.bounds;
        // 检查窗口中心是否在某个显示器范围内
        const centerX = x + 150;
        const centerY = y + 150;
        if (centerX >= dx && centerX <= dx + width && centerY >= dy && centerY <= dy + height) {
          isVisible = true;
          break;
        }
      }

      // 如果窗口不在任何显示器范围内，恢复到主显示器
      if (!isVisible && displays.length > 0) {
        const primaryDisplay = displays[0];
        const newX = primaryDisplay.bounds.x + 100;
        const newY = primaryDisplay.bounds.y + 100;
        mainWindow.setPosition(newX, newY);
        saveConfig({ x: newX, y: newY });
        console.log('[Desktop Cat] Window out of bounds, reset to primary display');
      } else {
        saveConfig({ x, y });
      }
    }
  });
}

// ============================================
// 系统托盘
// ============================================
function createTray() {
  // 加载猫咪图标 (32x32)
  const iconPath = path.join(__dirname, 'renderer', 'assets', 'tray-icon-flash.png');
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
          const { state, event, detail, project } = data;
          if (state) {
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
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          // 从 cwd 中提取项目名称
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
    // 显示主窗口并聚焦
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    if (anchorWindow) {
      anchorWindow.show();
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
    // 同步移动锚点窗口
    if (anchorWindow) {
      anchorWindow.setPosition(currentX + deltaX, currentY + deltaY);
    }
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
    createAnchorWindow();
    createMainWindow();
    createTray();
    startNotificationServer();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createAnchorWindow();
        createMainWindow();
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

// Electron 主进程
console.log('[Desktop Cat] Starting...');

// 在 Electron 主进程中，require('electron') 应该返回 API 对象
// 但根据版本不同，可能需要不同的处理方式

let app, BrowserWindow, Tray, Menu, ipcMain, nativeImage;

// 尝试方式1: 直接 require('electron')
const electron = require('electron');
console.log('[Desktop Cat] require("electron"):', typeof electron);

if (typeof electron === 'object' && electron.app) {
  // 标准方式
  ({ app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = electron);
  console.log('[Desktop Cat] Loaded via require("electron")');
} else if (typeof electron === 'string') {
  // 返回的是路径，说明不是在 Electron 主进程中
  console.log('[Desktop Cat] require("electron") returned path, not in main process');
  console.log('[Desktop Cat] This usually means ELECTRON_RUN_AS_NODE is set');
  console.log('[Desktop Cat] process.env.ELECTRON_RUN_AS_NODE:', process.env.ELECTRON_RUN_AS_NODE);

  // 尝试方式2: 从 electron/dist 获取
  try {
    const distPath = require('electron/dist/electron');
    console.log('[Desktop Cat] require("electron/dist/electron"):', typeof distPath);
  } catch (e) {
    console.log('[Desktop Cat] require("electron/dist/electron") failed');
  }

  // 尝试方式3: 使用 process.mainModule
  if (process.mainModule) {
    console.log('[Desktop Cat] process.mainModule:', process.mainModule.filename);
  }
}

const path = require('path');
const http = require('http');

let mainWindow;
let tray;
const PORT = 18923;

function createWindow() {
  if (!BrowserWindow) {
    console.error('[Desktop Cat] BrowserWindow not available');
    return;
  }

  mainWindow = new BrowserWindow({
    width: 200,
    height: 200,
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
  });

  mainWindow.loadFile('renderer/index.html');
  mainWindow.setIgnoreMouseEvents(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  if (!Tray || !nativeImage) {
    console.error('[Desktop Cat] Tray or nativeImage not available');
    return;
  }

  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

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
        notifyTaskDone('测试任务已完成！');
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

function notifyTaskDone(message) {
  // 发送应用内通知
  if (mainWindow) {
    mainWindow.webContents.send('task-done', message);
  }
}

// 处理窗口移动
ipcMain.on('move-window', (event, deltaX, deltaY) => {
  if (mainWindow) {
    const [currentX, currentY] = mainWindow.getPosition();
    mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
  }
});

function startNotificationServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          notifyTaskDone(data.message || '任务已完成！');
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

// 检查 API是否可用
if (!app) {
  console.error('[Desktop Cat] Error: Electron API not available');
  console.error('[Desktop Cat] This script must be run with Electron');
  console.error('[Desktop Cat] Try: npm start');
  process.exit(1);
}

app.whenReady().then(() => {
  console.log('[Desktop Cat] App is ready');
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

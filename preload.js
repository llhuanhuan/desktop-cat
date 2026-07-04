const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  // 状态变化监听（来自 Claude Code hook）
  onStateChange: (callback) => {
    ipcRenderer.on('state-change', (event, data) => {
      callback(data);
    });
  },

  // 兼容旧的通知接口
  onTaskDone: (callback) => {
    ipcRenderer.on('task-done', (event, message) => {
      callback(message);
    });
  },

  // 窗口移动
  moveWindow: (deltaX, deltaY) => {
    ipcRenderer.send('move-window', deltaX, deltaY);
  },

  // 点击穿透控制
  setIgnoreMouse: (ignore) => {
    ipcRenderer.send('set-ignore-mouse', ignore);
  },

  // 清理监听器
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('state-change');
    ipcRenderer.removeAllListeners('task-done');
  }
});

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

  // DND 模式切换
  onToggleDND: (callback) => {
    ipcRenderer.on('toggle-dnd', (event, enabled) => {
      callback(enabled);
    });
  },

  // 显示历史请求
  onShowHistory: (callback) => {
    ipcRenderer.on('show-history', () => {
      callback();
    });
  },

  // 发送历史数据到主进程（用于 dialog 显示）
  sendHistory: (history) => {
    ipcRenderer.send('show-history-dialog', history);
  },

  // 窗口移动
  moveWindow: (deltaX, deltaY) => {
    ipcRenderer.send('move-window', deltaX, deltaY);
  },

  // 点击穿透控制
  setIgnoreMouse: (ignore) => {
    ipcRenderer.send('set-ignore-mouse', ignore);
  },

  // 精确清理监听器（按 channel）
  removeStateChangeListener: () => {
    ipcRenderer.removeAllListeners('state-change');
  },
  removeTaskDoneListener: () => {
    ipcRenderer.removeAllListeners('task-done');
  },
  removeToggleDNDListener: () => {
    ipcRenderer.removeAllListeners('toggle-dnd');
  },
  removeShowHistoryListener: () => {
    ipcRenderer.removeAllListeners('show-history');
  }
});

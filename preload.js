const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  onTaskDone: (callback) => {
    ipcRenderer.on('task-done', (event, message) => {
      callback(message);
    });
  },
  removeTaskDoneListener: () => {
    ipcRenderer.removeAllListeners('task-done');
  },
  moveWindow: (deltaX, deltaY) => {
    ipcRenderer.send('move-window', deltaX, deltaY);
  }
});

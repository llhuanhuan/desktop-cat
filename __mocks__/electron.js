// Electron mock for testing
module.exports = {
  app: {
    getPath: jest.fn(() => '/mock/path'),
    getName: jest.fn(() => 'desktop-cat'),
    getVersion: jest.fn(() => '1.0.0'),
    quit: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve())
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    webContents: {
      send: jest.fn()
    }
  })),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn()
  },
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
    invoke: jest.fn()
  },
  shell: {
    openExternal: jest.fn()
  },
  Tray: jest.fn(() => ({
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn()
  })),
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn()
  },
  nativeImage: {
    createFromPath: jest.fn(() => ({
      resize: jest.fn()
    }))
  }
};

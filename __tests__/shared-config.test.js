/**
 * shared-config.js 测试用例
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock fs module
jest.mock('fs');

const {
  CONFIG_DIR,
  CONFIG_FILE,
  DEFAULTS,
  loadConfig,
  getConfig,
  getAllConfig,
  saveConfig
} = require('../shared-config');

describe('shared-config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置缓存
    const { __resetCache } = require('../shared-config');
    if (__resetCache) __resetCache();
  });

  describe('constants', () => {
    test('CONFIG_DIR should be in user home directory', () => {
      expect(CONFIG_DIR).toBe(path.join(os.homedir(), '.desktop-cat'));
    });

    test('CONFIG_FILE should be config.json in CONFIG_DIR', () => {
      expect(CONFIG_FILE).toBe(path.join(CONFIG_DIR, 'config.json'));
    });

    test('DEFAULTS should have required keys', () => {
      expect(DEFAULTS).toHaveProperty('port');
      expect(DEFAULTS).toHaveProperty('windowWidth');
      expect(DEFAULTS).toHaveProperty('windowHeight');
      expect(DEFAULTS).toHaveProperty('autoLaunch');
      expect(DEFAULTS).toHaveProperty('soundEnabled');
      expect(DEFAULTS).toHaveProperty('dndMode');
    });
  });

  describe('loadConfig', () => {
    test('should return empty object when config file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const config = loadConfig();
      expect(config).toEqual({});
    });

    test('should return parsed config when file exists', () => {
      const mockConfig = { port: 3000, autoLaunch: false };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      fs.statSync.mockReturnValue({ mtimeMs: 1000 });

      const config = loadConfig();
      expect(config).toEqual(mockConfig);
    });

    test('should return empty object on JSON parse error', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      fs.statSync.mockReturnValue({ mtimeMs: 1000 });

      const config = loadConfig();
      expect(config).toEqual({});
    });
  });

  describe('getConfig', () => {
    test('should return default value when key not in config', () => {
      fs.existsSync.mockReturnValue(false);
      expect(getConfig('port')).toBe(DEFAULTS.port);
    });

    test('should return config value when key exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ port: 3000 }));
      fs.statSync.mockReturnValue({ mtimeMs: 1000 });

      expect(getConfig('port')).toBe(3000);
    });
  });

  describe('getAllConfig', () => {
    test('should return defaults when no config file', () => {
      fs.existsSync.mockReturnValue(false);
      const config = getAllConfig();
      expect(config).toEqual(DEFAULTS);
    });

    test('should merge config with defaults', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ port: 3000 }));
      fs.statSync.mockReturnValue({ mtimeMs: 1000 });

      const config = getAllConfig();
      expect(config.port).toBe(3000);
      expect(config.windowWidth).toBe(DEFAULTS.windowWidth);
    });
  });

  describe('saveConfig', () => {
    test('should create directory if not exists', () => {
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});

      saveConfig({ port: 3000 });

      expect(fs.mkdirSync).toHaveBeenCalledWith(CONFIG_DIR, { recursive: true });
    });

    test('should write config to file', () => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});

      saveConfig({ port: 3000 });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        CONFIG_FILE,
        expect.any(String),
        'utf8'
      );
    });

    test('should handle write errors gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      // Should not throw
      expect(() => saveConfig({ port: 3000 })).not.toThrow();
    });
  });
});

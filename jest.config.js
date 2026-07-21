module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  collectCoverageFrom: [
    '*.js',
    'renderer/*.js',
    '!jest.config.js',
    '!node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  // 忽略 Electron 相关的模块
  moduleNameMapper: {
    '^electron$': '<rootDir>/__mocks__/electron.js'
  }
};

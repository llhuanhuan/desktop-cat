/**
 * 构建诊断脚本
 * 分析为什么 exe 在某些 Windows 系统上无法运行
 */

const fs = require('fs');
const path = require('path');

console.log('=== Desktop Cat 构建诊断 ===\n');

// 1. 检查 package.json 配置
console.log('1. 检查构建配置:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const buildConfig = packageJson.build;

console.log('  - 目标平台:', buildConfig.win.target.map(t => `${t.target} (${t.arch.join(', ')})`).join(', '));
console.log('  - Electron 版本:', packageJson.devDependencies.electron);

// 2. 检查构建产物
console.log('\n2. 检查构建产物:');
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    if (file.endsWith('.exe')) {
      console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    }
  });
} else {
  console.log('  - dist 目录不存在');
}

// 3. 检查原生模块
console.log('\n3. 检查原生模块依赖:');
const nativeModules = ['sharp'];
nativeModules.forEach(mod => {
  try {
    const modPath = require.resolve(mod);
    console.log(`  - ${mod}: 已找到`);
  } catch (e) {
    console.log(`  - ${mod}: 未找到或加载失败`);
  }
});

// 4. 问题分析
console.log('\n4. 问题分析:');
console.log('  可能的原因:');
console.log('  a) 架构限制: 当前只构建 x64，不支持 32 位系统');
console.log('  b) 运行时依赖: 可能需要 Visual C++ Redistributable');
console.log('  c) Windows 版本: 某些旧版 Windows 可能不支持');
console.log('  d) 原生模块: sharp 可能需要针对不同架构编译');

// 5. 建议修复
console.log('\n5. 建议修复:');
console.log('  1. 添加 ia32 和 arm64 架构支持');
console.log('  2. 确保包含所有必要的运行时依赖');
console.log('  3. 考虑使用 NSIS 安装包（自动安装依赖）');
console.log('  4. 测试不同 Windows 版本的兼容性');

console.log('\n=== 诊断完成 ===');

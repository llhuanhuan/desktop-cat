/**
 * 测试构建配置
 * 验证多架构支持和 VC++ 运行时打包配置
 */

const fs = require('fs');
const path = require('path');

console.log('=== 测试构建配置 ===\n');

let passed = 0;
let failed = 0;

// 测试 1: 检查 package.json 配置
console.log('1. 检查 package.json 配置:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const buildConfig = packageJson.build;

  // 检查多架构支持
  const winTargets = buildConfig.win.target;
  const hasX64 = winTargets.some(t => t.arch.includes('x64'));
  const hasIa32 = winTargets.some(t => t.arch.includes('ia32'));
  const hasArm64 = winTargets.some(t => t.arch.includes('arm64'));

  if (hasX64 && hasIa32 && hasArm64) {
    console.log('  ✅ 多架构支持: x64, ia32, arm64');
    passed++;
  } else {
    console.log('  ❌ 缺少架构支持');
    failed++;
  }

  // 检查 NSIS 配置
  if (buildConfig.nsis.include) {
    console.log('  ✅ NSIS 安装脚本: ' + buildConfig.nsis.include);
    passed++;
  } else {
    console.log('  ❌ 缺少 NSIS 安装脚本配置');
    failed++;
  }

  // 检查 extraResources
  if (buildConfig.extraResources && buildConfig.extraResources.length > 0) {
    console.log('  ✅ VC++ 运行时打包: ' + buildConfig.extraResources.length + ' 个文件');
    passed++;
  } else {
    console.log('  ❌ 缺少 VC++ 运行时打包配置');
    failed++;
  }

  // 检查构建脚本
  const scripts = packageJson.scripts;
  if (scripts['build:win:x64'] && scripts['build:win:ia32'] && scripts['build:win:arm64']) {
    console.log('  ✅ 构建脚本: 支持多架构构建');
    passed++;
  } else {
    console.log('  ❌ 缺少多架构构建脚本');
    failed++;
  }
} catch (e) {
  console.log('  ❌ 读取 package.json 失败: ' + e.message);
  failed++;
}

// 测试 2: 检查 VC++ Redistributable 文件
console.log('\n2. 检查 VC++ Redistributable 文件:');
const buildDir = path.join(__dirname, '..', 'build');
const vcFiles = ['vc_redist.x64.exe', 'vc_redist.x86.exe'];

vcFiles.forEach(file => {
  const filePath = path.join(buildDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ ${file} (${sizeMB} MB)`);
    passed++;
  } else {
    console.log(`  ❌ ${file} 不存在`);
    failed++;
  }
});

// 测试 3: 检查 NSIS 安装脚本
console.log('\n3. 检查 NSIS 安装脚本:');
const installerPath = path.join(buildDir, 'installer.nsh');
if (fs.existsSync(installerPath)) {
  const content = fs.readFileSync(installerPath, 'utf8');
  if (content.includes('customInit') && content.includes('vc_redist')) {
    console.log('  ✅ installer.nsh 配置正确');
    passed++;
  } else {
    console.log('  ❌ installer.nsh 内容不完整');
    failed++;
  }
} else {
  console.log('  ❌ installer.nsh 不存在');
  failed++;
}

// 测试 4: 检查 GitHub Actions 工作流
console.log('\n4. 检查 GitHub Actions 工作流:');
const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'release.yml');
if (fs.existsSync(workflowPath)) {
  const content = fs.readFileSync(workflowPath, 'utf8');
  if (content.includes('x64') && content.includes('ia32') && content.includes('arm64')) {
    console.log('  ✅ 工作流支持多架构构建');
    passed++;
  } else {
    console.log('  ❌ 工作流缺少多架构支持');
    failed++;
  }
} else {
  console.log('  ❌ release.yml 不存在');
  failed++;
}

// 测试结果
console.log('\n=== 测试结果 ===');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);

if (failed > 0) {
  console.log('\n❌ 部分测试失败，请检查配置');
  process.exit(1);
} else {
  console.log('\n✅ 所有测试通过！构建配置正确');
  process.exit(0);
}

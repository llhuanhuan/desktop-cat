# 构建兼容性修复方案

## 问题描述
当前构建的 exe 只能在部分 Windows 系统运行，缺少必要的运行时依赖。

## 根本原因
1. **缺少 Visual C++ Redistributable** - Electron 43 需要 VC++ 2015-2022
2. **架构限制** - 只构建 x64，不支持 32 位系统
3. **运行时未打包** - 依赖用户系统预装运行时

## 修复方案

### 方案 A: 添加多架构支持 (推荐)
修改 `package.json` 的 build 配置：

```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64", "ia32", "arm64"]
    },
    {
      "target": "portable",
      "arch": ["x64", "ia32", "arm64"]
    }
  ]
}
```

### 方案 B: 打包 VC++ 运行时 (推荐)
1. 下载 VC++ Redistributable 安装包
2. 添加到 `extraResources`
3. 在 NSIS 安装脚本中检查并安装

### 方案 C: 更新 GitHub Actions 工作流
构建多个架构的产物：

```yaml
strategy:
  matrix:
    include:
      - os: windows-latest
        arch: x64
        artifact: dist/*-x64.exe
      - os: windows-latest
        arch: ia32
        artifact: dist/*-ia32.exe
```

## 实施步骤

### 步骤 1: 下载 VC++ Redistributable
```bash
# 下载 x64 版本
curl -L -o build/vc_redist.x64.exe https://aka.ms/vs/17/release/vc_redist.x64.exe

# 下载 x86 版本 (用于 32 位系统)
curl -L -o build/vc_redist.x86.exe https://aka.ms/vs/17/release/vc_redist.x86.exe
```

### 步骤 2: 创建 NSIS 安装脚本
创建 `build/installer.nsh`:

```nsis
!macro customInit
  ; 检查是否已安装 VC++ Redistributable
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  ${If} $0 != 1
    ; 未安装，执行安装
    ExecWait '"$PLUGINSDIR\vc_redist.x64.exe" /install /quiet /norestart'
  ${EndIf}
!macroend
```

### 步骤 3: 更新 package.json 配置
```json
"build": {
  "extraResources": [
    {
      "from": "build/vc_redist.x64.exe",
      "to": "vc_redist.x64.exe"
    }
  ],
  "nsis": {
    "include": "build/installer.nsh"
  }
}
```

### 步骤 4: 更新 GitHub Actions
```yaml
- name: Download VC++ Redistributable
  run: |
    curl -L -o build/vc_redist.x64.exe https://aka.ms/vs/17/release/vc_redist.x64.exe

- name: Build
  run: npm run build:win
```

## 测试建议
1. 在干净的 Windows 10/11 虚拟机上测试
2. 测试 Windows Server 2019/2022
3. 测试 32 位系统 (如果添加 ia32 支持)
4. 测试 ARM64 设备 (如果添加 arm64 支持)

## 临时解决方案 (用户手动安装)
在 README 中添加说明：

```markdown
## 系统要求
- Windows 10/11 (64 位)
- [Visual C++ Redistributable 2015-2022](https://aka.ms/vs/17/release/vc_redist.x64.exe)

如果遇到 "VCRUNTIME140.dll not found" 错误，请先安装上述运行时。
```

## 参考资料
- [Microsoft Visual C++ Redistributable 最新版本](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- [electron-builder NSIS 配置](https://www.electron.build/configuration/nsis)
- [GitHub Issues: electron-builder#3099](https://github.com/electron-userland/electron-builder/issues/3099)

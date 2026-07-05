# Desktop Cat - Claude Code 桌面猫咪通知

一个可爱的桌面猫咪，会在 Claude Code 完成任务时通知你。

## 功能特性

- 🐱 可爱的猫咪动画
- ✨ 任务完成时播放开心动画
- 🔔 系统通知
- 🖱️ 支持拖拽移动位置
- 📌 始终置顶显示

## 安装

```bash
# 进入项目目录
cd desktop-cat

# 安装依赖
npm install
```

## 使用

### 启动桌面猫咪

```bash
# 方法 1: 使用 npm
npm start

# 方法 2: 使用启动脚本
start.bat
```

### 测试通知

1. 启动桌面猫咪应用
2. 右键点击系统托盘图标
3. 选择"测试通知"

### 配置 Claude Code Hook

桌面猫咪会自动监听本地端口（默认 18923）。要让它在 Claude Code 任务完成时自动通知，运行安装脚本：

```bash
node hooks/install.js
```

这会自动将 hook 注册到 `~/.claude/settings.json` 中。

卸载 hook：
```bash
node hooks/install.js uninstall
```

## 项目结构

```
desktop-cat/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── renderer/
│   ├── index.html       # 主页面
│   ├── style.css        # 样式
│   ├── app.js           # 渲染进程逻辑
│   └── assets/          # 动画资源
├── package.json
├── start.bat            # 启动脚本
└── README.md
```

## 自定义

所有配置存储在 `~/.desktop-cat/config.json`，首次运行时自动创建。可自定义项：

```json
{
  "port": 18923,        // 通知服务器端口
  "windowWidth": 300,   // 窗口宽度
  "windowHeight": 300,  // 窗口高度
  "autoLaunch": true,   // 开机自启动
  "soundEnabled": true  // 音效开关
}
```

### 修改猫咪颜色

编辑 `renderer/style.css`，修改 `#FF9F43`（橙色）为你喜欢的颜色。

### 添加音效

将音效文件放入 `renderer/assets/sounds/` 目录，然后在 `app.js` 中取消注释音效播放代码。

## 故障排除

### 端口被占用

如果看到 "Port 18923 is already in use" 错误，可以：
1. 关闭占用端口的程序
2. 或者修改 `~/.desktop-cat/config.json` 中的 `port` 值

### 通知不工作

1. 确保桌面猫咪应用正在运行
2. 检查端口是否被防火墙阻止
3. 尝试手动测试：`curl -X POST http://localhost:18923 -H "Content-Type: application/json" -d '{"message":"测试"}'`

## 开发

```bash
# 开发模式（带调试）
npm run dev
```

## 许可证

MIT

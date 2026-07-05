# Desktop Cat 通知设置

## 快速开始

1. 启动桌面宠物：
   ```bash
   cd e:/AI/desktop-cat
   npm start
   ```

2. 测试通知：
   ```bash
   node claude-hook.js "测试消息"
   ```

## Claude Code 集成

### 方法 1: 自动安装（推荐）
```bash
node hooks/install.js
```
这会自动将 hook 注册到 Claude Code 配置中。

### 方法 2: 手动调用
在 Claude Code 完成任务后，执行：
```bash
node e:/AI/desktop-cat/claude-hook.js "任务描述"
```

## API 接口

桌面宠物监听本地端口（默认 18923，可在 `~/.desktop-cat/config.json` 中修改）。

发送通知：
```bash
curl -X POST http://localhost:18923 \
  -H "Content-Type: application/json" \
  -d '{"message": "你的消息"}'
```

## 配置

所有配置存储在 `~/.desktop-cat/config.json`，首次运行时自动创建：

```json
{
  "port": 18923,
  "windowWidth": 300,
  "windowHeight": 300,
  "autoLaunch": true,
  "soundEnabled": true
}
```

## 注意事项

- 确保桌面宠物正在运行
- 端口未被占用（默认 18923）
- Windows 系统需要允许 Node.js 通过防火墙

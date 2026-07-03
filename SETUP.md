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

### 方法 1: 手动调用（推荐）
在 Claude Code 完成任务后，执行：
```bash
node e:/AI/desktop-cat/claude-hook.js "任务描述"
```

### 方法 2: 配置为自动钩子
在项目的 `.claude/settings.json` 中添加：
```json
{
  "hooks": {
    "afterResponse": "node e:/AI/desktop-cat/claude-hook.js \"Claude Code 任务完成\""
  }
}
```

## API 接口

桌面宠物监听端口：`18923`

发送通知：
```bash
curl -X POST http://localhost:18923 \
  -H "Content-Type: application/json" \
  -d '{"message": "你的消息"}'
```

## 注意事项

- 确保桌面宠物正在运行
- 端口 18923 未被占用
- Windows 系统需要允许 Node.js 通过防火墙

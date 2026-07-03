@echo off
REM 发送通知到桌面宠物
REM 用法: notify.bat "任务完成消息"

set MESSAGE=%~1
if "%MESSAGE%"=="" set MESSAGE=Claude Code 任务已完成！

curl -X POST http://localhost:18923 -H "Content-Type: application/json" -d "{\"message\": \"%MESSAGE%\"}"

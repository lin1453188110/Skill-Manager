@echo off
cd /d "%~dp0"
echo 🛠️  Skill Manager - 后台启动中...
echo.
echo    浏览器将自动打开 http://127.0.0.1:3001
echo    关闭此窗口将停止服务
echo.
start /B node dist-server\bundle.cjs > nul 2>&1
timeout /t 2 /nobreak > nul
start http://127.0.0.1:3001
echo ✅ 已启动！按任意键停止服务...
pause > nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Skill*" > nul 2>&1

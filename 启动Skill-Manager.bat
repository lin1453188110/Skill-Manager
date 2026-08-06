@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Skill Manager

echo 🛠️  Skill Manager 正在启动...
echo.

REM 检查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js，请先安装 https://nodejs.org/
    pause
    exit /b 1
)

REM 检查依赖
if not exist node_modules (
    echo 📦 正在安装依赖 (npm install)...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查前端构建产物
if not exist dist (
    echo 🏗️  正在构建前端 (npm run build)...
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败
        pause
        exit /b 1
    )
)

echo ✅ 启动成功，正在打开浏览器 http://127.0.0.1:3001
echo    关闭此窗口将停止服务
echo.

start "Skill-Manager" /B cmd /c "npm run dev:server" > nul 2>&1
timeout /t 2 /nobreak > nul
start http://127.0.0.1:3001
pause > nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Skill*" > nul 2>&1

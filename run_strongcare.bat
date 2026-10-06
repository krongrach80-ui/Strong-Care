@echo off
title Strong Care Web Runner
echo ========================================================
echo       Starting Strong Care System (Backend + Frontend)
echo   AI-assisted Rehabilitation Monitoring Platform v1.0
echo ========================================================

set "CURRENT_DIR=%~dp0"
set "NODE_PATH=%CURRENT_DIR%..\node-v20.18.0-win-x64"
set "PHP_PATH=%CURRENT_DIR%..\php"
set "PATH=%NODE_PATH%;%PHP_PATH%;%PATH%"

echo [1/2] Starting PHP Backend API on http://127.0.0.1:8000 ...
start "StrongCare-Backend" /min "%PHP_PATH%\php.exe" -S 127.0.0.1:8000 -t "%CURRENT_DIR%backend" "%CURRENT_DIR%backend\index.php"

echo [2/2] Starting Frontend (Vite) on http://127.0.0.1:5173 ...
cd /d "%CURRENT_DIR%frontend"
start "StrongCare-Frontend" "%NODE_PATH%\node.exe" ".\node_modules\vite\bin\vite.js" --host 127.0.0.1 --open http://127.0.0.1:5173

echo.
echo ========================================================
echo   Web servers are running!
echo   - Frontend: http://127.0.0.1:5173
echo   - Backend API: http://127.0.0.1:8000/api
echo ========================================================
pause

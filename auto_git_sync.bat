@echo off
title Strong Care - Real-Time GitHub Auto Sync
cd /d "%~dp0"

echo ==========================================================
echo   Strong Care - Real-Time GitHub Auto Sync
echo   Repository: https://github.com/krongrach80-ui/Strong-Care.git
echo ==========================================================
echo.
echo Starting Auto-Sync Watcher...
echo (When you save or create files, they will auto push to GitHub!)
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto_git_sync.ps1"

pause

@echo off
title FaceVoice - Frontend Dev Server
cd /d "%~dp0\frontend"
echo ========================================================
echo   Starting FaceVoice Frontend (Vite Dev Server)
echo   Local App: http://localhost:3000
echo ========================================================
npm run dev
pause

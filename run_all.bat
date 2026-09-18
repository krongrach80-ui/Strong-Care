@echo off
title FaceVoice - One-Click Launcher
echo ========================================================
echo   Launching FaceVoice AI Platform...
echo ========================================================
start "FaceVoice Backend" cmd /k "%~dp0run_backend.bat"
ping 127.0.0.1 -n 4 >nul
start "FaceVoice Frontend" cmd /k "%~dp0run_frontend.bat"
ping 127.0.0.1 -n 3 >nul
start http://localhost:3000
echo System is launching!

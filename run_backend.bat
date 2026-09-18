@echo off
title FaceVoice - FastAPI Backend Server
cd /d "%~dp0\backend"
echo ========================================================
echo   Starting FaceVoice AI Backend Platform (FastAPI)
echo   API Docs: http://localhost:8000/docs
echo   Web App:  http://localhost:8000
echo ========================================================
"C:\Users\Changretta\AppData\Local\Programs\Python\Python311\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

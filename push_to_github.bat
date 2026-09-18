@echo off
title Push Strong Care to GitHub
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\mingw64\bin;%PATH%"

echo ========================================================
echo   Pushing Strong Care to GitHub (krongrach80-ui)
echo   Repository: https://github.com/krongrach80-ui/Strong-Care.git
echo   Email: krongrach80@gmail.com
echo ========================================================

git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Strong Care has been pushed to GitHub!
    echo   View repo: https://github.com/krongrach80-ui/Strong-Care
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   If authentication is needed, please sign in via the browser window.
    echo ========================================================
)
pause

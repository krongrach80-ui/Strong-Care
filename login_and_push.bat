@echo off
title GitHub Authentication & Push - Strong Care
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\mingw64\bin;C:\Program Files\GitHub CLI;%PATH%"

echo ========================================================
echo   GitHub Setup & Push for Strong Care
echo   Repository: https://github.com/krongrach80-ui/Strong-Care.git
echo   Email: krongrach80@gmail.com
echo ========================================================
echo.

echo [1/3] Checking GitHub CLI Authentication...
gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo --------------------------------------------------------
    echo   Please complete GitHub login in the browser window!
    echo   1. Copy the 8-digit one-time code shown below.
    echo   2. Press Enter to open GitHub in your browser.
    echo   3. Paste the code and click 'Authorize'.
    echo --------------------------------------------------------
    echo.
    gh auth login --web --git-protocol https
) else (
    echo [OK] Already logged into GitHub CLI!
)

echo.
echo [2/3] Configuring Git with GitHub credentials...
gh auth setup-git

echo.
echo [3/3] Pushing Strong Care repository to GitHub main branch...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Strong Care successfully uploaded to GitHub!
    echo   Repository URL: https://github.com/krongrach80-ui/Strong-Care
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push encountered an issue. Please verify permissions.
)

echo.
pause

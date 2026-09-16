@echo off
title Student Automation System - SIH 2026 Launcher
color 0B

echo.
echo  =====================================================
echo   STUDENT AUTOMATION SYSTEM - SIH 2026
echo   Powered by In Net Creations
echo   Created by S. Manohar
echo  =====================================================
echo.

cd /d "%~dp0student-auth-app"

echo [1/2] Checking dependencies...
call npm.cmd install --no-fund --no-audit --silent
echo.

echo [2/2] Choose run mode:
echo   [1] Development Mode   (hot-reload, for testing changes)
echo   [2] Production Mode    (fastest, recommended for demos)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="2" goto prod
if "%choice%"=="1" goto dev
echo Invalid choice. Defaulting to Development...
goto dev

:dev
echo.
echo  Starting Development Server...
echo  Opening: http://localhost:3000
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
call npm.cmd run dev
pause
exit /b 0

:prod
echo.
echo  Building production bundle (this may take 1-2 minutes)...
call npm.cmd run build
if %errorlevel% neq 0 (
  echo.
  echo  ERROR: Build failed! Check errors above.
  pause
  exit /b 1
)
echo.
echo  Starting Production Server...
echo  Opening: http://localhost:3000
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
call npm.cmd run start
pause
exit /b 0

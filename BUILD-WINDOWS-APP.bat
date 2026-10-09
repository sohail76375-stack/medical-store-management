@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo   Medical Store Management - Windows App Builder
echo ================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js LTS from https://nodejs.org/en/download
  pause
  exit /b 1
)
echo Installing required packages. Internet is required for the first build...
call npm install
if errorlevel 1 (
  echo.
  echo Dependency installation failed. Check your internet connection, then run this script again.
  pause
  exit /b 1
)
echo Building the Windows installer...
call npm run dist:win
if errorlevel 1 (
  echo.
  echo Build failed. Read the error above, then try again.
  pause
  exit /b 1
)
echo.
echo SUCCESS! Your installer is in the dist folder.
explorer "%~dp0dist"
pause

@echo off
title Budget App Server
cd /d "%~dp0"

echo ============================================
echo   Starting your Budget app...
echo   It will open at http://localhost:3000
echo.
echo   KEEP THIS WINDOW OPEN while using the app.
echo   Close this window to stop the server.
echo ============================================
echo.

REM Open the browser a couple seconds after the server starts.
start "" /min cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:3000"

REM Start the server (this keeps running until you close the window).
node backend/index.js

echo.
echo Server stopped. Press any key to close.
pause >nul

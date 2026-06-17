@echo off
title BigQuery Release Insights Launcher
echo ========================================================
echo   BigQuery Release Insights - Web Application Launcher
echo ========================================================
echo.
echo [1/3] Activating virtual environment...
if not exist venv\Scripts\python.exe (
    echo [ERROR] Virtual environment 'venv' not found.
    echo Please ensure Python is installed and run: python -m venv venv
    pause
    exit /b 1
)

echo [2/3] Verifying dependencies...
venv\Scripts\pip install -r requirements.txt >nul 2>&1

echo [3/3] Opening browser and starting application...
start http://127.0.0.1:5000/
echo.
echo Application is running at http://127.0.0.1:5000/
echo Close this terminal window to stop the server.
echo.
venv\Scripts\python.exe app.py
pause

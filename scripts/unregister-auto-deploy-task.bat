@echo off
rem  Removes the Task Scheduler entry that runs auto-deploy.ps1.
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-auto-deploy-task.ps1" -Remove
echo.
pause

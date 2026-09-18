@echo off
rem  Creates or updates the Task Scheduler entry that runs auto-deploy.ps1.
rem  Administrator rights are NOT required. Existing auto-deploy/auto-commit
rem  tasks are reused instead of creating a second one.
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-auto-deploy-task.ps1" %*
echo.
pause

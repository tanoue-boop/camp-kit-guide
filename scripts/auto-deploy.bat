@echo off
rem ---------------------------------------------------------------------------
rem  auto-deploy.bat - Task Scheduler entry point.
rem  Delegates to auto-deploy.ps1, which starts scripts\deploy.cjs when there is
rem  something ready to publish. See auto-deploy.ps1 for the guards.
rem ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0.."
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0auto-deploy.ps1"
exit /b %errorlevel%

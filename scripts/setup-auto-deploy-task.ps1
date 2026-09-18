<#
    setup-auto-deploy-task.ps1 - create or update the Windows Task Scheduler entry
    that runs auto-deploy.ps1 (which starts scripts/deploy.cjs).

    It first looks for scheduled tasks that already point at an auto-commit script
    for this repository. If it finds any, it repoints and re-schedules them instead
    of creating a second task (two tasks committing the same repo would race).

    Usage (from scripts\):
      powershell -NoProfile -ExecutionPolicy Bypass -File setup-auto-deploy-task.ps1
      powershell -NoProfile -ExecutionPolicy Bypass -File setup-auto-deploy-task.ps1 -IntervalMinutes 30
      powershell -NoProfile -ExecutionPolicy Bypass -File setup-auto-deploy-task.ps1 -ListOnly
      powershell -NoProfile -ExecutionPolicy Bypass -File setup-auto-deploy-task.ps1 -Remove

    Administrator rights are not required: the task is registered for the current user.
#>
[CmdletBinding()]
param(
    [int]$IntervalMinutes = 30,
    [string]$TaskName = 'campkit-auto-deploy',
    [switch]$ListOnly,
    [switch]$Remove
)

$ErrorActionPreference = 'Stop'

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $PSScriptRoot 'auto-deploy.ps1'
if (-not (Test-Path $ScriptPath)) {
    Write-Host "[ERROR] auto-deploy.ps1 not found at $ScriptPath" -ForegroundColor Red
    exit 1
}

function Get-AutoDeployTasks {
    # このリポジトリを指しているタスクだけを対象にする。
    # 名前だけで照合すると、別プロジェクトの auto-commit / auto-deploy タスクまで
    # 書き換えてしまうため、必ずリポジトリの絶対パスで絞り込む。
    Get-ScheduledTask | Where-Object {
        $_.Actions | Where-Object {
            $text = ''
            if ($_.PSObject.Properties.Name -contains 'Execute')   { $text += [string]$_.Execute }
            if ($_.PSObject.Properties.Name -contains 'Arguments') { $text += ' ' + [string]$_.Arguments }
            $text -like ('*' + $RepoRoot + '*')
        }
    }
}

$existing = @(Get-AutoDeployTasks)

Write-Host ''
if ($existing.Count -gt 0) {
    Write-Host ('Found {0} existing auto-deploy task(s):' -f $existing.Count) -ForegroundColor Yellow
    foreach ($t in $existing) {
        $info = $t | Get-ScheduledTaskInfo
        Write-Host ('  - {0}{1}  [{2}]  last run: {3}  next run: {4}' -f $t.TaskPath, $t.TaskName, $t.State, $info.LastRunTime, $info.NextRunTime)
        foreach ($a in $t.Actions) { Write-Host ('      action: {0} {1}' -f $a.Execute, $a.Arguments) }
    }
}
else {
    Write-Host 'No existing auto-deploy task found.' -ForegroundColor Yellow
}
Write-Host ''

if ($ListOnly) { exit 0 }

if ($Remove) {
    if ($existing.Count -eq 0) { Write-Host 'Nothing to remove.'; exit 0 }
    foreach ($t in $existing) {
        Unregister-ScheduledTask -TaskName $t.TaskName -TaskPath $t.TaskPath -Confirm:$false
        Write-Host ('Removed {0}{1}' -f $t.TaskPath, $t.TaskName) -ForegroundColor Green
    }
    exit 0
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}"' -f $ScriptPath)

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)
$trigger.Repetition = (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)).Repetition

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 1)

if ($existing.Count -gt 0) {
    foreach ($t in $existing) {
        Set-ScheduledTask -TaskName $t.TaskName -TaskPath $t.TaskPath -Action $action -Trigger $trigger -Settings $settings | Out-Null
        Write-Host ('Updated {0}{1}: runs auto-deploy.ps1 every {2} minutes' -f $t.TaskPath, $t.TaskName, $IntervalMinutes) -ForegroundColor Green
    }
}
else {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
    Write-Host ('Registered "{0}": runs auto-deploy.ps1 every {1} minutes' -f $TaskName, $IntervalMinutes) -ForegroundColor Green
}

Write-Host ''
Write-Host 'Current state:'
foreach ($t in @(Get-AutoDeployTasks)) {
    $info = $t | Get-ScheduledTaskInfo
    Write-Host ('  - {0}{1}  [{2}]  next run: {3}' -f $t.TaskPath, $t.TaskName, $t.State, $info.NextRunTime)
}
Write-Host ''
Write-Host 'Results are written to logs\auto-deploy-status.json and logs\auto-deploy.log'

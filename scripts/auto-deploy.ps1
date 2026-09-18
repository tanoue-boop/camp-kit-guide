<#
    auto-deploy.ps1 - run scripts/deploy.cjs automatically on a schedule.

    Campkit already has deploy.cjs, which does everything that matters:
      exclusive .deploy.lock, git lock recovery, .env/node_modules detection,
      lint-bold check, npm run build (mandatory), scoped git add, commit,
      push and production verification (verify-deploy.cjs).

    The only thing missing was something to START it, which used to be a human.
    This wrapper is deliberately thin - it does NOT duplicate any of the above.
    It only adds what a scheduled run needs:

      1. exit quietly when there is nothing to publish
      2. skip the round while files are still being written (quiet period),
         so a half-finished batch of articles is never published
      3. pick a commit message (see below)
      4. run deploy.cjs and record the outcome for the scheduled tasks to read

    Commit message:
      - if _file\next-commit-message.txt exists, its first line is used and the
        file is deleted (scheduled tasks write a proper Japanese message there,
        e.g. "記事追加: ストーブファン(楽天API実データ5選)")
      - otherwise a message is generated from the changed paths

    Output:
      logs\auto-deploy.log          run log (rotated at 1MB)
      logs\auto-deploy-status.json  last result, read by the scheduled tasks
      logs\auto-deploy-deploy.log   full output of the last deploy.cjs run

    Manual run:
      powershell -NoProfile -ExecutionPolicy Bypass -File scripts\auto-deploy.ps1
      powershell -NoProfile -ExecutionPolicy Bypass -File scripts\auto-deploy.ps1 -DryRun
#>
[CmdletBinding()]
param(
    # Skip the round when any changed file was written less than N minutes ago.
    # Scheduled article tasks run for a while, so this is longer than usual.
    [int]$QuietMinutes = 10,
    # Show what would be published without running deploy.cjs.
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$DeployJs   = Join-Path $PSScriptRoot 'deploy.cjs'
$MessageFile= Join-Path $RepoRoot '_file\next-commit-message.txt'
$LogDir     = Join-Path $RepoRoot 'logs'
$LogFile    = Join-Path $LogDir 'auto-deploy.log'
$DeployLog  = Join-Path $LogDir 'auto-deploy-deploy.log'
$StatusFile = Join-Path $LogDir 'auto-deploy-status.json'
$LockFile   = Join-Path $LogDir 'auto-deploy.lock'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Set-Status {
    param([string]$Result, [hashtable]$Extra = @{})
    $obj = [ordered]@{
        lastRun = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
        result  = $Result
    }
    foreach ($k in $Extra.Keys) { $obj[$k] = $Extra[$k] }
    $json = $obj | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText($StatusFile, $json, (New-Object System.Text.UTF8Encoding($false)))
}

function Invoke-Git {
    # Call as: Invoke-Git @('status', '--porcelain')
    param([string[]]$GitArgs)
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & git @GitArgs 2>&1
        $code   = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previous
    }
    return [pscustomobject]@{ Output = ($output | Out-String).Trim(); ExitCode = $code }
}

# --- log rotation ------------------------------------------------------------
if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 1MB)) {
    Move-Item -Path $LogFile -Destination "$LogFile.1" -Force
}

# --- single instance ---------------------------------------------------------
# deploy.cjs has its own .deploy.lock; this one just avoids starting a second
# wrapper (and a second build) in the first place.
if (Test-Path $LockFile) {
    $lockAge = (Get-Date) - (Get-Item $LockFile).LastWriteTime
    if ($lockAge.TotalMinutes -lt 60) {
        Write-Log 'another run is still in progress; exiting' 'WARN'
        exit 0
    }
    Write-Log ('stale lock file ({0} min old); continuing' -f [int]$lockAge.TotalMinutes) 'WARN'
}
Set-Content -Path $LockFile -Value $PID -Encoding ASCII

try {
    Set-Location $RepoRoot

    if (-not (Test-Path $DeployJs)) {
        Write-Log ('deploy.cjs not found at ' + $DeployJs) 'ERROR'
        Set-Status 'deploy-script-missing'
        exit 1
    }

    # --- anything to publish? ------------------------------------------------
    $statusResult = Invoke-Git @('-c', 'core.quotepath=false', 'status', '--porcelain', '--untracked-files=all')
    if ($statusResult.ExitCode -ne 0) {
        Write-Log ('git status failed: ' + $statusResult.Output) 'ERROR'
        Set-Status 'git-status-failed' @{ error = $statusResult.Output }
        exit 1
    }
    if ([string]::IsNullOrWhiteSpace($statusResult.Output)) {
        Set-Status 'no-changes'
        exit 0
    }

    $changed = @()
    foreach ($line in ($statusResult.Output -split "`r?`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $path = $line.Substring(3).Trim()
        if ($path -match ' -> ') { $path = ($path -split ' -> ')[-1] }
        $path = $path.Trim('"')
        # the message file is bookkeeping, not a change worth publishing
        if ($path -match 'next-commit-message\.txt$') { continue }
        $changed += $path
    }
    if ($changed.Count -eq 0) {
        Set-Status 'no-changes'
        exit 0
    }
    Write-Log ('{0} changed path(s): {1}' -f $changed.Count, ($changed -join ', '))

    # --- quiet period --------------------------------------------------------
    # A scheduled task may be mid-way through writing a batch of articles.
    # Publishing now would put a half-finished article live, so wait a round.
    $now = Get-Date
    $stillWriting = @()
    foreach ($path in $changed) {
        $full = Join-Path $RepoRoot $path
        if (Test-Path -LiteralPath $full -PathType Leaf) {
            if (($now - (Get-Item -LiteralPath $full).LastWriteTime).TotalMinutes -lt $QuietMinutes) {
                $stillWriting += $path
            }
        }
    }
    if ($stillWriting.Count -gt 0) {
        Write-Log ('files written within the last {0} min ({1}); waiting for the next round' -f $QuietMinutes, ($stillWriting -join ', '))
        Set-Status 'skipped-recent-activity' @{ files = $stillWriting }
        exit 0
    }

    # --- commit message ------------------------------------------------------
    $message = $null
    if (Test-Path $MessageFile) {
        $raw = Get-Content -Path $MessageFile -Raw -Encoding UTF8
        $firstLine = ($raw -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
        if ($firstLine) { $message = $firstLine.Trim() }
    }

    if (-not $message) {
        # fall back to a description built from the changed paths
        $newArticles = @($changed | Where-Object { $_ -match '^content/posts/.*\.mdx$' })
        $parts = @()
        if ($newArticles.Count -gt 0) { $parts += ('記事{0}件' -f $newArticles.Count) }
        $others = @($changed | Where-Object { $_ -notmatch '^content/posts/' })
        if ($others.Count -gt 0) { $parts += ('その他{0}件' -f $others.Count) }
        if ($parts.Count -eq 0) { $parts += ('変更{0}件' -f $changed.Count) }
        $message = '自動反映: ' + ($parts -join '・') + ('（{0}）' -f (Get-Date -Format 'yyyy-MM-dd HH:mm'))
    }
    Write-Log ('commit message: ' + $message)

    if ($DryRun) {
        Write-Log 'DRY RUN - deploy.cjs was not started'
        Set-Status 'dry-run' @{ files = $changed; message = $message }
        exit 0
    }

    # --- hand over to deploy.cjs --------------------------------------------
    # No scope (`--`) is passed on purpose: an unattended run publishes every
    # article that is ready, which is the point of removing the review step.
    # deploy.cjs still performs the build, safety checks and verification.
    Write-Log 'starting deploy.cjs (build -> commit -> push -> verify)'
    if (Test-Path $MessageFile) { Remove-Item $MessageFile -Force -ErrorAction SilentlyContinue }

    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & node $DeployJs $message 2>&1 |
            Tee-Object -FilePath $DeployLog |
            ForEach-Object { Write-Host $_ }
        $deployExit = $LASTEXITCODE
    }
    catch {
        $deployExit = 1
        Write-Log ('deploy.cjs could not be started: ' + $_.Exception.Message) 'ERROR'
    }
    finally {
        $ErrorActionPreference = $previous
    }

    if ($deployExit -ne 0) {
        $tail = ''
        if (Test-Path $DeployLog) { $tail = (Get-Content $DeployLog -Tail 20 | Out-String).Trim() }
        Write-Log ("deploy.cjs FAILED (exit $deployExit). last lines:`n" + $tail) 'ERROR'
        Set-Status 'deploy-failed' @{ exitCode = $deployExit; message = $message; deployLog = $DeployLog; files = $changed }
        exit 1
    }

    $sha = (Invoke-Git @('rev-parse', '--short', 'HEAD')).Output
    Write-Log ('deployed {0}: {1}' -f $sha, $message)
    Set-Status 'deployed' @{ commit = $sha; message = $message; files = $changed }
    exit 0
}
catch {
    Write-Log ('unexpected error: ' + $_.Exception.Message) 'ERROR'
    Set-Status 'error' @{ error = $_.Exception.Message }
    exit 1
}
finally {
    Remove-Item -Path $LockFile -Force -ErrorAction SilentlyContinue
}

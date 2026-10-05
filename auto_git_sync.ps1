# Strong Care - Real-Time GitHub Auto Sync Watcher
# Automatically detects changes, commits, and pushes to GitHub

param(
    [int]$IntervalSeconds = 5,
    [string]$Branch = "main",
    [string]$Remote = "origin"
)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Strong Care - Real-Time GitHub Auto Sync Watcher" -ForegroundColor Yellow
Write-Host "  Remote: $Remote | Branch: $Branch" -ForegroundColor White
Write-Host "  Check interval: Every $IntervalSeconds seconds" -ForegroundColor Gray
Write-Host "  Press Ctrl + C in this window to stop auto-sync." -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootPath

# Verify git repo
$isGit = Test-Path "$rootPath\.git"
if (-not $isGit) {
    Write-Host "[ERROR] Not a git repository: $rootPath" -ForegroundColor Red
    exit 1
}

$lastSyncTime = Get-Date

while ($true) {
    try {
        # Check git status for any untracked, modified, or deleted files
        $status = git status --porcelain
        
        if ($status) {
            $changedLines = ($status -split "`n").Where({ $_.Trim().Length -gt 0 })
            $fileCount = $changedLines.Count
            
            $nowStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            Write-Host "[$nowStr] Detected $fileCount changed file(s). Preparing to sync..." -ForegroundColor Yellow

            # Small debounce to let editor finish writing files
            Start-Sleep -Seconds 2

            # Stage all changes
            git add -A

            # Generate concise commit message
            $summaryNames = ($changedLines | ForEach-Object { 
                $parts = $_.Trim() -split "\s+", 2
                if ($parts.Count -gt 1) { Split-Path -Leaf $parts[1] } else { $_.Trim() }
            } | Select-Object -First 3) -join ", "
            
            if ($fileCount -gt 3) {
                $summaryNames += " (and $($fileCount - 3) more)"
            }

            $commitMsg = "Auto-sync ($nowStr): $summaryNames"

            # Commit
            $commitOutput = git commit -m "$commitMsg" 2>&1
            Write-Host "[$nowStr] Changes committed: $commitMsg" -ForegroundColor Green

            # Push to GitHub
            Write-Host "[$nowStr] Pushing to GitHub ($Remote/$Branch)..." -ForegroundColor Cyan
            $pushOutput = git push $Remote $Branch 2>&1

            if ($LASTEXITCODE -eq 0) {
                $finishTime = (Get-Date).ToString("HH:mm:ss")
                Write-Host "[$finishTime] SUCCESS: Synced to GitHub successfully!`n" -ForegroundColor Green
                $lastSyncTime = Get-Date
            } else {
                Write-Host "[WARNING] Push failed (will retry next cycle). Output:" -ForegroundColor Magenta
                Write-Host ($pushOutput -join "`n") -ForegroundColor DarkGray
            }
        }
    }
    catch {
        Write-Host "[ERROR] Error during sync check: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds $IntervalSeconds
}

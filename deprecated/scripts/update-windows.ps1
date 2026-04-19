# update-windows.ps1 — Pull, build, and install Book Tracker on Windows
# Usage: Right-click -> "Run with PowerShell", or from terminal: powershell -ExecutionPolicy Bypass -File scripts/update-windows.ps1

param(
    [switch]$SkipPull,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot\..

Write-Host "`n=== Book Tracker Update ===" -ForegroundColor Cyan

# 1. Pull latest changes
if (-not $SkipPull) {
    Write-Host "`n[1/3] Pulling latest changes..." -ForegroundColor Yellow
    git pull
    if ($LASTEXITCODE -ne 0) { throw "git pull failed" }
} else {
    Write-Host "`n[1/3] Skipping pull (--SkipPull)" -ForegroundColor DarkGray
}

# 2. Build
Write-Host "`n[2/3] Building release..." -ForegroundColor Yellow
npm run tauri build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# 3. Find and install the MSI
Write-Host "`n[3/3] Installing..." -ForegroundColor Yellow
$msiDir = "src-tauri\target\release\bundle\msi"
$msi = Get-ChildItem -Path $msiDir -Filter "*.msi" -ErrorAction Stop |
       Sort-Object LastWriteTime -Descending |
       Select-Object -First 1

if (-not $msi) {
    throw "No MSI found in $msiDir"
}

Write-Host "Found: $($msi.Name)" -ForegroundColor Green

if (-not $SkipInstall) {
    Write-Host "Installing $($msi.FullName)..."
    Start-Process msiexec.exe -ArgumentList "/i", "`"$($msi.FullName)`"" -Wait
    Write-Host "`nDone!" -ForegroundColor Green
} else {
    Write-Host "Skipping install (--SkipInstall). MSI is at:" -ForegroundColor DarkGray
    Write-Host "  $($msi.FullName)"
}

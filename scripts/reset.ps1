<#
.SYNOPSIS
    Stops the solution and DELETES all database data (metadata, play stats).
    Video files in the video-library folder are never touched.
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$answer = Read-Host 'This will DELETE all metadata and statistics (video files are safe). Continue? (y/N)'
if ($answer -notin @('y', 'Y', 'yes')) {
    Write-Host 'Cancelled.' -ForegroundColor Yellow
    exit 0
}

docker compose down -v
Write-Host 'Reset complete. Run scripts\start.ps1 to rebuild the library from scratch.' -ForegroundColor Green

<#
.SYNOPSIS
    Stops the Video Library solution (containers are removed, data is kept).
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

Write-Host 'Stopping the Video Library...' -ForegroundColor Cyan
docker compose down
Write-Host 'Stopped. Database data is preserved. Use scripts\start.ps1 to start again.' -ForegroundColor Green

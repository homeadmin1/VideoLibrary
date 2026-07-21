<#
.SYNOPSIS
    Rebuilds container images (after code changes) and restarts the solution.
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

Write-Host 'Rebuilding images and restarting...' -ForegroundColor Cyan
docker compose up -d --build --force-recreate
Write-Host 'Rebuild complete.' -ForegroundColor Green

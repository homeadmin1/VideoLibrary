<#
.SYNOPSIS
    Builds and starts the complete Video Library solution with Docker.
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# Verify Docker is available and running
try {
    docker info | Out-Null
} catch {
    Write-Host 'Docker is not running. Please start Docker Desktop and try again.' -ForegroundColor Red
    exit 1
}

Write-Host 'Building and starting the Video Library...' -ForegroundColor Cyan
docker compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Failed to start the solution. Check the output above.' -ForegroundColor Red
    exit 1
}

$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { '8080' }
$apiPort = if ($env:API_PORT) { $env:API_PORT } else { '4000' }

Write-Host ''
Write-Host '  Video Library is up!' -ForegroundColor Green
Write-Host "  Library site:   http://localhost:$webPort" -ForegroundColor Green
Write-Host "  Administration: http://localhost:$webPort/admin" -ForegroundColor Green
Write-Host "  Insights:       http://localhost:$webPort/admin/insights" -ForegroundColor Green
Write-Host "  API (direct):   http://localhost:$apiPort/api/health" -ForegroundColor DarkGray
Write-Host ''
Write-Host '  The library is scanned automatically on startup.' -ForegroundColor DarkGray
Write-Host '  Run scripts\rescan.ps1 after adding new video files.' -ForegroundColor DarkGray

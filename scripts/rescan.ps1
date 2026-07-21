<#
.SYNOPSIS
    Triggers a re-scan of the video-library folder so new/removed files are
    reflected in the database. Also available from the Administration page.
#>
$ErrorActionPreference = 'Stop'

$apiPort = if ($env:API_PORT) { $env:API_PORT } else { '4000' }

Write-Host 'Requesting library scan...' -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Method Post -Uri "http://localhost:$apiPort/api/admin/scan" -TimeoutSec 600
    Write-Host ("Scan complete: {0} files found - {1} added, {2} updated, {3} removed ({4:N1}s)" -f `
        $result.scanned, $result.added, $result.updated, $result.removed, ($result.durationMs / 1000)) -ForegroundColor Green
} catch {
    Write-Host "Scan failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Is the solution running? Try scripts\start.ps1 first.' -ForegroundColor Yellow
    exit 1
}

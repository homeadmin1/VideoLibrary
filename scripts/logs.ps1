<#
.SYNOPSIS
    Follows logs from the running solution.
.EXAMPLE
    .\logs.ps1            # all services
    .\logs.ps1 server     # backend only
    .\logs.ps1 web        # frontend only
    .\logs.ps1 db         # database only
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

docker compose logs -f --tail 100 @args

param(
    [string]$EnvFile = "ai/backend/.env",
    [string]$HostOverride = "",
    [int]$PortOverride = 0
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

function Import-DotEnv {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }
        $parts = $line.Split("=", 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        Set-Item -Path "Env:$name" -Value $value
    }
}

Import-DotEnv ".env"
Import-DotEnv $EnvFile

if ($HostOverride) {
    $env:FITSHELF_BACKEND_HOST = $HostOverride
}
if ($PortOverride -gt 0) {
    $env:FITSHELF_BACKEND_PORT = [string]$PortOverride
}

if (-not $env:FITSHELF_BACKEND_HOST) {
    $env:FITSHELF_BACKEND_HOST = "0.0.0.0"
}
if (-not $env:FITSHELF_BACKEND_PORT) {
    $env:FITSHELF_BACKEND_PORT = "8000"
}

Write-Host "Starting FitShelf backend on $($env:FITSHELF_BACKEND_HOST):$($env:FITSHELF_BACKEND_PORT)"
Write-Host "CatVTON: $($env:CATVTON_WIDTH)x$($env:CATVTON_HEIGHT), steps=$($env:CATVTON_STEPS), precision=$($env:CATVTON_MIXED_PRECISION)"

$port = [int]$env:FITSHELF_BACKEND_PORT
py -m uvicorn ai.backend.app:app --host $env:FITSHELF_BACKEND_HOST --port $port

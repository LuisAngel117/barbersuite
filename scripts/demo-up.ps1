$ErrorActionPreference = "Stop"

function Assert-PortFree {
    param(
        [int]$Port,
        [string]$Name
    )

    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $listener) {
        $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
        $processName = if ($null -ne $process) { $process.ProcessName } else { "desconocido" }
        throw "El puerto $Port ya esta ocupado por '$processName'. Cierra ese proceso antes de correr demo-up."
    }
}

Assert-PortFree -Port 3000 -Name "frontend"
Assert-PortFree -Port 8080 -Name "backend"

docker compose `
    -f docker-compose.yml `
    -f docker-compose.app.yml `
    -f docker-compose.frontend.yml `
    up -d --build --remove-orphans

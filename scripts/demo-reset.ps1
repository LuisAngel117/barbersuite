$ErrorActionPreference = "Stop"

docker compose `
    -f docker-compose.yml `
    -f docker-compose.app.yml `
    -f docker-compose.frontend.yml `
    down -v --remove-orphans

$credentialsPath = Join-Path $PSScriptRoot "demo-credentials.json"
if (Test-Path $credentialsPath) {
    Remove-Item $credentialsPath -Force
}

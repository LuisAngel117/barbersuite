$ErrorActionPreference = "Stop"

docker compose `
    -f docker-compose.yml `
    -f docker-compose.app.yml `
    -f docker-compose.frontend.yml `
    down

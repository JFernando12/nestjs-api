$ErrorActionPreference = "Stop"

if (-Not (Test-Path ".env")) { 
    Copy-Item ".env.example" ".env" 
}

docker compose down -v 2>$null
docker compose up -d --build
docker compose logs -f

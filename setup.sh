#!/bin/bash
set -e

if [ ! -f .env ]; then 
    cp .env.example .env
fi

docker compose down -v 2>/dev/null || true
docker compose up -d --build
docker compose logs -f

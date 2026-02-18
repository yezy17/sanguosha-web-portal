#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[mvp] starting engine + gateway via docker compose..."
docker compose up -d --build

echo "[mvp] services:"
docker compose ps

echo "[mvp] gateway health: http://127.0.0.1:8787/health"
echo "[mvp] engine health:  http://127.0.0.1:8000/api/health"

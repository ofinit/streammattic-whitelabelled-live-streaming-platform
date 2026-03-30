#!/usr/bin/env bash
# Run on the Ubuntu VPS (after SSH login), from the repository root.
# Prerequisites: .env.production filled in (copy from .env.production.example).
# Does not contain secrets — uses your existing .env.production file.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production. Copy .env.production.example, set DATABASE_URL and secrets, then re-run."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker --now 2>/dev/null || true
fi

echo "Running database migrations (one-off Node container)..."
docker run --rm \
  --env-file "$ROOT/.env.production" \
  -v "$ROOT:/app" -w /app \
  node:20-bookworm-slim \
  bash -lc 'npm ci && node scripts/run-migration.js'

echo "Building and starting app (docker-compose.cloudjiffy.yml)..."
docker compose -f "$ROOT/docker-compose.cloudjiffy.yml" --env-file "$ROOT/.env.production" up -d --build

echo "Done. App should listen on 127.0.0.1:3000 — put Nginx (see deploy/nginx/streamlivee.conf.example) in front for HTTPS."

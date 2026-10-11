#!/bin/sh
# Builds and starts the WAAFA stack on the VPS (docs/DEPLOY.md). Run from the repository root after `git pull`:
#   sh deploy/deploy.sh
# Order matters: the web build prerenders pages from the API, so PostgreSQL, Redis and the API start first.
set -eu

COMPOSE="docker compose -f deploy/compose.yml"

if [ ! -f deploy/.env ]; then
  echo "deploy/.env is missing: copy deploy/.env.example and fill it in." >&2
  exit 1
fi

echo "1/4 API image"
$COMPOSE build api

echo "2/4 Database, Redis, API (migrations and seed run on start)"
$COMPOSE up -d postgres redis api
attempt=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($COMPOSE ps -q api)")" = "healthy" ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 60 ]; then
    echo "The API did not become ready; last log lines:" >&2
    $COMPOSE logs --tail 80 api >&2
    exit 1
  fi
  sleep 3
done
echo "API ready"

echo "3/4 Web image (reads the API snapshot)"
$COMPOSE build web

echo "4/4 Worker, web and Caddy"
$COMPOSE up -d worker web caddy

# Old image layers fill a small disk quickly.
docker image prune -f > /dev/null
$COMPOSE ps
echo "Done. Check the site, then Admin > Audit log after the first sign-in."

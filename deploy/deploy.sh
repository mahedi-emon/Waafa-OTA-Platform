#!/bin/sh
# Builds and starts the WAAFA stack on the VPS (docs/DEPLOY.md). Run from the repository root after `git pull`:
#   sh deploy/deploy.sh
# Order matters: the web build prerenders pages from the API, so PostgreSQL, Redis and the API start first. On the
# first run with ACME_EMAIL set, it gets the Let's Encrypt certificate and switches nginx to HTTPS.
set -eu

COMPOSE="docker compose -f deploy/compose.yml"

if [ ! -f deploy/.env ]; then
  echo "deploy/.env is missing: copy deploy/.env.example and fill it in." >&2
  exit 1
fi
setting() { sed -n "s/^$1=//p" deploy/.env | tr -d '\r' | head -n 1; }
DOMAIN=$(setting SITE_DOMAIN)
EMAIL=$(setting ACME_EMAIL)

echo "1/5 API image"
$COMPOSE build api

echo "2/5 Database, Redis, API (migrations and seed run on start)"
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

echo "3/5 Web image (reads the API snapshot through 127.0.0.1:4000)"
# The classic builder accepts the host network for this one build without extra BuildKit entitlements.
COMPOSE_BAKE=false $COMPOSE build web

echo "4/5 Worker, web, nginx and certbot"
$COMPOSE build nginx
$COMPOSE up -d worker web nginx certbot

echo "5/5 HTTPS certificate"
if [ -n "$EMAIL" ] && [ "$DOMAIN" != "localhost" ]; then
  if $COMPOSE run --rm --entrypoint test certbot -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
    echo "Certificate present; certbot renews it when due"
  else
    $COMPOSE run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
      -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --non-interactive
    $COMPOSE restart nginx
    echo "HTTPS on for $DOMAIN"
  fi
else
  echo "Skipped (ACME_EMAIL empty or localhost): the site answers over HTTP only"
fi

# Old image layers fill a small disk quickly.
docker image prune -f > /dev/null
$COMPOSE ps
echo "Done. Check the site, then Admin > Audit log after the first sign-in."

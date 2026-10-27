#!/bin/sh
# Starts the WAAFA stack on the VPS (docs/DEPLOY.md). Run from the repository root after `git pull`:
#   sh deploy/deploy.sh            pulls the images GitHub Actions pushed to Docker Hub (IMAGE_REPO in deploy/.env)
#   sh deploy/deploy.sh --build    builds the images on this machine instead (the default when IMAGE_REPO is empty)
# Order matters: PostgreSQL, Redis and the API start first (a local web build prerenders pages from the API). After
# the web starts, a signed call refreshes its caches from the live database. On the first run with ACME_EMAIL set,
# it gets the Let's Encrypt certificate and switches nginx to HTTPS.
set -eu

COMPOSE="docker compose -f deploy/compose.yml"

if [ ! -f deploy/.env ]; then
  echo "deploy/.env is missing: run sh deploy/init-env.sh <domain> <email> and fill it in." >&2
  exit 1
fi
setting() { sed -n "s/^$1=//p" deploy/.env | tr -d '\r' | head -n 1; }
DOMAIN=$(setting SITE_DOMAIN)
EMAIL=$(setting ACME_EMAIL)
REPO=$(setting IMAGE_REPO)
TAG=$(setting IMAGE_TAG)
TAG=${TAG:-latest}

MODE=pull
if [ "${1:-}" = "--build" ] || [ -z "$REPO" ]; then MODE=build; fi

# Waits until a service's health check passes; prints its last log lines and stops the deploy otherwise.
wait_healthy() {
  attempt=0
  until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($COMPOSE ps -q "$1")" 2>/dev/null)" = "healthy" ]; do
    attempt=$((attempt + 1))
    if [ "$attempt" -gt 60 ]; then
      echo "$1 did not become ready; last log lines:" >&2
      $COMPOSE logs --tail 80 "$1" >&2
      exit 1
    fi
    sleep 3
  done
  echo "$1 ready"
}

# A pulled web image is built for one address and one Turnstile site key (both public, stored as image labels).
check_web_image() {
  image="$REPO:web-$TAG"
  label() { docker image inspect -f "{{ index .Config.Labels \"$1\" }}" "$image" 2>/dev/null | sed 's/<no value>//'; }
  built_url=$(label org.waafa.site-url)
  built_key=$(label org.waafa.turnstile-site-key)
  site_url=$(setting SITE_URL)
  if [ "$built_url" != "$site_url" ]; then
    if [ "$DOMAIN" = "localhost" ]; then
      echo "Note: the web image was built for $built_url; canonical links point there (fine for a local run)."
    else
      echo "The web image was built for '$built_url' but SITE_URL is '$site_url'. Set the GitHub variable SITE_URL" >&2
      echo "and run the Docker images workflow again, or fix SITE_URL in deploy/.env." >&2
      exit 1
    fi
  fi
  if [ -n "$(setting TURNSTILE_SECRET_KEY)" ] && [ -z "$built_key" ]; then
    echo "TURNSTILE_SECRET_KEY is set but the web image has no Turnstile site key, so every form would be refused." >&2
    echo "Set the GitHub variable TURNSTILE_SITE_KEY and run the Docker images workflow, or empty the secret." >&2
    exit 1
  fi
  if [ -n "$built_key" ] && [ -z "$(setting TURNSTILE_SECRET_KEY)" ]; then
    echo "Note: the web image shows Turnstile; set TURNSTILE_SECRET_KEY in deploy/.env so the server checks it."
  fi
}

if [ "$MODE" = pull ]; then
  echo "1/5 Images from Docker Hub ($REPO, tag $TAG)"
  # docker pull, not `compose pull`: compose only warns when a buildable service fails to pull and would carry on
  # with an old local image; here a failed pull stops the deploy.
  for service in api web nginx; do
    docker pull "$REPO:$service-$TAG"
  done
  check_web_image

  echo "2/5 Database, Redis, API (migrations and seed run on start)"
  $COMPOSE up -d --no-build postgres redis api
  wait_healthy api
else
  echo "1/5 API image (built here)"
  $COMPOSE build api

  echo "2/5 Database, Redis, API (migrations and seed run on start)"
  $COMPOSE up -d --no-build postgres redis api
  wait_healthy api

  echo "   Web and nginx images (the web build reads the API snapshot through 127.0.0.1:4000)"
  # The classic builder accepts the host network for this one build without extra BuildKit entitlements.
  COMPOSE_BAKE=false $COMPOSE build web
  $COMPOSE build nginx
fi

echo "3/5 Worker, ClamAV, web, nginx and certbot"
$COMPOSE up -d --no-build clamav worker web nginx certbot
# Optimised images and /media/ files have no content hash in their URLs: drop the cached copies so a photo replaced in
# this deploy shows at once (issue 126). nginx treats a missing cache file as a miss and refills it on demand.
$COMPOSE exec -T nginx sh -c 'rm -rf /var/cache/nginx/waafa/*' || echo "nginx cache not cleared (nginx not running yet)"

echo "4/5 Fresh content"
wait_healthy web
# Pages were prerendered when the image was built; expire every cache tag so they render from this server's database.
$COMPOSE exec -T api node --input-type=module < deploy/server/revalidate.mjs ||
  echo "Web caches not refreshed: pages show the build's content until the next admin save." >&2

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
# Issue 239: the daily backup (03:15) and the monthly restore drill (1st, 04:30) install themselves; BACKUP_CRON=off in
# deploy/.env leaves the crontab alone. Re-running replaces only the lines marked "waafa-backup".
if [ "$(setting BACKUP_CRON)" != "off" ] && command -v crontab > /dev/null 2>&1; then
  here=$(cd deploy && pwd)
  mkdir -p deploy/backups
  {
    crontab -l 2>/dev/null | grep -v "# waafa-backup" || true
    echo "15 3 * * * cd $here && sh backup.sh >> backups/backup.log 2>&1 # waafa-backup"
    echo "30 4 1 * * cd $here && sh backup.sh --drill >> backups/drill.log 2>&1 # waafa-backup"
  } | crontab -
  echo "Backups: daily at 03:15 and a restore drill on the 1st (crontab; BACKUP_CRON=off to skip)"
fi

docker image prune -f > /dev/null
$COMPOSE ps
echo "Done ($MODE mode). Check the site, then Admin > Audit log after the first sign-in."

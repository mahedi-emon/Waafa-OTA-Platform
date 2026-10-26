#!/bin/sh
# Starts or updates WAAFA on the VPS from Docker Hub images (issue 164). Run inside this folder (/opt/waafa):
#   sh deploy.sh                      newest images (IMAGE_TAG in .env, usually latest)
#   IMAGE_TAG=<7-char sha> sh deploy.sh   a given release (rollback)
# Order: pull the images, start PostgreSQL, Redis and the API (migrations and the seed run on start), then worker, web,
# nginx and certbot; refresh the web caches from the live database; on the first run get the Let's Encrypt
# certificate for the domain and www, and switch nginx to HTTPS.
set -eu
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo ".env is missing: copy the production settings here as .env (docs/DEPLOY.md, Image-only deploy)." >&2
  exit 1
fi
chmod 600 .env
setting() { sed -n "s/^$1=//p" .env | tr -d '\r' | head -n 1; }
DOMAIN=$(setting SITE_DOMAIN)
EMAIL=$(setting ACME_EMAIL)
REPO=$(setting IMAGE_REPO)
TAG=${IMAGE_TAG:-$(setting IMAGE_TAG)}
TAG=${TAG:-latest}
export IMAGE_TAG="$TAG"
COMPOSE="docker compose -f compose.yml"

if [ -z "$REPO" ] || [ -z "$DOMAIN" ]; then
  echo "Set IMAGE_REPO and SITE_DOMAIN in .env." >&2
  exit 1
fi

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

echo "1/5 Images from Docker Hub ($REPO, tag $TAG)"
# A private Docker Hub repository needs `docker login -u <user>` once (an access token with read rights).
for service in api web nginx; do
  if ! docker pull "$REPO:$service-$TAG"; then
    echo "Could not pull $REPO:$service-$TAG. Private repository? Run: docker login -u <docker hub user>" >&2
    exit 1
  fi
done
# The web image is built for one address (an image label); a mismatch would put wrong canonical links on every page.
built_url=$(docker image inspect -f '{{ index .Config.Labels "org.waafa.site-url" }}' "$REPO:web-$TAG" 2>/dev/null | sed 's/<no value>//')
if [ -n "$built_url" ] && [ "$built_url" != "$(setting SITE_URL)" ] && [ "$DOMAIN" != "localhost" ]; then
  echo "The web image was built for '$built_url' but SITE_URL in .env is '$(setting SITE_URL)'." >&2
  echo "Set the GitHub variable SITE_URL, run the Docker images workflow again, then deploy." >&2
  exit 1
fi

echo "2/5 Database, Redis, API (migrations and seed run on start)"
$COMPOSE up -d postgres redis api
wait_healthy api

echo "3/5 Worker, ClamAV, web, nginx and certbot"
$COMPOSE up -d clamav worker web nginx certbot
$COMPOSE exec -T nginx sh -c 'rm -rf /var/cache/nginx/waafa/*' || echo "nginx cache not cleared (nginx not running yet)"

echo "4/5 Fresh content"
wait_healthy web
$COMPOSE exec -T api node --input-type=module < revalidate.mjs ||
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

docker image prune -f > /dev/null
$COMPOSE ps
echo "Done: https://$DOMAIN (release $TAG). Admin: https://$DOMAIN/secure-admin-control"

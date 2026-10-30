#!/bin/sh
# Checks the nginx image's HTTPS site (issue 332) beside the running stack: a throwaway certificate for localhost, the
# HTTPS template rendered by the image's own entrypoint, then HTTP/2, Brotli, HSTS and the HTTP/3 advert. Run from the
# repository root after deploy.sh, in the VPS smoke and the Docker images workflow.
set -eu

COMPOSE="docker compose -f deploy/compose.yml"
nginx=$($COMPOSE ps -q nginx)
image=$(docker inspect -f '{{.Config.Image}}' "$nginx")
network=$(docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{end}}' "$nginx")
work=$(mktemp -d)
trap 'docker rm -f waafa-https-check > /dev/null 2>&1 || true; rm -rf "$work"' EXIT

mkdir -p "$work/live/localhost"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=localhost \
  -keyout "$work/live/localhost/privkey.pem" -out "$work/live/localhost/fullchain.pem" 2> /dev/null
chmod -R a+rX "$work"
docker run -d --name waafa-https-check --network "$network" -e SITE_DOMAIN=localhost \
  -v "$work:/etc/letsencrypt:ro" -p 127.0.0.1:8443:443 "$image" > /dev/null

for attempt in $(seq 1 30); do
  curl -skf -o /dev/null https://localhost:8443/robots.txt && break
  sleep 1
done
docker logs waafa-https-check 2>&1 | grep -q "serving localhost over https"
docker exec waafa-https-check nginx -t

headers=$(curl -sk --http2 -H 'Accept-Encoding: br, gzip' -o /dev/null -D - https://localhost:8443/ | tr -d '\r')
echo "$headers"
echo "$headers" | grep -q '^HTTP/2 200'
echo "$headers" | grep -qi '^content-encoding: br'
echo "$headers" | grep -qi '^strict-transport-security: max-age=31536000'
echo "$headers" | grep -qi '^alt-svc: h3=":443"'
echo "nginx HTTPS: HTTP/2, Brotli, HSTS and the HTTP/3 advert"

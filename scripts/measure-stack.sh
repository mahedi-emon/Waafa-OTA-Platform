#!/bin/sh
# Measures the running stack (issue 303): the size of each WAAFA image and the memory of every container once the
# site has settled, with ClamAV's signatures loaded. Run from the repository root after deploy.sh, in the VPS smoke and
# the Docker images workflow. Fails when an image or the whole stack grows past its budget, so a heavier release is
# caught before it reaches the 8 GB server. Writes a table to the GitHub step summary when there is one.
set -eu

COMPOSE="docker compose -f deploy/compose.yml"
repo=$(sed -n 's/^IMAGE_REPO=//p' deploy/.env | head -n 1)
tag=$(sed -n 's/^IMAGE_TAG=//p' deploy/.env | head -n 1)
repo=${repo:-waafa}
tag=${tag:-latest}
# Budgets in MB: images as `docker images` reports them on the server, memory as `docker stats` reports it.
API_MAX=400
WEB_MAX=500
NGINX_MAX=100
STACK_MAX=3072

# ClamAV answers only after loading its signatures (a minute or two on first start).
for attempt in $(seq 1 60); do
  state=$($COMPOSE ps --format '{{.Service}} {{.Health}}' | awk '$1 == "clamav" { print $2 }')
  [ "$state" = "healthy" ] && break
  sleep 5
done
# Let the site settle after the smoke requests.
sleep 30

mb() { awk -v b="$1" 'BEGIN { printf "%d", b / 1048576 }'; }
summary=${GITHUB_STEP_SUMMARY:-/dev/null}
failed=0

{
  echo "### Image sizes and memory (issue 303)"
  echo ""
  echo "| Image | Size (MB) | Budget |"
  echo "| --- | --- | --- |"
} >> "$summary"
for service in api web nginx; do
  bytes=$(docker image inspect -f '{{.Size}}' "$repo:$service-$tag")
  size=$(mb "$bytes")
  case "$service" in api) max=$API_MAX ;; web) max=$WEB_MAX ;; *) max=$NGINX_MAX ;; esac
  revision=$(docker image inspect -f '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$repo:$service-$tag")
  echo "image $service: $size MB (budget $max MB), revision ${revision:-none}"
  echo "| $service | $size | $max |" >> "$summary"
  [ "$size" -le "$max" ] || { echo "image $service is over its budget" >&2; failed=1; }
  [ -n "$revision" ] && [ "$revision" != "unknown" ] || { echo "image $service has no revision label" >&2; failed=1; }
done

{
  echo ""
  echo "| Container | Memory (MB) | Limit (MB) |"
  echo "| --- | --- | --- |"
} >> "$summary"
total=0
stats=$(docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' $($COMPOSE ps -q))
echo "$stats" | while read -r name used _ limit; do
  echo "| $name | $used | $limit |" >> "$summary"
done
# docker stats prints sizes like 123.4MiB or 1.2GiB; add them up in MB.
total=$(echo "$stats" | awk '{
  v = $2; n = v + 0
  if (v ~ /GiB$/) n *= 1024; else if (v ~ /KiB$/) n /= 1024; else if (v ~ /B$/ && v !~ /iB$/) n /= 1048576
  sum += n
} END { printf "%d", sum }')
echo "$stats"
echo "stack: $total MB in use (budget $STACK_MAX MB)"
echo "" >> "$summary"
echo "Whole stack: **$total MB** (budget $STACK_MAX MB)" >> "$summary"
[ "$total" -le "$STACK_MAX" ] || { echo "the stack uses more memory than its budget" >&2; failed=1; }
exit "$failed"

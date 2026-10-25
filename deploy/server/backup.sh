#!/bin/sh
# Daily backup for the image-only server (issue 164): the PostgreSQL dump, the uploaded photos and the customer files, 14 of each kept in
# ./backups. Cron (crontab -e):
#   15 3 * * * cd /opt/waafa && sh backup.sh >> backups/backup.log 2>&1
# Restore the database: gunzip -c backups/<file>.sql.gz | docker compose -f compose.yml exec -T postgres psql -U waafa waafa
# Restore photos:       docker compose -f compose.yml exec -T api tar -xzf - -C /data/media < backups/<file>.media.tar.gz
# Restore customer files: docker compose -f compose.yml exec -T api tar -xzf - -C /data/private < backups/<file>.private.tar.gz
# Copy the backups off the server now and then (scp -r user@server:/opt/waafa/backups .).
set -eu
cd "$(dirname "$0")"
COMPOSE="docker compose -f compose.yml"

mkdir -p backups
stamp=$(date +%Y%m%d-%H%M)
file="backups/waafa-$stamp.sql.gz"
$COMPOSE exec -T postgres pg_dump -U waafa --no-owner waafa | gzip > "$file"
if [ "$(wc -c < "$file")" -lt 1024 ]; then
  echo "$(date) backup too small: $file" >&2
  exit 1
fi
ls -1t backups/waafa-*.sql.gz | tail -n +15 | xargs -r rm --
$COMPOSE exec -T api tar -czf - -C /data/media . > "backups/waafa-$stamp.media.tar.gz"
ls -1t backups/waafa-*.media.tar.gz | tail -n +15 | xargs -r rm --
# Customer files (issue 232: visa documents, payment slips): readable by the server owner only.
(umask 077 && $COMPOSE exec -T api tar -czf - -C /data/private . > "backups/waafa-$stamp.private.tar.gz")
ls -1t backups/waafa-*.private.tar.gz | tail -n +15 | xargs -r rm --
echo "$(date) backup ok: $file"

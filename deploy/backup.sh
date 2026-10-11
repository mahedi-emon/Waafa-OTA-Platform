#!/bin/sh
# Daily PostgreSQL backup for the WAAFA stack (docs/DEPLOY.md). Keeps the last 14 dumps in deploy/backups.
# Cron (as the deploy user, from the repository root):
#   15 3 * * * cd /opt/waafa && sh deploy/backup.sh >> deploy/backups/backup.log 2>&1
# Restore: gunzip -c deploy/backups/<file>.sql.gz | docker compose -f deploy/compose.yml exec -T postgres psql -U waafa waafa
set -eu

mkdir -p deploy/backups
stamp=$(date +%Y%m%d-%H%M)
file="deploy/backups/waafa-$stamp.sql.gz"
docker compose -f deploy/compose.yml exec -T postgres pg_dump -U waafa --no-owner waafa | gzip > "$file"
# A dump smaller than 1 KB means pg_dump failed.
if [ "$(wc -c < "$file")" -lt 1024 ]; then
  echo "$(date) backup too small: $file" >&2
  exit 1
fi
ls -1t deploy/backups/waafa-*.sql.gz | tail -n +15 | xargs -r rm --
echo "$(date) backup ok: $file"

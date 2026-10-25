#!/bin/sh
# Daily backup for the WAAFA stack (docs/DEPLOY.md): the PostgreSQL dump and the uploaded photos (media volume).
# Keeps the last 14 of each in deploy/backups.
# Cron (as the deploy user, from the repository root):
#   15 3 * * * cd /opt/waafa && sh deploy/backup.sh >> deploy/backups/backup.log 2>&1
# Restore: gunzip -c deploy/backups/<file>.sql.gz | docker compose -f deploy/compose.yml exec -T postgres psql -U waafa waafa
# Photos: docker compose -f deploy/compose.yml exec -T api tar -xzf - -C /data/media < deploy/backups/<file>.media.tar.gz
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
# Photos change rarely; a full copy each night keeps restores simple (an empty library is still a valid archive).
docker compose -f deploy/compose.yml exec -T api tar -czf - -C /data/media . > "deploy/backups/waafa-$stamp.media.tar.gz"
ls -1t deploy/backups/waafa-*.media.tar.gz | tail -n +15 | xargs -r rm --
# Customer files (issue 232: visa documents, payment slips): readable by the server owner only.
(umask 077 && docker compose -f deploy/compose.yml exec -T api tar -czf - -C /data/private . > "deploy/backups/waafa-$stamp.private.tar.gz")
ls -1t deploy/backups/waafa-*.private.tar.gz | tail -n +15 | xargs -r rm --
echo "$(date) backup ok: $file"

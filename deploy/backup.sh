#!/bin/sh
# Daily backup (the same script ships in deploy/server for the image-only server, issue 164): the PostgreSQL dump, the uploaded photos and the customer files, BACKUP_KEEP_DAYS of each (default 7) kept in
# ./backups, plus a copy of each to the off-site storage card in Admin › Integrations when it is On (issue 239).
# deploy.sh installs the cron lines itself (BACKUP_CRON=off in .env to skip):
#   15 3 * * * cd /opt/waafa && sh backup.sh >> backups/backup.log 2>&1
#   30 4 1 * * cd /opt/waafa && sh backup.sh --drill >> backups/drill.log 2>&1
# `sh backup.sh --drill` restores the newest dump into a throwaway database, checks it holds staff, content and
# settings, logs the lead and order counts, and drops it again (the monthly restore drill).
# Restore the database: gunzip -c backups/<file>.sql.gz | docker compose -f compose.yml exec -T postgres psql -U waafa waafa
# Restore photos:       docker compose -f compose.yml exec -T api tar -xzf - -C /data/media < backups/<file>.media.tar.gz
# Restore customer files: docker compose -f compose.yml exec -T api tar -xzf - -C /data/private < backups/<file>.private.tar.gz
set -eu
cd "$(dirname "$0")"
COMPOSE="docker compose -f compose.yml"
mkdir -p backups

psql() { $COMPOSE exec -T postgres psql -U waafa -v ON_ERROR_STOP=1 -tA "$@"; }

if [ "${1:-}" = "--drill" ]; then
  latest=$(ls -1t backups/waafa-*.sql.gz 2>/dev/null | head -n 1)
  [ -n "$latest" ] || { echo "$(date) drill failed: no backup yet" >&2; exit 1; }
  psql -d waafa -c "DROP DATABASE IF EXISTS waafa_drill" > /dev/null
  psql -d waafa -c "CREATE DATABASE waafa_drill" > /dev/null
  gunzip -c "$latest" | psql -q -d waafa_drill > /dev/null
  report=""
  failed=0
  for table in Lead Order StaffUser ContentDocument Setting; do
    count=$(psql -d waafa_drill -c "SELECT count(*) FROM \"$table\"")
    report="$report $table=$count"
    case "$table" in StaffUser | ContentDocument | Setting) [ "$count" -gt 0 ] || failed=1 ;; esac
  done
  psql -d waafa -c "DROP DATABASE waafa_drill" > /dev/null
  if [ "$failed" -ne 0 ]; then
    echo "$(date) drill failed: $latest restored without staff, content or settings ($report)" >&2
    exit 1
  fi
  echo "$(date) drill ok: $latest restored ($report)"
  exit 0
fi

# Issue 303: keep BACKUP_KEEP_DAYS days of backups (one a day, default 7), compressed; older ones are removed.
keep=$(sed -n "s/^BACKUP_KEEP_DAYS=//p" .env 2>/dev/null | tr -d '\r' | head -n 1)
case "$keep" in "" | *[!0-9]*) keep=7 ;; esac
[ "$keep" -ge 1 ] || keep=1
stamp=$(date +%Y%m%d-%H%M)
file="backups/waafa-$stamp.sql.gz"
$COMPOSE exec -T postgres pg_dump -U waafa --no-owner waafa | gzip > "$file"
if [ "$(wc -c < "$file")" -lt 1024 ]; then
  echo "$(date) backup too small: $file" >&2
  exit 1
fi
ls -1t backups/waafa-*.sql.gz | tail -n +$((keep + 1)) | xargs -r rm --
$COMPOSE exec -T api tar -czf - -C /data/media . > "backups/waafa-$stamp.media.tar.gz"
ls -1t backups/waafa-*.media.tar.gz | tail -n +$((keep + 1)) | xargs -r rm --
# Customer files (issue 232: visa documents, payment slips): readable by the server owner only.
(umask 077 && $COMPOSE exec -T api tar -czf - -C /data/private . > "backups/waafa-$stamp.private.tar.gz")
ls -1t backups/waafa-*.private.tar.gz | tail -n +$((keep + 1)) | xargs -r rm --
echo "$(date) backup ok: $file"

# Off-site copy (issue 239): the API sends each file to the Cloudflare R2 or Backblaze B2 card that is On.
for part in sql.gz media.tar.gz private.tar.gz; do
  name="waafa-$stamp.$part"
  $COMPOSE exec -T api node dist/offsite.js "$name" < "backups/$name" ||
    echo "$(date) off-site copy failed: $name (the local copy is kept)" >&2
done

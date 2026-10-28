#!/bin/sh
# Upgrade rehearsal (issue 285): start the stack at the release live on the server, add a lead and an order the way
# visitors do, note what is stored, deploy this checkout over it (migrations and seed patches run), and check that the
# leads, orders, content, settings and staff accounts are all still there. Run from the repository root in CI, with
# deploy/.env written and Docker available. The live release is the commit in deploy/LIVE_RELEASE.
set -eu

live=$(tr -d '[:space:]' < deploy/LIVE_RELEASE)
intake=$(sed -n 's/^INTAKE_KEY=//p' deploy/.env)
psql() { docker compose -f deploy/compose.yml exec -T postgres psql -U waafa -d waafa -tAc "$1"; }
ids() { psql "SELECT string_agg(\"$2\"::text, ',' ORDER BY \"$2\") FROM \"$1\""; }

echo "1/4 Start the live release $live"
rm -rf ../live-release
git worktree add --detach ../live-release "$live"
cp deploy/.env ../live-release/deploy/.env
(cd ../live-release && sh deploy/deploy.sh --build)

echo "2/4 A lead and an order as a visitor sends them"
post() {
  curl -sf -X POST "http://127.0.0.1:4000/api/v1/public/$1" \
    -H "content-type: application/json" -H "x-intake-key: $intake" \
    -H "idempotency-key: $(cat /proc/sys/kernel/random/uuid)" -H "x-client-ip: 10.9.0.$2" -d "$3"
  echo
}
post leads 1 '{"contact":{"name":"Rehearsal Customer","phone":"+8801000000101"},"consent":true,"payload":{"module":"flights","search":{"tripType":"one-way","legs":[{"from":"DAC","to":"DXB","date":"'"$(date -d "+30 days" +%F)"'"}],"travellers":{"adults":1,"childAges":[],"infants":0},"cabin":"economy"}}}'
post orders 2 '{"lines":[{"variantId":"bd-w1510a","quantity":1}],"address":{"name":"Rehearsal Customer","phone":"+8801712345678","division":"Dhaka","district":"Dhaka","area":"Motijheel","street":"House 4, Road 2"},"payment":{"method":"cod"}}'

before_leads=$(ids Lead id); before_orders=$(ids Order id); before_staff=$(ids StaffUser id)
before_hash=$(psql "SELECT \"passwordHash\" FROM \"StaffUser\" ORDER BY \"createdAt\" LIMIT 1")
before_docs=$(psql "SELECT count(*) FROM \"ContentDocument\""); before_settings=$(psql "SELECT count(*) FROM \"Setting\"")
[ -n "$before_leads" ] && [ -n "$before_orders" ] && [ -n "$before_staff" ] || { echo "nothing stored at the live release"; exit 1; }
echo "live: leads=$before_leads orders=$before_orders documents=$before_docs settings=$before_settings"

echo "3/4 Deploy this checkout over it"
git worktree remove --force ../live-release
sh deploy/deploy.sh --build

echo "4/4 Everything is still there"
[ "$(ids Lead id)" = "$before_leads" ] || { echo "leads changed"; exit 1; }
[ "$(ids Order id)" = "$before_orders" ] || { echo "orders changed"; exit 1; }
[ "$(ids StaffUser id)" = "$before_staff" ] || { echo "staff accounts changed"; exit 1; }
[ "$(psql "SELECT \"passwordHash\" FROM \"StaffUser\" ORDER BY \"createdAt\" LIMIT 1")" = "$before_hash" ] || {
  echo "the first staff password changed"
  exit 1
}
[ "$(psql "SELECT count(*) FROM \"ContentDocument\"")" -ge "$before_docs" ] || { echo "content records lost"; exit 1; }
[ "$(psql "SELECT count(*) FROM \"Setting\"")" -ge "$before_settings" ] || { echo "settings lost"; exit 1; }
psql "SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL" | grep -qx 0 || {
  echo "a migration did not finish"
  exit 1
}
echo "Upgrade rehearsal passed: $live → $(git rev-parse --short HEAD)"

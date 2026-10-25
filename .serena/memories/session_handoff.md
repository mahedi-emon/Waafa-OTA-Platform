# Session handoff (update at every session end)
Updated 2026-10-26 00:40 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after Docker images is green; never touch the
VPS or its .env). Repo PRIVATE: CI budget rules in CLAUDE.md (normal PR = quick set; `full-ci` label for the full suite,
required for schema/deploy/auth/payments/checkout/intake). Never cancel or skip CI by hand; wait for a run to finish
before pushing again (a push restarts the full suite on full-ci PRs). Minutes: `node scripts/ci-minutes.mjs <pr>`.
MAIN PROMPT: docs/claude-code-prompts.md v5 PROMPT 10 (Phase D, A–M); order D268. Deadline PRD P1 13 Nov 2026.
DONE: #231 Step 0 (PR #260, 54 min); #232 customer files (PR #262, 85 min, MIGRATION + bundle copy); #263 test fix;
#233 P0 notifications + EMI form (PR #264, 48 min, no migration). TRACKER for #233 → Done + minutes goes in the next PR.
NOW (26 Oct 01:45, usage limit): #229 WIP pushed on chore/229-admin-polish (no PR yet). DONE in it: Trash, Newsletter
(+CustomerTabs), Sent messages (email chips), Search activity, Audit log on AdminDataTable with `q` in API; AdminDateRange
(+Panel, lib/admin/dateRangeStrings) on Reports + Audit; ListFilters removed; integrations plain words + stacked switches;
canDelete (FIXED lists) API 409 + editor/bulk hidden; template chips sending/notSending; airline logos as list thumbs;
Add staff dialog in header; CountriesField widget (phoneCountries) + auto rule phoneDisplay (contact + extraPhones).
TODO: booking modes as cards per service with lock chip + reason (item 2); unit tests (phoneDisplay rule, canDelete API
409, q filters, CountriesField), run guards/lint/typecheck/test, local API-mode e2e (admin-screens/settings/staff tasks
may need updates for new list markup), screenshots 390/1440, TRACKER #229 block + #233 Done/minutes, PR (no full-ci:
no risky paths… check apps/api/src/admin only → quick set), merge.
OLD NOTE — letter A: #229 admin polish (lists onto DataTable: Trash, Newsletter→Customers tab, Sent messages, Search
activity, Audit log; booking modes cards; integrations plain words; phone once + country picker; themed date range;
template status words + no Trash on fixed records; airline logos on group fares; Add staff in header), then #219
(100-row page INP), #224 (budget cold-start flake).
NEXT STEPS: 1) #229. 2) #219 + #224. 3) letter B #234 TOTP/login history/new-device email/Redis rate limits, #235 ClamAV.
OWNER DEPLOY STATE: #232 needs bundle copy + backup before deploy (told). #233 no migration.
COVERAGE: docs/PRD_COVERAGE.md is the FR-ID map; turn rows done and recompute the summary as issues close.
GOTCHAS: NEVER `git stash pop` without checking `git stash list`: stash@{0} is the old A5 media WIP (first session);
popping it onto main once caused conflicts (restored 26 Oct, backup in that session's scratchpad). "#232"-style strings in web code trip the hex-colour guard (write "issue 232"); bash heredocs with quotes
break: write python/node scripts with Write; Project #4 auto-adds new issues; Fastify path params max 100 chars;
strict zod payload schemas (feedback photo) must list new fields; e2e date math near month ends (2-month calendars);
DocumentSlot uploads on pick (fixture mode returns a Sample key); real JPEG/PDF bytes needed in e2e (sniffed).
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL `waafa-dev-pg` (5433). DBs waafa_dev, waafa_test (API tests), waafa_ci (reset: DROP SCHEMA public CASCADE;
  CREATE SCHEMA public; prisma migrate deploy; node dist/seed.js with SEED_ADMIN_PASSWORD=ci-owner-password-123).
- Env file: scratchpad api-env.sh (CI values + PRIVATE_FILES_DIR/MEDIA_DIR in scratchpad). API `node
  apps/api/scripts/build.mjs && node dist/main.js` on 4000; web `WAAFA_API_URL=http://localhost:4000
  WAAFA_INTAKE_KEY=ci-intake-key-0123456789-abcdef STYLEGUIDE=1 next build` then `RATE_LIMIT_FACTOR=50 next start -p
  3100`; e2e with WAAFA_API_URL + SEED_ADMIN_PASSWORD. Stop servers after (ports 4000, 3100).
- gh needs PATH += /c/Program Files/GitHub CLI.

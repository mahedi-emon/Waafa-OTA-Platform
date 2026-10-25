# Session handoff (update at every session end)
Updated 2026-10-25 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo PRIVATE: keep path filters, no needless reruns, NEVER cancel or skip CI; CI has
cancel-in-progress, so wait for a PR run to finish before pushing again.
DONE: D0 R0–R9 merged. R8 #226 (137428f), #225 #227 (81d4e04), R9 #228 (951080b, MIGRATION staff_invites: owner runs
`sh backup.sh` before deploying; seed patch adds the staff-invite template).
NOW: R10 #200 on chore/200-usability-qa, all local checks green (web 664, shared 144, e2e API job 79 on a fresh DB,
fixture build earlier). Next: commit, PR (Closes #200), owner COMMENT review, CI, merge, close-out (no migration),
close epic #201 and #71 (replaced), then tell the owner in Banglish what the redesign changed.
NEXT STEPS: 1) finish R10 (above) + Banglish summary. 2) Phase D (#31): #229 admin polish (lists onto DataTable,
booking modes cards, integrations words, phone once + country picker, themed date range, template status/Trash,
airline logos), #219, #224. 3) PRD P1 list as new issues (Bangla /bn etc.).
GOTCHAS: e2e specs share one DB in the API job, so pick data no other spec counts (Malaysia for task 11, bd-cf280a for
orders, dubai package for task 13; bd-w1510a has only 3 in stock); a test that changes data restores it in finally;
Playwright clears test-results at each run (copy screenshots out first); MCP screenshots save relative to the repo
root; sr-only spans in scrolling tables need positioned cells; notFound() inside a streamed Suspense logs React #419;
bash heredocs/node -e lose regex backslashes: use Write/Edit for code with regex or apostrophes.
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL `waafa-dev-pg` (5433, waafa/waafa). DBs waafa_dev, waafa_test (API tests via API_TEST_DATABASE_URL),
  waafa_ci (reset: DROP SCHEMA public CASCADE; CREATE SCHEMA public; prisma migrate deploy; tsx prisma/seed.ts with
  DATABASE_URL=.../waafa_ci; restart the API after a reset).
- Env: scratchpad dev-env.sh. API `npx tsx src/main.ts` on 4000; web `next build` then `RATE_LIMIT_FACTOR=50 next start
  -p 3100`. Fixture build: `env -u WAAFA_API_URL -u WAAFA_INTAKE_KEY STYLEGUIDE=1 next build`.
- gh needs PATH += /c/Program Files/GitHub CLI; labels "type: bug", "area: admin", "priority: P2".

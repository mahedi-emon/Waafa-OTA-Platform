# Session handoff (update at every session end)
Updated 2026-10-25 22:40 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after Docker images is green; never touch the
VPS or its .env). Repo PRIVATE: CI budget rules in CLAUDE.md (normal PR = quick set; `full-ci` label for the full suite,
required for schema/deploy/auth/payments/checkout/intake). Never cancel or skip CI by hand; wait for a run to finish
before pushing again. Record minutes: `node scripts/ci-minutes.mjs <pr>`.
MAIN PROMPT: docs/claude-code-prompts.md v5 PROMPT 10 (Phase D, A–M). Deadline PRD P1 13 Nov 2026.
NOW: Step 0 #231 → PR #260 (full-ci) in CI. After green: owner COMMENT review step (D159), squash-merge, close #231,
Project Done, close-out (no migration; owner copies deploy/server bundle when convenient; Docker Hub private steps),
CI minutes into the TRACKER block, then the Banglish checkpoint summary (issue order D268, owner actions: Actions
billing decision, Docker Hub private + token, DOCKERHUB_TOKEN with delete, R9/R10 deploy with backup, Dependabot,
accounts for J/E/D).
NEXT STEPS: 1) finish #231 + checkpoint. 2) #232 customer files → private storage (P0; migration → full-ci, owner
backup). 3) #233 P0 notification gaps, then A (#229, #219, #224), B (#234, #235).
COVERAGE: docs/PRD_COVERAGE.md is the FR-ID map; turn rows done as issues close.
GOTCHAS: Project #4 auto-adds new issues (item-add may say "already exists": look up the item id instead). e2e specs
share one DB in the API job (pick data no other spec counts); Playwright clears test-results each run; MCP screenshots
save relative to the repo root; notFound() inside streamed Suspense logs React #419; bash heredocs lose regex
backslashes (use Write/Edit). API image now runs dist/*.js (no tsx); integration CI job runs the compiled API.
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL `waafa-dev-pg` (5433, waafa/waafa). DBs waafa_dev, waafa_test (API tests via API_TEST_DATABASE_URL),
  waafa_ci (reset: DROP SCHEMA public CASCADE; CREATE SCHEMA public; prisma migrate deploy; node dist/seed.js or tsx
  prisma/seed.ts with DATABASE_URL=.../waafa_ci; restart the API after a reset).
- API `node apps/api/scripts/build.mjs && node dist/main.js` (or `npx tsx src/main.ts`) on 4000 with the CI env values;
  web `next build` then `RATE_LIMIT_FACTOR=50 next start -p 3100`. Fixture build: `env -u WAAFA_API_URL -u
  WAAFA_INTAKE_KEY STYLEGUIDE=1 next build`.
- gh needs PATH += /c/Program Files/GitHub CLI; labels "type: bug", "area: admin", "priority: P2", "full-ci".

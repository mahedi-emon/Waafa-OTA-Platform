# Session handoff (update at every session end)
Updated 2026-10-26 10:30 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after Docker images is green; never touch the
VPS or its .env). Repo PRIVATE: CI budget rules in CLAUDE.md (normal PR = quick set; `full-ci` label for the full suite,
required for schema/deploy/auth/payments/checkout/intake). Never cancel or skip CI by hand. Minutes:
`node scripts/ci-minutes.mjs <pr>`.
MAIN PROMPT: docs/claude-code-prompts.md v5 PROMPT 10 (Phase D, A–M); order D268. Deadline PRD P1 13 Nov 2026.
DONE: Step 0 (#231–#233), A (#229 PR #265, #224 PR #266, #219 PR #267), B (#234 PR #268 two-step sign-in, MIGRATION;
#235 PR #270 ClamAV, BUNDLE CHANGE). Checkpoint B sent to the owner (26 Oct): copy deploy/server bundle → backup.sh →
deploy.sh → set up the authenticator at the next sign-in, save recovery codes.
NOW: branch chore/236-speed (pushed) holds only TRACKER (#235 Done + minutes) and Serena memory updates; issue #236 not
started (Project status still Ready). Resume: set #236 In progress, plan comment, then the work on that branch.
NEXT STEPS: 1) #236 Lighthouse mobile 90+ (median of 3) on the listed public routes + first-load JS ≤ 200 KB on every
public route (Home 217, Flights 258, Shop 215 at last count), then LHCI assertions warn → error. 2) Letter C checkpoint.
3) Letter D #237 measurement.
E2E NOTE (D289): playwright `setup` project (e2e/staff.setup.ts) enrols/trusts the seed Super Admin and writes
e2e/.auth (git-ignored). Local waafa_ci data is stale (toner stock 0, Malaysia has a range, 3000+ leads): 3 admin e2e
fail locally only; reset waafa_ci (and delete e2e/.auth) for a clean local run.
COVERAGE: docs/PRD_COVERAGE.md is the FR-ID map; turn rows done and recompute the summary as issues close.
GOTCHAS: NEVER `git stash pop` (stash@{0} is old A5 media WIP). "#232"-style strings in web code trip the hex guard
(write "issue 232"). The Bash tool strips backslashes in heredocs and `node -e '...'`: write scripts with Write and run
them, or use Edit. git pathspec with [locale]: ':(literal)apps/web/src/app/[locale]/...'. PowerShell jq filters with
quotes break: run gh --jq in Bash. CodeQL acceptance = `// codeql[rule-id] reason` on the line above the finding.
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL `waafa-dev-pg` (5433, waafa/waafa): waafa_test (API tests: API_TEST_DATABASE_URL=
  postgresql://waafa:waafa@localhost:5433/waafa_test), waafa_ci (e2e). Redis for tests: container `waafa-dev-redis`
  (stopped; `docker start waafa-dev-redis`, API_TEST_REDIS_URL=redis://localhost:6380).
- Env file: scratchpad api-env.sh. API `node scripts/build.mjs && node dist/main.js` (RATE_LIMIT_FACTOR=50) on 4000; web
  STYLEGUIDE=1 next build then `WAAFA_API_URL=... WAAFA_INTAKE_KEY=... RATE_LIMIT_FACTOR=50 next start -p 3100`.
  Servers are stopped now.
- gh needs PATH += /c/Program Files/GitHub CLI.

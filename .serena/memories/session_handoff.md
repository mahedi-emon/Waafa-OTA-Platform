# Session handoff (update at every session end)
Updated 2026-10-26 08:00 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after Docker images is green; never touch the
VPS or its .env). Repo PRIVATE: CI budget rules in CLAUDE.md (normal PR = quick set; `full-ci` label for the full suite,
required for schema/deploy/auth/payments/checkout/intake). Never cancel or skip CI by hand; wait for a run to finish
before pushing again. Minutes: `node scripts/ci-minutes.mjs <pr>`.
MAIN PROMPT: docs/claude-code-prompts.md v5 PROMPT 10 (Phase D, A–M); order D268. Deadline PRD P1 13 Nov 2026.
DONE: Step 0 (#231, #232, #233). Letter A: #229 (PR #265), #224 (PR #266), #219 (PR #267, 11 min).
NOW: #234 two-step sign-in PR #268 (full-ci, In review). Branch feat/234-two-step-sign-in. MIGRATION (additive) →
close-out must tell owner: copy nothing, `sh backup.sh` then `sh deploy.sh`; after deploy the owner (Super Admin) sets up
an authenticator at the next sign-in and saves recovery codes. Independent review agent was launched; apply its real
findings before merge. TRACKER #234 block says "In review": set Done + CI minutes in the next PR's TRACKER.
NEXT STEPS: 1) finish #268 (review fixes, green CI, merge, close #234, Project Done, close-out in Banglish with
backup/deploy + authenticator note). 2) #235 ClamAV (deploy bundle change → full-ci, DEPLOY.md bundle table).
3) Letter B checkpoint message to the owner, then letter C #236.
E2E NOTE (D289): playwright.config has a `setup` project (e2e/staff.setup.ts) that enrols/trusts the seed Super Admin
and writes e2e/.auth/staff-device.json (+ owner-two-step.json secret, git-ignored). Local waafa_ci DB data is stale
(toner stock 0, Malaysia already has a range, 3000+ leads) → those 3 e2e fail locally only; reset waafa_ci if needed
(then delete e2e/.auth).
COVERAGE: docs/PRD_COVERAGE.md is the FR-ID map; turn rows done and recompute the summary as issues close.
GOTCHAS: NEVER `git stash pop` (stash@{0} is old A5 media WIP). "#232"-style strings in web code trip the hex guard
(write "issue 232"). The Bash tool strips backslashes inside heredocs and `node -e '...'`: write scripts with Write and
run them, or use Edit. git pathspec with [locale]: use ':(literal)apps/web/src/app/[locale]/...'. Project #4 auto-adds
issues; Fastify path params max 100 chars; strict zod payloads must list new fields.
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL `waafa-dev-pg` (5433, user waafa/waafa): waafa_test (API tests: API_TEST_DATABASE_URL=
  postgresql://waafa:waafa@localhost:5433/waafa_test), waafa_ci (e2e). Redis for tests: container `waafa-dev-redis`
  on 6380 (API_TEST_REDIS_URL=redis://localhost:6380); stop it when done.
- Env file: scratchpad api-env.sh. API `node scripts/build.mjs && node dist/main.js` (RATE_LIMIT_FACTOR=50) on 4000; web
  STYLEGUIDE=1 next build then `WAAFA_API_URL=... WAAFA_INTAKE_KEY=... RATE_LIMIT_FACTOR=50 next start -p 3100`.
  Stop servers after (ports 4000, 3100).
- gh needs PATH += /c/Program Files/GitHub CLI.

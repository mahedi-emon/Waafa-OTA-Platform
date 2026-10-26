# Session handoff (update at every session end)
Updated 2026-10-26 19:00 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after Docker images is green; never touch the
VPS or its .env). Repo PRIVATE: CI budget rules in CLAUDE.md (normal PR = quick set; `full-ci` label for the full suite,
required for schema/deploy/auth/payments/checkout/intake). Never cancel or skip CI by hand. Minutes:
`node scripts/ci-minutes.mjs <pr>`.
MAIN PROMPT: docs/claude-code-prompts.md v5 PROMPT 10 (Phase D, A–M); order D268. Deadline PRD P1 13 Nov 2026.
DONE: Step 0, A, B (see progress).
NOW: #236 (In progress) on chore/236-speed, all pushed (last ebcec41). First-load JS ≤ 200 KB on EVERY public route
(Home 200 tight, Flights 192, Shop 196, Checkout 182; budget.spec covers 31 routes at 200). D293–D297 in TRACKER:
native radio/checkbox/switch/tabs, compiled next-intl messages (no empty plural branches, no t.raw), lazy dialogs and
second steps, useSubmitOnce (double tap), client-boundary guard (in pnpm guards + CI Guards job). Public e2e green
locally (flights, hotels, packages, services, store, orders, visa, home, search, smoke, budget, content, seo, …).
NOT YET: e2e/native-controls.spec.ts written but never run; Lighthouse local run failed (Windows dropped
--ignore-certificate-errors → fixed in scripts/lighthouse-run.mjs, quoteOnWindows) and was then killed for low memory;
TRACKER #236 issue block, session log, QA SUMMARY, PRD_COVERAGE NFR-PERF row not written; PR not opened.
NEXT STEPS: 1) run `npx playwright test native-controls --no-deps --workers=2` (build first, port 3100), fix; 2) Lighthouse
`node scripts/lighthouse-run.mjs --warn` with nothing else running (needs ~1.5 GB free); if all 11 medians ≥ 90 drop
`--warn` in ci.yml lighthouse job, else keep warn and log why; 3) TRACKER block + QA SUMMARY + PRD_COVERAGE, open PR
"Closes #236" with label full-ci (ui primitives changed under admin too: admin e2e must run in CI), merge, then letter D
#237.
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

# Session handoff (update at every session end)
Updated 2026-10-27 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after Docker images is green; never touch the
VPS or its .env). Repo PRIVATE: CI budget rules in CLAUDE.md (normal PR = quick set; `full-ci` label for the full suite,
required for schema/deploy/auth/payments/checkout/intake). Never cancel or skip CI by hand. Minutes:
`node scripts/ci-minutes.mjs <pr>`. The manual Lighthouse workflow is dispatch-only (#273) — never let a workflow run
on every branch push again.
MAIN PROMPT: docs/claude-code-prompts.md v5 PROMPT 10 (Phase D, A–M); order D268. Deadline PRD P1 13 Nov 2026.
DONE: Step 0, A, B, C (#236 merged PR #272 5583bf7; follow-up #271 Lighthouse 90 on Home/Hotels/Blog + LCP 2.5 s).
NOW: #273 (lighthouse.yml dispatch-only + #236 TRACKER close-out) on chore/273-lighthouse-dispatch → PR → quick CI →
merge. Owner checkpoint C to send (no migration, no bundle change: just `sh deploy.sh` after Docker images green).
NEXT STEPS: 1) merge #273; 2) letter D #237 measurement (GA4, GTM, Pixel after consent, UTM on orders, Reports source
view) with docs/qa/D-measurement.md first; 3) letter E (#238 error tracking, #239 off-site backups).
LESSONS (#236): fixture mode hides API-mode problems — record pages must keep Suspense (draftMode in snapshot, D299);
client-boundary guard catches server-only imports in client code; compiled messages forbid empty plural branches;
Lighthouse local runner: run with MSYS_NO_PATHCONV=1 from Git Bash, nothing else running (memory).
E2E NOTE (D289): playwright `setup` project (e2e/staff.setup.ts) enrols/trusts the seed Super Admin and writes
e2e/.auth (git-ignored). Public specs run locally with `--no-deps --workers=2` on a `next start -p 3100` build.
Admin/API-mode specs run in CI (full-ci). Flaky: admin-staff-tasks task 2 hero upload (passed on re-run).
COVERAGE: docs/PRD_COVERAGE.md is the FR-ID map; NFR-PERF partial → #271.
GOTCHAS: NEVER `git stash pop` (stash@{0} is old A5 media WIP). "#232"-style strings in web code trip the hex guard
(write "issue 232"). The Bash tool strips backslashes in heredocs and `node -e '...'`: write scripts with Write and run
them, or use Serena replace tools. Commit headers ≤ 100 chars. A failed lint-staged run can leave CRLF-only diffs:
re-run the commit. git pathspec with [locale]: ':(literal)apps/web/src/app/[locale]/...'. PowerShell jq filters with
quotes break: run gh --jq in Bash. CodeQL acceptance = `// codeql[rule-id] reason` on the line above the finding.
Don't leave a shell cwd inside apps/web/.next (locks the build).
LOCAL DEV STACK (~1 GB free RAM): PostgreSQL `waafa-dev-pg` (5433, waafa/waafa), Redis `waafa-dev-redis` (stopped).
gh needs PATH += /c/Program Files/GitHub CLI.

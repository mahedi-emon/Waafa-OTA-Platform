# Session handoff (update at every session end)
Updated 2026-10-25 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo PRIVATE: keep path filters, no needless reruns, NEVER cancel or skip CI; CI has
cancel-in-progress, so wait for a PR run to finish before pushing again.
DONE: R8 #198 merged (#226, 137428f, no migration). #225 missing record → not-found screen merged (#227, 81d4e04).
Main CI green on 137428f (R8 also fixed the toast-over-Schedule flake that failed main after R7).
NOW: R9 #199 on feat/199-dashboard-settings, all local checks green (web 663, API 192, e2e API job 71, fixture build).
Next: commit, PR (Closes #199), owner COMMENT review, CI, merge, close-out WITH MIGRATION NOTE:
20261025090000_staff_invites → owner runs `sh backup.sh` before deploying. Seed patch 2026-10-25-staff-invite-template
adds the invite email template on deploy. Screens: .playwright-mcp/r9/.
NEXT STEPS: 1) finish R9 (above). 2) R10 #200 usability QA: 14 staff tasks as e2e (tasks 1,7,9,11 in admin-editors,
10 in admin-settings, 4/5/6 in admin-workflow, 13/14 in admin-workflow? check), axe, screenshots 390/768/1024/1440,
independent subagent review, docs/ADMIN_GUIDE.md; owner checkpoint after R10 then Phase D. 3) #224 budget flake, #219.
GOTCHAS: sr-only spans in a scrolling table need positioned cells (else the page widens); a scrolling region needs
role=region + aria-label + tabIndex=0 for axe; notFound() inside a streamed Suspense logs React #419 (render
AdminNotFound instead); bash heredocs/node -e lose backslashes in regexes: use the Write/Edit tools for code with
regex or apostrophes; "#225"-style text in code trips the hex guard (write "issue 225").
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL `waafa-dev-pg` (5433, waafa/waafa). DBs waafa_dev, waafa_test (API tests via API_TEST_DATABASE_URL),
  waafa_ci (reset: DROP SCHEMA public CASCADE; CREATE SCHEMA public; prisma migrate deploy; tsx prisma/seed.ts with
  DATABASE_URL=.../waafa_ci). Check a migration: `prisma migrate diff --from-config-datasource --to-schema
  prisma/schema.prisma --script --exit-code` must print an empty migration.
- Env: scratchpad dev-env.sh. API `npx tsx src/main.ts` on 4000 (DATABASE_URL waafa_ci); web `next build` then
  `RATE_LIMIT_FACTOR=50 next start -p 3100`. Fixture build: `env -u WAAFA_API_URL -u WAAFA_INTAKE_KEY STYLEGUIDE=1
  next build`. Stop only my own processes on 3100/4000. Typecheck with NODE_OPTIONS=--max-old-space-size=3584.
- gh needs PATH += /c/Program Files/GitHub CLI; labels "type: bug", "area: admin", "priority: P2".

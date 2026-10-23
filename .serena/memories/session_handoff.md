# Session handoff (update at every session end)
Updated 2026-10-23 15:30 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo PRIVATE: Actions minutes limited, keep path filters, no needless reruns, but
NEVER cancel or skip CI (owner, 20 Oct): every push's CI runs to green; verify locally first.
URGENT FIRST: #213 security (Next 16.4.0 had two critical unauthenticated RCE advisories; a 16.4.0 build now STOPS
with SecurityFatalError, so every CI build needs 16.4.2). Branch fix/213-security-deps, PR #214 (next +
eslint-config-next 16.4.2, sanitize-html 2.18.1, fastify 5.12.7 + pnpm override in pnpm-workspace.yaml for the copy
@nestjs/platform-fastify 12.1.2 pins). Local: audit critical 0, unit all, fixture build, smoke 132/56 skipped. When CI
is green: squash-merge, check the merge author, wait for Docker images green, tell the owner to `sh deploy.sh` (no
migration). Close #213 with a comment, Project status Done.
THEN R3 #193 (branch feat/193-media, pushed at d879cad; commits 08a4721 API, 4524de1 web, e77ca47 review fixes,
d879cad e2e/docs): merge origin/main into it (merge commit, NO force push; resolve TRACKER, package.json, lockfile;
pnpm install), insert the R3 TRACKER block from scratchpad tracker-r3-block.md ({SMOKE} = smoke result) at the top of
the issue log, components inventory/decisions D207–D212 are already in the branch's TRACKER, commit the .serena
memory edits, push, open the PR with scratchpad pr-193.md ({TESTS} filled), CI green, merge. Close-out MUST say the
migration `20261020050000_media_credit` → owner runs `sh backup.sh` before `sh deploy.sh`. Then the owner checkpoint
(Banglish summary + screenshot paths test-results/admin-audit/r3/final-*.png + "test this yourself").
R3 verified locally: API-job e2e 30/30 on a fresh DB (CI order) and media spec 7/7 on a used DB; web unit 617, API 163.
Unverified visually: FocalPointPicker previews now h-20 row (d879cad) — check on the next API-mode build.
NEXT AFTER R3: R4 #194 status automation (ADMIN.md §8, §9).
LOCAL DEV STACK (this Windows machine, ~0.7–1 GB free RAM; the owner's Docker stack also runs, don't touch it):
- Docker Desktop must be running (start it if the machine rebooted). PostgreSQL container `waafa-dev-pg` (mine; port
  5433, waafa/waafa). DBs: waafa_dev, waafa_test (API tests: API_TEST_DATABASE_URL=postgresql://waafa:waafa@localhost:5433/waafa_test),
  waafa_ci (recreate: docker exec waafa-dev-pg psql -U waafa -d postgres -c "DROP DATABASE IF EXISTS waafa_ci WITH (FORCE);" -c "CREATE DATABASE waafa_ci;", then migrate + seed), waafa_ci2.
- Env: scratchpad dev-env.sh (CI-style values, SEED_ADMIN_PASSWORD dev-owner-password-123). API: `pnpm --filter @waafa/api start`
  on 4000 with DATABASE_URL and MEDIA_DIR in the scratchpad (not inside the repo). Web: `pnpm build` (API-mode needs the
  API running; fixture mode: STYLEGUIDE=1 without WAAFA_* envs), then Playwright starts `next start` itself.
- e2e: Playwright runs spec files in name order; e2e create their own data; clicks/typing right after goto need
  hydration-safe retries (until(), counters). Measure admin JS with scratchpad measure-admin-js.mjs (MSYS_NO_PATHCONV=1
  and a Windows script path).
Gotchas: after switching branches run `pnpm --filter @waafa/api generate` (the generated Prisma client is gitignored and
can be from the other branch's schema: "Unknown argument credit"); Git Bash converts leading-slash args (MSYS_NO_PATHCONV=1); write node scripts with Write (shell quoting
breaks backticks/regex); pnpm auto-installs when switching to a branch with another lockfile; gh needs
PATH += /c/Program Files/GitHub CLI; 21st.dev free tier: 2 retrievals/day, a refused install still uses one, and
uvain/file-upload is a paid marketplace item; guards read "#205" in apps/web/src as hex; Next's proxy keeps only 10 MB
of a body (uploads live outside it).

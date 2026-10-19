# Session handoff (update at every session end)
Updated 2026-10-20 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo is PRIVATE now: Actions minutes limited, keep path filters, no needless reruns.
CURRENT EPIC: D0 Admin redesign #201 (see `mem:admin_redesign`). R0 #190 and R1 #191 merged; CodeQL skip while
private merged (#204/#206). R2 #192 (also closes #205 list order) on branch feat/192-form-engine: code done and
reviewed in the browser at 1440; commits up to ea629dc (remount fix: useEditorState syncs to a new version instead of
`key={version}` remounts). TRACKER R2 block written (Tests and First-load JS rows still TBD).
RESUME R2 HERE: (1) rebuild web, rerun `e2e/admin-editor.spec.ts` (7 tests) + admin-shell + admin-screens;
(2) 390 / 768 screenshots of the editor, rail line-clamp-2 instead of truncate; (3) full suites + lint/typecheck/
guards, admin first-load JS (scratchpad measure-admin-js.mjs); (4) fill TRACKER tests/JS rows, session log, next
steps; (5) push, PR "Closes #192, Closes #205", owner COMMENT review (D159), green CI, squash-merge, close-outs (no
migration). THEN R3 #193 media + owner checkpoint (Banglish summary, screenshots, "test this yourself").
LOCAL DEV STACK (this Windows machine, ~1 GB free RAM):
- PostgreSQL: docker container `waafa-dev-pg` (postgres:16, port 5433, waafa/waafa, db waafa_dev; tests use db
  waafa_test via API_TEST_DATABASE_URL=postgresql://waafa:waafa@localhost:5433/waafa_test), restart unless-stopped.
  Do NOT touch the owner's local test stack containers (waafa-api-1, …).
- Env (CI-style test values, nothing secret): DATABASE_URL=postgresql://waafa:waafa@localhost:5433/waafa_dev,
  JWT_SECRET=dev-jwt-secret-0123456789-0123456789-abcdef, REVALIDATE_SECRET=dev-revalidate-secret-0123456789-abc,
  INTAKE_KEY=WAAFA_INTAKE_KEY=dev-intake-key-0123456789-abcdef, WEB_ORIGINS=http://localhost:3100,
  WEB_REVALIDATE_URL=http://localhost:3100/api/revalidate, SEED_ADMIN_EMAIL=owner@example.com,
  SEED_ADMIN_PASSWORD=dev-owner-password-123, PROVIDER_SECRET_KEY=dev-provider-secret-key-0123456789-abcdef,
  WAAFA_API_URL=http://localhost:4000, NEXT_PUBLIC_SITE_URL=http://localhost:3100, MEDIA_DIR=H:/Waafa-OTA-Platform/.media.
- API: `pnpm --filter @waafa/api migrate && seed && start` (port 4000). Web: `next build` (7–15 min here) then
  `next start -p 3100`; never edit apps/web or packages/shared while a build runs (its type check reads them).
  next dev reloads in a loop on H: and is very slow. Stop servers by port (Get-NetTCPConnection → Stop-Process).
- Sample inbox data in waafa_dev (≈16 leads, 5 orders, 4 proofs, 3 feedback). Screenshots in test-results/admin-audit/
  (before/ = R0, r1/ = R1, r2/ = R2; gitignored). e2e locally: export the env + SEED_ADMIN_PASSWORD, `pnpm exec
  playwright test e2e/admin-editor.spec.ts --workers=1` (reuses the running server).
OWNER TODO (unchanged): Search Console requests, Google Business Profile, Bing, Facebook link, replace Sample records.
Gotchas: auto-mode classifier blocks creating staff users in other databases, broad rm and `git config` reads; Bash
heredocs/backticks in `node -e` break (use Write or Serena replace_content); gh needs PATH += /c/Program Files/GitHub
CLI; 21st.dev free tier = 2 component retrievals per day (resets 00:00 UTC); guards read "#205" in apps/web/src as a
hex colour (write "issue 205"); CRLF stat-dirty files block switch/rebase (refresh with `git add <file>`).

# Session handoff (update at every session end)
Updated 2026-10-19 21:40 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo is PRIVATE now: Actions minutes limited, keep path filters, no needless reruns.
CURRENT EPIC: D0 Admin redesign #201 (see `mem:admin_redesign`). R0 #190 merged (PR #202). R1 #191 done on branch
feat/191-admin-shell (PR opened from it; merge after green CI + owner-account COMMENT review). NEXT: R2 #192 form
engine v2 (blueprints per content key, widgets except media, action bar, right rail, unsaved guard, autosave,
History/restore + Duplicate + conflict endpoints in the API, session warning, lead page labelled facts), then R3 #193
(checkpoint after R3).
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
- API: `pnpm --filter @waafa/api migrate && seed && start` (port 4000). Web: `next build` (7–8 min here) then
  `next start -p 3100`; never edit apps/web or packages/shared while a build runs (its type check reads them).
  next dev reloads in a loop on H: and is very slow. Stop servers by port (Get-NetTCPConnection → Stop-Process).
- Sample inbox data in waafa_dev (≈16 leads, 5 orders, 4 proofs, 3 feedback). Screenshots in test-results/admin-audit/
  (before/ = R0, r1/ = R1; gitignored). e2e locally: export the env + SEED_ADMIN_PASSWORD, `pnpm exec playwright test
  e2e/admin-shell.spec.ts --workers=1` (reuses the running server).
OWNER TODO (unchanged): Search Console requests, Google Business Profile, Bing, Facebook link, replace Sample records.
Gotchas: auto-mode classifier blocks creating staff users in other databases and broad rm; Bash heredocs/backticks in
`node -e` break (use Write or Serena replace_content); gh needs PATH += /c/Program Files/GitHub CLI; 21st.dev free
tier = 2 component retrievals per day (resets 00:00 UTC).

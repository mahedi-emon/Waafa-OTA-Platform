# Session handoff (update at every session end)
Updated 2026-10-19 18:20 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo is PRIVATE now: Actions minutes limited, keep path filters, no needless reruns.
CURRENT EPIC: D0 Admin redesign #201 (see `mem:admin_redesign`). R0 #190 done on branch docs/190-admin-audit-plan
(ADMIN.md, waafa-admin design system, TRACKER D183–D187). NEXT: R1 #191 (shell, sidebar IA, top bar, Ctrl+K, + New,
notifications, breadcrumbs, page header, tokens + StatusChip, states, sign-in), then R2 #192, R3 #193.
LOCAL DEV STACK (this Windows machine, ~1 GB free RAM):
- PostgreSQL: docker container `waafa-dev-pg` (postgres:16, port 5433, user/pass waafa/waafa, db waafa_dev);
  `docker start waafa-dev-pg` if stopped. Do NOT touch the owner's local test stack containers (waafa-api-1, …).
- Env (CI-style test values, nothing secret): DATABASE_URL=postgresql://waafa:waafa@localhost:5433/waafa_dev,
  JWT_SECRET=dev-jwt-secret-0123456789-0123456789-abcdef, REVALIDATE_SECRET=dev-revalidate-secret-0123456789-abc,
  INTAKE_KEY=WAAFA_INTAKE_KEY=dev-intake-key-0123456789-abcdef, WEB_ORIGINS=http://localhost:3100,
  WEB_REVALIDATE_URL=http://localhost:3100/api/revalidate, SEED_ADMIN_EMAIL=owner@example.com,
  SEED_ADMIN_PASSWORD=dev-owner-password-123, PROVIDER_SECRET_KEY=dev-provider-secret-key-0123456789-abcdef,
  WAAFA_API_URL=http://localhost:4000, NEXT_PUBLIC_SITE_URL=http://localhost:3100, MEDIA_DIR=H:/Waafa-OTA-Platform/.media.
- API: `pnpm --filter @waafa/api migrate && seed && start` (port 4000). Web: `next build` then `next start -p 3100`
  (next dev reloads in a loop on H: and is very slow; don't use it for screenshots). Sample inbox data was posted
  through the public intake (15 leads, 5 orders, 4 proofs, 3 feedback).
- Admin screenshots: test-results/admin-audit/before/*.png (gitignored), capture script test-results/admin-audit/capture.js.
OWNER TODO (unchanged): Search Console requests, Google Business Profile, Bing, Facebook link, replace Sample records.
Gotchas: auto-mode classifier blocks creating staff users in other databases and broad rm; Bash heredocs with quotes
break (write scripts with Write); gh needs PATH += /c/Program Files/GitHub CLI.

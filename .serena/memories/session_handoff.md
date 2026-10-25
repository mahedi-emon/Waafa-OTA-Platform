# Session handoff (update at every session end)
Updated 2026-10-26 00:40 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after Docker images is green; never touch the
VPS or its .env). Repo PRIVATE: CI budget rules in CLAUDE.md (normal PR = quick set; `full-ci` label for the full suite,
required for schema/deploy/auth/payments/checkout/intake). Never cancel or skip CI by hand; wait for a run to finish
before pushing again (a push restarts the full suite on full-ci PRs). Minutes: `node scripts/ci-minutes.mjs <pr>`.
MAIN PROMPT: docs/claude-code-prompts.md v5 PROMPT 10 (Phase D, A–M); order D268. Deadline PRD P1 13 Nov 2026.
DONE: #231 Step 0 merged (PR #260, 54 min); checkpoint summary sent to the owner (Banglish).
NOW: #232 customer files → PR #262 (full-ci; also Closes #263 date-dependent hotel e2e). CI rerun after: CodeQL
acceptance comment (js/http-to-file-access on writeFile, D214 style) + #263 test fix. After green: squash-merge, close
#232/#263, Project Done, close-out comment. TELL OWNER (Banglish): MIGRATION + bundle change: copy new deploy/server
bundle (compose.yml privatedata volume, backup.sh) FIRST, then `sh backup.sh`, then `sh deploy.sh`; uploads pause until
the bundle is copied. Then record in TRACKER (inside the #233 PR): #232 block → Done + CI minutes, #263 bug row fixed.
NEXT STEPS: 1) merge #262 + owner deploy note. 2) #233 P0 notification gaps (visa-status-customer email on stage
change; staff recipients per module in Settings › Notifications replacing STAFF_ALERT_EMAIL-only; low-stock alert
(Product.variants lowStockAt default 3) in placeOrder; EMI request form (EmiLeadPayloadSchema unused); booking-mode
change reason → audit). 3) Letter A: #229, #219, #224.
COVERAGE: docs/PRD_COVERAGE.md is the FR-ID map; turn rows done and recompute the summary as issues close.
GOTCHAS: "#232"-style strings in web code trip the hex-colour guard (write "issue 232"); bash heredocs with quotes
break: write python/node scripts with Write; Project #4 auto-adds new issues; Fastify path params max 100 chars;
strict zod payload schemas (feedback photo) must list new fields; e2e date math near month ends (2-month calendars);
DocumentSlot uploads on pick (fixture mode returns a Sample key); real JPEG/PDF bytes needed in e2e (sniffed).
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL `waafa-dev-pg` (5433). DBs waafa_dev, waafa_test (API tests), waafa_ci (reset: DROP SCHEMA public CASCADE;
  CREATE SCHEMA public; prisma migrate deploy; node dist/seed.js with SEED_ADMIN_PASSWORD=ci-owner-password-123).
- Env file: scratchpad api-env.sh (CI values + PRIVATE_FILES_DIR/MEDIA_DIR in scratchpad). API `node
  apps/api/scripts/build.mjs && node dist/main.js` on 4000; web `WAAFA_API_URL=http://localhost:4000
  WAAFA_INTAKE_KEY=ci-intake-key-0123456789-abcdef STYLEGUIDE=1 next build` then `RATE_LIMIT_FACTOR=50 next start -p
  3100`; e2e with WAAFA_API_URL + SEED_ADMIN_PASSWORD. Stop servers after (ports 4000, 3100).
- gh needs PATH += /c/Program Files/GitHub CLI.

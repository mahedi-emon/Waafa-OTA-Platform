# Session handoff (update at every session end)
Updated 2026-10-12 18:30 Dhaka.
GOOGLE SIGN-IN (#134, PR #135, D163): built and merged, OFF until two switches: Admin › Integrations › Sign-in
(Google client ID + secret, Active) and Content › Site settings › Accounts live. Owner steps: docs/DEPLOY.md 5b.
API: Customer/CustomerSession, public/auth/google(+config), public/account(+sign-out, delete); web: /login,
/account, /api/auth/google/start|callback (state + PKCE cookie), session cookie waafa_customer.
LAUNCH-READY (go-live 13 Oct, waafasworld.com). Merged today: #127 (#126 nginx gzip + cache), #129 (#125 structured
data), #118 (#115 docs), #128 (dependabot, approved from the owner's account; commit author dependabot[bot], D162),
#131 (#130 Docker Hub images). Open: #74 (owner's VPS deploy), #71 (later), epics #30-#33.
DEPLOY FLOW (D161): push to main → workflow "Docker images" builds api/web/nginx (deploy.sh --build in the runner,
throwaway secrets), smoke + secret scan, pushes emon6107/waafa-ota-platform:{api,web,nginx}-<sha7> and -latest.
Server: git clone repo to /opt/waafa, copy deploy/.env (IMAGE_REPO set) → sh deploy/check.sh → sh deploy/deploy.sh
(docker pull, label guard for SITE_URL/Turnstile key, up, nginx cache clear, signed revalidation, certbot).
Rollback: IMAGE_TAG=<sha7>. GitHub: secrets DOCKERHUB_USERNAME/TOKEN; variables SITE_URL (default
https://waafasworld.com), TURNSTILE_SITE_KEY (re-run workflow after changing).
Production settings: deploy/.env.production on the owner's PC (gitignored; admin + ACME + staff email =
the owner's git email; generated secrets). Still needed from the owner: RESEND_API_KEY or SMTP_URL (API refuses to
start without one), DNS A records (apex + www), the VPS (x86_64, 2 vCPU/4 GB min, 4/8 recommended, Singapore).
Local stack: deploy/.env (localhost) now has IMAGE_REPO → `sh deploy/deploy.sh` pulls the Docker Hub images; Mailpit
container waafa-mailpit (axllent/mailpit:v1.27) on :8025/:1025. Stop: docker compose -f deploy/compose.yml down.
OWNER RULE: real code review on every PR, posted from the owner's account (gh api .../pulls/N/reviews, COMMENT +
inline comments; bot PRs APPROVE), fix + reply, then merge; never Copilot; no AI wording. Reviews do count
(contributionsCollection.totalPullRequestReviewContributions).
Next: 1) owner buys the VPS + DNS + Resend → deploy; 2) after go-live: Search Console, Rich Results test, Sample
content, Tracking IDs, Turnstile (GitHub variable + re-run + secret), uptime; 3) #71 rest, Bangla P1.
Gotchas: compose pull only warns for buildable services (use docker pull); Git Bash mangles rev:path
(MSYS_NO_PATHCONV=1); seo.spec needs test.slow() on this PC; no testing-library (react-dom/server in unit tests).

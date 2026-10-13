# Session handoff (update at every session end)
Updated 2026-10-13 09:30 Dhaka.
STATE: everything merged to main (last: #165 hero card removed, #166 image-only server bundle). Go-live 14 Oct with
NO source code on the server: deploy/server/ (compose images only, deploy.sh, setup-server.sh, backup.sh,
revalidate.mjs) + deploy/server/.env (= deploy/.env.production, gitignored) packed as waafa-server.tgz in the repo root
(gitignored). Server: unpack to /opt/waafa → sh setup-server.sh root → sh deploy.sh → cron backup.sh. GitHub may go
private; Docker Hub private needs docker login on the server. Old stash@{0} "A5 media WIP" must stay untouched (never
`git stash pop` without a fresh stash: it popped that one once; main was reset to HEAD).
THIS SESSION: #146 Log in words (PR #150), #149 Resend + Google env fallback (#151), #147 country flags (#152), #148
larger hero + flight path in the sky (#153, with #154 e2e outside-day fix), docs #155; then #156 airline logos (#159:
scripts/fetch-airline-logos.mjs → 89 marks in public/media/airlines, AirlineLogo, optional Airline.logo), #157 hero
fare card + chip flags + ribbon + glows (#161), #158 bootstrap-server.sh + runbook + web cap 1 GB (#160).
SECRETS: Resend key + Google client only in gitignored deploy/.env.production and local deploy/.env. Resend domain
verified; test mail sent. Owner should rotate the Google secret and Resend key after launch (both were pasted in chat).
Local stack: Docker Hub images; web image is built for https://waafasworld.com, so Google sign-in can only complete on
the live domain. Local mail goes through Resend (not Mailpit). Redeploy local: MSYS_NO_PATHCONV=1 sh deploy/deploy.sh.
OWNER TODO: Google Cloud web client → origin https://waafasworld.com, redirect https://waafasworld.com/api/auth/google/callback,
Audience → Publish app. Add a Home destination "Bali" (DPS) if the hero chip should show its flag.
MCP: magic (21st.dev) timed out earlier; shadcn/github MCP flaky (gh CLI works).
Next: 1) owner go-live; 2) after: Search Console, Rich Results, Sample content, Tracking IDs, Turnstile, uptime;
3) #71 rest, Bangla P1.
Gotchas: Windows case-insensitive file names (CountryFlag.tsx vs countryFlagSrc.ts); stacked calendars repeat outside
days (e2e uses :not([data-outside])); pics.avs.io returns a 200 placeholder for unknown codes; dev server first compile
takes minutes with the Docker stack running (~300–500 MB free).

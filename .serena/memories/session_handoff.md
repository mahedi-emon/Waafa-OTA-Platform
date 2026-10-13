# Session handoff (update at every session end)
Updated 2026-10-13 22:30 Dhaka.
STATE: site LIVE on https://waafasworld.com (VPS, Docker Hub images, owner deploys with `sh deploy.sh` after the Docker
images workflow is green). Merged today after go-live: #169 (Sample noindex), #171 (perf), #174, #175 (on-page SEO),
#177 (visa route /visa-services → /visa with 308s + one-time seed patch `2026-10-13-visa-route` that renames the live
header/drawer item to "Visa" and moves stored links). PR #180 open (Closes #178 store Show price default off + Ask for
price on WhatsApp; Closes #179 visa priceRange min/max per type) → merge when CI green.
SEED PATCHES: `apps/api/src/seed/seedPatches.ts`, run by prisma/seed.ts on start, recorded in setting `_seedPatches`.
Never edit a shipped patch; add a new id.
CLOUD SESSIONS: commit with `git commit --author="Mahedi Hasan Emon <mahedi.emon62@gmail.com>"` (owner approved);
after each squash-merge, merge origin/main into the designated branch (no force-push).
OWNER TODO: deploy after #180; Admin › Waafas World › Products › Show price on products that should show a price;
Admin › Visa › Countries › each type › Price range; Search Console, Google Business Profile, socials; Sample off per
real record.
NEXT: 1) perf follow-up: Home 57 / Flights 74 in CI; 2) #71 rest; 3) Bangla P1.
Gotchas: turbo `pnpm typecheck` can fail here with "Exec format error" (run tsc per package); Lighthouse locally needs
a warm-up; `pkill -f "next start"` kills your own shell (use the pid). Playwright: executablePath /opt/pw-browsers/chromium.

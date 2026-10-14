# Session handoff (update at every session end)
Updated 2026-10-14 16:30 Dhaka.
STATE: site LIVE on https://waafasworld.com (VPS, Docker Hub images, owner deploys with `sh deploy.sh` in /opt/waafa
after the Docker images workflow is green). Merged 13-14 Oct: #177 visa route /visa + seed patch, #180 store price on
request + visa price ranges, #182 second office number (extraPhones + seed patch), #186 every published page indexable
(Sample no longer noindex, D180). PR #187 open: #184 search titles, services/contact points in Home JSON-LD,
/llms.txt, home SEO seed patch; #185 photos q65 / logo q90, deviceSizes to 2560, cache 31 days, og:image through the
optimiser at 1200 px, shipped JPEGs mozjpeg q80.
SEED PATCHES (apps/api/src/seed/seedPatches.ts, run on API start, recorded in setting `_seedPatches`):
2026-10-13-visa-route, 2026-10-14-second-phone, 2026-10-14-home-seo. Never edit a shipped patch; add a new id.
CLOUD SESSIONS: commit with `git commit --author="Mahedi Hasan Emon <mahedi.emon62@gmail.com>"`; after each
squash-merge, merge origin/main into the designated branch (take our side when main equals our commit), no force-push.
TRACKER decisions table: insert after the line starting `| D<n> | <date>` (not the `| Decision | D<n> |` row).
OWNER TODO: deploy after #187; Search Console: request indexing (/, /about-us, /visa, /tour-packages, /flights,
/hotels, /contact, /visa/thailand) and resubmit sitemap; Google Business Profile (same name, address, both numbers,
website, photos, reviews); Bing Webmaster import; Facebook page website link; Admin: Show price per product, visa
price ranges, replace Sample records with real ones (the Sample label then goes).
NEXT: 1) perf: Home 217 KB / Flights 259 KB first-load JS; 2) Bangla P1 (/bn, hreflang); 3) #71 rest.
Gotchas: live site is unreachable from cloud containers (proxy 403); turbo typecheck can fail with "Exec format
error" (run tsc per package); local Postgres for API tests: /tmp/claude-0/pg (pg_ctl -o '-p 5433' as postgres);
Playwright: executablePath /opt/pw-browsers/chromium; budget e2e can flake under load (rerun alone).

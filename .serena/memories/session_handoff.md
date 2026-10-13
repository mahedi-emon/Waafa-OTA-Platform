# Session handoff (update at every session end)
Updated 2026-10-13 21:00 Dhaka.
STATE: site LIVE on https://waafasworld.com (VPS, Docker Hub images, owner deploys with `sh deploy.sh` after the Docker
images workflow is green). Merged today after go-live: #169 (Sample records noindex,follow + out of sitemap), #171
(perf: hero loop after first interaction, DeferredSearchCard on /flights + /hotels, lazyResolver for lead forms,
TripStep/StayStep/BulkQuoteForm on demand), #174 (header + drawer label "Visa"). #175 (on-page SEO #173) last.
CLOUD SESSIONS: `git var GIT_AUTHOR_IDENT` is Claude there; owner approved committing with
`git commit --author="Mahedi Hasan Emon <mahedi.emon62@gmail.com>"` (no config change); CI attribution checks author only.
One designated branch per cloud session: after each squash-merge, merge origin/main into it (no force-push) and continue.
OWNER TODO: Admin › Content › Menus › header label "Visa" (seed never overwrites live menus); Search Console (HTML tag in
Settings › General, submit sitemap); Google Business Profile; socials; turn Sample off per real record (About and
policies are Sample too = noindex until then); PageSpeed Insights on live after deploy.
NEXT: 1) perf follow-up: Home 57 / Flights 74 in CI (Home 1,900 nodes; Flights lead card hydration);
2) #71 rest; 3) Bangla P1.
Gotchas: Lighthouse locally needs a warm-up run (image optimizer CPU); content-visibility breaks axe target-size;
`pkill -f "next start"` kills your own shell (use the pid). Playwright here: executablePath /opt/pw-browsers/chromium.

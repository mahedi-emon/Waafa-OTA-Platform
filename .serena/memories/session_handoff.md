# Session handoff (update at every session end)
Updated 2026-10-11 17:30 Dhaka.
Phase A ✅, Phase B ✅ (launch scope). Owner deploys BY HAND later: docs/DEPLOY.md quick start →
deploy/init-env.sh <domain> <email> (secrets generated) → fill RESEND_API_KEY|SMTP_URL, STAFF_ALERT_EMAIL,
SEED_ADMIN_EMAIL/PASSWORD → deploy/check.sh → deploy/deploy.sh. #74 stays open until it is live.
Today (late): #97 SEO (withSocial on all public pages, admin default SEO + Search Console/Bing fields, WebSite +
TravelAgency, ItemList, sitemap images), #98 deploy kit, #100 flight route landing pages (/flights/[route],
flightRoutes collection, Popular routes on /flights). Lighthouse (CI): A11y/BP/SEO 100; Perf home 45 (#91).
Phase B prompt items not built (post-launch): R2 uploads + media library (#71), CSV/Excel reports, compatibility CSV
import, pg_trgm search, k6 load scripts, @fastify/compress/etag (API is private behind the web cache).
Next: 1) owner manual deploy; 2) after go-live: Search Console code, submit sitemap, Facebook debugger, expert review of
Sample routes; 3) #91 perf (home TBT), more route pages, Bangla P1.
Gotchas: stale apps/web/tsconfig.tsbuildinfo hides new message keys (delete it); commitlint header ≤ 100 chars;
Bash collapses `\\`; python glob treats [locale] as a class; Local Postgres stopped (low memory).

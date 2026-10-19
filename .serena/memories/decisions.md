# Decisions (full table: docs/TRACKER.md section 8)
- D1–D63: see TRACKER (planning, design system, MotionKit, search card, Back restore, pickers lazy).
- D64–D124: see TRACKER (home, flights/hotels Manual, packages, visa, store, cart/checkout, service pages, info pages,
  system states, group fares, footer brand text).
- D125 launch data model: relational for transactions; content/settings JSON documents (shared CONTENT_MODEL).
  D126 API via tsx + explicit @Inject. D127 local Postgres 5433. D128 seed admin from SEED_ADMIN_*. D129 admin = BFF
  (web httpOnly cookies; API Bearer).
- D130 public snapshot GET /api/v1/public/snapshot (ETag). D131 intake server to server (x-intake-key,
  Idempotency-Key). D132 orders lock products FOR UPDATE. D133 emails via BullMQ. D134 OpenAPI outside production.
  D135 lead/content access by role. D136 web API mode by env (WAAFA_API_URL + WAAFA_INTAKE_KEY).
- D141 prod = owner VPS Docker Compose + nginx/certbot. D142 provider adapters + ProviderCredential (AES-256-GCM).
  D143 admin at /secure-admin-control, /admin 404. D144 client imports zod-free constants. D145 per-route JS ceilings.
  D146 BannerHero inset panel. D147 CardFx/HoverVideo in-house. D151 CSP without nonces. D152 audit highs not runtime.
  D153 rehearsal on Docker Desktop.
- D154 (12 Oct, #91) overlays/toasts/desktop menu load on use; CSS page + word motion; native details accordions;
  zod jitless via beforeInteractive script; message precompile and content-visibility tried and dropped.
- D155 (#107) IntegrationSetting per provider (Active, isLive → production creds, markup for flight/hotel) next to
  per-environment sealed credentials; custom providers "custom-<kind>-<slug>" with generic fields; audited reveal;
  getIntegrationConfig / resolveCategory (manual fallback); email via active Resend/SMTP else env mailer.
- D156 (#109) media uploads on VPS volume, sharp in the API (WebP, 2560 px, no EXIF), /uploads via nginx → API.
- D157 (#111) customers keyed by phone across leads and orders until accounts (Phase D). D158 (#116) tiptap rich text.
- D159 (12 Oct) every PR: COMMENT code review with inline comments from the owner's account before merge; never
  Copilot; bot PRs may be approved. D160 (#126) nginx gzip + proxy cache (/_next/static 30 d, /_next/image 7 d per
  format, /media 1 d), Next compression off in the Docker image only, deploy.sh clears the cache.
- D161 (#130) GitHub Actions builds api/web/nginx images → public Docker Hub emon6107/waafa-ota-platform
  ({service}-<sha7>, {service}-latest); VPS pulls; SITE_URL + Turnstile site key are build-time (GitHub variables,
  image labels checked by deploy.sh). D162 dependabot merges keep dependabot[bot] as author.
- D163 (#134) Google sign-in behind Integrations › Sign-in + Accounts live; API exchanges the code (secret stays in
  the API), opaque 30-day sessions hashed; My account by verified email; safeNext allows printable ASCII paths only.
- D164 (#147) real country flags: flag-icons 7.2.3 MIT SVGs in public/media/flags, CountryFlag (cva xs–lg, alt "",
  two-letter fallback); destinations/group fares take the country from the airport record.
- D165 (#146, supersedes #142) Log in shows words from 1280 px (icon 1024–1279), header tagline from 1440 px
  (LogoLockup taglineFrom="wide"); Accounts live default true in fixtures (new installs only; schema default false).
- D166 (#149) Google keys: Admin Integrations record wins; GOOGLE_CLIENT_ID/SECRET env fallback only when no record.
- D167 (#148) hero media clamp(480px,58vh,620px) from lg, 16:10 sm; FlightPath = dashed route + plane inside the sky.
- D168 (#156) airline logos: bundled square marks by IATA code (scripts/fetch-airline-logos.mjs), Airline.logo from
  Admin wins, code fallback; "We book", never partners. D169 (#157) hero: next group fare card over the route's
  departure dot (bottom calc(34.9%-12px)), flags in TextRotate marks, RibbonLine, masked static glows; glass only on
  the search card. D170 (#158) web mem cap 1g; deploy/bootstrap-server.sh for fresh Ubuntu.
- D171 (#164) server gets no code: deploy/server bundle from Docker Hub images; guards check it against deploy/compose.yml.
  D169 now without the hero fare card (#163).
- Header (#142, words now per D165): nav trigger px-1.5, xl:px-2;
  account Log out/Delete are POST route handlers with same-origin check (no server-action redirects into streaming pages).
- Structured data (#125): shared @ids from lib/seo/schemaIds.ts; CollectionPageJsonLd; data must mirror visible content
  (store ItemList follows the Best sellers row); never ratings/reviews.
- Gotchas: Radix radios need aria-labelledby; tabs need panels; import MotionKit files directly; PowerShell Move-Item
  treats [locale] as wildcard; Radix SelectValue empty on SSR; never use t.raw (placeholders via t(key,{x:"{x}"}));
  getByLabel is substring (use exact); e2e sign-ins need their own x-forwarded-for (5 per 15 min per address);
  Bash heredocs with quotes can break (write scripts with Write); "#123" in web code trips the hex guard.
- D172 Sample records (any record with its own page) are noindex,follow and out of sitemap.xml via lib/seo/indexing.ts
  isIndexable/recordRobots; Sample off in Admin = indexed again (#168).
- D173 Hero loop (SmartVideo preloadPoster) starts on first scroll/touch/pointer move/key so its frame never becomes LCP.
- D174 On demand: results-page search card (DeferredSearchCard), lead step 2, zod/libphonenumber (lazyResolver), corporate
  quote form; inlineCss and content-visibility rejected (slower FCP; axe target-size on off-screen links).
- D175 withSocial fits titles (60, "| Waafa" only if it fits) and descriptions (155) in code; Explore more links on pages
  with few links; Home h1 includes the brand eyebrow; Home JSON-LD alternateNames list all brand names (#173).
- D176 Visa route /visa (308 from /visa-services); live admin data changed only through one-time seed patches
  (`_seedPatches`, audited), never by re-seeding (#176).
- D177 Store prices hidden by default per product (`showPrice`); hidden prices blanked server-side (publicProduct),
  out of filters, sorts, JSON-LD and priceCart; Ask for price on WhatsApp (#178).
- D178 Visa price = admin range per type (`priceRange {min,max?}`): "৳a – ৳b" or "From ৳a"; fallback fee + charge (#179).
- D179 Extra office numbers = `contactSettings.extraPhones[]` after the main number; WhatsApp stays on the main (#181).
- D180 Every published record page is indexed whatever its Sample flag; only SEO › noindex hides one (#183, replaces D172).
- D181 Meta titles use search wording (air tickets, visa processing, tour packages, Dhaka); h1s keep board copy;
  /llms.txt lists links, never prices (#184).
- D182 Photos q65 (AVIF ≈ 41), logo q90, widths ≤ 2560, image cache 31 days, og:image via optimiser at 1200 px (#185).
- D183 Admin follows docs/design/ADMIN.md (epic #201); Admin* boards no longer the floor. D184 sidebar stays
  midnight-950. D185 status families (info, progress, success, warning, danger, neutral) + tokens sky-50/sky-700,
  success-700, warning-800, danger-700. D186 21st.dev picks (ADMIN.md §14). D187 SchemaEditor + blueprints (no fork),
  RHF for fixed forms, URLs /content/[key] + /website/home, /website/menus, /visa-applications, /settings/[section].

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
- Structured data (#125): shared @ids from lib/seo/schemaIds.ts; CollectionPageJsonLd; data must mirror visible content
  (store ItemList follows the Best sellers row); never ratings/reviews.
- Gotchas: Radix radios need aria-labelledby; tabs need panels; import MotionKit files directly; PowerShell Move-Item
  treats [locale] as wildcard; Radix SelectValue empty on SSR; never use t.raw (placeholders via t(key,{x:"{x}"}));
  getByLabel is substring (use exact); e2e sign-ins need their own x-forwarded-for (5 per 15 min per address);
  Bash heredocs with quotes can break (write scripts with Write); "#123" in web code trips the hex guard.

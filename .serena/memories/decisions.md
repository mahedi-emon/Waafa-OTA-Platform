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
- D188 shell on shadcn Sidebar (icon rail, Ctrl+B, sheet below 1024 px via hooks/use-mobile), Settings one door
  (/settings index; R9 sub-nav), badges/bell from GET /admin/inbox (30 s poll), Ctrl K from GET /admin/search.
  D189 role rules shared (packages/shared/helpers/access.ts). D190 scoped NextIntlClientProvider with nested paths
  (pickMessagePaths). D191 lead pending = "Waiting for customer", order processing = "Packing" (labels only).
- D192 CodeQL skipped while the repo is private (code scanning needs GHAS). D193 blueprints grouped by area
  (blueprints/<group>.ts + registry Record<ContentKey, Blueprint>). D194 blueprint words in messages, resolved on the
  server (ResolvedBlueprint prop). D195 list order owned by the list (#205). D196 dnd-kit classic after hydration +
  Move up/down. D197 21st.dev patterns rebuilt on primitives. D198 history follows renames; restore audited (either
  side). D199 Duplicate = hidden draft "(copy)". D200 interim photo field until R3. D201 sessions: 401 back to editors,
  sign in returns with the draft. D202 no zod in the browser (routes check), heavy widget parts load on first use.
  D203 picker options open to all staff only for shared PICKER_KEYS (12 lists); others need edit access. D204 canCopy:
  fixed/code lists can't be copied (API 409 noCopy, no button); product copies get new variant ids + SKUs; slug-keyed
  lists keep data.id unique (API 409 exists); priceCart/placeOrder read published products only.
- D205 CodeQL runs on every PR/push again (replaces D192): private repo keeps SARIF (upload never), scripts/
  codeql-findings.mjs fails on error/warning. D206 codeql-config paths-ignore for two dev download scripts.
- D207 (#193) dropzone (react-dropzone 20.1.2, uvain/file-upload pattern) and cropper (@origin-space/image-cropper
  0.1.9, originui/image-crop pattern) built in-house; uvain/file-upload is a paid marketplace item. D208 photo frames
  per field (FRAME in blueprints/common.ts; test fails a photo without one). D209 focal point stored on ImageSchema →
  object-position in SmartImage/SmartVideo. D210 crop = new library photo; Replace everywhere via normal saves, takes
  the new file's alt/credit, drops focal, keeps video format; delete only when unused. D211 videos MP4/WebM ≤50 MB on
  their own route (nginx 51m), stored as-is, byte ranges, poster from the clip at 1 s; uploads live OUTSIDE the Next
  proxy (it keeps only 10 MB of a body) at app/secure-admin-control/media/upload*, 401 not redirect. D212 words
  fieldNames.<owner>_<name> before fieldNames.<name> (video_credit).
- D213 (#213) security patches ship on their own PR before feature work: Next 16.4.2 (two critical RCE in 16.4.0;
  a vulnerable Next build now stops), sanitize-html 2.18.1, fastify 5.12.7 + pnpm override (pnpm-workspace.yaml) for
  the copy @nestjs/platform-fastify pins; drop the override when Nest ships the patch.

- D215–D226 (R4, 23 Oct): minute job in the API process with an advisory lock (SCHEDULER_INTERVAL_MS); API alone writes status/publishAt/liveSince from the editor button, restore keeps status; Trash = TrashItem table (30 days, Super Admin purge); SlugRedirect for ROUTED_KEYS, record pages call followMovedRecord before 404 (streamed redirect, static shell); draft preview waits for R7; contact buttons log the contact; Confirmed on call only for COD, proofs confirm prepaid; proofs auto-match, decided stays decided; coupon maxUses; booked group-fare lead takes seats; visa progress on Lead.progress; one overdue alert per lead.
- D227–D231 (R5, 24 Oct): saved views + hidden columns on the device (localStorage per list); INP bar checked on the 25-row page of 500 leads, 100-row page tracked in #219; checkbox indicator forceMount (Radix Presence forced style recalcs); list name links to editor, row opens the sheet; lead views and proof/feedback queues stay tabs above the table, other filters are table chips.
- D232–D242 (R6, 24 Oct): queues travel in the address and stay beside leads/orders from 1280 px (InboxSplit: one grid + own separator, D241); service tabs with open counts (counts=1) and Show chips (supersedes D231's lead part); board moves = shared leadStepForMove + the lead page's LeadStepDialog, dnd-kit mouse+touch sensors in the board chunk, Move to…; 21st.dev diceui/kanban install failed in the shadcn CLI and burned the retrievals (D235); /visa-applications stage per lead from its country checklist (newest 2,000); contact buttons everywhere log the contact; client reply timer; phone bottom bar; customer card by phone and role; review fixes D242.
- D243–D250 (R7, 24 Oct): framing = public pages frame-ancestors 'self'/SAMEORIGIN for everyone, admin paths
  frame-ancestors 'none' + frame-src 'self' (later headers() rule wins; the cookie-conditional variant was dropped);
  hint `waafa_staff` set at sign-in (expiry only with Keep me signed in) and backfilled by the proxy. Proxy ends a
  stale preview (bypass cookie without refresh/access cookie). Saves call updateTag on all data tags (D249).
  #222: NotificationService.idle() + afterEach in public.test (D250). Website › Home page (homeSections + homeContent.hero, sheets with an iframe preview scrolled
  via data-edit marks, standard words as placeholders). Website › Menus (ten flat menus grouped Header/Phone/Footer,
  save at once, Undo on Remove, tab bar fixed and always shown). One LinkPicker for every href (cmdk with wordFilter,
  popover as wide as the field). Draft preview in the web only: draft mode → readSnapshot fresh + previewDrafts (2 s
  shared read), /secure-admin-control/preview + /api/preview/exit, previewPath blocks admin/API/other sites. Staff tools
  behind the hint via next/dynamic, words + links from /secure-admin-control/api/staff-tools (session + role checked).
- D251–D253 (R8, 25 Oct): purpose-built editors are blueprint data (section order, layout "writing", startWith,
  bulkPhotos, auto lowestPrice/itineraryDays/initialsFromName), never forks; variants as a matrix of option values
  with "Variant shown first" by radio and stray variants listed with Remove; Optional chip aria-hidden + sr-only
  " (optional)"; empty-group Add names its group.
- D254 (#225): record pages read with adminFind (null on 404) and render AdminNotFound in place; adminGet 404 →
  notFound() + (panel)/not-found.tsx (a notFound thrown inside a streamed Suspense logs React #419).
- D255–D261 (R9, 25 Oct): SETTINGS_SECTIONS + /settings/[section] (embedded editor, split documents by blueprint
  section, old /content/<setting> redirect, screens keep addresses inside SettingsFrame); setup checklist computed
  (setupSteps; Search Console = site code or tracking token; Turnstile from web env, managers); invite by email
  (sha256 token 7 days, POST /auth/invite 5/15 min, welcome page; reset password closes invite); audit sentences
  (auditText, AUDIT_AREAS prefixes, Dhaka days); template Insert + preview (variables keep); Excel via own xlsx
  writer; dashboard charts server SVG, AdminPanel id names its section.
- D266–D269 (#231, 25 Oct): CI quick set for PRs (smoke e2e only), full suite on main/nightly/`full-ci` label (required
  for schema, deploy/, API Dockerfile, sign-in, payments, checkout, lead intake; label re-runs CI via full-ci-label.yml,
  labels read live); CodeQL job inside ci.yml; VPS smoke not on main pushes (Docker images covers it). API image =
  esbuild bundle (apps/api/scripts/build.mjs; @waafa/* + tsx are devDeps; dist/main|worker|seed.js; tsx stand-in for
  the old worker command one release); Docker Hub keeps 15 releases. Phase D order D268 (#232 files, #233, A, B, C, D,
  E, F, J, K, G, H, I, L, M). Markup → Phase E; no staging VPS (D269).
- D270–D283 (Step 0 + letter A, 26 Oct): see TRACKER (customer files, staff alerts by area, AdminDateRange, fixed lists
  no Trash, phones typed once, budget counts referenced scripts D282, no row transitions/overlay blur + INP e2e trace
  off D283).
- D284–D289 (#234, 26 Oct): TOTP on node:crypto (RFC 6238, sealed with key from JWT_SECRET, last step stored = no
  replay); Super Admin/Admin must enrol before a session, refresh signs them out without it; 10 recovery codes (hashes);
  wrong codes share the 5-try lockout; trusted device 30 days via httpOnly device cookie; history kept 1 year;
  new-device email only after a first known device; API rate limits in Redis (hashed keys, process fallback, never off)
  + 10/h per phone, RATE_LIMIT_FACTOR for e2e only; QR drawn server-side with uqr; e2e setup project trusts the seed
  Super Admin's browser.
- D290 (#234 review): locks double within a day (cap 24 h), code-step lock emails the person (staff-code-locked),
  enrol claims totpEnabledAt atomically, two-step cookie path "/", focus to each step heading.
- D291–D292 (#235): worker scans unscanned customer files every 10 s with clamd (INSTREAM, no dependency); with
  CLAMAV_URL staff open only clean files, hits → quarantine/ + infected + audit; ClamAV 1.5.4 (1.6 GB limit, clamdata
  volume), VPS minimum 8 GB.
- D293–D298 (#236, 26 Oct): ui radio-group/checkbox/switch/tabs = native inputs/buttons behind the shadcn API (tick =
  `checkbox-tick` CSS mask, tabs set data-active); next-intl `precompile: true` (no empty plural branches — unit test;
  no t.raw); overlays + second steps load on use (PreferencesSheet, LazyDialog, next/dynamic steps, checkout form after
  hydration), ContactStep without RHF; useSubmitOnce (ref) for every submit with an idempotency key; client-boundary
  guard (no LocalLink/next-intl/server/server-only/next/headers in client graphs; in pnpm guards + CI Guards);
  Lighthouse: budgets (a11y/BP/SEO 95, CLS 0.1) fail CI, targets (perf 90, LCP 2.5 s, TBT 200) warn until #271.
  Page-level Suspense fallbacks are min-h-dvh (footer jump = CLS). Supersedes D154/D174 on message precompile.
  D299: record detail pages KEEP their Suspense (API-mode snapshot reads draftMode = request data; without it new or
  moved records 500 "uncached or runtime data during prerendering"; fixture mode hides this — only API-mode e2e catches it).
- D262–D265 (R10, 25 Oct): lists named by headingOf, columns only with data; banner/deal/announcement editor states
  startsLater/ended + group fares endingSoon (<= 7 days); system editors in words (editorName); sentence-case admin
  chrome, Table scrollLabel → named focusable region, tab rows wrap or fade.
- D300–D302 (27 Oct): owner order (accounts first), email code sign-in (no SMS), My account (offers opt-in, passport
  sealed, optional password). See TRACKER.
- D303 (28 Oct): owner's order replaces D300: finish all P0/P1; no deploys until ONE release (docs/RELEASE.md
  cumulative, deploy/LIVE_RELEASE + scripts/upgrade-rehearsal.sh in the VPS smoke and Docker images workflow);
  integration hub before D/E; checkpoints with local screenshot paths; docs/qa/UAT.md; docs/qa/SUMMARY.md.
- D304 (#284): every outside service = provider card (kinds captcha, analytics, monitoring, storage, alerts,
  courier); site reads only catalog `publicFields` via GET /public/integrations/status in a cached accessor (hours,
  seconds when API down) expired by saves (tag `integrations`); Turnstile verified in the API; reveal removed (last 4
  only); liveOnly cards; failing last test = not used; Settings › Tracking + verification fields retired (blueprint
  `retired`); seed patch 2026-10-28-integration-cards. Supersedes D161's Turnstile build-time key and D155's reveal.
- D305 (#237): UTM/referrer/landing remembered by the proxy in httpOnly cookie waafa_src (no client JS; UTM replaces,
  referrer only fills, own host = SITE_URL); lead/order routes add it; Order.source JSONB; conversions via track() →
  EventBridge mounted only inside consented scripts (dataLayer + gtag beacon + Pixel, once per reference); Reports
  "Where leads come from" (admin/leadSources.ts). Sitemap split + share images → #287.
- axe 4.14 (label-content-name-mismatch): a link's aria-label must contain its visible words (#283 logo, #288 ask-for-price).

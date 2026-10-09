# WAAFA OTA Platform — tracker

| | |
| --- | --- |
| **Current phase** | A · Frontend |
| **Current issue** | A2 [#2](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/2) (A1 done) |
| **Last updated** | 2026-10-09 06:26 (Asia/Dhaka) |
| **Overall progress** | Launch scope (A–C): 1 / 39 · all phases: 1 / 56 |
| **Days left to launch** | 4 (go-live Tue 13 Oct 2026; hard deadline before 14 Oct) |

Legend: ⬜ todo · 🟡 in progress · ✅ done · ⛔ blocked. Update this file after every issue (CLAUDE.md, Workflow step 11).

## Tooling

| Tool | Kind | Status | Last tested | Result / notes |
| --- | --- | --- | --- | --- |
| serena | MCP | ✅ | 2026-10-09 | Project `Waafa-OTA-Platform` active (TypeScript LS); `list_memories` → 4 memories |
| context7 | MCP | ✅ | 2026-10-09 | `resolve-library-id "Next.js"` → `/vercel/next.js` (versions up to v16.2.9 indexed) |
| shadcn | MCP | ✅ | 2026-10-09 | `list_items_in_registries @shadcn` → 61 ui items |
| playwright | MCP | ✅ | 2026-10-09 | Opened https://example.com, screenshot saved (`.playwright-mcp/`, gitignored) |
| magic (21st.dev) | MCP | ✅ | 2026-10-09 | `search "flight search card"` → 5 components (ravikatiyar162/flight-search, …) |
| github | MCP | ✅ | 2026-10-09 | `get_me` → mahedi-emon |
| figma | MCP | ⬜ | — | Not needed for Phase A; needs OAuth via `/mcp` |
| gh CLI | CLI | ✅ | 2026-10-09 | 2.102.0, logged in as mahedi-emon, scopes gist, project, read:org, repo, workflow. Not on PATH by default (see CLAUDE.md) |
| Node / pnpm | Runtime | ✅ | 2026-10-09 | Node 25.2.1 active (≥ 20.9; 22.11.0 also installed via nvm4w); pnpm 12.10.1 global; corepack not bundled with Node 25 |
| Python / uvx | Runtime | ✅ | 2026-10-09 | Python 3.12.6 (UI UX Pro Max scripts), uvx 0.12.24 (Serena) |
| frontend-design | Skill | ✅ | 2026-10-09 | Loaded |
| design-taste-frontend (taste) | Skill | ✅ | 2026-10-09 | Loaded; PRD overrides its Inter/lucide/dark-mode defaults (Decision D6) |
| ui-ux-pro-max | Skill | ✅ | 2026-10-09 | Loaded; design-system query "premium OTA travel booking + e-commerce, Bangladesh, mobile-first" run, kept for A1 |
| web-interface-guidelines.md | Reference | ✅ | 2026-10-09 | `docs/design/web-interface-guidelines.md` present |
| awesome-design-md format | Reference | ✅ | 2026-10-09 | `docs/design/design-md-format.md` present |
| Lighthouse | CLI | ✅ | 2026-10-09 | `npx -y lighthouse@13.5.0` with local Chrome 155 (headless); 12 runs for the benchmark |

## Phase checklists

### A · Frontend (milestone 1, due 11 Oct)
| | Issue | Title | Size |
| --- | --- | --- | --- |
| ✅ | [#1](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/1) | A1 · Design direction and competitor benchmark (docs only) | M |
| ⬜ | [#2](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/2) | A2 · Foundation: monorepo, Next.js app, tokens, fonts, i18n, test tooling | L |
| ⬜ | [#3](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/3) | A3 · Design system in code + /styleguide | L |
| ⬜ | [#4](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/4) | A4 · Data layer and content model (shared zod contracts + fixtures) | XL |
| ⬜ | [#5](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/5) | A5 · Media: real photos with credits, video loops and posters | S |
| ⬜ | [#6](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/6) | A6 · Layout shell: header, mega panels, tab bar, drawer, footer, WhatsApp, loader | L |
| ⬜ | [#7](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/7) | A7 · Home: 13 sections from data, video hero with word reveal | L |
| ⬜ | [#8](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/8) | A8 · Unified search card and pickers | XL |
| ⬜ | [#9](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/9) | A9 · Results shell + Flights Manual mode + group fares | L |
| ⬜ | [#10](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/10) | A10 · Hotels Manual mode | S |
| ⬜ | [#11](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/11) | A11 · Tour packages (list, detail, query) + Plan My Trip | XL |
| ⬜ | [#12](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/12) | A12 · Visa services (list, country, apply) + Visa Guide | L |
| ⬜ | [#13](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/13) | A13 · Waafas World catalogue: store home, listing, product, finder, search | XL |
| ⬜ | [#14](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/14) | A14 · Shop cart, checkout (COD + offline payment), order success, track order | L |
| ⬜ | [#15](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/15) | A15 · Printing Solutions and International Trading | M |
| ⬜ | [#16](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/16) | A16 · Gallery, Feedback, team, About, Contact, FAQs, Blog, policies, Baggage, EMI, Offline Payment | XL |
| ⬜ | [#17](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/17) | A17 · 404, 500, offline, maintenance + Live-mode (P2) bodies on fixtures | L |
| ⬜ | [#18](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/18) | A18 · Admin: shell, sign-in, dashboard, leads, search activity, bookings | XL |
| ⬜ | [#19](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/19) | A19 · Admin catalogue: group fares, packages, visa, shop | XL |
| ⬜ | [#20](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/20) | A20 · Admin content: pages, blog, FAQs, banners, home order, menus, media, SEO | XL |
| ⬜ | [#21](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/21) | A21 · Admin customers, marketing, reports, users and roles, settings | L |
| ⬜ | [#22](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/22) | A22 · Frontend QA and polish against the benchmark | L |

### B · Backend (milestone 2, due 12 Oct) — issues opened when Phase A closes
| | Item |
| --- | --- |
| ⬜ | B1 · API foundation: NestJS on Fastify, config, `/health` `/ready`, RFC 7807, request IDs, OpenAPI, docker-compose (Postgres, Redis, Mailpit) |
| ⬜ | B2 · Prisma schema from the shared contracts, migrations, seed from `fixtures/` |
| ⬜ | B3 · Auth and roles: argon2id, JWT + rotating refresh cookies, role guards, login rate limit + lockout, audit log |
| ⬜ | B4 · Settings + public config (Golden Switch, 60 s cache, `config` tag revalidation) |
| ⬜ | B5 · Leads + search logs: idempotency keys, Turnstile verification, Redis rate limits, duplicate guard, BullMQ email alerts |
| ⬜ | B6 · Travel: airports, group fares (auto-expiry), packages, provider adapters (Manual + contract-tested stubs) |
| ⬜ | B7 · Visa: countries, types, applications, private R2 documents with 10-minute signed links, retention job, download audit |
| ⬜ | B8 · Shop: catalogue, variants, attribute sets, collections, compatibility CSV, cart, orders, stock, coupons, shipping zones |
| ⬜ | B9 · CMS: pages, blog, FAQs, banners, menus, gallery, feedback moderation, team, media (R2), SEO fields, sanitised rich text |
| ⬜ | B10 · Notifications (templates, queue, retries, delivery log), customers, reports |
| ⬜ | B11 · API tests: Supertest, provider contract tests, k6 load scripts |

### C · Integration & Launch (milestone 3, due 13 Oct)
| | Item |
| --- | --- |
| ⬜ | C1 · API repositories replace fixtures behind the same interfaces (no UI change) |
| ⬜ | C2 · Admin wired to the API with optimistic updates and audit trail |
| ⬜ | C3 · SEO and analytics: sitemaps, robots, OG images, JSON-LD audit, GA4/GTM/Pixel after consent, Search Console |
| ⬜ | C4 · Security: nonce CSP and headers, Turnstile live, rate limits verified, secrets in env only |
| ⬜ | C5 · Full e2e + Lighthouse CI + axe + k6 on staging; owner sign-off on 12 Oct |
| ⬜ | C6 · Production deploy (Vercel + API Docker), Sentry, uptime monitor, backups |

### D · P1 completion (milestone 4, due 13 Nov)
| | Item |
| --- | --- |
| ⬜ | D1 · Customer accounts (phone OTP, Google), My account, `/track`, guest-to-account linking |
| ⬜ | D2 · Bangla (bn) with a Bengali web font |
| ⬜ | D3 · SSLCommerz and bKash online payment (shop first) |
| ⬜ | D4 · SMS gateway adapter, real-time admin alerts with sound, Telegram alert, 2FA (TOTP) |
| ⬜ | D5 · Quote builder, lead kanban, reminders, round-robin assignment, scheduled reports |
| ⬜ | D6 · Reviews (packages, products) with moderation, wishlist, campaign pages with countdowns, flash sales |
| ⬜ | D7 · EMI calculator, courier APIs (Steadfast, Pathao, RedX), partial lead capture, curated hotels |

### E · Live booking (milestone 5)
| | Item |
| --- | --- |
| ⬜ | E1 · First two flight provider APIs: search, revalidate, book (PNR), ticket, e-ticket PDF |
| ⬜ | E2 · Hotel API booking and vouchers |
| ⬜ | E3 · Instant package booking with advance or full payment |
| ⬜ | E4 · Pricing engine, circuit breaker and kill switch |
| ⬜ | E5 · Booking operations: refunds, reissues, reconciliation |

## Route ↔ screen matrix

| Route | Screens | Issue | 320 | 390 | 768 | 1440 | Tests | Lighthouse (P/A/SEO) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Home, Home-t, Home-m, Home-help, Home-mfull, Home-mfull2, Home-lower, Home-m-drawer, Home-m-more, Home-shopmenu, Home-moremenu | #7 (#6, #8) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/flights` | Flights, Flights-2, Flights-done, Flights-err, Flights-edit, FlightsFare, Flights-m-*, Pick-* | #9 (#8) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/flights` Live (P2, fixtures) | FlightsLive, -offer, -loading, -nomatch, -book, -pay, -price, -done, -m-* | #17 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/flights/group-fares` | GroupFares, GroupFares-empty, GroupFares-m, GroupFares-m-empty | #9 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/hotels` | Hotels, Hotels-2, Hotels-done, Hotels-m-* | #10 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/hotels` Live (P2, fixtures) | HotelsLive, -map, -detail, -book, -done, -m-* | #17 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/tour-packages` | Packages, Packages-empty, Packages-m, Packages-m-filters | #11 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/tour-packages/[slug]` | PackageDetail, -photos, -query, -done, PackageDetail-m-* | #11 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/plan-my-trip` | PlanTrip, PlanTrip-4, PlanTrip-done, PlanTrip-m-* | #11 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/visa-services` | Visa, Visa-none, Visa-m | #12 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/visa-services/[country]` | VisaCountry, -medical, VisaApply, -2, -3, -4, -err, -done, -m-* | #12 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/visa-guide`, `/visa-guide/[country]` | VisaGuide, VisaGuidePost (+ -m) | #12 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop` | Shop, Shop-m, Shop-mega, Shop-suggest, Shop-bulk | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/c/[slug]`, brand, collection, deals | ShopList, -printers, -empty, -m, -m-filters, -m-fashion, ShopCats, ShopDeals | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/p/[slug]` | ShopProduct, -pb, -hp, -toner, -video, -bulk, -m-* | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/finder`, `/shop/search` | ShopFinder, -part, -none, ShopSearch | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/cart` → checkout → order | Shop-mini, ShopCart, -empty, -coupon, ShopCheckout, -err, ShopDone, -bank | #14 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/track` | ShopTrack, -nf, -delivered | #14 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| Printing Solutions, International Trading | Printing, Printing-done, Trading, Trading-done (+ -m) | #15 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/gallery`, `/gallery/[album]` | Gallery, Gallery-album, Gallery-photo (+ -m) | #16 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/feedback` | Feedback, Feedback-sent, Feedback-m | #16 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| More pages | About, Contact, Faqs, Blog, BlogPost, Refund, Privacy, Terms, Baggage, Emi, OfflinePay (+ -m, -sent) | #16 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 404, 500, offline, maintenance | Error, Error500, Offline, Maintenance, States (+ -m) | #17 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/admin/login` | AdminLogin, -error, -locked, -totp, AdminLogin-m | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` shell + dashboard | AdminSide, AdminTop, AdminNav-m, AdminCmd, AdminDash, AdminDash-m | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin/leads`, `/admin/leads/[ref]` | AdminLeads, -bulk, -board, -m, AdminLead, -convert, -lost, -m | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin/search`, `/admin/bookings` | AdminSearch, AdminBookings, -open | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` catalogue | AdminGroupFares, -new, AdminPackages, AdminPackage, AdminVisa, AdminProducts, AdminProduct, -toner, AdminCats, AdminCollections, AdminCoupons, AdminOrders, -open, -m | #19 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` content | AdminPages, AdminHome, AdminTeam, AdminGallery, AdminMedia, AdminFeedback | #20 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` customers, reports, users, settings | AdminCustomers, -open, AdminReports, AdminUsers, AdminGeneral, AdminModes, -confirm, AdminFooter, AdminPayments, AdminNotify | #21 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/styleguide` (dev only) | Brand, Tokens, Components, Components2, MotionKit, PCard, States | #3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/track`, `/login`, `/account` (P1) | Track, Track-nf, Login, Login-otp, Login-err, Account | D1 | — | — | — | — | — | — |

## Admin-control matrix

Every public element → the data field it reads → the admin screen that edits it → the API endpoint (filled in Phase B).
Rows are added by each issue; an issue is not done until its rows are here.

| Public element | Data field (repository → field) | Admin screen | API endpoint |
| --- | --- | --- | --- |
| _rows added from A4 onward_ | | | |

## Components inventory

| Component | Path | Source (shadcn / 21st.dev id / custom) | Used on |
| --- | --- | --- | --- |
| MotionProvider | `apps/web/src/components/motion/` | custom (LazyMotion + MotionConfig) | root layout |

## Benchmark (Lighthouse mobile)

Lighthouse 13.5.0 mobile (simulated Slow 4G, 4× CPU), median of 3 runs, 9 Oct 2026. Perf / A11y / Best practices / SEO · LCP.

| Page | gozayaan.com | sharetrip.net | akijair.com | obokash.com | Waafa (target / actual) |
| --- | --- | --- | --- | --- | --- |
| Home | 26 / 76 / 50 / 92 · 24.4 s | 1 / 72 / 73 / 100 · 29.2 s | 27 / 79 / 69 / 92 · 25.4 s | 35 / 88 / 54 / 92 · 12.5 s | ≥ 90 / ≥ 95 / ≥ 95 / 100 · ≤ 2.5 s / — |

Detail, weights and the area-by-area review: `docs/design/COMPETITOR_BENCHMARK.md`.

## Session log (newest first)

### 2026-10-09 06:26 (Asia/Dhaka) — A1 design direction and benchmark (#1)
- Playwright pass over the four competitors at 390 and 1440 px, live DAC → CXB search on GoZayaan, ShareTrip Shop at 390.
- Lighthouse mobile ×3 on each home page (best of four: Perf 35, A11y 88, BP 73, SEO 100, LCP 12.5 s).
- Wrote `docs/design/COMPETITOR_BENCHMARK.md`, `docs/design/DESIGN.md` (awesome-design-md format), `docs/design/MOTION.md`.
- Decisions D8-D11 logged. No code changed.

### 2026-10-09 06:10 (Asia/Dhaka) — Step 0 setup and tool check
- Serena activated and instructions read; memories listed. Environment checked (Node 25.2.1, pnpm 12.10.1, gh 2.102.0 with project scope).
- Tools tested: serena, context7, shadcn, playwright, magic, github MCPs; skills frontend-design, design-taste-frontend, ui-ux-pro-max (design-system query run).
- `.claude/settings.json`: `attribution` commit/pr empty, `sessionUrl` false. Baseline commit `03b47a4` pushed (no trailer, verified with `git log -1 --format=%B`).
- CLAUDE.md rewritten (Workflow, Component rules, Admin control, Quality gates, dependency rule replaced).
- GitHub: 17 labels, 5 milestones, issues #1–#22 (A1–A22) on Project #4 with Status Ready, Priority P0 and Size.

## Decisions

| # | Date | Decision | Why |
| --- | --- | --- | --- |
| D1 | 2026-10-09 | Project Status "Todo" maps to the existing **Ready** option | Project #4 has Backlog/Ready/In progress/In review/Done and no Todo; its schema is left untouched |
| D2 | 2026-10-09 | `.claude/settings.json` uses `attribution` (`commit: ""`, `pr: ""`, `sessionUrl: false`), not `includeCoAuthoredBy` | Settings reference marks `includeCoAuthoredBy` deprecated since v2.0.62 |
| D3 | 2026-10-09 | Local Node 25.2.1 kept; CI runs Node 22 LTS; pnpm pinned via `packageManager` | Meets "at least 20.9" without switching the machine-wide nvm4w link; corepack is not bundled with Node 25 |
| D4 | 2026-10-09 | Labels use `type:`, `area:`, `priority:` prefixes; GitHub default labels kept | Clear grouping; nothing deleted |
| D5 | 2026-10-09 | Milestone due dates follow the PRD gantt: A 11 Oct, B 12 Oct, C 13 Oct, D 13 Nov, E open | PRD §5 launch week |
| D6 | 2026-10-09 | PRD wins over skill defaults: Plus Jakarta Sans + Inter, lucide-react, light-only public site | Skills (taste) discourage Inter/lucide and push dark mode; PRD §15–16 decides |
| D7 | 2026-10-09 | shadcn primitives keep CLI file names in `components/ui`; all other components use PascalCase files | `shadcn add` and diffs keep working; custom code follows the PascalCase rule |
| D8 | 2026-10-09 | `--primary` = electric-600 #0053D7 (brand-700 #003FBE for hover and links), `--ring` = electric-600 | PRD §16 and the prototype's `.w-btn-primary` use electric-600; `tokens.css` maps `--primary` to brand-700, the outlier |
| D9 | 2026-10-09 | Logo in full colour on white or mist-50 only; footer is light (mist-50); no white/silver/dark logo versions | Brand board and CLAUDE.md "never recolour" win over the PRD's "white logo on dark"; the prototype's final footer is mist-50 |
| D10 | 2026-10-09 | Header 64 px phone, 72 px desktop | PRD FR-GLB-01 (the prototype uses 76 px on desktop) |
| D11 | 2026-10-09 | Above-the-fold motion is CSS (no hydration wait); blur-in, spotlight, skeleton and chart effects rebuilt with transform/opacity | MOTION.md §5 and §7: LCP and the transform/opacity rule |

## Known issues and bugs
_None yet._

## Cut list (if time runs out, in this order — PRD §17)
1. Gallery video embeds
2. Blog extras (related posts, contents list)
3. Part-code search in Find by model

## Blockers and owner questions (PRD §17)
- [ ] Production domain (the email uses waafasworld.com)
- [ ] Office floor: Facebook says 4th floor, trade licence says 5th; which goes on the site? (site uses 4th until answered)
- [ ] Hotline and WhatsApp numbers (office hours confirmed: Saturday to Thursday, 10 am to 6 pm)
- [ ] Waafas World: launch categories and product list with prices, stock and photos; delivery areas and charges; cash-on-delivery limit
- [ ] Offline payment accounts to publish (bank, bKash, Nagad)
- [ ] Launch content: packages, visa countries with fees and processing times, group fares
- [ ] Refund, privacy and terms text, or approval of drafts
- [ ] Logo vector files (SVG or AI) — the header uses an SVG traced from the PNG until then
- [ ] Staff names and roles for admin accounts; team members who agree to appear on the site
- [ ] SSLCommerz merchant account status
- [ ] Email provider for info@ and DNS access for the sending domain
- [ ] Hosting accounts: Vercel, VPS or Railway, Cloudflare (Turnstile, R2)

## Next steps
1. A2 (#2): monorepo foundation and CI green.
2. A3 → A22 in order.

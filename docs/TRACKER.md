# WAAFA — Build Tracker
Updated: 09 Oct 20:56 Asia/Dhaka · Phase: A · Frontend · Current: #6 · A6 Layout shell (A5 #5 and A1b #34 in parallel) · Progress: 5/24 issues (21%) · Launch: 13 Oct 2026, 4 days left · Status: Behind by 3 issues (a 90-minute usage-limit pause today; cuts proposed in section 10)

Legend: ⬜ Todo · 🟡 In progress · ✅ Done · ⛔ Blocked. Phase A counts A0–A22 plus A1b (24 issues).

## 0. Audit (first session)

Step 0 of the v4 master prompt (`docs/claude-code-prompts.md`, PROMPT 1), run on 9 Oct 16:30–17:00. Full notes:
Serena memory `audit_findings`.

| Area | Found | Verdict | Belongs to |
| --- | --- | --- | --- |
| Git identity | `Mahedi Hasan Emon <mahedi.emon62@gmail.com>` | ✅ owner | — |
| History on origin | 13 commits, all authored by the owner (6 with the Gmail address, 7 squash merges with the GitHub noreply address and "GitHub" as committer); no co-author trailer, no AI attribution | ✅ nothing to rewrite | — |
| main | A1–A4 merged (PRs #23–#26): monorepo, Next 16.4, design system, MotionKit, data layer | ✅ keep | — |
| Earlier-session work in progress | A5 media on `feat/5-media` (now committed there as WIP, copy in `stash@{0}`): 31 Unsplash photos, 3 Better Day product shots, `VideoSchema`, `MediaSlot`, credit URLs | ✅ keep photos and contracts | #5 |
| Drawn loops | A5 WIP shipped the prototype's drawn motion graphics (route map, passport, headphones, power bank) and a pan over a product still | ❌ breaks "real media only" | #5 replaces with real footage |
| Rules files | CLAUDE.md (v3), HANDOFF kick-off prompt with "Ask before adding a dependency" and a broken code fence, PRD with the "Shop" tab and a W-mark store header | ❌ superseded | #27 (fixed) |
| Copy | A FAQ answer mentioned recruitment | ❌ Phase F copy | #27 (reworded) |
| Guards | No guards script, hooks, commitlint, attribution check, CodeQL, Dependabot, PR template or issue forms | ❌ missing | #27 (added) |
| Hex colours | Styleguide swatch list and `themeColor` outside `components/brand` | ❌ | #27 (moved to `components/brand/brandColors.ts`) |
| GitHub settings | Merge commits and rebase allowed, branches kept after merge, no branch protection | ❌ | #27 (squash-only; protection) |
| Secrets | `.mcp.json` uses env references only; `.claude/settings.local.json` (gitignored) holds the 21st.dev key and a GitHub PAT; no `.env` files | ✅ | — |
| A1 docs vs v4 | MOTION.md has no signature moments or beat list; ui-ux-pro-max design system not persisted; no inner-page Lighthouse | ⚠️ gap | #34 (A1b) |
| Machine | Node 25.2.1 (22.11 installed), pnpm 12.10.1, Python 3.12, Docker Desktop; ffmpeg and Vercel CLI missing; about 1–2 GB free memory | ⚠️ | owner actions; one build at a time |

## 1. Overview

| Phase | Milestone | Issues | Done | In progress | Blocked | Progress |
| --- | --- | --- | --- | --- | --- | --- |
| A · Frontend | 11 Oct · epic #28 | 24 (A0, A1–A22, A1b) | 5 | 3 (#6, #5, #34) | 0 | 21% |
| B · Backend | 12 Oct · epic #29 | opened with PROMPT 3 | 0 | 0 | 0 | 0% |
| C · Integration & Launch | 13 Oct · epic #30 | opened with PROMPT 4 | 0 | 0 | 0 | 0% |
| D · P1 completion | 13 Nov · epic #31 | opened with PROMPT 5 | 0 | 0 | 0 | 0% |
| E · Live booking | — · epic #32 | waits for a provider contract | 0 | 0 | — | 0% |
| F · Licensed modules | — · epic #33 | waits for the licences | 0 | 0 | — | 0% |

## 2. Issue log

### #27 · A0 Project setup: rules, tracker, guards, hooks and CI — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 16:52 → 09 Oct 17:47 |
| Branch · PR · merge | `chore/27-project-setup` · #35 · `20614bd` |
| Built | v4 tracker; CLAUDE.md, README, HANDOFF and PRD corrections; guards, husky + commitlint + attribution hook; CI (guards, attribution, path filters, caches), CodeQL, Dependabot, PR template, issue forms; deny rules; GitHub labels, milestone F, epics, sub-issues, Project fields, squash-only merges |
| Files and components | `CLAUDE.md`, `README.md`, `docs/TRACKER.md`, `docs/PRD.md`, `docs/design/handoff/HANDOFF.md`, `.claude/settings.json`, `.husky/*`, `commitlint.config.mjs`, `lint-staged.config.mjs`, `scripts/guards.mjs`, `scripts/check-attribution.mjs`, `.github/**`, `components/brand/brandColors.ts` |
| Screens matched | — |
| Admin control | — |
| Tests | unit +19 (brand colours vs globals.css) · guards negative test · hook rejects a co-author trailer |
| Widths checked | — (no UI change; styleguide swatches render from `brandColors.ts`) |
| Tools and skills | Serena, Context7 (Next.js 16, husky), shadcn MCP, magic MCP, Playwright MCP, GitHub MCP + gh; skills ui-ux-pro-max, design-taste-frontend, frontend-design, design-superpowers:design-review (tool check) |
| Decisions | D36–D45 |
| Bugs and follow-ups | #34 (A1b addendum) |

### #6 · A6 Layout shell: header, mega panels, tab bar, drawer, footer, WhatsApp, loader — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 06:03 → 09 Oct 21:03 |
| Branch · PR · merge | `feat/6-layout-shell` · #36 · `3723d68` |
| Built | Sticky header (CSS scroll-timeline solidify, 64/72 px), desktop nav with the Waafas World mega panel and the More panel, help popover and phone help sheet with live office status and copy buttons, full-screen phone drawer, five-tab bar with the raised W disc and a sliding indicator, More sheet above the tab bar, data-driven footer (accordions on phones, live payment methods only, newsletter, code-rendered developer credit), dismissible announcement, floating WhatsApp that names the page, breadcrumbs with JSON-LD, route loader |
| Files and components | `apps/web/src/components/layout/*` (SiteHeader, DesktopNav, ShopMegaPanel, MorePanel, HelpMenu, HelpPanel, ContactRow, CopyButton, OfficeStatusChip, useOfficeStatus, MobileMenu, MobileMenuBody, MoreGrid, MoreSheetBody, TabBar, CurrentMarker, WithPathname, isActivePath, SiteFooter, FooterAccordion, NewsletterForm, DeveloperCredit, AnnouncementBar, AnnouncementShell, FloatingWhatsApp, Breadcrumbs), `components/icons/MenuIcon.tsx`, `components/seo/JsonLd.tsx`, `lib/currentYear.ts`, `lib/siteUrl.ts`, `app/[locale]/(site)/{layout,loading}.tsx`, restyled `components/ui/navigation-menu.tsx` |
| Screens matched | Header, Home-shopmenu, Home-moremenu, Home-help, Home-m, Home-m-drawer, Home-m-more, Home-m-help, Footer, TabBar |
| Admin control | AC-57 to AC-63 (new); AC-01 to AC-16 used |
| Tests | unit +3 (isActivePath) · e2e 30 (13 new layout tests: panels by keyboard, help, drawer focus return, More sheet, tab bar, announcement memory, WhatsApp message, newsletter, footer credit; smoke and styleguide now include 1024) · axe pass with panels and sheets open · Lighthouse — (A7 adds lighthouserc) |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | Serena, Context7 (Next 16 Cache Components, Partial Prefetching, next/script), Playwright MCP (prototype boards side by side), shadcn NavigationMenu, Sheet, Drawer, Popover, Accordion; ui-ux-pro-max pre-delivery checklist, design-taste-frontend, frontend-design, design-superpowers design-review (self-review: no P0 or P1) |
| Decisions | D46–D53 |
| Bugs and follow-ups | Fixed in-issue: nav overflow at 1024 (tagline from 1280), panel width and centring, footer logo images shrinking, status chip overflow at 1024, nav re-mount losing focus after hydration |

### #34 · A1b v4 addendum: signature moments, beat list, persisted design system, inner-page benchmark — 🟡 In progress
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct → — |
| Branch · PR · merge | `docs/34-v4-addendum` (pushed) · — · — |
| Built | MOTION.md §8 signature moments and §9 beat list; reconciled UI UX Pro Max system in `docs/design/design-system/waafa`; DESIGN.md deviation log. Pending: inner-page Lighthouse |
| Files and components | `docs/design/MOTION.md`, `docs/design/DESIGN.md`, `docs/design/COMPETITOR_BENCHMARK.md`, `docs/design/design-system/waafa/*` |
| Screens matched | Motion board |
| Admin control | — |
| Tests | — |
| Widths checked | — |
| Tools and skills | — |
| Decisions | — |
| Bugs and follow-ups | — |

### #5 · A5 Media: real photos with credits, video loops and posters — 🟡 In review
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 06:03 → — |
| Branch · PR · merge | `feat/5-media` · — · — |
| Built | 31 Unsplash photos and 3 Better Day product shots with sizes and linked credits; six real clips (Mixkit, Pexels) for the home hero, two package previews, the visa and trading headers and the sample headphones, each with 720 px phone files and a first-frame WebP poster; `VideoSchema` (phone sources, credit), `MediaSlot` contract with repository, cached accessor and `media` cache tag; SmartVideo picks the phone files under 768 px; the prototype's drawn loops removed |
| Files and components | `apps/web/public/media/{photos,products,video}`, `fixtures/src/{images,media,travel,shop,visa,content}.ts`, `packages/shared/src/schemas/{common,content,shop,travel,visa}.ts`, `apps/web/src/lib/data/{types,content,tags}.ts`, `components/media/SmartVideo.tsx`, `docs/design/MEDIA_CREDITS.md` |
| Screens matched | PhotoBrief |
| Admin control | AC-64 (media slots) |
| Tests | fixtures: every referenced file exists, desktop clips ≤ 1 MB, phone clips ≤ 512 KB, linked credits for every stock photo and clip · repository: home-hero slot, empty office slot, unique keys · e2e styleguide video specimen |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 (styleguide media specimen) |
| Tools and skills | Serena, a sourcing subagent (WebFetch, WebSearch, Playwright MCP, ffmpeg-static), Read on every poster frame |
| Decisions | D37, D45, D54, D55 |
| Bugs and follow-ups | Owner action: real photos of the Motijheel office for the `office` slot |

### #4 · A4 Data layer and content model — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 06:03 → 09 Oct 11:29 |
| Branch · PR · merge | `feat/4-data-layer` · #26 · `088c1b1` |
| Built | Shared zod contracts for every domain; reference, phone, office-hours and Dhaka-time helpers; typed Sample fixtures (parsed and frozen); repository interfaces, fixture repositories (pure, take `now`) and cached accessors (`'use cache'`, `cacheLife`, `cacheTag`) |
| Files and components | `packages/shared/src/**`, `fixtures/src/**`, `apps/web/src/lib/data/**` |
| Screens matched | Data from every board |
| Admin control | rows AC-01 to AC-56 seeded |
| Tests | unit 168 (shared 38, fixtures 75 incl. compliance, web 55) · e2e 15 · axe pass · Lighthouse — |
| Widths checked | — (no UI) |
| Tools and skills | Serena, Context7, Playwright |
| Decisions | D27–D35 |
| Bugs and follow-ups | Known issues 1–3 (section 9) |

### #3 · A3 Design system in code + /styleguide — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 06:03 → 09 Oct 10:28 |
| Branch · PR · merge | `feat/3-design-system` · #25 · `3348229` |
| Built | 41 shadcn primitives restyled to the Components and States boards; brand pieces (logo lockup, ribbon, gold triangle, W loader); MotionKit; SmartImage and SmartVideo; empty and error states; taka glyph font; favicon and app icon; dev-only `/styleguide` |
| Files and components | `apps/web/src/components/{ui,brand,motion,media,feedback,icons}/**`, `app/[locale]/(site)/styleguide/**` |
| Screens matched | Brand, Tokens, Components, Components2, MotionKit, PCard, States |
| Admin control | — |
| Tests | unit 36 · e2e 15 (320/390/768/1440, axe, keyboard, reduced motion) · axe pass |
| Widths checked | 320 · 390 · 768 · 1440 |
| Tools and skills | Serena, Context7, shadcn, Playwright; ui-ux-pro-max, design-taste-frontend, frontend-design |
| Decisions | D17–D26 |
| Bugs and follow-ups | Fixed in-issue: horizontal scroll at 320/390, Radix radio names, tabs without panels, OTP console error, image aspect warning, set-state-in-effect |

### #2 · A2 Foundation: monorepo, Next.js app, tokens, fonts, i18n, test tooling — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 06:03 → 09 Oct 06:50 |
| Branch · PR · merge | `feat/2-foundation` · #24 · `f740523` |
| Built | pnpm workspaces + Turborepo; Next 16.4 with Cache Components; tokens in `globals.css` with the default palette removed; Plus Jakarta Sans + Inter; shadcn init; next-intl with unprefixed English; Vitest and Playwright + axe |
| Files and components | root configs, `apps/web`, `packages/{shared,config}`, `fixtures` |
| Screens matched | — |
| Admin control | — |
| Tests | unit 20 · e2e 7 (320/390/768/1440, axe, console, overflow, zoom, skip link) |
| Widths checked | 320 · 390 · 768 · 1440 |
| Tools and skills | Serena, Context7, shadcn, Playwright |
| Decisions | D12–D16 |
| Bugs and follow-ups | none |

### #1 · A1 Design direction and competitor benchmark — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 06:03 → 09 Oct 06:28 |
| Branch · PR · merge | `feat/1-design-direction` · #23 · `4fde3b7` |
| Built | Playwright pass over the four competitors at 390 and 1440 px, live DAC → CXB search; Lighthouse mobile ×3 per home page; COMPETITOR_BENCHMARK.md, DESIGN.md, MOTION.md |
| Files and components | `docs/design/{COMPETITOR_BENCHMARK,DESIGN,MOTION}.md` |
| Screens matched | Main (Stage A research) |
| Admin control | — |
| Tests | — (docs) |
| Widths checked | — |
| Tools and skills | Playwright, Lighthouse 13.5; ui-ux-pro-max, design-taste-frontend, frontend-design |
| Decisions | D8–D11 |
| Bugs and follow-ups | v4 gaps → #34 |

### Todo (A6–A22), in build order
Each gets the full block when work starts.

| Issue | Title | Size | Depends on |
| --- | --- | --- | --- |
| #7 | A7 Home: 13 sections from data, video hero with word reveal | L | #6, #8 |
| #8 | A8 Unified search card and pickers | XL | #6 |
| #9 | A9 Results shell + Flights Manual mode + group fares | L | #8 |
| #10 | A10 Hotels Manual mode | S | #8, #9 |
| #11 | A11 Tour packages (list, detail, query) + Plan My Trip | XL | #6, #8 |
| #12 | A12 Visa services (list, country, apply) + Visa Guide | L | #6 |
| #13 | A13 Waafas World catalogue: store home, listing, product, finder, search | XL | #6 |
| #14 | A14 Cart, checkout (COD + offline payment), order success, track order | L | #13 |
| #15 | A15 Printing Solutions and International Trading | M | #6 |
| #16 | A16 Gallery, Feedback, team, About, Contact, FAQs, Blog, policies, Baggage, EMI, Offline Payment | XL | #6 |
| #17 | A17 System states: 404, 500, offline, maintenance, loading + LiveBody placeholder | L | #9, #10 |
| #18 | A18 Admin: shell, sign-in, dashboard, leads, search activity, bookings | XL | #3, #4 |
| #19 | A19 Admin catalogue: group fares, packages, visa, shop | XL | #18 |
| #20 | A20 Admin content: pages, blog, FAQs, banners, home order, menus, media, SEO | XL | #18 |
| #21 | A21 Admin customers, marketing, reports, users and roles, settings | L | #18 |
| #22 | A22 Frontend QA and polish against the benchmark | L | #5–#21 |

## 3. Route ↔ screen matrix

| Route | Screens | Issue | 320 | 390 | 768 | 1024 | 1440 | Tests | Lighthouse mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Home, Home-t, Home-m, Home-help, Home-mfull, Home-mfull2, Home-lower, Home-m-drawer, Home-m-more, Home-shopmenu, Home-moremenu | #7 (#6, #8) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/flights` | Flights, Flights-2, Flights-done, Flights-err, Flights-edit, FlightsFare, Flights-m-*, Pick-* | #9 (#8) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/flights` Live placeholder | FlightsLive (placeholder only; full Live bodies in Phase E) | #17 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/flights/group-fares` | GroupFares, GroupFares-empty, GroupFares-m, GroupFares-m-empty | #9 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/hotels` | Hotels, Hotels-2, Hotels-done, Hotels-m-* | #10 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/tour-packages` | Packages, Packages-empty, Packages-m, Packages-m-filters | #11 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/tour-packages/[slug]` | PackageDetail, -photos, -query, -done, PackageDetail-m-* | #11 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/plan-my-trip` | PlanTrip, PlanTrip-4, PlanTrip-done, PlanTrip-m-* | #11 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/visa-services` | Visa, Visa-none, Visa-m | #12 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/visa-services/[country]` | VisaCountry, -medical, VisaApply, -2, -3, -4, -err, -done, -m-* | #12 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/visa-guide`, `/visa-guide/[country]` | VisaGuide, VisaGuidePost (+ -m) | #12 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop` | Shop, Shop-m, Shop-mega, Shop-suggest, Shop-bulk | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/c/[slug]`, brand, collection, deals | ShopList, -printers, -empty, -m, -m-filters, -m-fashion, ShopCats, ShopDeals | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/p/[slug]` | ShopProduct, -pb, -hp, -toner, -video, -bulk, -m-* | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/finder`, `/shop/search` | ShopFinder, -part, -none, ShopSearch | #13 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/cart` → checkout → order | Shop-mini, ShopCart, -empty, -coupon, ShopCheckout, -err, ShopDone, -bank | #14 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/track` | ShopTrack, -nf, -delivered | #14 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/shop/printing-solutions`, `/shop/international-trading` | Printing, Printing-done, Trading, Trading-done (+ -m) | #15 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/gallery`, `/gallery/[album]` | Gallery, Gallery-album, Gallery-photo (+ -m) | #16 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/feedback` | Feedback, Feedback-sent, Feedback-m | #16 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| More pages | About, Contact, Faqs, Blog, BlogPost, Refund, Privacy, Terms, Baggage, Emi, OfflinePay (+ -m, -sent) | #16 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| 404, 500, offline, maintenance | Error, Error500, Offline, Maintenance, States (+ -m) | #17 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/admin/login` | AdminLogin, -error, -locked, -totp, AdminLogin-m | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` shell + dashboard | AdminSide, AdminTop, AdminNav-m, AdminCmd, AdminDash, AdminDash-m | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin/leads`, `/admin/leads/[ref]` | AdminLeads, -bulk, -board, -m, AdminLead, -convert, -lost, -m | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin/search`, `/admin/bookings` | AdminSearch, AdminBookings, -open | #18 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` catalogue | AdminGroupFares, -new, AdminPackages, AdminPackage, AdminVisa, AdminProducts, AdminProduct, -toner, AdminCats, AdminCollections, AdminCoupons, AdminOrders, -open, -m | #19 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` content | AdminPages, AdminHome, AdminTeam, AdminGallery, AdminMedia, AdminFeedback | #20 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| `/admin` customers, reports, users, settings | AdminCustomers, -open, AdminReports, AdminUsers, AdminGeneral, AdminModes, -confirm, AdminFooter, AdminPayments, AdminNotify | #21 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a |
| Layout shell (every public route) | Header, Home-shopmenu, Home-moremenu, Home-help, Home-m-drawer, Home-m-more, Home-m-help, Footer, TabBar | #6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ e2e 13 + axe | — |
| `/styleguide` (dev only) | Brand, Tokens, Components, Components2, MotionKit, PCard, States | #3 | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ axe + keyboard | n/a |
| `/track`, `/login`, `/account` (P1) | Track, Track-nf, Login, Login-otp, Login-err, Account | D (#31) | — | — | — | — | — | — | — |

## 4. Admin-control matrix

Every public element → the data field it reads → the admin screen that edits it → the API endpoint (planned in A4,
confirmed in Phase B) → verified against the live API (Phase C). Accessors live in `apps/web/src/lib/data/*.ts`.

| # | Public element | Data field (accessor → field) | Admin screen | API endpoint | Verified |
| --- | --- | --- | --- | --- | --- |
| AC-01 | Brand names (header, footer, metadata) | `getSiteSettings()` → travelBrand, storeName, companyName | Settings › General | `GET /api/v1/settings/site` | ⬜ |
| AC-02 | Default SEO title, description, share image | `getSiteSettings()` → defaultSeo | Settings › General | `GET /api/v1/settings/site` | ⬜ |
| AC-03 | Header menu (7 items, order, visibility, Waafas World and More panels) | `getMenu("header")` → items[].label, href, icon, panel, visible | Settings › Footer and menus | `GET /api/v1/menus/header` | ⬜ |
| AC-04 | More panel and sheet (icon, title, one line) | `getMenu("more")` → items[].label, description, icon, href | Settings › Footer and menus | `GET /api/v1/menus/more` | ⬜ |
| AC-05 | Waafas World mega panel categories | `listCategories()` → level-1 name, description, icon, order | Waafas World › Categories | `GET /api/v1/shop/categories` | ⬜ |
| AC-06 | Announcement bar | `getActiveAnnouncement()` → text, link, startsAt, endsAt, enabled | Content › Home and banners | `GET /api/v1/announcements/active` | ⬜ |
| AC-07 | Hotline chip, Call and WhatsApp buttons, floating WhatsApp | `getContactSettings()` → phoneDisplay, phoneE164, whatsappE164 | Settings › General | `GET /api/v1/settings/contact` | ⬜ |
| AC-08 | Open now / Closed chip | `getContactSettings()` → officeHours, read with `getOfficeStatus()` in Asia/Dhaka on the client | Settings › General | `GET /api/v1/settings/contact` | ⬜ |
| AC-09 | Need help? panel, drawer contact block, Contact page, Visit our office | `getContactSettings()` → addressLines, city, country, email, officeHoursText, closedText, mapUrl | Settings › General | `GET /api/v1/settings/contact` | ⬜ |
| AC-10 | Footer brand column | `getSiteSettings()` → footerTagline, footerAbout; `getContactSettings()` → socials | Settings › General | `GET /api/v1/settings/site` | ⬜ |
| AC-11 | Footer link columns | `getFooterSettings()` → columns[].title, menu; `getMenu("footer-travel" / "footer-shop" / "footer-help")` | Settings › Footer and menus | `GET /api/v1/settings/footer` | ⬜ |
| AC-12 | We accept | `getFooterSettings()` → paymentMethods (live ones only), paymentNote | Settings › Footer and menus | `GET /api/v1/settings/footer` | ⬜ |
| AC-13 | Trust badges (ATAB, TOAB, IATA once held) | `getFooterSettings()` → trustBadges | Settings › Footer and menus | `GET /api/v1/settings/footer` | ⬜ |
| AC-14 | Newsletter band | `getFooterSettings()` → newsletterTitle, newsletterPlaceholder, newsletterButton | Settings › Footer and menus | `GET /api/v1/settings/footer` | ⬜ |
| AC-15 | Bottom bar copyright and legal links | `getFooterSettings()` → copyrightHolder; `getMenu("legal")` | Settings › Footer and menus | `GET /api/v1/settings/footer` | ⬜ |
| AC-16 | Developer credit | Rendered from code (FR-FTR-06) | Not editable, by design | — | — |
| AC-17 | Manual or Live body; Send query or Book now | `getPublicConfig()` → modes.{flights, hotels, packages, shopPayment}.mode, liveLocked, lockReason | Settings › Booking modes | `GET /api/v1/config/public` | ⬜ |
| AC-18 | Online payment at checkout; cash-on-delivery cap | `getPublicConfig()` → onlinePaymentLive, codLimit | Settings › Payments and delivery | `GET /api/v1/config/public` | ⬜ |
| AC-19 | Maintenance page | `getPublicConfig()` → maintenance.enabled, message | Settings › General | `GET /api/v1/config/public` | ⬜ |
| AC-20 | Analytics and verification tags | `getTrackingSettings()` → ga4Id, gtmId, metaPixelId, searchConsoleToken | Settings › General | `GET /api/v1/settings/tracking` | ⬜ |
| AC-21 | Lead forms: consent line, email required, reply promise | `getLeadFormSettings()` → consentText, emailRequired, slaMinutes | Settings › General | `GET /api/v1/settings/lead-form` | ⬜ |
| AC-22 | Home section order, visibility and heading overrides | `listHomeSections()` → key, enabled, order, title, subtitle | Content › Home and banners | `GET /api/v1/home/sections` | ⬜ |
| AC-23 | Home trust strip | `listTrustItems()` → icon, title, detail, order | Content › Home and banners | `GET /api/v1/home/trust` | ⬜ |
| AC-24 | Home offers, store campaigns, results banners | `listBanners(placement)` → kicker, title, body, image, link, code, validityText, startsAt, endsAt, order, enabled | Content › Home and banners | `GET /api/v1/banners?placement=` | ⬜ |
| AC-25 | Airline strip | `listFeaturedAirlines()` → code, name, featuredOrder | Content › Home and banners | `GET /api/v1/airlines?featured=true` | ⬜ |
| AC-26 | Destination finder | `listDestinations()` → name, subtitle, iata, image, flightTime, visaNote, visaEasy, bestSeason, fromPrice, tags, order | Content › Home and banners | `GET /api/v1/home/destinations` | ⬜ |
| AC-27 | Why WAAFA values (Home, About) | `listValues()` → icon, title, body, order | Content › Home and banners | `GET /api/v1/home/values` | ⬜ |
| AC-28 | Journey timeline (Home, About) | `listTimeline()` → period, text, order | Content › Home and banners | `GET /api/v1/home/timeline` | ⬜ |
| AC-29 | Group fare cards (Home rail, group fares page, results) | `listGroupFares()`, `getGroupFare()` → airline, cabin, baggage, tripType, from, to, stops, departDate, returnDate, seatsLeft, farePerAdult, expiresAt, notes | Sales › Group fares | `GET /api/v1/group-fares` | ⬜ |
| AC-30 | Package cards, list filters and sort | `listPackages()` → title, placesLabel, categories, tags, months, durationDays, durationNights, includesShort, cover, fromPrice, popularity | Travel › Tour packages | `GET /api/v1/packages` | ⬜ |
| AC-31 | Package detail | `getPackage()`, `listRelatedPackages()` → summary, gallery, video, groupSize, visaNote, highlights, itinerary, inclusions, exclusions, prices, departures, anyDate, hotels, visa, terms, faqs, relatedSlugs, seo | Travel › Tour packages | `GET /api/v1/packages/{slug}` | ⬜ |
| AC-32 | Airport and hotel-city autocomplete | `searchAirports()`, `listPinnedAirports()`, `searchHotelPlaces()` → iata, city, name, country, pinnedRank; place name, city, popular | Seeded reference data (B6) | `GET /api/v1/airports?q=`, `GET /api/v1/hotel-places?q=` | ⬜ |
| AC-33 | Visa list and country cards | `listVisaCountries()` → name, flagCode, region, submission, popular, cover, types[].type, processingTime, serviceCharge | Travel › Visa | `GET /api/v1/visa/countries` | ⬜ |
| AC-34 | Visa country page | `getVisaCountry()` → types[].processingTime, stay, entry, validity, checklist, embassyFee, embassyFeeNote, serviceCharge, notes; forms; faqs; guideSlug | Travel › Visa | `GET /api/v1/visa/countries/{slug}` | ⬜ |
| AC-35 | Visa Guide list and article | `listVisaGuides()`, `getVisaGuide()` → title, summary, cover, sections, tips, updatedAt, readingMinutes, seo | Content › Pages, blog and FAQs | `GET /api/v1/visa/guides` | ⬜ |
| AC-36 | Store home rows | `listStoreRows()` → key, enabled, order | Waafas World › Collections | `GET /api/v1/shop/store-rows` | ⬜ |
| AC-37 | Category grid and listing filters | `listCategories()`, `getCategory()`, `getAttributeSet()` → name, slug, icon, description, banner, parentId, level, attributeSetId, compatibility, order, seo; attributes[].filterable | Waafas World › Categories | `GET /api/v1/shop/categories` | ⬜ |
| AC-38 | Product cards and product page | `listProducts()`, `getProduct()` → title, shortTitle, badges, cardSpec, highlights, description, specs, warranty, images, video, options, variants (sku, price, mrp, stock, lowStockAt, preOrder, images), codEligible, bulkFrom, seo | Waafas World › Products | `GET /api/v1/shop/products` | ⬜ |
| AC-39 | Brands row and brand pages | `listBrands()`, `getBrand()` → name, logo, description | Waafas World › Products | `GET /api/v1/shop/brands` | ⬜ |
| AC-40 | Collections | `listCollections()`, `getCollection()` → name, description, image, rule, order | Waafas World › Collections | `GET /api/v1/shop/collections` | ⬜ |
| AC-41 | Deals with an end date | `listDeals()` → dealPrice, endsAt, product, variant | Waafas World › Products | `GET /api/v1/shop/deals` | ⬜ |
| AC-42 | Find by model | `listCompatibleModels()`, `findCompatibleProducts()` → brand, model, partCodes; product.compatibleModelIds | Waafas World › Products (compatibility CSV) | `GET /api/v1/shop/compatible-products` | ⬜ |
| AC-43 | Coupons at checkout | `findCoupon()` → code, type, value, minOrder, maxDiscount, startsAt, endsAt, enabled | Waafas World › Coupons | `POST /api/v1/shop/coupons/validate` | ⬜ |
| AC-44 | Delivery charges, estimates, free delivery, minimum order, office pick-up | `getShippingSettings()` → zones[].name, areas, charge, estimate; freeDeliveryThreshold; minimumOrder; officePickup | Settings › Payments and delivery | `GET /api/v1/settings/shipping` | ⬜ |
| AC-45 | Offline Payment page, checkout and order emails | `getPaymentSettings()` → offlineAccounts[].kind, title, lines, instructions | Settings › Payments and delivery | `GET /api/v1/settings/payments` | ⬜ |
| AC-46 | EMI page | `getEmiSettings()` → minimumAmount, tenuresMonths, cardsNote, appliesTo, interestNote; `listEmiBanks()` → name, tenuresMonths, note | Settings › Payments and delivery | `GET /api/v1/settings/emi` | ⬜ |
| AC-47 | Refund, Privacy, Terms and About Us text | `getPage(slug)` → title, summary, highlights, sections, lastUpdated, seo | Content › Pages, blog and FAQs | `GET /api/v1/pages/{slug}` | ⬜ |
| AC-48 | Blog list, post and Home blog strip | `listBlogPosts()`, `getBlogPost()`, `listRelatedBlogPosts()`, `listBlogCategories()` → title, excerpt, intro, sections, cover, category, author, publishedAt, readingMinutes, featured, cta, seo | Content › Pages, blog and FAQs | `GET /api/v1/blog/posts` | ⬜ |
| AC-49 | FAQs page and Home FAQ strip | `listFaqs()` → category, question, answer, link, order, onHome | Content › Pages, blog and FAQs | `GET /api/v1/faqs` | ⬜ |
| AC-50 | Baggage table | `listBaggageRules()` → airlineCode, airlineName, scope, cabinClass, cabinAllowance, checkedAllowance, notes, lastVerified | Content › Pages, blog and FAQs | `GET /api/v1/baggage-rules` | ⬜ |
| AC-51 | Gallery page, albums and Home strip | `listGalleryAlbums()`, `getGalleryAlbum()` → title, category, cover, items (photo or video, caption), publishedAt | Content › Gallery | `GET /api/v1/gallery/albums` | ⬜ |
| AC-52 | Testimonials wall and Home reviews | `listPublicFeedback()` → name, service, rating, comment, photo, submittedAt (approved with consent only) | Content › Feedback | `GET /api/v1/feedback` | ⬜ |
| AC-53 | Facebook reviews link (until approved feedback exists) | `getSiteSettings()` → reviewsUrl | Settings › General | `GET /api/v1/settings/site` | ⬜ |
| AC-54 | Meet our team (Home bento and carousel, About grid) | `listTeam(placement)` → name, initials, designation, department, bio, photo, whatsappE164, email, linkedinUrl, featured, showOnHome, showOnAbout, visible, order | Content › Team | `GET /api/v1/team?placement=` | ⬜ |
| AC-55 | Customer emails (lead received, order placed, visa status) | NotificationTemplate → subject, body, variables, channel, enabled | Settings › Notifications | `GET /api/v1/admin/notification-templates` | ⬜ |
| AC-56 | Lead reference on success screens | `createLead()` → reference, createdAt | Sales › Leads | `POST /api/v1/leads` | ⬜ |
| AC-57 | Phone drawer main links | `getMenu("drawer")` → items[].label, href, icon, visible | Settings › Footer and menus | `GET /api/v1/menus/drawer` | ⬜ |
| AC-58 | Phone tab bar (five tabs, Waafas World third, More last) | `getMenu("tabbar")` → items[].label, href, icon, panel (the schema enforces the shape) | Settings › Footer and menus | `GET /api/v1/menus/tabbar` | ⬜ |
| AC-59 | Phone More sheet extras (Gallery, Feedback, Track order) | `getMenu("more-phone")` → items[] | Settings › Footer and menus | `GET /api/v1/menus/more-phone` | ⬜ |
| AC-60 | Waafas World panel: store intro and service cards | `getSiteSettings()` → storeIntro; `getMenu("shop-panel")` → items[].label, description, cta, href, icon | Settings › General; Settings › Footer and menus | `GET /api/v1/settings/site`, `GET /api/v1/menus/shop-panel` | ⬜ |
| AC-61 | Help panel line and Visit row | `getContactSettings()` → helpLine, visitLabel | Settings › General | `GET /api/v1/settings/contact` | ⬜ |
| AC-62 | Floating WhatsApp prefilled message | `getContactSettings()` → whatsappMessage (`{page}` placeholder) | Settings › General | `GET /api/v1/settings/contact` | ⬜ |
| AC-63 | Header Log in (hidden until accounts ship) | `getSiteSettings()` → accountsLive | Settings › General | `GET /api/v1/settings/site` | ⬜ |
| AC-64 | Page-level photos and videos (home hero, flights, group fares, visa, printing, trading headers and form side images) | `getMediaSlot(key)` → image or video (mp4, webm, phone files, poster, credit) | Content › Media library | `GET /api/v1/media/slots/{key}` | ⬜ |

## 5. Components inventory

| Component | Path | Source (shadcn · 21st.dev id · custom) | Used on |
| --- | --- | --- | --- |
| MotionProvider | `apps/web/src/components/motion/MotionProvider.tsx` | custom (LazyMotion strict + MotionConfig reducedMotion="user") | root layout |
| reducedMotion helpers | `apps/web/src/components/motion/reducedMotion.ts` | custom (`REDUCED_FADE`, `useRiseVariants`, `useSafeTransition`) | MotionKit |
| PageTransition · Reveal · Stagger · StaggerItem · CountUp · Marquee · Parallax · PressScale · DrawCheck | `apps/web/src/components/motion/` | custom on Motion (MotionKit) | site-wide |
| cn | `apps/web/src/lib/utils.ts` | shadcn (`cn` package) | every component |
| formatTaka, formatDate, formatTime | `packages/shared/src/format/` | custom | prices, dates (web + API) |
| shadcn primitives (41) | `apps/web/src/components/ui/` | shadcn radix-nova, restyled to the Components and States boards | everywhere |
| Button (pill, loading, 9 variants) | `components/ui/button.tsx` | shadcn, rewritten | everywhere |
| Badge (premium, discount, status) | `components/ui/badge.tsx` | shadcn, rewritten | cards, admin |
| Toaster | `components/ui/sonner.tsx` | shadcn + Sonner, light-only, above the tab bar | site layout |
| LogoLockup | `components/brand/LogoLockup.tsx` | custom (supplied logo cut-outs) | header, footer |
| RibbonBand · RibbonDivider · RibbonLine | `components/brand/` | custom (prototype ribbon geometry) | hero, dividers, tabs, progress |
| GoldTriangle | `components/brand/GoldTriangle.tsx` | custom | premium badges |
| BrandLoader | `components/brand/BrandLoader.tsx` | custom (W strokes, CSS) | route loading |
| brandColors (BRAND_PALETTE, RIBBON_STOPS, THEME_COLOR) | `components/brand/brandColors.ts` | custom, drift-tested against globals.css | styleguide, viewport metadata |
| SmartImage · SmartVideo | `components/media/` | custom on next/image | photos, hero and package loops |
| EmptyState · ErrorState | `components/feedback/` | custom on shadcn Empty | lists, results, errors |
| WhatsAppIcon · FacebookIcon | `components/icons/` | Simple Icons 16.34.0 (CC0) | WhatsApp buttons, socials |
| zod contracts | `packages/shared/src/schemas/` | custom (zod 4, `.strict()`) | web, fixtures, API (Phase B) |
| makeReference · parseReference · toDhakaIsoString · toDhakaDateString | `packages/shared/src/helpers/reference.ts` | custom | lead and order references |
| toBdE164 · formatBdPhone · whatsappLink | `packages/shared/src/helpers/phone.ts` | custom | forms, contact links |
| getOfficeStatus · formatClock | `packages/shared/src/helpers/officeHours.ts` | custom (Asia/Dhaka) | Open now chip |
| Sample fixtures + `loadFixtures()` | `fixtures/src/` | custom | fixture repositories, Phase B seed |
| Repository interfaces · fixture repositories · cached accessors | `apps/web/src/lib/data/` | custom on Next 16 Cache Components | every page |
| NavigationMenu (restyled) | `components/ui/navigation-menu.tsx` | shadcn, restyled (pills, 20 px panels) | header |
| SiteHeader · DesktopNav · ShopMegaPanel · MorePanel | `components/layout/` | custom on shadcn NavigationMenu | every public page |
| HelpMenu · HelpPanel · ContactRow · CopyButton · OfficeStatusChip · useOfficeStatus | `components/layout/` | custom on shadcn Popover and vaul Drawer | header, drawer, footer |
| MobileMenu · MobileMenuBody · MoreGrid | `components/layout/` | custom on shadcn Sheet | phones and tablets |
| TabBar · MoreSheetBody · CurrentMarker · WithPathname · isActivePath | `components/layout/` | custom (CSS indicator, vaul Drawer) | phones |
| SiteFooter · FooterAccordion · NewsletterForm · DeveloperCredit | `components/layout/` | custom on shadcn Accordion | every public page |
| AnnouncementBar · AnnouncementShell · FloatingWhatsApp · Breadcrumbs | `components/layout/` | custom | every public page |
| MenuIcon | `components/icons/MenuIcon.tsx` | Lucide (allow-listed names from data) | menus, panels, grids |
| JsonLd | `components/seo/JsonLd.tsx` | custom (escaped JSON) | breadcrumbs, pages |

## 6. Tooling

Tested 9 Oct 2026 (v4 Step 1).

| Tool or skill | Kind | Status | Last tested | Used for |
| --- | --- | --- | --- | --- |
| serena | MCP | ✅ | 09 Oct | Symbol reads and edits, memories (`list_memories` → 8; project active, TypeScript LS) |
| context7 | MCP | ✅ | 09 Oct | Library docs before use (`resolve` Next.js → `/vercel/next.js` up to v16.2.9; Cache Components docs; husky v9.1.7) |
| shadcn | MCP | ✅ | 09 Oct | Registry search/view/add (`search "sidebar"` in `@shadcn` → 31 items; pass `registries` because `components.json` is in `apps/web`) |
| magic (21st.dev) | MCP | ✅ | 09 Oct | Component search, inspiration, logos (`search "flight search card"` → 5); key from `TWENTY_FIRST_API_KEY` |
| playwright | MCP | ✅ | 09 Oct | Screenshots at every width, console, network, traces (example.com at 390 px) |
| github | MCP | ✅ | 09 Oct | Issues and PRs (`get_me` → mahedi-emon); Projects through `gh` |
| gh CLI | CLI | ✅ | 09 Oct | Issues, Project #4 fields, sub-issues, merges (2.102, scopes repo, project, workflow) |
| figma (project) | MCP | ⏸ off | — | Not needed; claude.ai Figma connector available if the handoff lacks a detail |
| ui-color-palette | MCP (plugin) | ❌ 503 | 09 Oct | Palette scales and contrast; server down ("Service temporarily unavailable"); its skills wait for it |
| figma-desktop, framer, sketch, penpot, gitlab | MCP (plugin) | ❌ not connected | 09 Oct | Not needed for this build |
| Claude Docs, Notion, Google Drive connectors | MCP | available | — | Not used (repo docs are the source) |
| Node / pnpm | Runtime | ✅ | 09 Oct | Node 25.2.1 local (22.11.0 installed; CI Node 22), pnpm 12.10.1 |
| Python | Runtime | ✅ | 09 Oct | 3.12 for UI UX Pro Max (`search.py --design-system` ran) |
| uvx | Runtime | ✅ | 09 Oct | Serena server |
| Docker Desktop | Runtime | ✅ installed | 09 Oct | API dependencies in Phase B |
| ffmpeg | CLI | ❌ missing | 09 Oct | Media transcoding: use `ffmpeg-static` (A5) |
| Vercel CLI | CLI | ❌ missing | 09 Oct | Preview deployments: owner action |
| Lighthouse | CLI | ✅ | 09 Oct | `npx -y lighthouse@13.5.0` with local Chrome (benchmark) |
| husky + lint-staged + commitlint | Git hooks | ✅ | 09 Oct | Commit-msg attribution check, Conventional Commits, Prettier, guards |
| ui-ux-pro-max | Skill (project) | ✅ loaded | 09 Oct | Design system, UX and stack rules, pre-delivery checklist |
| design-taste-frontend | Skill (project) | ✅ loaded | 09 Oct | Anti-template direction, layout and copy rules |
| frontend-design | Skill (project) | ✅ loaded | 09 Oct | Aesthetic direction, typography, restraint |
| design-superpowers:design-review | Skill | ✅ loaded | 09 Oct | Review pass on every finished screen |
| design-superpowers:design | Skill | available | — | Composing features from the design system |
| design-superpowers:creative | Skill | available | — | Visual direction, moodboards |
| design-superpowers:ds-make | Skill | available | — | Tokens and component variants |
| design-superpowers:ds-manage | Skill | available | — | DS docs and drift checks |
| design-superpowers:ds-consumer | Skill | available | — | Choosing DS components for features |
| design-superpowers:ds-producer | Skill | available | — | DS governance checklists |
| design-superpowers:map-design | Skill | available | — | Extracting a DESIGN.md from an artifact |
| design-superpowers:figma-setup | Skill | available | — | Figma plugin setup (not needed) |
| design:accessibility-review | Skill | available | — | WCAG audits of screens |
| design:design-critique | Skill | available | — | Usability and hierarchy critique |
| design:design-handoff | Skill | available | — | Spec sheets |
| design:design-system | Skill | available | — | DS audits and docs |
| design:ux-copy | Skill | available | — | Microcopy, errors, empty states |
| design:research-synthesis | Skill | available | — | Research synthesis (not needed) |
| design:user-research | Skill | available | — | Research plans (not needed) |
| 21st:21st-ui | Skill | available | — | Choosing and adapting 21st.dev components |
| ui-color-palette:* (14 skills) | Skill | ⏸ MCP down | — | build-color-system, scale-palette, audit-palette, generate-code, generate-semantic-code, generate-source-colors, manage-palettes, figma, penpot, framer, sketch, help, gh-cli, gitlab-cli-skills |
| figma:* (14 skills) | Skill | available | — | figma-use, figma-generate-design, figma-generate-library, figma-design-to-code, figma-implement-motion, figma-code-connect, figma-create-new-file, figma-generate-diagram, figma-generative-plugins, figma-shaders, figma-swiftui, figma-use-figjam, figma-use-motion, figma-use-slides (only if the handoff lacks a detail) |
| dataviz | Skill | available | — | Admin charts (A18, A21) |
| code-review | Skill | available | — | Diff review before PRs |
| simplify | Skill | available | — | Cleanup passes |
| security-review | Skill | available | — | Security review (Phase B/C) |
| run | Skill | available | — | Launching the app to verify changes |
| update-config · fewer-permission-prompts · keybindings-help | Skill | available | — | Claude Code settings |
| loop · schedule | Skill | available | — | Recurring checks (not needed) |
| init · plugin-authoring · claude-api · skill-creator | Skill | available | — | Not needed for this build |
| artifact-design · artifact-diagramming · artifact-capabilities | Skill | available | — | Shareable pages (not needed) |
| claude-in-chrome · built-in-browser · chrome-browser · computer-use | Skill | available | — | Browser control (Playwright MCP used instead) |
| deep-research | Skill | available | — | Multi-source research (not needed) |
| docs · docx · pdf · pptx · xlsx · google-workspace | Skill | available | — | Documents (not needed) |
| import-memory · morning | Skill | available | — | Not needed |

## 7. Benchmark

Lighthouse 13.5.0 mobile (simulated Slow 4G, 4× CPU), median of 3 runs, 9 Oct 2026. Perf / A11y / Best practices /
SEO · LCP. Detail: `docs/design/COMPETITOR_BENCHMARK.md`.

| Page | GoZayaan | ShareTrip | Akij Air | Obokash | Waafa | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 26 / 76 / 50 / 92 · 24.4 s | 1 / 72 / 73 / 100 · 29.2 s | 27 / 79 / 69 / 92 · 25.4 s | 35 / 88 / 54 / 92 · 12.5 s | target ≥ 90 / ≥ 95 / ≥ 95 / 100 · ≤ 2.5 s | measured in A22 |
| Inner page | — | — | — | — | — | A1b (#34) |

## 8. Decisions

| ID | Date | Decision | Why | Issue |
| --- | --- | --- | --- | --- |
| D1 | 09 Oct | Project Status "Todo" maps to the existing **Ready** option | Project #4 has Backlog/Ready/In progress/In review/Done and no Todo | Step 0 |
| D2 | 09 Oct | `.claude/settings.json` uses `attribution` (`commit: ""`, `pr: ""`, `sessionUrl: false`) | `includeCoAuthoredBy` is deprecated | Step 0 |
| D3 | 09 Oct | Local Node 25.2.1 kept; CI runs Node 22 LTS; pnpm pinned via `packageManager` | Works without switching the machine-wide nvm4w link | Step 0 |
| D4 | 09 Oct | Labels use `type:`, `area:`, `priority:` prefixes; GitHub default labels kept | Clear grouping; nothing deleted | Step 0 |
| D5 | 09 Oct | Milestone dues: A 11 Oct, B 12 Oct, C 13 Oct, D 13 Nov, E and F open | PRD §5 launch week | Step 0 |
| D6 | 09 Oct | PRD wins over skill defaults: Plus Jakarta Sans + Inter, lucide-react, light-only public site | Skills push other fonts, icons and dark mode | #1 |
| D7 | 09 Oct | shadcn primitives keep CLI file names in `components/ui`; everything else PascalCase | `shadcn add` and diffs keep working | #2 |
| D8 | 09 Oct | `--primary` = electric-600 #0053D7 (brand-700 #003FBE for hover and links), `--ring` = electric-600 | PRD §16 and the prototype's primary button | #1 |
| D9 | 09 Oct | Logo in full colour on white or mist-50 only; light footer (mist-50) | Never recolour the logo | #1 |
| D10 | 09 Oct | Header 64 px phone, 72 px desktop | PRD FR-GLB-01 | #1 |
| D11 | 09 Oct | Above-the-fold motion is CSS; blur-in, spotlight, skeleton and chart effects rebuilt with transform and opacity | LCP and the transform/opacity rule | #1 |
| D12 | 09 Oct | TypeScript 6.0.3 and ESLint 9 | typescript-eslint 8.71 supports TypeScript < 6.1 | #2 |
| D13 | 09 Oct | One root layout `app/[locale]/layout.tsx`; site in `(site)`, admin in `[locale]/admin` | `next/root-params` + next-intl; English unprefixed via `src/proxy.ts` | #2 |
| D14 | 09 Oct | next-intl: `localeDetection: false`, `localeCookie: false` | Language changes only by choice; responses stay cacheable | #2 |
| D15 | 09 Oct | Tailwind through `@tailwindcss/postcss` | Documented path in the bundled Next 16.4 docs | #2 |
| D16 | 09 Oct | Tailwind default palette removed; only WAAFA colours exist | Off-brand colours cannot compile | #2 |
| D17 | 09 Oct | shadcn `radix-nova` preset with Lucide and pointer cursors; `cn` from shadcn's package | Radix per the stack; Lucide per the PRD | #2 |
| D18 | 09 Oct | `framer-motion` removed; `motion` v14 only; pnpm `allowBuilds` denies three packages' scripts | No duplicate animation bundle; prebuilt binaries | #2 |
| D19 | 09 Oct | LogoLockup renders the supplied logo cut-outs through next/image | Tracing would alter the logo; vectors are an owner question | #3 |
| D20 | 09 Oct | Buttons are full pills (48 / 38 / 56 px, icon 44 px) | Measured on the Components board | #3 |
| D21 | 09 Oct | Hover colours swap instantly or fade an overlay; accordion fades instead of animating height | Transform/opacity-only rule | #3 |
| D22 | 09 Oct | "Waafa Taka": 2.6 KB Hind Siliguri subset for ৳ (U+09F3) | Inter and Plus Jakarta Sans have no taka glyph | #3 |
| D23 | 09 Oct | Grids declare `grid-cols-1` at the phone base; carousels contain inline size; OTP boxes 40 px below 640 px | Horizontal scroll found at 320/390 px | #3 |
| D24 | 09 Oct | next-intl root provider passes `messages={null}`; client leaves get strings as props or `pickMessages` | Otherwise the whole catalogue ships to every page | #3 |
| D25 | 09 Oct | WhatsApp and Facebook glyphs from Simple Icons (CC0) | Lucide has no brand icons | #3 |
| D26 | 09 Oct | `/styleguide` only in dev and `STYLEGUIDE=1` builds; 404 in production | Dev-only page that CI still tests | #3 |
| D27 | 09 Oct | UI reads data only through cached accessors (`'use cache'` + `cacheLife` + `cacheTag`) that call `repositories` from server-only `source.ts`; fixture repositories are pure and take `now` | Phase C swaps one line; repositories stay unit-testable | #4 |
| D28 | 09 Oct | Fixtures are zod inputs, parsed by `loadFixtures()` and deep-frozen | Broken fixtures fail loudly; shared data cannot be mutated | #4 |
| D29 | 09 Oct | Pages, blog posts and visa guides store headed sections (id = anchor) | Contents lists come from data; sanitised rich text per section | #4 |
| D30 | 09 Oct | Embassy fees default to null; stay, entry and validity optional; only Thailand carries sample figures | No invented visa facts | #4 |
| D31 | 09 Oct | Sample people use "Sample …" names, example.com emails and the unassigned 010 prefix | No real person reachable through seed data | #4 |
| D32 | 09 Oct | Gallery albums named after places; feedback fixtures pending only; no MD card in team samples | No invented trips, reviews or owner details | #4 |
| D33 | 09 Oct | Packages carry `categories` and `months`; More menu item has no href; snake_case template variables; airline strip = `featuredOrder` | Matches the boards' filters and admin screens | #4 |
| D34 | 09 Oct | Printing Solutions and International Trading at `/shop/printing-solutions` and `/shop/international-trading` | PRD sitemap lists them as /shop children | #4 |
| D35 | 09 Oct | Phase A lead intake validates and returns a reference but stores nothing | No personal data in a dev server's memory | #4 |
| D36 | 09 Oct | v4 prompt adopted mid-build: issues #1–#22 reused as A1–A22, A0 = #27, epics #28–#33, A1b = #34 for the v4 doc gaps; A17 narrowed to system states + LiveBody placeholder (full Live bodies move to Phase E) | Keep finished work and history; the v4 backlog keeps A17's Live bodies for Phase E | #27 |
| D37 | 09 Oct | The prototype's drawn motion graphics (route map, passport, product animations) are not shipped; real footage only; the route map becomes a live SVG component | Correction 7 (real media only) beats HANDOFF's "motion graphics the site can use"; HANDOFF fixed | #27, #5 |
| D38 | 09 Oct | `dangerouslySetInnerHTML` allowed in `components/content/RichText.tsx` and `components/seo/JsonLd.tsx` only (ESLint `react/no-danger` + guards) | JSON-LD needs raw script text; everything else is components | #27 |
| D39 | 09 Oct | Hex guard covers `apps/web/src` (UI code); brand colours for metadata live in `components/brand/brandColors.ts` with a drift test against `globals.css` | Product swatch colours in fixtures are data, not styling | #27 |
| D40 | 09 Oct | `.mcp.json` keeps `TWENTY_FIRST_API_KEY` (set in local settings); CLI installs use `${API_KEY_21ST:-$TWENTY_FIRST_API_KEY}` | `API_KEY_21ST` is not set on this machine; the magic MCP works today | #27 |
| D41 | 09 Oct | husky writes the local `core.hooksPath` (its install step); CI sets `HUSKY=0` | Required for the hooks; git identity is untouched | #27 |
| D42 | 09 Oct | CI path filtering at job level (dorny/paths-filter v4); Guards and Authorship jobs always run | Required checks report "skipped" (passing) instead of "pending" on docs-only PRs | #27 |
| D43 | 09 Oct | Project fields: Phase A start 9 Oct, target 11 Oct; epics B 11–12 Oct, C 12–13 Oct, D 14 Oct–13 Nov; Estimate XS 1, S 2, M 3, L 5, XL 8 | Milestone dates (D5) | #27 |
| D44 | 09 Oct | FAQ "Which visas do you help with?" no longer mentions recruitment; guards fail on Phase F words in UI code, messages, fixtures and contracts | PRD §2: no copy for unlicensed modules | #27 |
| D45 | 09 Oct | Media credits live in `docs/design/MEDIA_CREDITS.md` | v4 prompt name (the earlier plan said IMAGE_CREDITS.md) | #5 |
| D46 | 09 Oct | The header's Log in stays hidden until customer accounts ship (`siteSettings.accountsLive`, P1) | No dead buttons at launch; the board's slot is kept | #6 |
| D47 | 09 Oct | Shared navs read the pathname only after hydration (`WithPathname`, `CurrentMarker`): the static App Shell renders without an active item, then small marker spans add the bar and a "(current page)" suffix | Cache Components and Partial Prefetching suspend any layout that reads URL data while prerendering (build failure); keeping links mounted preserves focus | #6 |
| D48 | 09 Oct | `getPublicConfig()` caches for hours and relies on `config` tag revalidation | A cacheLife under five minutes counts as dynamic and pushes the header out of the App Shell | #6 |
| D49 | 09 Oct | With a single locale, the next-intl request config does not read `next/root-params` | Avoids URL data in shared layouts until Bangla (P1) adds a second locale | #6 |
| D50 | 09 Oct | Announcement dismissal is remembered per announcement id in localStorage | Simple and private; returning visitors who dismissed it may see a brief collapse after hydration (known issue) | #6 |
| D51 | 09 Oct | The header tagline shows from 1280 px; nav items tighten between 1024 and 1279 px | The seven items, logo and help button fit on one line at 1024 (taste rule: nav on one line) | #6 |
| D52 | 09 Oct | Radix NavigationMenu's visually hidden focus proxy is excluded from axe in e2e | Radix forwards focus from it into the open panel; axe flags its aria-hidden and tabindex pattern | #6 |
| D53 | 09 Oct | E2E allows 404s only for RSC prefetches of routes later issues build; every other 404 fails | Links point at A7–A16 routes that do not exist yet; remove the allowance in A22 | #6 |
| D54 | 09 Oct | Six real clips ship (hero sky, Maldives, Cappadocia, port, passport, headphones); the printing header uses the Unsplash printer photo and the sample power bank has no video | The only free printer clip was too dark for the brand; no free real power bank footage exists; never a drawn stand-in | #5 |
| D55 | 09 Oct | Media slots (`MediaSlotKey`) hold page-level photos and videos; the `office` slot stays empty until Waafa sends real office photos; `about-routes` dropped (the route map is a live SVG) | Every page image is admin-replaceable without a stand-in | #5 |

## 9. Bugs and known issues

| Issue | Severity | Where | Status |
| --- | --- | --- | --- |
| Fixture images point at `/media/...` files that only land on `main` with A5 | P1 | fixtures, every image | Fixed by #5 (PR pending) |
| Boards disagree on two shop numbers: COD cap ৳20,000 (FAQ, Terms) vs ৳25,000 (admin sample); free delivery over ৳3,000 (admin) vs ৳5,000 (product page). Fixtures use ৳20,000 and ৳3,000 until the owner confirms | P2 | fixtures (shop settings) | Owner question |
| Phase A references restart at 0001 whenever the dev server restarts (no storage before the API) | P2 | lead intake | By design until Phase C |
| Visitors who dismissed the announcement may see it collapse right after hydration on their next visit | P2 | announcement bar | Accepted (D50); revisit if field CLS shows it |

## 10. Cut list

If time runs out, cut in this order (PRD §17). Never cut security, lead capture, the admin leads module, compliance
or accessibility.
1. Gallery video embeds
2. Blog extras (related posts, contents list)
3. Part-code search in Find by model
4. Proposed now (behind by 3 issues): 21st.dev desktop-only flourishes (tilt, spotlight, magnetic) move to A22 polish; the About route map ships as a static SVG first

## 11. Blockers and owner actions

| Item | What I need from the owner | Exact steps | Needed by |
| --- | --- | --- | --- |
| Vercel (web hosting, preview per PR) | An account and a logged-in CLI | `npm i -g vercel` → `vercel login` → tell me; I run `vercel link` in `apps/web` and connect the GitHub repo | 11 Oct |
| API hosting | Railway project or a small VPS | Railway: create a project and an API token (`railway login`); VPS: Ubuntu 24.04, 2 GB RAM, SSH key access | 11 Oct |
| PostgreSQL 16 + Redis | Managed instances (Railway, Neon or Supabase for Postgres; Railway or Upstash for Redis) | Create both; put the URLs in the host's env settings (never in chat or the repo) | 11 Oct |
| Cloudflare R2 + Turnstile | R2 buckets (public media, private documents) and a Turnstile site | Cloudflare dashboard → R2 → two buckets + an API token (Object Read & Write); Turnstile → add site → site key + secret | 12 Oct |
| Email (Resend) + DNS | Resend account and DNS access for the sending domain | Resend → add domain → add the SPF, DKIM and DMARC records it shows at the DNS host | 12 Oct |
| Domain | Production domain (waafasworld.com?) and DNS access | Confirm the domain; give DNS access or add the Vercel records I send | 12 Oct |
| Sentry | Project DSNs for web and API | sentry.io → new projects (Next.js, Node) → copy the DSNs into the host env | 13 Oct |
| GA4, GTM, Meta Pixel | Measurement IDs | GA4 property → web stream ID; GTM container ID; Meta Events Manager → Pixel ID | 13 Oct |
| 21st.dev key name (optional) | Nothing required | Works through `TWENTY_FIRST_API_KEY`; to use `API_KEY_21ST` set it as a Windows user variable and restart VS Code | — |
| Context7 key (optional) | Higher rate limits | context7.com → API key → set `CONTEXT7_API_KEY` as a Windows user variable | — |
| Branch protection | — | Applied by me in A0 (public repo) | done in #27 |
| Content (PRD §17) | Domain; office floor (4th vs 5th; site shows 4th); hotline and WhatsApp numbers; Waafas World launch categories, products, prices, stock, photos, delivery areas, charges, COD limit; offline payment accounts (bank, bKash, Nagad); launch packages, visa countries with fees and times, group fares; refund, privacy and terms text or approval of drafts; logo vector files; About mission and vision; EMI banks and tenures; Better Day toner prices and compatible models; staff names, roles and team members who agree to appear; SSLCommerz status; email provider for info@ | Send what is ready; drafts stay marked Sample until replaced | 11 Oct |

## 12. Later phases (E live booking · F licensed modules)

| Item | Waiting for | Notes |
| --- | --- | --- |
| E · Live flights (#32) | IATA accreditation, consolidator API or GDS contract, sandbox certification | Golden Switch UI ships with Live locked; A17 adds the LiveBody placeholder in the same slot |
| E · Live hotels (#32) | Hotel API contract | Same ResultsBody slot |
| E · Instant package booking (#32) | Online payment (Phase D) | Package detail keeps the query flow until then |
| F · Hajj and Umrah (#33) | Hajj agency licence and the owner's go-ahead | Package categories are admin-managed; PRD update first |
| F · Manpower and Recruitment (#33) | Recruiting licence and the owner's go-ahead | Visa types and menus are admin-managed; PRD update first |
| D · P1 (#31) | Merchant account (SSLCommerz, bKash), SMS gateway, launch | Accounts, Bangla, payments, SMS, 2FA, quote builder, reviews, EMI calculator, couriers |

## 13. Session log (newest first)

| Date and time | Summary | Issues | PRs | Tests |
| --- | --- | --- | --- | --- |
| 09 Oct 17:30–20:56 | A0 merged (#35) with branch protection; A1b docs pushed; A5 footage sourced by a subagent (7 real clips; power bank skipped, no free real footage); A6 layout shell built and verified at five widths; a usage limit paused work for about 90 minutes | #27, #34, #5, #6 | #35 | e2e 30 · unit all green |
| 09 Oct 16:30–17:20 | v4 PROMPT 1: audit, tool check (all MCPs and four skills), GitHub planning (labels, milestone F, epics #28–#33, A0 #27, sub-issues, Project fields, squash-only), A0 setup in progress | #27, #5 | — | guards + hook negative tests |
| 09 Oct 11:27 | A4 data layer and content model: contracts, Sample fixtures, repositories, cached accessors; admin-control matrix seeded (56 rows) | #4 | #26 | unit 168 · e2e 15 |
| 09 Oct 10:24 | A3 design system: 41 primitives, brand, MotionKit, media, styleguide; fixed overflow, radio names, tabs, OTP and lint issues; usage limit hit mid-issue; low memory stopped servers | #3 | #25 | unit 36 · e2e 15 |
| 09 Oct 06:46 | A2 foundation: workspaces, Next 16.4, tokens, fonts, shadcn, next-intl, Vitest, Playwright + axe | #2 | #24 | unit 20 · e2e 7 |
| 09 Oct 06:26 | A1 design direction and benchmark (docs only) | #1 | #23 | — |
| 09 Oct 06:10 | Step 0 (v3): tools tested, attribution off, labels, milestones, issues #1–#22 on Project #4 | — | — | — |

## 14. Next steps
1. Finish A0 (#27): CI green, squash-merge, branch protection, memories.
2. A5 (#5): real footage from Pexels/Coverr/Mixkit (hero sky, Cox's Bazar sea, passport, port, printer), ffmpeg-static transcodes (720p ≤ 1 MB, mobile 720 px wide, AVIF/WebP posters), MEDIA_CREDITS.md, drop the drawn loops.
3. A1b (#34) docs addendum in parallel (subagent: inner-page Lighthouse), then A6 layout shell and A8/A7 in order.

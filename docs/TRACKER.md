# WAAFA — Build Tracker
Updated: 10 Oct 21:21 Asia/Dhaka · Phase: A · Frontend + B · Backend (launch order) · Current: #56 · B3 Public intake (after #55 B2 merges) · Progress: Phase A 19/24 (79%), Phase B 2/4 · Launch: 13 Oct 2026, 3 days left · Status: Behind; launch-critical order in section 14 (owner accounts needed now, section 11)

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
| A · Frontend | 11 Oct · epic #28 | 24 (A0, A1–A22, A1b) + bug #39 | 19 | 0 | 0 | 79% |
| B · Backend | 12 Oct · epic #29 | 4 (#54 – #57, launch scope) | 2 | 1 (#56) | 0 | 50% |
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

### #64 · C1 Web on the API: snapshot source, intake forwarding, revalidation — 🟡 In review
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 00:40 → (PR open) |
| Branch · PR · merge | `feat/64-web-api-source` · see section 13 · squash |
| Built | API mode when `WAAFA_API_URL` and `WAAFA_INTAKE_KEY` are set (D136): every repository read runs the tested fixture implementation on the API snapshot, read once inside `"use cache"` with the `snapshot` tag (the last good snapshot is served for seconds at a time if the API blips); leads, orders (409 refusals mapped to changed, minimum, cod, pickup), order tracking, feedback, payment proofs, search logs and newsletter sign-ups go to `/api/v1/public/*` with the visitor address and the form's idempotency key; the API's own 429 stays a 429. `POST /api/revalidate` checks the HMAC-SHA256 signature in constant time, refuses calls older than five minutes and expires the snapshot and every data tag at once. The newsletter form posts to the new `/api/newsletter` (busy state, failure message from messages) and no longer repeats the same element ids when the blog page and the footer both show it. `apps/web/.env.example` and the README document the switch |
| Files and components | `apps/web/src/lib/data/api/{apiClient,snapshot,apiRepositories}.ts` (+ tests), `lib/data/{source,leads,orders,content,tags}.ts`, `lib/http/{intakeFailure,signature}.ts` (+ test), `lib/http/handleSubmission.ts`, `app/api/{revalidate,newsletter}/route.ts`, `app/api/{leads,orders,feedback,payment-proof,search/log}/route.ts`, `shop/track/page.tsx`, `components/layout/NewsletterForm.tsx`, `vitest.config.ts` (server-only alias), `apps/web/.env.example`, `.gitignore` |
| Screens matched | — (no visual change; newsletter busy state) |
| Admin control | Section 4 rows now served by the API in API mode |
| Tests | web +9 (API config, client headers, 204, refusals; snapshot parsing round trip and broken key; HMAC); web unit 219 passed; e2e layout, orders, content, smoke, flights 41 passed in fixture mode |
| Widths checked | — |
| Tools and skills | Serena; Next.js 16 bundled docs (cacheLife nesting, revalidateTag `{ expire: 0 }` from route handlers) |
| Decisions | D136 |
| Bugs and follow-ups | Turnstile has no browser widget yet: setting TURNSTILE_SECRET_KEY would refuse every form (follow-up issue); API-mode end-to-end run waits for a database (local PostgreSQL stopped for low memory) |

### #57 · B4 Admin API — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 00:33 → 11 Oct 00:58 |
| Branch · PR · merge | `feat/57-admin-api` · #63 · `0e09e5b` |
| Built | Under `/api/v1/admin`, staff Bearer token and roles: dashboard (KPIs for the person's modules, leads by module and status, orders and revenue this month, pending feedback and proofs, top routes, activity); leads (saved views all, open, mine, unassigned, overdue by the admin SLA; module, status, assignee, created dates, search by reference, name, email or phone; detail with timeline, duplicate links; status rules with first-response and closed stamps, Booked amount, Cancelled and Lost reason; priority and assignee; notes, calls, emails, WhatsApp; bulk assign and status; CSV export with formula neutralising and a byte order mark); orders (list, detail with history and proofs, workflow transitions, courier required to ship, payment verified, cancellation puts stock back; Accounts may verify payment only); feedback moderation (approval needs consent, refreshes the public wall); payment proofs (verify marks the order paid); search activity with top routes and the search-to-lead rate; subscribers; email log; generic content for every CONTENT_MODEL key (overview by role, read, create, save with optimistic version and id moves, delete, reorder, settings) validated with the shared schemas; users and roles (add with a first password, roles, deactivate with sign-out everywhere, reset, last Super Admin kept), own password change, staff directory, audit log. Every write is audited; content writes rebuild the snapshot and call the web's revalidation |
| Files and components | `apps/api/src/admin/{access,admin.controllers,admin.module,leads.service,orders.service,inbox.service,content-admin.service,users.service,dashboard.service}.ts`, `src/docs/openapi.ts` (admin routes), `src/features.ts`, `test/admin.test.ts`; `packages/shared/src/schemas/admin.ts` (list queries and inputs) |
| Screens matched | — (admin screens in A18 – A21) |
| Admin control | Every content row is written through `PUT /api/v1/admin/content/:key/:id` or `PUT /api/v1/admin/settings/:key` |
| Tests | API +11 (roles and tokens, lead lists by role and view, status rules with timeline and audit, bulk and CSV, order workflow and restock, proof verification, feedback moderation into the snapshot, content validation, versions, reorder and delete, settings versions and role boundaries, staff management and passwords, dashboard and search activity) |
| Widths checked | — |
| Tools and skills | Serena; Prisma groupBy and aggregates |
| Decisions | D135 |
| Bugs and follow-ups | Customers, reports and bookings records are post-launch (cut list) |

### #56 · B3 Public API: snapshot, intake and notifications — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 23:40 → 11 Oct 00:33 |
| Branch · PR · merge | `feat/56-public-intake` · #62 · `d179a0f` |
| Built | Under `/api/v1/public`, server to server with the intake key (constant-time check): GET snapshot (every content key the site renders, private keys empty, approved feedback without contact details; ETag and 304, rebuilt after writes); POST leads for every module (per-day references from an atomic sequence, duplicate flag for the same phone and module within 24 hours, a "created" activity, customer and staff emails); POST orders priced on the server with the shared `priceCart`, running deals and scheduled coupons, product documents locked FOR UPDATE while stock is taken, refusals (changed, minimum, cod, pickup) returned as 409 with the quote; POST orders/track (order number plus the last ten digits of the phone); POST feedback (pending, staff alert), payment-proofs (accounts alert with the account name), search-logs and subscribers. Idempotency-Key header (UUID) on every create: the outcome is replayed for 24 hours, refusals release the key. Per-visitor limits behind the web's. Notifications: admin templates with `{{variables}}`, BullMQ queue with 5 retries and backoff when Redis is set (worker process), in-process otherwise, every email in the notification log; Resend, SMTP (Mailpit) or memory. Web revalidation client (HMAC-signed, batched). OpenAPI 3.1 from the zod contracts at /api/v1/openapi.json outside production |
| Files and components | `apps/api/src/public/{public.controller,public.module,intake.service}.ts`, `src/content/content.service.ts`, `src/notifications/{mailer,notification.service}.ts`, `src/revalidate/revalidate.service.ts`, `src/common/{idempotency.service,references,serverKey}.ts`, `src/services.module.ts`, `src/docs/openapi.ts`, `src/worker.ts`, `src/features.ts`, `test/public.test.ts`; `packages/shared/src/helpers/{leadSummary,deals}.ts`, `OrderTrackInputSchema`, `SubscriberInputSchema` |
| Screens matched | — |
| Admin control | Section 4 API column filled: every content row → `GET /api/v1/public/snapshot`; leads, orders, track, feedback, proofs, search logs → `POST /api/v1/public/*` |
| Tests | API +11 (intake key, snapshot ETag and 304, lead references, replay and duplicate flag with emails, Idempotency-Key and unknown fields, order pricing, stock and tracking, refusal then retry with the same key, two orders racing for the last item, feedback moderation and privacy, payment proof alert, search logs and subscribers, OpenAPI); shared +2 (lead summary) +1 (BIN); web +1 (idempotency keep) |
| Widths checked | — |
| Tools and skills | Serena; zod 4 `toJSONSchema`; BullMQ, nodemailer |
| Decisions | D130 – D134 |
| Bugs and follow-ups | #60 VAT invoice BIN regex (fixed here), #61 checkout stuck after a refusal (fixed here). The local PostgreSQL was stopped by the system for low memory on 11 Oct; API database tests ran in CI |

### #55 · B2 Staff auth, roles and audit log — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 21:15 → 11 Oct 00:02 |
| Branch · PR · merge | `feat/55-staff-auth` · #59 · `de36338` |
| Built | POST /api/v1/auth/login, /refresh, /logout and GET /auth/me: argon2id passwords, 15-minute HS256 access tokens bound to an open session, rotating 7-day refresh tokens stored only as SHA-256 hashes, reuse detection (an old refresh token closes every session of that person), lockout for 15 minutes after five wrong passwords (audited), one error message for unknown emails and wrong passwords, 5 sign-ins per 15 minutes per address (the web passes the visitor address with the server key). StaffGuard + @Roles (Super Admin passes every check) and the audit service for every admin write |
| Files and components | `apps/api/src/auth/{auth.controller,auth.service,auth.guard,auth.module,tokens,principal}.ts`, `src/audit/audit.service.ts`, `src/common/rateLimit.ts`, `src/features.ts`, `test/auth.test.ts` |
| Screens matched | — (admin sign-in screen in A18) |
| Admin control | — |
| Tests | API +7 (sign-in and /me, same message for wrong password and unknown email, lockout with audit, refresh rotation and reuse detection, logout, role guard with forged and expired tokens); API suite 15 passed |
| Widths checked | — |
| Tools and skills | Serena; jose for JWT, argon2 |
| Decisions | D129 |
| Bugs and follow-ups | TOTP two-factor is P1 (Phase D) |

### #54 · B1 API foundation and database — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 20:45 → 10 Oct 21:07 |
| Branch · PR · merge | `feat/54-api-foundation` · see section 13 · squash |
| Built | apps/api: NestJS 12 on the Fastify adapter (ESM, run with tsx), env validated with zod (production refuses to start without Redis, an email provider and real secrets), pino logs with request IDs (incoming x-request-id kept) and redacted secrets, RFC 7807 problem responses, helmet, CORS for the web origins, /health and /ready (database check), graceful shutdown. PostgreSQL through Prisma 7 with the pg driver adapter: staff and sessions, reference sequences, idempotency records, leads and activities, search logs, orders with item snapshots and status events, feedback, payment proofs, subscribers, admin content documents and settings, audit and notification logs, with indexes on every filter. An idempotent seed loads the Sample content through the shared content model and creates the first Super Admin from env (12+ characters, argon2id); it never overwrites admin edits. Dockerfile (migrate, seed, start), docker-compose (PostgreSQL 16, Redis 7, Mailpit), CI PostgreSQL service |
| Files and components | `apps/api/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.ts,prisma.config.ts,Dockerfile,.env.example}`, `apps/api/prisma/{schema.prisma,migrations,seed.ts}`, `apps/api/src/{app,main,features,core.module}.ts`, `src/config/env.ts`, `src/prisma/prisma.service.ts`, `src/common/problem.ts`, `src/health/health.controller.ts`, `src/seed/seedDatabase.ts`, `apps/api/test/*`, `packages/shared/src/content/registry.ts` (CONTENT_MODEL), `docker-compose.yml`, CI service, README API section |
| Screens matched | — |
| Admin control | Every content and settings row (AC-01 – AC-109) now has its storage: Setting (singletons) or ContentDocument (collections) |
| Tests | API +8 (env rules, content model covers every fixture key, /health and /ready, request ID and RFC 7807 404, idempotent seed that keeps admin edits, weak first password refused) |
| Widths checked | — |
| Tools and skills | Serena, WebFetch for the NestJS 12 migration guide and the Prisma 7 upgrade guide (Context7 disconnected), local PostgreSQL 17 binaries |
| Decisions | D125 – D128 |
| Bugs and follow-ups | B2 auth (#55), B3 public intake (#56), B4 admin API (#57) |

### #51 · Review findings for A6 – A16 (lead quality, navigation, links, SEO) — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 20:40 → 10 Oct 20:42 |
| Branch · PR · merge | `fix/51-review-findings` · see section 13 · squash |
| Built | Flight step 2 asks who travels (adults, children with ages, infants within adults, nine at most) so a visitor without a search is no longer sent as one adult; hotel step 2 asks for rooms, adults and children with ages, hotel class and the best time to call; store bar gets a category row (top categories that hold products, Printing Solutions, International Trading) and Track order; visa list "Start an application"; the footer names the brand in text (one logo per page); Home metadata from the admin SEO fields with its own canonical and an h1 fallback; unique visa country descriptions; collection description fallback; service pages and About honour noIndex; production builds fail without NEXT_PUBLIC_SITE_URL; group fares use `?groupFare=` (the search card keeps `fare` for the fare type) and partial links (`/flights?to=KUL`) prefill To and the admin default origin; banner and footer links no longer land on an empty category or an ignored parameter |
| Files and components | `components/forms/{TravellersFields,RoomsGuestsFields}.tsx`, `lib/leads/{flightLeadForm,hotelLeadForm}.ts`, flights `TripStep`, `FlightRequest` and page, hotels `StayStep`, `components/shop/ShopBar.tsx`, `components/layout/SiteFooter.tsx`, `components/travel/GroupFareCard.tsx`, home page and `HomeSections`, visa list and country pages, collection page, service pages, `lib/siteUrl.ts`, `lib/rateLimit.ts`, fixtures links; e2e `errors.ts` now fails on any 404 |
| Screens matched | Flights-2, Hotels-2, ShopBar, Visa, Footer |
| Admin control | AC-04 (search default origin) used for partial links; SEO rows use `siteSettings.defaultSeo` |
| Tests | unit +4 (travellers from the step, infant and nine-traveller rules, rooms and guests distribution, adult per room); e2e +6 (destination-only link, hotel guests and class, store category row and Track order, one logo, visa start, Home title and canonical); suite 87 passed in parallel |
| Widths checked | 390 · 1440 (tests) |
| Tools and skills | Serena, subagent reviews (links and SEO, board fidelity), Playwright test runner; skills ui-ux-pro-max rules |
| Decisions | D120 – D124 |
| Bugs and follow-ups | Not fixed by choice: "See all" on best sellers and new arrivals still opens the noindex search page (it shows the right list; indexing it adds nothing). Board polish list moved to #22; motion moments to #52 |

### #17 · A17 System states: 404, 500, offline, maintenance, Live placeholder — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 19:50 → 10 Oct 20:02 |
| Branch · PR · merge | `feat/17-system-states` · see section 13 · squash |
| Built | Branded 404 inside the site frame for unknown URLs (`[...rest]` catch-all) and unknown records (`notFound()`), with Home and five popular pages; the site error boundary (Try again, WhatsApp with the error ID, call, home) using the server digest as the error ID; a last-resort `global-error`; an offline notice above the tab bar (online/offline events, Try again, Call us instead); maintenance mode from Admin settings replacing the public site (logo, message, optional "Back by", WhatsApp and call; noindex), admin and API unaffected; one Live placeholder for the results slot (flights, hotels) |
| Files and components | `app/[locale]/(site)/{not-found,error}.tsx`, `app/[locale]/(site)/[...rest]/page.tsx`, `app/global-error.tsx`, `components/feedback/{SystemState,SupportContact,OfflineNotice,MaintenanceScreen}.tsx`, `components/results/LivePlaceholder.tsx`, site layout (maintenance switch, Errors messages for the boundary, support contact, offline notice); shared: `MaintenanceSettingsSchema.backAt` |
| Screens matched | Error, Error500, Error-m, Offline, Offline-m, Maintenance, Maintenance-m, States |
| Admin control | AC-19 used (maintenance message, now with backAt); AC-07 numbers in the error and offline states |
| Tests | e2e +4 (unknown URL → branded 404 inside header and footer at 320 and 1440 with axe and noindex, unknown product → same 404, offline notice on and off); package not-found test now expects the branded page; suite 81 passed |
| Widths checked | 320 · 390 · 1440 |
| Tools and skills | Serena, Playwright test runner and screenshot script; skills frontend-design, ui-ux-pro-max rules |
| Decisions | D116 – D119 |
| Bugs and follow-ups | Footer repeats the WAAFA logo (correction 4: one logo per page) → review-fix issue. Maintenance toggling is tested once the admin settings screen exists (A21) |

### #16 · A16 Information pages: About, Contact, FAQs, Blog, Gallery, Feedback, policies, Baggage, EMI, Offline payment — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 18:10 → 10 Oct 19:45 |
| Branch · PR · merge | `feat/16-content-pages` · see section 13 · squash |
| Built | 15 routes: `/about-us` (story, services, routes from Dhaka, journey, values, team grid with initials, visit card when no office photo), `/contact` (four channels, CNT message form, hours, directions), `/faqs` (instant search, topic chips with counts, FAQPage markup, WhatsApp when nothing matches), `/blog` and `/blog/[slug]` (editor's pick, topics, search, contents list, service call to action, related posts, BlogPosting markup), `/gallery` and `/gallery/[slug]` (latest album, kinds, masonry with the shared lightbox, video links out), `/feedback` (approved and consented wall only, honest empty state, form stored as pending), the three policies (In short, On this page, questions card), `/baggage-information` (facts, allowance table with route, class and airline search, cabin-or-checked rules), `/emi` (calculator, steps, banks, rules) and `/offline-payment` (admin accounts, steps, proof form). New intake routes `/api/feedback` and `/api/payment-proof` share one submission handler (same-site, cap, rate limit, Turnstile, idempotency) |
| Files and components | `components/content/{PageHero,ArticleContents,InfoCard,PolicyPage,RatingStars}`, `components/forms/{StarRatingInput}` (+ DocumentSlot images-only mode), `lib/http/handleSubmission.ts`, `lib/leads/{contactLeadForm,paymentProofForm}.ts`, `lib/content/feedbackForm.ts`, `lib/shop/emi.ts`, route folders above with their `_components`; shared: `PageBlockSchema`, `FeedbackCreateInputSchema`, `PaymentProofInputSchema`, optional feedback rating; fixtures: `pageBlocks`; repositories: listPageBlocks, createFeedback, submitPaymentProof; sanitiser allows simple tables; sitemap lists every indexable route (pages through products, skips empty categories and noindex records) |
| Screens matched | About, Contact, Contact-sent, Faqs, Faqs-search, Blog, BlogPost, Gallery, Gallery-album, Gallery-photo, Feedback, Feedback-sent, Refund, Privacy, Terms, Baggage, Emi, OfflinePay, OfflinePay-sent (+ -m) |
| Admin control | AC-45 – AC-54 used; AC-106 – AC-109 new |
| Tests | unit +19 (contact, feedback and proof forms, EMI maths, table sanitising, page blocks, pending feedback, proofs); e2e +10 (14 routes at 320 and 1440 with no overflow or console errors, axe on all 14 at 390, contact → CNT, feedback pending and not on the wall, proof needs a transaction ID or slip, FAQ search and WhatsApp, baggage filters, EMI monthly amount, album lightbox); suite 77 passed |
| Widths checked | 320 · 390 · 1440 by script screenshots and tests (768 / 1024 in A22) |
| Tools and skills | Serena, Playwright test runner and screenshot script (MCP disconnected), subagent reviews (links and SEO, board fidelity); skills frontend-design, ui-ux-pro-max rules |
| Decisions | D110 – D115 |
| Bugs and follow-ups | Fixed in-issue: slider thumb had no accessible name (axe), duplicated hint text on upload slots, home gallery tiles linked to `/gallery?album=`. Review findings for earlier issues go to the review-fix issue |

### #15 · A15 Printing Solutions and International Trading — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 16:20 → 10 Oct 17:40 |
| Branch · PR · merge | `feat/15-services` · see section 13 · squash |
| Built | `/shop/printing-solutions` and `/shop/international-trading`: hero with facts and a photo or real loop, services, how it works, the shared two-step request card (contact first, then the service step) with a side photo on desktop, questions with FAQPage markup. Printing quote: company, service, printers, pages, branches, frequency, location, models, notes, optional file, consent → PRN reference. Trading RFQ: company, request type, product, quantity and unit, country, specifications, target price, delivery terms, timeline, optional file, consent → TRD reference. Both in the sitemap |
| Files and components | `ServicePageSchema` (shared), fixture `servicePages`, `getServicePage` (repository, cached accessor), `components/services/{ServicePageView,PrintingRequest,TradingRequest,AttachmentField}`, `components/forms/{ConsentField,StepActions}`, `lib/leads/serviceLeadForm.ts`, two route pages |
| Screens matched | Printing, Printing-done, Printing-m, Trading, Trading-done, Trading-m |
| Admin control | AC-104, AC-105 new; media slots printing-header, printing-quote-side, trading-header, trading-rfq-side used |
| Tests | unit +4 (service lead contracts and rules); e2e +3 (printing quote with validation → PRN reference, trading RFQ with validation → TRD reference, both pages at 1440 with no overflow); suite passes · axe pass on both pages and both forms |
| Widths checked | 390 and 1440 by test (overflow and axe); 320 / 768 / 1024 and Lighthouse left for A22 (Playwright MCP unavailable) |
| Tools and skills | Serena, Playwright test runner; skills frontend-design, ui-ux-pro-max rules |
| Decisions | D108 – D109 |
| Bugs and follow-ups | Printing service enum gained new-printers and paper-supplies. Follow-ups: 320 / 768 / 1024 screenshots, Lighthouse, design review pass (A22) |

### #14 · A14 Waafas World cart, checkout, order success and track order — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 15:40 → 10 Oct 16:10 |
| Branch · PR · merge | `feat/14-cart-checkout` · see section 13 · squash |
| Built | `/shop/cart`: guest cart priced by the server (current price, deals, stock), free-delivery bar, quantity steppers, coupon with applied / invalid-or-expired / below-minimum states, delivery area switch, minimum order, empty state. `/shop/checkout`: one page with contact, VAT invoice switch (company, BIN), address or office pick-up, payment (cash on delivery up to the admin limit, otherwise an admin-listed bKash, Nagad or bank account with transaction ID and optional proof), summary, idempotent submit, boarding-pass success with ORD number and next steps (bank details for transfers). `/shop/track`: order number plus phone, progress timeline with courier and tracking number, not-found state with WhatsApp. Server pricing is one shared function (`priceCart`), so the browser never sets a price |
| Files and components | `packages/shared/src/helpers/orderPricing.ts`, shared order schemas (`OrderCreateInputSchema`, invoice, pickup), `app/api/shop/quote`, `app/api/orders`, `lib/data/orders.ts`, `lib/data/source.ts` (globalThis store), `lib/shop/checkoutForm.ts`, `lib/useHydrated.ts`, `components/shop/{CartLineRow,CartSummary,FreeDeliveryBar,EmptyCart,CheckoutSummary,PaymentOptions,OrderDone,OrderTimeline,useQuote,useCartPrefs}`, `components/forms/{RadioCard,DocumentSlot}` (DocumentSlot moved from visa), `shop/{cart,checkout,track}` routes; repository: getProductsByVariantIds, createOrder, findOrder |
| Screens matched | ShopCart, -empty, -coupon, -m, ShopCheckout, -err, -m, ShopDone, -bank, -m, ShopTrack, -nf, -delivered, -m |
| Admin control | AC-24, AC-98 used; AC-100 – AC-103 new |
| Tests | unit +19 (pricing 10, checkout form 7, order repository 1, plus shared); e2e +4 (coupon and zone pricing, quantity and remove; COD order → ORD reference → track by phone → wrong phone not found; COD blocked over the limit and bKash order with transaction ID; delivered sample timeline); suite 64 passed · axe pass on cart, checkout and track · production build green |
| Widths checked | 390 and 1440 by screenshot; 320 / 768 / 1024 not re-run this session (Playwright MCP was lost when the node processes were stopped), covered by A22 |
| Tools and skills | Serena, Playwright test runner and MCP, Context7 earlier in the project; skills frontend-design, ui-ux-pro-max rules |
| Decisions | D102 – D107 |
| Bugs and follow-ups | Fixed in-issue: in-memory orders were invisible to the track page (route handlers and pages are separate module graphs; store now on globalThis); COD chosen then blocked switches to the first transfer account. Follow-ups: mini-cart drawer and fly-to-cart arc, save for later, "often bought together", corporate quote for the cart (not built, cut to A22); Lighthouse for the three routes; 320 / 768 / 1024 screenshots |

### #13 · A13 Waafas World catalogue: store home, listings, product, finder, search — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 13:35 → 10 Oct 15:30 |
| Branch · PR · merge | `feat/13-store` · see section 13 · squash |
| Built | Store bar under the header ("Waafas World" as text from settings, no second mark; search with grouped suggestions and keyboard support; categories, deals and Find by model links; cart with a live count). `/shop`: admin-ordered rows that hide when empty (campaign carousel with bulk and finder strips, categories with counts, collections, deals with a Dhaka-time countdown, best sellers, brands, new arrivals, recently viewed, Waafa International services, corporate band, trust row). Listings for category (attribute filters from the category set, sub-category chips, finder strip), brand, collection, search and deals, plus all categories: GET filters (brand, price band, availability, attributes), sort, count, Load more, empty state with WhatsApp sourcing, bulk strip. Product page: gallery that follows the variant with thumbnails and a lazy zoom lightbox, stock badge, SKU, price against MRP and saving, swatch and size selectors with sold-out states, quantity, Add to cart and Buy now, delivery by zone, COD limit, warranty and refund link, Compatible with, highlights, description with product video, spec table, warranty cards, corporate quote (QTE) and WhatsApp, related and recently viewed, phone buy bar, Product JSON-LD. Find by model (brand → model, part code). PCard: percent off, badges, stock, Add to cart → stepper, Choose options. Guest cart in localStorage (A14 builds the cart page). Deals apply one effective price everywhere |
| Files and components | `app/[locale]/(site)/shop/{layout,page}.tsx`, `shop/_components/CampaignCarousel.tsx`, `shop/{c,brand,collection}/[slug]/page.tsx`, `shop/{search,deals,categories,finder}/page.tsx`, `shop/p/[slug]/{page.tsx,_components/ProductView.tsx}`, `components/shop/{ShopBar,ShopSearchBox,CartButton,useCart,ProductCard,AddToCartControl,StockBadge,ProductListing,ListingHeader,ListingSkeleton,DealCountdown,RecentlyViewed,useRecentlyViewed,BulkQuote,BulkQuoteDialog}`, `components/forms/FilterDisclosure.tsx` (moved), `components/media/PhotoLightbox.tsx` (moved), `lib/shop/{variants,cart,deals,catalogue}.ts`, `lib/leads/bulkLeadForm.ts`; shared: bulk lead module (QTE), `ShopContentSchema`, store row title and subtitle, `shop-service-trading` media slot; fixtures: shop content, collection photos; repository attribute filter |
| Screens matched | Shop, Shop-m, Shop-suggest, Shop-bulk, ShopCats, ShopCats-m, ShopList, ShopList-printers, ShopList-empty, ShopList-m, ShopList-m-filters, ShopList-m-fashion, ShopDeals, ShopDeals-m, ShopProduct, -pb, -hp, -toner, -video, -bulk, ShopProduct-m-*, ShopFinder, -part, -none, ShopFinder-m, ShopSearch, ShopSearch-m (Shop-mega is the A6 header panel) |
| Admin control | AC-24, AC-36 – AC-42, AC-60 used; AC-95 – AC-99 new |
| Tests | unit +24 (variant resolution and option picking, availability, price/MRP/percent off, price range, stock badges, images, cart add/merge/clamp/remove/parse, deals, bulk quote contract, attribute filters in the repository); e2e +6 (suggestions → product, attribute filter → variant changes update SKU and price → sold-out → cart count, card stepper persists after reload, finder by model and part code, corporate quote QTE, deal timers); suite 60 passed · axe pass · no overflow at 320 / 390 / 768 / 1024 / 1440 on 10 store routes · Lighthouse mobile `/shop` 67 / 100 / 96 / 100, category 75 / 100 / 96 / 92 → meta description fixed, product 75 / 99 → label fixed / 96 / 100, finder 77 / 100 / 96 / 100 |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | Serena, Context7, Playwright MCP and scripts, Lighthouse CLI; skills frontend-design, ui-ux-pro-max rules (44 px swatches and steppers, labelled groups, sold-out states) |
| Decisions | D92 – D101 |
| Bugs and follow-ups | Fixed in-issue: deals countdown overflowed 2-column phone grid; phone buy bar cut the price at 320 px; stacked buy buttons collapsed on phones; zoom button name included badge text; category pages without a description had no meta description. Follow-ups: cart page, mini-cart and fly-to-cart (A14); numeric attribute ranges (D96); #39 perf |

### #12 · A12 Visa services (list, country, apply) + Visa Guide — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 12:20 → 10 Oct 13:30 |
| Branch · PR · merge | `feat/12-visa` · see section 13 · squash |
| Built | `/visa-services`: GET search, popular links, region chips with counts, country cards (code mark, types, processing, fee from, submission chip), empty state with WhatsApp, how it works, visa questions. `/visa-services/[country]`: a tab per visa type kept in `?type=`, facts, documents checklist with a progress ring, forms, good to know, guide link, questions (FAQPage JSON-LD), sticky fee card (embassy fee, service charge, total) and a phone bar. `/visa-services/[country]/apply`: shared LeadRequestCard (contact first), then trip (type, date, applicants), four document slots (JPG, PNG or PDF up to 5 MB; files stay in the browser, only name, type and size are sent), optional office visit day and window from admin office days, notes, review with fees, consent → VSA reference. `/visa-guide` and `/visa-guide/[slug]`: featured guide and list; article with an On this page list, sanitised rich text, fees, tips, questions and the service link (both ways). Dynamic param pages (package detail, visa country, apply, guide) now await params inside Suspense |
| Files and components | `app/[locale]/(site)/visa-services/{page.tsx,[country]/page.tsx,[country]/_components/{VisaTypeProvider,useVisaType,VisaTypeTabs,VisaChecklist,VisaFeeCard,VisaFeeBar}.tsx,[country]/apply/{page.tsx,_components/{VisaApplyRequest,VisaFileStep,DocumentSlot}.tsx}}`, `app/[locale]/(site)/visa-guide/{page.tsx,[slug]/page.tsx}`, `components/content/RichText.tsx`, `components/seo/Canonical.tsx`, `components/visa/VisaCountryCard.tsx` (submission chip), `lib/visa/visaFiles.ts`, `lib/leads/visaLeadForm.ts`, `lib/content/sanitizeRichText.ts`, `app/sitemap.ts` |
| Screens matched | Visa, Visa-none, Visa-m, VisaCountry, VisaCountry-medical, VisaCountry-m, VisaApply, VisaApply-2, -3, -4, -err, -done, VisaApply-m-*, VisaGuide, VisaGuidePost (+ -m) |
| Admin control | AC-33, AC-34, AC-35 used; AC-92 – AC-94 new (visa header media slots are not used yet) |
| Tests | unit +11 (file type and size, extension fallback, application schema, fee maths, visa lead contract without storage keys, sanitiser); e2e +4 (search → country → tab in URL → checklist ring → Apply link, empty state, apply with a rejected then accepted file → VSA reference, guide ↔ service links); suite 54 passed · axe pass · no overflow at 320 / 390 / 768 / 1024 / 1440 · Lighthouse mobile `/visa-services` 77 / 100 / 96 / 100, country 76 / 99 → heading fixed / 96 / 100, apply 70 / 100 / 96 / 69 (noindex by design), `/visa-guide` 85 / 100 / 96 / 100, guide article 82 / 100 / 96 / 100 |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | Serena, Context7 (Next.js Cache Components instant navigation, sanitize-html, next-intl metadata), Playwright MCP and scripts, Lighthouse CLI; skills frontend-design, ui-ux-pro-max rules |
| Decisions | D85 – D91 |
| Bugs and follow-ups | Fixed in-issue: dev "URL data during prerendering" error on dynamic param pages (also on the merged package detail); package visa link pointed at `/visa`; fee list put a paragraph inside `<dl>` (axe) |

### #11 · A11 Tour packages, package detail and query, Plan My Trip — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 09:50 → 10 Oct 12:10 |
| Branch · PR · merge | `feat/11-packages` · see section 13 · squash |
| Built | `/tour-packages`: keyword search, GET filter form (destination, kind of trip, length, budget, month, sort; a disclosure on phones), count, card grid, Load more, empty state to Plan my trip, plan CTA band. `/tour-packages/[slug]`: adaptive photo bento with a lazy lightbox (Embla), tags, Sample badge, share (system sheet or copy), facts, sticky section nav, highlights, day-by-day timeline with Expand all, included / not included, prices table with an Indicative chip, departures with seats and Any date, hotels, visa card linking the country page, terms and refund link, questions, related trips, TouristTrip JSON-LD; desktop sticky booking card (departure, travellers, room, indicative estimate, Send query, WhatsApp) and a phone booking bar above the tab bar; the inline query (shared LeadRequestCard, PKG reference) prefilled from the booking card. `/plan-my-trip`: how it works, two-step request (places from admin chips or typed, flexible month or exact dates, nights, travellers, trip for, budget band, hotels, interests, flights and visa switches, contact preference) with a CTR reference; help card. Sitemap lists packages and Plan my trip |
| Files and components | `app/[locale]/(site)/tour-packages/{page.tsx,_components/FilterDisclosure.tsx,[slug]/page.tsx,[slug]/_components/{PackageGallery,PackageLightbox,ShareButton,ItineraryDays,BookingCard,BookingBar,PackageBookingProvider,usePackageBooking,PackageQuery,QueryStep}}`, `app/[locale]/(site)/plan-my-trip/{page.tsx,_components/{PlanTripRequest,PlanStep}.tsx}`, `components/forms/{NumberStepper,ChipRadioGroup,ChoiceChip}.tsx`, `lib/leads/{packageLeadForm,planTripLeadForm}.ts`, `app/sitemap.ts`; shared: PlanTrip payload (budget band, hotel class with resort, trip for, flights, visa), `SearchSettings.planTripPlaces` |
| Screens matched | Packages, Packages-empty, Packages-m, Packages-m-filters, PackageDetail, PackageDetail-photos, PackageDetail-query, PackageDetail-done, PackageDetail-m-*, PlanTrip, PlanTrip-4, PlanTrip-done, PlanTrip-m-* |
| Admin control | AC-30, AC-31 used; AC-88 – AC-91 new |
| Tests | unit +7 (package query rules, PKG and CTR lead contracts, estimate maths); e2e +5 (filter → detail, booking bar → query → PKG reference, unknown slug, booking card choices carried into the query + lightbox, plan validation → CTR reference); suite 50 passed · axe pass at 390 and 1440 · no overflow at 320 / 390 / 768 / 1024 / 1440 · Lighthouse mobile `/tour-packages` 73 / 100 / 96 / 100, package detail 68 / 100 / 96 / 100 (61 before the lazy lightbox), `/plan-my-trip` 68 / 100 / 96 / 100 (#39) |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | Serena, Playwright MCP and scripts, Lighthouse CLI; skills frontend-design, design-taste-frontend, ui-ux-pro-max rules (chips 44 px, labelled radio groups, focus rings) |
| Decisions | D78 – D84 |
| Bugs and follow-ups | Fixed in-issue: chip radios in flights and hotels were off-centre (hidden radio kept 20 px in the flow); #39 (perf, JS 440 KB on package detail); branded 404 page (A17) |

### #10 · A10 Hotels Manual mode — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 09:00 → 10 Oct |
| Branch · PR · merge | `feat/10-hotels` · see section 13 · squash |
| Built | `/hotels` on the shared results shell: summary bar (Edit opens the search card on the hotel tab, prefilled), sea view and free cancellation preferences (rail or sheet), Manual/Live switch, help card; two-step hotel request (contact, then the stay prefilled from the URL: place, nationality, dates, budget band, meals, contact preference, notes, consent) with an HTL reference and three next steps. The request card is now a shared `LeadRequestCard` with a shared `ContactStep` and a `Leads` message namespace, reused by flights and the next modules |
| Files and components | `app/[locale]/(site)/hotels/{page.tsx,_components/{HotelRequest,StayStep}.tsx}`, `components/leads/{LeadRequestCard,ContactStep}.tsx`, `lib/leads/{contactForm,hotelLeadForm}.ts`, `lib/search/flightDraft.ts` (hotel draft), `HotelLeadPayloadSchema` (budget band, meals, sea view, free cancellation) |
| Screens matched | Hotels, Hotels-2, Hotels-done, Hotels-m, Hotels-m-2, Hotels-m-done |
| Admin control | AC-86 – AC-87 |
| Tests | unit +4 (stay rules, hotel lead contract); e2e +2 (search → steps → HTL reference, stay rules); suite 45 · axe pass |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | Serena, Playwright scripts; skills frontend-design, ui-ux-pro-max rules |
| Decisions | D75 – D77 |
| Bugs and follow-ups | #39 (perf); "Hotels we know" list deferred (D76) |

### #9 · A9 Results shell + Flights Manual mode + group fares — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 06:40 → 10 Oct |
| Branch · PR · merge | `feat/9-flights` · see section 13 · squash |
| Built | `/flights` results shell: trip summary bar with Edit (the A8 card opens prefilled from the URL), preferences rail (sheet below 1280 px), ResultsBody switching Manual/Live from the public config, sticky help card (call, WhatsApp, live office status, why ask WAAFA); Manual two-step request (React Hook Form + zod: contact with +880 phone picker, then the trip prefilled from the URL or the group fare with a fixed date, contact preference, best time, notes, consent); `POST /api/leads` (same-site, 16 KB, rate limit, Turnstile when keys exist, idempotency key per request); boarding-pass success (drawn check, light confetti, reference, three steps, WhatsApp with the reference); error state; group fares rail; `/flights/group-fares` with a no-JS filter form, sort, empty state and the rules note |
| Files and components | `app/[locale]/(site)/flights/{page.tsx,_components/*,group-fares/page.tsx}`, `components/results/{TripSummaryBar,HelpCard,ResultsBody,GroupFaresRail}`, `components/leads/{LeadSuccess,Confetti}`, `components/forms/{FormField,PhoneField}`, `lib/leads/{flightLeadForm,phone,idempotency,turnstile}.ts`, `lib/http/readCappedBody.ts`, `lib/search/flightDraft.ts`, `app/api/leads/route.ts`, `FlightPreferencesSchema`, `LeadFormSettings.phoneCountries` |
| Screens matched | Flights, Flights-2, Flights-done, Flights-err, Flights-edit, FlightsFare, Flights-m, Flights-m-2, Flights-m-done, Flights-m-err, Flights-m-prefs, FlightsFare-m, GroupFares, GroupFares-empty, GroupFares-m, GroupFares-m-empty |
| Admin control | AC-81 – AC-85 |
| Tests | unit +14 (phone E.164, idempotency, flight lead form, flight draft); e2e +6 (search → steps → success with reference, validation, step 2 rules, one idempotency key on double submit, group fare request with fixed date, empty filter); suite 43 · axe pass · Lighthouse mobile `/flights` 65 / 100 / 96 / 100, `/flights/group-fares` 77 / 99 / 96 / 100 (#39) |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | Serena, shadcn primitives, Playwright scripts, Lighthouse CLI; skills design-taste-frontend, frontend-design, ui-ux-pro-max rules |
| Decisions | D71 – D74 |
| Bugs and follow-ups | #39 (perf); search → results layoutId morph and the route arc are deferred to A22 polish (D74) |

### #7 · A7 Home: 13 sections from data, video hero with word reveal — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct 03:45 → 10 Oct |
| Branch · PR · merge | `feat/7-home` · see section 13 · squash |
| Built | Home from 13 admin-ordered sections (hidden sections and empty data hide themselves): hero with CSS word reveal, rotating destination chip, real video with poster LCP and the search card overlapping the panel; trust strip; offers; group fares as boarding passes with the airline marquee; destination finder with filter chips; featured packages; visa countries; Why WAAFA (owner figure, journey, values bento); Waafas World band (text name, categories, services, best sellers); gallery with Facebook and feedback cards; travel guides; five FAQs; Meet our team (bento desktop, snap carousel phones, initials); closing WhatsApp and office band; Organization + TravelAgency JSON-LD; robots.txt and sitemap.xml |
| Files and components | `app/[locale]/(site)/page.tsx`, `app/[locale]/(site)/_components/home/*` (HomeSections, HomeSectionShell, SnapRow, HeroSection, TrustSection, OffersSection, OfferCard, GroupFaresSection, DestinationsSection, DestinationFilter, PackagesSection, VisaSection, WhySection, StoreSection, TestimonialsSection, GalleryBlogFaqSection, TeamSection, CtaSection, HomeJsonLd), reusable cards `components/travel/{GroupFareCard,PackageCard,DestinationCard}`, `components/visa/VisaCountryCard`, `components/shop/ProductCard`, `components/content/{SectionHeading,SampleBadge,BlogCard}`, `components/team/TeamCard`, `components/motion/TextRotate`, `HomeContent` contract + fixture, `app/robots.ts`, `app/sitemap.ts` |
| Screens matched | Home, Home-t, Home-m, Home-mfull, Home-mfull2, Home-lower, Home-help |
| Admin control | AC-72 – AC-80 |
| Tests | e2e +5 (admin order, disabled section absent, destination filter, no overflow, axe 390 + 1440, JSON-LD); suite 37 passed · axe pass · Lighthouse mobile `/` 71–74 / 100 / 96 / 100 (budget gap in #39) |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 (no horizontal overflow at any width) |
| Tools and skills | Serena, Context7, shadcn (Accordion, ToggleGroup), Playwright scripts and MCP, Lighthouse CLI; skills design-taste-frontend, frontend-design, ui-ux-pro-max rules |
| Decisions | D66 – D70 |
| Bugs and follow-ups | #39 (perf: LCP bound by JS, fonts and 69 KB HTML on simulated Slow 4G); duplicate "Mixkit · Mixkit" credit fixed; Marquee under reduced motion now wraps (axe scrollable-region) |

### #8 · A8 Unified search card and pickers — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 21:10 → 10 Oct |
| Branch · PR · merge | `feat/8-search-card` · see section 13 · squash |
| Built | Glass search card with Flight / Hotel / Tour / Visa tabs (sliding pill), trip type, From ⇄ To swap, multi-city up to 5 flights; phone pickers as vaul sheets (full screen for lists and calendars), desktop pickers as Radix popovers, both loaded on demand; airport, place, destination, country and visa-type lists (cmdk, typed text in bold, WhatsApp empty state); calendar ranges (2 months desktop, 6 stacked on phones, 30-night cap); travellers, rooms, tour party and applicants steppers with rolling numbers and child ages; month picker; shared-schema validation with errors under fields, a shake and an announcement; nuqs URLs for /flights, /hotels, /tour-packages, /visa-services/[country]; search log by sendBeacon (204, never blocks); recent searches (localStorage) and Back restore (sessionStorage) |
| Files and components | `apps/web/src/components/search/*` (SearchCard, SearchCardClient, SearchCardContext, SearchTabList, TripTypeToggle, SearchField, SwapButton, SearchSubmit, FlightPanel, MultiCityPanel, HotelPanel, TourPanel, VisaPanel, QuickPicks, HelpLine, PickerAnchor, PickerPopover, PickerSheet, PickerSheetBody, PickerBody, OptionList, OptionIcon, NoMatch, CountryCode, AirportPicker, PlacePicker, DestinationPicker, CountryPicker, VisaTypePicker, DatesPicker, RangeBox, MonthPicker, TravellersPicker, RoomsPicker, PartyPicker, CounterRow, ChildAges, PickerFooter, hooks), `components/fx/BorderBeam.tsx`, `components/motion/RollingNumber.tsx`, `lib/search/*`, `app/api/search/{airports,places,log}/route.ts`, `SearchSettings` contract + fixture |
| Screens matched | SearchCard, Pick-m-from, Pick-m-to, Pick-m-dates, Pick-m-range, Pick-m-pax, Pick-m-multi, Pick-m-hcity, Pick-m-rooms, Pick-m-tmonth, Pick-m-vcountry, Pick-m-vtype, Pick-d-from, Pick-d-to, Pick-d-dates, Pick-d-range, Pick-d-pax, Pick-d-rooms, Pick-d-tmonth, Pick-d-vcountry |
| Admin control | AC-32, AC-65 – AC-71 |
| Tests | unit +58 (search state, URL round trips, submit, recent, draft snapshot, highlight, rate limiter) · e2e 11 (phone sheets, desktop popovers, every tab's URL, validation, keyboard, multi-city, 320 px overflow, axe) · axe pass · Lighthouse mobile `/` 74–83 / 99 / 96 / 92 (shell alone 84; budget gap tracked in #39) |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | Serena, Context7 (nuqs, Next.js Activity, react-day-picker v10), shadcn primitives, Playwright MCP, Lighthouse CLI, CDP CPU profile, an independent review subagent; skills design-taste-frontend, frontend-design (direction), ui-ux-pro-max rules |
| Decisions | D57 – D65 |
| Bugs and follow-ups | #39 (perf budget and picker long tasks); hotel stay over 30 nights reset check-in (fixed, regression test); independent review: 15 findings, 14 fixed (phone calendar reach, selected-day contrast, restore once per document, log route byte cap + same-origin + rate limit, stepper focus at limits, popover toggle, 44 px targets, double submit, one-night stays, Dhaka today in calendars and at midnight, same-site recent links, row alignment, repeated announcements); locale-aware formatters move to P1 Bangla (D65) |

### #34 · A1b v4 addendum: signature moments, beat list, persisted design system, inner-page benchmark — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 17:00 → 10 Oct |
| Branch · PR · merge | `docs/34-v4-addendum` · see section 13 · squash |
| Built | MOTION.md §8 signature moments and §9 beat list; reconciled UI UX Pro Max system in `docs/design/design-system/waafa`; DESIGN.md deviation log; Lighthouse mobile on each competitor's package listing (one run each) in COMPETITOR_BENCHMARK §1 and the section 7 table |
| Files and components | `docs/design/MOTION.md`, `docs/design/DESIGN.md`, `docs/design/COMPETITOR_BENCHMARK.md`, `docs/design/design-system/waafa/*` |
| Screens matched | Motion board |
| Admin control | — |
| Tests | — (docs only) · Lighthouse 13.5.0 mobile × 4 competitor pages |
| Widths checked | — |
| Tools and skills | Serena, ui-ux-pro-max (`--design-system --persist`, `--page`), design-taste-frontend, Lighthouse CLI |
| Decisions | Bugs and follow-ups | — |

### #5 · A5 Media: real photos with credits, video loops and posters — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct 06:03 → 10 Oct 00:20 |
| Branch · PR · merge | `feat/5-media` · #37 · `ac2f0b1` |
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
| `/tour-packages` | Packages, Packages-empty, Packages-m, Packages-m-filters | #11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 73 / 100 / 96 / 100 |
| `/tour-packages/[slug]` | PackageDetail, -photos, -query, -done, PackageDetail-m-* | #11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 68 / 100 / 96 / 100 |
| `/plan-my-trip` | PlanTrip, PlanTrip-4, PlanTrip-done, PlanTrip-m-* | #11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 68 / 100 / 96 / 100 |
| `/visa-services` | Visa, Visa-none, Visa-m | #12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 77 / 100 / 96 / 100 |
| `/visa-services/[country]` (+ `/apply`) | VisaCountry, -medical, VisaApply, -2, -3, -4, -err, -done, -m-* | #12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 76 / 99 / 96 / 100 · apply 70 / 100 / 96 / 69 (noindex) |
| `/visa-guide`, `/visa-guide/[country]` | VisaGuide, VisaGuidePost (+ -m) | #12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 85 and 82 / 100 / 96 / 100 |
| `/shop` | Shop, Shop-m, Shop-mega, Shop-suggest, Shop-bulk | #13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 67 / 100 / 96 / 100 |
| `/shop/c/[slug]`, brand, collection, deals, categories | ShopList, -printers, -empty, -m, -m-filters, -m-fashion, ShopCats, ShopDeals | #13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 75 / 100 / 96 / 92 → fixed |
| `/shop/p/[slug]` | ShopProduct, -pb, -hp, -toner, -video, -bulk, -m-* | #13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 75 / 99 → fixed / 96 / 100 |
| `/shop/finder`, `/shop/search` | ShopFinder, -part, -none, ShopSearch | #13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 77 / 100 / 96 / 100 |
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

Phase B (D130): the web reads every public row from one cached snapshot, `GET /api/v1/public/snapshot` (content keys as in `CONTENT_MODEL`, ETag), and the admin edits them through `PUT /api/v1/admin/content/:key/:id` and `PUT /api/v1/admin/settings/:key` (B4). Visitor submissions go to `POST /api/v1/public/*`.

| # | Public element | Data field (accessor → field) | Admin screen | API endpoint | Verified |
| --- | --- | --- | --- | --- | --- |
| AC-01 | Brand names (header, footer, metadata) | `getSiteSettings()` → travelBrand, storeName, companyName | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-02 | Default SEO title, description, share image | `getSiteSettings()` → defaultSeo | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-03 | Header menu (7 items, order, visibility, Waafas World and More panels) | `getMenu("header")` → items[].label, href, icon, panel, visible | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-04 | More panel and sheet (icon, title, one line) | `getMenu("more")` → items[].label, description, icon, href | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-05 | Waafas World mega panel categories | `listCategories()` → level-1 name, description, icon, order | Waafas World › Categories | `GET /api/v1/public/snapshot` | ⬜ |
| AC-06 | Announcement bar | `getActiveAnnouncement()` → text, link, startsAt, endsAt, enabled | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-07 | Hotline chip, Call and WhatsApp buttons, floating WhatsApp | `getContactSettings()` → phoneDisplay, phoneE164, whatsappE164 | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-08 | Open now / Closed chip | `getContactSettings()` → officeHours, read with `getOfficeStatus()` in Asia/Dhaka on the client | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-09 | Need help? panel, drawer contact block, Contact page, Visit our office | `getContactSettings()` → addressLines, city, country, email, officeHoursText, closedText, mapUrl | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-10 | Footer brand column | `getSiteSettings()` → footerTagline, footerAbout; `getContactSettings()` → socials | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-11 | Footer link columns | `getFooterSettings()` → columns[].title, menu; `getMenu("footer-travel" / "footer-shop" / "footer-help")` | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-12 | We accept | `getFooterSettings()` → paymentMethods (live ones only), paymentNote | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-13 | Trust badges (ATAB, TOAB, IATA once held) | `getFooterSettings()` → trustBadges | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-14 | Newsletter band | `getFooterSettings()` → newsletterTitle, newsletterPlaceholder, newsletterButton | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-15 | Bottom bar copyright and legal links | `getFooterSettings()` → copyrightHolder; `getMenu("legal")` | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-16 | Developer credit | Rendered from code (FR-FTR-06) | Not editable, by design | — | — |
| AC-17 | Manual or Live body; Send query or Book now | `getPublicConfig()` → modes.{flights, hotels, packages, shopPayment}.mode, liveLocked, lockReason | Settings › Booking modes | `GET /api/v1/public/snapshot` | ⬜ |
| AC-18 | Online payment at checkout; cash-on-delivery cap | `getPublicConfig()` → onlinePaymentLive, codLimit | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ⬜ |
| AC-19 | Maintenance page | `getPublicConfig()` → maintenance.enabled, message | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-20 | Analytics and verification tags | `getTrackingSettings()` → ga4Id, gtmId, metaPixelId, searchConsoleToken | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-21 | Lead forms: consent line, email required, reply promise | `getLeadFormSettings()` → consentText, emailRequired, slaMinutes | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-22 | Home section order, visibility and heading overrides | `listHomeSections()` → key, enabled, order, title, subtitle | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-23 | Home trust strip | `listTrustItems()` → icon, title, detail, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-24 | Home offers, store campaigns, results banners | `listBanners(placement)` → kicker, title, body, image, link, code, validityText, startsAt, endsAt, order, enabled | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-25 | Airline strip | `listFeaturedAirlines()` → code, name, featuredOrder | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-26 | Destination finder | `listDestinations()` → name, subtitle, iata, image, flightTime, visaNote, visaEasy, bestSeason, fromPrice, tags, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-27 | Why WAAFA values (Home, About) | `listValues()` → icon, title, body, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-28 | Journey timeline (Home, About) | `listTimeline()` → period, text, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-29 | Group fare cards (Home rail, group fares page, results) | `listGroupFares()`, `getGroupFare()` → airline, cabin, baggage, tripType, from, to, stops, departDate, returnDate, seatsLeft, farePerAdult, expiresAt, notes | Sales › Group fares | `GET /api/v1/public/snapshot` | ⬜ |
| AC-30 | Package cards, list filters and sort | `listPackages()` → title, placesLabel, categories, tags, months, durationDays, durationNights, includesShort, cover, fromPrice, popularity | Travel › Tour packages | `GET /api/v1/public/snapshot` | ⬜ |
| AC-31 | Package detail | `getPackage()`, `listRelatedPackages()` → summary, gallery, video, groupSize, visaNote, highlights, itinerary, inclusions, exclusions, prices, departures, anyDate, hotels, visa, terms, faqs, relatedSlugs, seo | Travel › Tour packages | `GET /api/v1/public/snapshot` | ⬜ |
| AC-32 | Airport and hotel-city autocomplete | `searchAirports()`, `listPinnedAirports()`, `searchHotelPlaces()` → iata, city, name, country, pinnedRank; place name, city, popular | Seeded reference data (B6) | `GET /api/v1/public/snapshot` | ⬜ |
| AC-33 | Visa list and country cards | `listVisaCountries()` → name, flagCode, region, submission, popular, cover, types[].type, processingTime, serviceCharge | Travel › Visa | `GET /api/v1/public/snapshot` | ⬜ |
| AC-34 | Visa country page | `getVisaCountry()` → types[].processingTime, stay, entry, validity, checklist, embassyFee, embassyFeeNote, serviceCharge, notes; forms; faqs; guideSlug | Travel › Visa | `GET /api/v1/public/snapshot` | ⬜ |
| AC-35 | Visa Guide list and article | `listVisaGuides()`, `getVisaGuide()` → title, summary, cover, sections, tips, updatedAt, readingMinutes, seo | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ⬜ |
| AC-36 | Store home rows | `listStoreRows()` → key, enabled, order | Waafas World › Collections | `GET /api/v1/public/snapshot` | ⬜ |
| AC-37 | Category grid and listing filters | `listCategories()`, `getCategory()`, `getAttributeSet()` → name, slug, icon, description, banner, parentId, level, attributeSetId, compatibility, order, seo; attributes[].filterable | Waafas World › Categories | `GET /api/v1/public/snapshot` | ⬜ |
| AC-38 | Product cards and product page | `listProducts()`, `getProduct()` → title, shortTitle, badges, cardSpec, highlights, description, specs, warranty, images, video, options, variants (sku, price, mrp, stock, lowStockAt, preOrder, images), codEligible, bulkFrom, seo | Waafas World › Products | `GET /api/v1/public/snapshot` | ⬜ |
| AC-39 | Brands row and brand pages | `listBrands()`, `getBrand()` → name, logo, description | Waafas World › Products | `GET /api/v1/public/snapshot` | ⬜ |
| AC-40 | Collections | `listCollections()`, `getCollection()` → name, description, image, rule, order | Waafas World › Collections | `GET /api/v1/public/snapshot` | ⬜ |
| AC-41 | Deals with an end date | `listDeals()` → dealPrice, endsAt, product, variant | Waafas World › Products | `GET /api/v1/public/snapshot` | ⬜ |
| AC-42 | Find by model | `listCompatibleModels()`, `findCompatibleProducts()` → brand, model, partCodes; product.compatibleModelIds | Waafas World › Products (compatibility CSV) | `GET /api/v1/public/snapshot` | ⬜ |
| AC-43 | Coupons at checkout | `findCoupon()` → code, type, value, minOrder, maxDiscount, startsAt, endsAt, enabled | Waafas World › Coupons | snapshot `coupons` (web quote); `POST /api/v1/public/orders` reprices | ⬜ |
| AC-44 | Delivery charges, estimates, free delivery, minimum order, office pick-up | `getShippingSettings()` → zones[].name, areas, charge, estimate; freeDeliveryThreshold; minimumOrder; officePickup | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ⬜ |
| AC-45 | Offline Payment page, checkout and order emails | `getPaymentSettings()` → offlineAccounts[].kind, title, lines, instructions | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ⬜ |
| AC-46 | EMI page | `getEmiSettings()` → minimumAmount, tenuresMonths, cardsNote, appliesTo, interestNote; `listEmiBanks()` → name, tenuresMonths, note | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ⬜ |
| AC-47 | Refund, Privacy, Terms and About Us text | `getPage(slug)` → title, summary, highlights, sections, lastUpdated, seo | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ⬜ |
| AC-48 | Blog list, post and Home blog strip | `listBlogPosts()`, `getBlogPost()`, `listRelatedBlogPosts()`, `listBlogCategories()` → title, excerpt, intro, sections, cover, category, author, publishedAt, readingMinutes, featured, cta, seo | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ⬜ |
| AC-49 | FAQs page and Home FAQ strip | `listFaqs()` → category, question, answer, link, order, onHome | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ⬜ |
| AC-50 | Baggage table | `listBaggageRules()` → airlineCode, airlineName, scope, cabinClass, cabinAllowance, checkedAllowance, notes, lastVerified | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ⬜ |
| AC-51 | Gallery page, albums and Home strip | `listGalleryAlbums()`, `getGalleryAlbum()` → title, category, cover, items (photo or video, caption), publishedAt | Content › Gallery | `GET /api/v1/public/snapshot` | ⬜ |
| AC-52 | Testimonials wall and Home reviews | `listPublicFeedback()` → name, service, rating, comment, photo, submittedAt (approved with consent only) | Content › Feedback | `GET /api/v1/public/snapshot` | ⬜ |
| AC-53 | Facebook reviews link (until approved feedback exists) | `getSiteSettings()` → reviewsUrl | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-54 | Meet our team (Home bento and carousel, About grid) | `listTeam(placement)` → name, initials, designation, department, bio, photo, whatsappE164, email, linkedinUrl, featured, showOnHome, showOnAbout, visible, order | Content › Team | `GET /api/v1/public/snapshot` | ⬜ |
| AC-55 | Customer emails (lead received, order placed, visa status) | NotificationTemplate → subject, body, variables, channel, enabled | Settings › Notifications | `GET /api/v1/admin/notification-templates` | ⬜ |
| AC-56 | Lead reference on success screens | `createLead()` → reference, createdAt | Sales › Leads | `POST /api/v1/public/leads` | ⬜ |
| AC-57 | Phone drawer main links | `getMenu("drawer")` → items[].label, href, icon, visible | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-58 | Phone tab bar (five tabs, Waafas World third, More last) | `getMenu("tabbar")` → items[].label, href, icon, panel (the schema enforces the shape) | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-59 | Phone More sheet extras (Gallery, Feedback, Track order) | `getMenu("more-phone")` → items[] | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-60 | Waafas World panel: store intro and service cards | `getSiteSettings()` → storeIntro; `getMenu("shop-panel")` → items[].label, description, cta, href, icon | Settings › General; Settings › Footer and menus | `GET /api/v1/public/snapshot` | ⬜ |
| AC-61 | Help panel line and Visit row | `getContactSettings()` → helpLine, visitLabel | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-62 | Floating WhatsApp prefilled message | `getContactSettings()` → whatsappMessage (`{page}` placeholder) | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-63 | Header Log in (hidden until accounts ship) | `getSiteSettings()` → accountsLive | Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-64 | Page-level photos and videos (home hero, flights, group fares, visa, printing, trading headers and form side images) | `getMediaSlot(key)` → image or video (mp4, webm, phone files, poster, credit) | Content › Media library | `GET /api/v1/public/snapshot` | ⬜ |
| AC-65 | Search card From default, Popular flight chips | `getSearchSettings()` → defaultOrigin, popularFlights[] | Settings › General › Search | `GET /api/v1/public/snapshot` | ⬜ |
| AC-66 | Hotel nationality list | `getSearchSettings()` → hotelNationalities[] (names from Intl) | Settings › General › Search | `GET /api/v1/public/snapshot` | ⬜ |
| AC-67 | Tour tab destinations and Popular chips | `listDestinations()` → slug, name, subtitle, iata, tags (domestic), order | Content › Destinations | `GET /api/v1/public/snapshot` | ⬜ |
| AC-68 | Visa tab countries, regions, types, Popular chips | `listVisaCountries()` → slug, name, flagCode, region, popular, types[].type | Visa › Countries | `GET /api/v1/public/snapshot` | ⬜ |
| AC-69 | Preferred airline list | `listAirlines()` → code, name | Flights › Airlines | `GET /api/v1/public/snapshot` | ⬜ |
| AC-70 | Flight help line (Manual vs Live) and Live hotline | `getPublicConfig()` → modes.flights.mode; `getContactSettings()` → phoneDisplay, whatsappE164 | Settings › Booking modes; Settings › General | `GET /api/v1/public/snapshot` | ⬜ |
| AC-71 | Search activity (every submitted search) | `logSearch()` → module, summary, params, device, source | Admin › Search activity (A18) | `POST /api/v1/public/search-logs`, `GET /api/v1/admin/search-logs` (B4) | ⬜ |
| AC-72 | Hero headline, accent line, lead, rotating destinations | `getHomeContent()` → hero.title, titleAccent, lead, rotatingLabel, rotating[] | Content › Home | `GET /api/v1/public/snapshot` | ⬜ |
| AC-73 | Home section order, visibility, kicker, heading, lead | `listHomeSections()` → key, enabled, order, kicker, title, subtitle | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-74 | Home offers | `listBanners("home-offers")` → kicker, title, body, image, link, code, validityText, schedule | Content › Home and banners | `GET /api/v1/public/snapshot` | ⬜ |
| AC-75 | Home trust strip | `listTrustItems()` → icon, title, detail, order | Content › Home | `GET /api/v1/public/snapshot` | ⬜ |
| AC-76 | Why WAAFA figure and story; values; journey | `getHomeContent()` → why; `listValues()`; `listTimeline()` | Content › Home; Content › About | `GET /api/v1/public/snapshot`, `/values`, `/timeline` | ⬜ |
| AC-77 | Waafas World band copy and perks; services row | `getHomeContent()` → store; `getMenu("shop-panel")`; `listCategories()`; `listProducts({sort:"popular"})` | Content › Home; Settings › Footer and menus; Waafas World | `GET /api/v1/public/snapshot`, `/menus/shop-panel`, `/shop/*` | ⬜ |
| AC-78 | Reviews cards (Facebook link, Leave feedback) and testimonials | `getHomeContent()` → reviews; `getSiteSettings()` → reviewsUrl; `listPublicFeedback()` (approved only) | Content › Home; Content › Feedback moderation | `GET /api/v1/public/snapshot` | ⬜ |
| AC-79 | Closing band and office card | `getHomeContent()` → cta; `getContactSettings()`; `getMediaSlot("office")` | Content › Home; Settings › General; Media library | `GET /api/v1/public/snapshot`, `/settings/contact` | ⬜ |
| AC-80 | Home JSON-LD (Organization, TravelAgency) | `getSiteSettings()`, `getContactSettings()` → names, address, hours, socials | Settings › General | — (rendered from settings) | ⬜ |
| AC-81 | Flight request form options: email required, consent text, phone countries | `getLeadFormSettings()` → emailRequired, consentText, phoneCountries | Settings › Lead form options | `GET /api/v1/public/snapshot` | ⬜ |
| AC-82 | Flights booking mode (Manual body vs Live body) | `getPublicConfig()` → modes.flights.mode | Settings › Booking modes | `GET /api/v1/public/snapshot` | ⬜ |
| AC-83 | Preferences airlines and trip airline list | `listFeaturedAirlines()`, `listAirlines()` | Flights › Airlines | `GET /api/v1/public/snapshot` | ⬜ |
| AC-84 | Group fares page, rail and fare banner | `listGroupFares({to, month})`, `getGroupFare(id)` → airline, route, dates, baggage, seats, fare, expiry | Flights › Group fares | `GET /api/v1/public/snapshot`, `/group-fares/:id` | ⬜ |
| AC-85 | Flight leads (reference, contact, trip, preferences, group fare) | `POST /api/leads` → `createLead()` → LeadCreated | Leads (A18) | `POST /api/v1/public/leads` | ⬜ |
| AC-86 | Hotels booking mode | `getPublicConfig()` → modes.hotels.mode | Settings › Booking modes | `GET /api/v1/public/snapshot` | ⬜ |
| AC-87 | Hotel leads (place, dates, rooms, nationality, budget band, meals, preferences) | `POST /api/leads` → `createLead()` | Leads (A18) | `POST /api/v1/public/leads` | ⬜ |
| AC-88 | Package booking card and bar (from price, prices per sharing, departures with seats, any date) | `getPackage()` → fromPrice, prices, departures, anyDate | Travel › Tour packages | `GET /api/v1/public/snapshot` | ⬜ |
| AC-89 | Package leads (package, departure, travellers, room sharing, contact preference, notes) | `POST /api/leads` → `createLead()` | Leads (A18) | `POST /api/v1/public/leads` | ⬜ |
| AC-90 | Plan my trip place chips (In Bangladesh, Abroad) | `getSearchSettings()` → planTripPlaces | Settings › Search | `GET /api/v1/public/snapshot` | ⬜ |
| AC-91 | Plan my trip leads (places, month or dates, nights, travellers, trip for, budget band, hotels, interests, flights, visa) | `POST /api/leads` → `createLead()` | Leads (A18) | `POST /api/v1/public/leads` | ⬜ |
| AC-92 | Visa fee card and phone bar (embassy fee, service charge, total per type) | `getVisaCountry()` → types[].embassyFee, embassyFeeNote, serviceCharge | Travel › Visa | `GET /api/v1/public/snapshot` | ⬜ |
| AC-93 | Visa office visit days and address on the apply step | `getContactSettings()` → officeHours.days, addressLines | Settings › Contact and hours | `GET /api/v1/public/snapshot` | ⬜ |
| AC-94 | Visa applications (country, type, travel date, applicants, document metadata, visit, notes) | `POST /api/leads` → `createLead()` (Phase C: files to the private bucket, signed and logged links) | Leads and Visa applications (A18) | `POST /api/v1/public/leads`, `POST /api/v1/visa/files` | ⬜ |
| AC-95 | Store bar (store name, tagline, search suggestions index, finder link when a category has compatibility) | `getSiteSettings()` → storeName; `getShopContent()` → tagline; `listCategories()`, `listBrands()`, `listProducts()` | Settings › General; Content › Store; Waafas World › Products | `GET /api/v1/public/snapshot` | ⬜ |
| AC-96 | Store row headings | `listStoreRows()` → title, subtitle (fallback to defaults) | Waafas World › Store home | `GET /api/v1/public/snapshot` | ⬜ |
| AC-97 | Store strips, corporate band, service cards and trust row | `getShopContent()` → bulkStrip, finderStrip, corporate, services[] (title, sub, body, cta, href, mediaSlot), trust[]; `getMediaSlot()` | Content › Store; Media library | `GET /api/v1/public/snapshot` | ⬜ |
| AC-98 | Product page delivery and COD lines | `getShippingSettings()` → zones (name, charge, estimate); `getPaymentSettings()` → codLimit | Settings › Shipping; Settings › Payments | `GET /api/v1/public/snapshot` | ⬜ |
| AC-99 | Corporate and bulk quotes | `POST /api/leads` → `createLead()` (QTE reference) | Leads (A18) | `POST /api/v1/public/leads` | ⬜ |
| AC-100 | Cart and checkout delivery charges, free-delivery threshold, minimum order, office pick-up | `getShippingSettings()` → zones, freeDeliveryThreshold, minimumOrder, officePickup | Settings › Shipping | `GET /api/v1/public/snapshot` | ⬜ |
| AC-101 | Coupons at the cart | `findCoupon(code)` → Coupon | Waafas World › Coupons | snapshot `coupons` (web quote); `POST /api/v1/public/orders` reprices | ⬜ |
| AC-102 | Payment accounts, cash-on-delivery limit, per-product COD eligibility | `getPaymentSettings()` → offlineAccounts, codLimit; `Product.codEligible` | Settings › Payments; Products | `GET /api/v1/public/snapshot` | ⬜ |
| AC-103 | Orders and Track order (status, courier, tracking number, payment verified) | `createOrder()`, `findOrder()` → Order | Waafas World › Orders | `POST /api/v1/public/orders`, `POST /api/v1/public/orders/track` | ⬜ |
| AC-104 | Service page copy: hero, facts, services, steps, form heading, questions, SEO | `getServicePage(key)` → ServicePage | Content › Pages › Service pages | `GET /api/v1/public/snapshot` | ⬜ |
| AC-105 | Service page photos and the trading loop | `getMediaSlot("printing-header" | "printing-quote-side" | "trading-header" | "trading-rfq-side")` | Content › Media library | `GET /api/v1/public/snapshot` | ⬜ |
| AC-106 | Information page cards (About services and routes, baggage facts and rules, EMI and offline payment steps) | `listPageBlocks(page)` → icon, title, body, link, tone, order | Content › Page blocks | `GET /api/v1/public/snapshot` | ⬜ |
| AC-107 | Feedback form (pending until moderated) | `POST /api/feedback` → `createFeedback()` | Content › Feedback moderation | `POST /api/v1/public/feedback` | ⬜ |
| AC-108 | Offline payment proofs | `POST /api/payment-proof` → `submitPaymentProof()` | Waafas World › Orders; Leads (payments) | `POST /api/v1/public/payment-proofs` | ⬜ |
| AC-109 | Contact page messages (CNT) | `POST /api/leads` (module contact) → `createLead()` | Leads | `POST /api/v1/public/leads` | ⬜ |

## 5. Components inventory

| Component | Path | Source (shadcn · 21st.dev id · custom) | Used on |
| --- | --- | --- | --- |
| SearchCard, SearchCardClient | `apps/web/src/components/search/` | custom (shadcn Tabs, Radio group, Button) | `/` (A7 hero), results bars (A9, A10) |
| Picker popover and sheet | `components/search/PickerPopover.tsx`, `PickerSheet.tsx` | shadcn Popover, Drawer (vaul), loaded with next/dynamic | search card |
| OptionList | `components/search/OptionList.tsx` | shadcn Command (cmdk) | airport, place, destination, country, visa-type pickers |
| DatesPicker | `components/search/DatesPicker.tsx` | shadcn Calendar (react-day-picker v10, custom modifiers) | search card |
| CounterRow, ChildAges | `components/search/` | shadcn Button, Select | travellers, rooms, party, applicants |
| BorderBeam | `components/fx/BorderBeam.tsx` | 21st.dev Border Beam (18473) rebuilt as a CSS conic layer | search card (desktop) |
| RollingNumber | `components/motion/RollingNumber.tsx` | custom (Motion AnimatePresence) | steppers |
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
| Package listing (1 run, 10 Oct) | 35 / 73 / 50 / 92 · 5.6 s | 1 / 72 / 73 / 100 · 26.5 s | 27 / 93 / 73 / 100 · 23.4 s | 34 / 85 / 54 / 100 · 16.2 s | target ≥ 90 / ≥ 95 / ≥ 95 / 100 · ≤ 2.5 s | GoZayaan `/tour` redirects to its home Tour tab; measured for Waafa in A11 and A22 |

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
| D56 | 10 Oct | Inner-page competitor Lighthouse uses one run per site on the package listing (time-boxed); GoZayaan's `/tour` redirect to its home Tour tab is recorded as is | Three runs per site would cost about 25 minutes at a point where the build is behind; the scores are far from Waafa's targets, so run-to-run noise cannot change any decision | #34 |
| D57 | 10 Oct | Search tabs and trip type use a CSS-transform sliding pill (spring curve), not Motion `layoutId` | Same look without loading `domMax` on the home page; MOTION.md's layoutId is kept for the search → results morph (A9) | #8 |
| D58 | 10 Oct | Countries show a two-letter code chip instead of flag images | No emoji, no third-party flag art; readable at 28 px and admin data already has `flagCode` | #8 |
| D59 | 10 Oct | The card is one row from 1280 px (xl); 768–1279 px uses two rows | At 1024 px six fields and the button truncated dates and airport names | #8 |
| D60 | 10 Oct | Back restores the submitted card from sessionStorage when the page was a full load; Cache Components' Activity keeps it otherwise | Results routes (A9–A12) are not built yet, so Back currently reloads; the snapshot is zod-validated and tab-scoped | #8 |
| D61 | 10 Oct | Pickers, Radix Popover/Popper and vaul load on demand (first touch or focus warms them); submit logic loads on first submit | Keeps ~40 KB of picker code out of the first load (budget work continues in #39) | #8 |
| D62 | 10 Oct | The tour tab has no budget field; budget filtering lives on /tour-packages (A11) | The SearchCard board shows Where to / When / Travellers only; the board wins on layout | #8 |
| D63 | 10 Oct | Calendars start the week on Sunday; days past a 30-night stay are disabled once check-in is set | Matches the Pick-d-range board; a stray pick past the cap never resets check-in | #8 |
| D64 | 10 Oct | `/api/search/log` accepts same-site requests only, 4 KB at most, 30 per minute per client (in-memory fixed window in Phase A, Redis in Phase B) | CLAUDE.md requires rate limits on submits; logs must not be floodable | #8 |
| D65 | 10 Oct | Search date formatters and country names stay English (`en-GB`, `Intl.DisplayNames(["en"])`) until Bangla ships in P1 | One locale at launch; the formatters take a locale parameter when `/bn` is added | #8 |
| D66 | 10 Oct | The site-wide `(site)/loading.tsx` is removed; route loaders go into dynamic segments as they ship (A9+) | It wrapped every page in a Suspense boundary, so the hero poster painted only after the boundary reveal (LCP render delay 1.2–2.6 s) | #7 |
| D67 | 10 Oct | Below-the-fold reveals use CSS `animation-timeline: view()` (`reveal-on-view`) instead of Motion's Reveal | Zero JS for 13 sections; unsupported browsers and reduced motion show content at once | #7 |
| D68 | 10 Oct | Home carousels (offers, fares, packages, posts, team) are CSS scroll-snap rows on phones and grids on desktop; Embla stays for galleries that need arrows | No carousel JS on Home (#39 budget); native swipe and keyboard scroll | #7 |
| D69 | 10 Oct | Non-list Home copy lives in one `HomeContent` record (hero, why, store, reviews, cta); section headings use `HomeSection.kicker/title/subtitle` | Everything a visitor reads is admin-editable without a schema per section | #7 |
| D70 | 10 Oct | Countries and airlines show code chips, team members without photos show initials on the ribbon | No flags, logos or stock faces until real assets exist | #7 |
| D71 | 10 Oct | Lead intake is `POST /api/leads` (route handler) with an idempotency key, rate limit, 16 KB cap and same-site check; Turnstile turns on when `TURNSTILE_SECRET_KEY` exists | One endpoint for every module; Phase C points it at the API without UI changes | #9 |
| D72 | 10 Oct | Step 2 uses native date inputs and shadcn selects for From/To instead of the full pickers | The trip is already chosen in the search card; native date pickers are fast and accessible on phones; Edit search opens the full card | #9 |
| D73 | 10 Oct | Group fares filter with a plain GET form (no client JS); sorting is server-side | Shareable URLs, works before hydration, no bundle cost | #9 |
| D74 | 10 Oct | The search → results `layoutId` morph and the route arc with a gliding plane are deferred to A22 polish | Results routes are full page loads today (Activity keeps Home); building the morph needs a persistent layout and `domMax` (budget #39) | #9 |
| D75 | 10 Oct | Every Manual module uses one `LeadRequestCard` (contact step, steps indicator, failure, idempotent submit, boarding-pass success) with module-specific second steps; shared copy lives in the `Leads` namespace | One tested flow for flights, hotels, packages, visa and the service forms | #10 |
| D76 | 10 Oct | The Hotels board’s "Hotels we know" list is deferred until a hotel content type and real hotel photos exist | Needs a new admin collection and photos; the request flow is the launch need (cut list) | #10 |
| D77 | 10 Oct | The hotel form follows the board (budget band and meals); star preference stays in the contract with "any" and is not asked | The board wins on layout; staff can ask stars in the follow-up | #10 |
| D78 | 10 Oct | An unknown package slug renders the Next not-found page with `noindex` but status 200 | Cache Components streams the layout shell before the page resolves; `dynamicParams = false` would hide packages added in admin until a rebuild; the branded 404 ships in A17 | #11 |
| D79 | 10 Oct | The package query is an inline section (`#query`) with the shared LeadRequestCard (contact first) instead of the board modal; booking card choices flow into step 2 through `PackageBookingProvider` | One tested request flow (D75); deep-linkable; no dialog focus trap on phones | #11 |
| D80 | 10 Oct | Plan my trip asks contact first (the board asks it last) and shows the help card in place of the "Your trip so far" summary | Same flow as every Manual module (D75) and the lead is captured even if the visitor stops; the live summary moves to A22 polish | #11 |
| D81 | 10 Oct | Package filters are a plain GET form with server-side filtering and sort (like D73) | Shareable URLs, works before hydration, no client bundle | #11 |
| D82 | 10 Oct | Plan my trip place chips come from `SearchSettings.planTripPlaces` (admin) | Nothing visitor-facing is hard-coded | #11 |
| D83 | 10 Oct | Plan my trip exact dates use native date inputs (like D72) | Fast, accessible phone pickers; the full calendar stays in the search card | #11 |
| D84 | 10 Oct | The package photo lightbox (Dialog + Embla) loads with next/dynamic on the first tap | Took package detail Lighthouse from 61 to 68; the rest is #39 | #11 |
| D85 | 10 Oct | Pages with dynamic params await them inside `<Suspense>` with a skeleton at final height | Next 16.4 flags params read outside Suspense ("URL data during prerendering") because navigations cannot be instant; known params still prerender fully | #12 |
| D86 | 10 Oct | Visa apply uses the shared LeadRequestCard: contact first, then one "Trip and documents" step with trip, documents, visit and review (the board has four steps) | One tested request flow (D75); the review block keeps the board's check-and-send content | #12 |
| D87 | 10 Oct | In Phase A visa files never leave the browser; only name, type and size go with the lead, and the visa desk collects files after the call | No private bucket before Phase B; documents must never be public (PRD FR-VISA-05) | #12 |
| D88 | 10 Oct | `sanitize-html` (server-only, allow-list) sanitises admin rich text in RichText | Smallest well-maintained server sanitiser; DOMPurify needs a DOM on the server | #12 |
| D89 | 10 Oct | The visa type on a country page is client state mirrored to `?type=` with replaceState | Keeps the country page fully static while links from the search card and shares open the right tab | #12 |
| D90 | 10 Oct | Fully static pages set their canonical with a hoisted `<link rel="canonical">` (Canonical component), not `alternates.canonical` | On a page with no dynamic holes Next treats metadata alternates as runtime data on the `/[locale]` shell and the build fails | #12 |
| D91 | 10 Oct | Visa checklist ticks live in memory only (no storage); the progress ring is a small SVG stroke animation | A planning aid, nothing to persist; MOTION.md allows small SVG drawing; reduced motion shows the end state | #12 |
| D92 | 10 Oct | Corporate and bulk quotes are a new lead module `bulk` with the QTE reference, reusing LeadRequestCard in a dialog with store wording for step 1 | The boards show QTE references; leads stay in one admin inbox | #13 |
| D93 | 10 Oct | Store copy that is not a list (strips, corporate band, service cards, trust row) is `ShopContent` in the data layer; store rows gain an optional title and subtitle | Nothing visitor-facing is hard-coded; row headings fall back to message defaults | #13 |
| D94 | 10 Oct | Running deals are applied once (`withDeals`): the deal variant sells at the deal price everywhere, with the normal price as MRP; a deal never raises a price | Cards, product page and cart must agree on one price | #13 |
| D95 | 10 Oct | The guest cart lives in localStorage behind a `useSyncExternalStore` store shared by every tab; the cart page, mini-cart and fly-to-cart arrive in A14 (the cart link 404s until then) | FR-SHOP-06 "guest carts persist across visits" without an account; one store for A13 and A14 | #13 |
| D96 | 10 Oct | Listing filters are a GET form (like D81); category attributes filter when they are select attributes with options; numeric ranges (page yield, watts, battery) wait for a range control | Works before hydration, shareable URLs; no fixture has numeric values per product yet | #13 |
| D97 | 10 Oct | Find by model is two GET steps (brand, then model) plus part-code search, without client JS | Fast and accessible; the model list depends on the brand | #13 |
| D98 | 10 Oct | Store home hides top-level categories with no products | FR-CAT-06: categories open when real products exist | #13 |
| D99 | 10 Oct | Product video plays as a muted loop under the description (SmartVideo with poster and reduced-motion stop), not inside the gallery | Keeps the gallery light; the poster is real footage | #13 |
| D100 | 10 Oct | Product zoom reuses the photo lightbox (shared `PhotoLightbox`, loaded on first tap); pinch zoom on phones is the browser's | One lightbox for packages and products; no extra library | #13 |
| D101 | 10 Oct | Fully static store pages (`/shop`, categories, deals) use the Canonical component (D90) | Same build rule as the visa guide list | #13 |
| D102 | 10 Oct | One shared `priceCart` in packages/shared prices the cart page quote, the checkout and the order intake; the browser sends variant ids and quantities only | Prices never come from the client; Phase B reuses the same function | #14 |
| D103 | 10 Oct | Free delivery is judged on the subtotal before the coupon; delivery zone comes from the address (division or district, "*" fallback), the cart page area choice is used until an address is typed | A coupon should not remove free delivery; the zone cannot be forged by the client | #14 |
| D104 | 10 Oct | Checkout is one page; the success state renders in place (no separate route); the cart is cleared after success | Matches the boards; avoids exposing order details by URL | #14 |
| D105 | 10 Oct | Phase A order store lives on globalThis (source.ts) | Route handlers and pages are separate module graphs in production | #14 |
| D106 | 10 Oct | Payment proof is metadata only in Phase A (same as visa files, D87); DocumentSlot moved to components/forms | Reuse | #14 |
| D107 | 10 Oct | Stock is not decremented in Phase A; mini-cart drawer, save for later and cart corporate quote are cut to A22 | Time; stock transactions are Phase B | #14 |
| D108 | 10 Oct | Service pages are one admin-edited ServicePage record each; form labels and option lists are UI chrome (next-intl); the request card is the shared LeadRequestCard | Copy editable in Admin, same flow as every Manual module | #15 |
| D109 | 10 Oct | Printing and trading attachments follow the Phase A rule: metadata only (D87) | Uploads arrive with the API | #15 |
| D110 | 10 Oct | Information page cards are one admin collection (PageBlock: page, group, icon, title, body, link, tone, order) instead of a schema per page | One admin screen covers About, Baggage, EMI and Offline payment | #16 |
| D111 | 10 Oct | The About route map ships as route chips (IATA + city) from the destinations list; the animated map waits for A22 | Cut list item 4; honest and light | #16 |
| D112 | 10 Oct | No stand-in office photo: the empty office slot shows a navy visit card (figure, address, hours) | Correction 7, no fake media | #16 |
| D113 | 10 Oct | Contact and About use a Get directions link instead of a map iframe | No third-party embed on first load (performance, privacy) | #16 |
| D114 | 10 Oct | Gallery videos show the poster and open on YouTube or Facebook in a new tab | Cut list item 1 (video embeds) | #16 |
| D115 | 10 Oct | Feedback rating is optional and stored only when given; the wall shows stars per review, never an average | Board "How was it? (optional)"; no made-up averages | #16 |
| D116 | 10 Oct | `global-error` uses fixed English copy | It replaces the root layout, so no messages, data or site frame exist there; every other error uses the translated site boundary | #17 |
| D117 | 10 Oct | Offline is a notice on the current page, not a separate page | No service worker yet; the visitor keeps the page and what they typed | #17 |
| D118 | 10 Oct | The 404 omits the board's site-wide search box and shows Home plus five popular pages | There is no site-wide search route yet; a box that searches only one module would mislead | #17 |
| D119 | 10 Oct | Maintenance mode replaces the public site in the site layout (noindex); admin and API stay reachable | Staff keep working while the public site is closed | #17 |
| D120 | 10 Oct | Group fares link with `?groupFare=<id>`; `fare` stays the search card's fare type | `fare=student` from a banner was read as a group-fare id | #51 |
| D121 | 10 Oct | A partial flight link (only `to`, `from` or `depart`) prefills those fields; a missing origin uses the admin default origin | Banner and group-fare links carry only the destination | #51 |
| D122 | 10 Oct | `RATE_LIMIT_FACTOR` raises the per-client limits for the Playwright test server only | Parallel e2e runs send many forms from one address; production keeps the real limits | #51 |
| D123 | 10 Oct | The footer names the brand in text instead of repeating the logo | Correction 4: one WAAFA logo per page, in the header | #51 |
| D124 | 10 Oct | Request steps ask for travellers (flights) and rooms and guests (hotels) even when a search prefilled them | Leads without a search were sent as one adult or two adults in one room | #51 |
| D125 | 10 Oct | Launch data model: transactional records (staff, sessions, leads, orders, feedback, proofs, subscribers, search logs, audit) are relational tables; admin-managed content and settings are JSON documents validated by the shared CONTENT_MODEL schemas, one table each | Thirty-plus content entities in two days is not possible as tables; one validated document path serves the seed, the snapshot and one generic admin editor. Normalising hot collections (products, packages) into tables follows after launch | #54 |
| D126 | 10 Oct | The API runs TypeScript through tsx (dev and production) and injects dependencies with explicit @Inject tokens | NestJS 12 and the workspace packages ship TypeScript source; tsx (esbuild) has no decorator metadata, explicit tokens make DI independent of it | #54 |
| D127 | 10 Oct | Local development without Docker uses a private PostgreSQL cluster on port 5433 started from the installed binaries; the owner's own PostgreSQL service is never touched | The machine has 1–2 GB free; Docker Desktop is off; no access to the existing service's password | #54 |
| D128 | 10 Oct | The seed creates the first Super Admin only from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ characters) and never overwrites admin edits | No default password in the repository; the seed is safe on every deploy | #54 |
| D129 | 10 Oct | The admin is a backend-for-frontend: the web signs staff in through the API server to server and keeps the tokens in its own httpOnly, Secure, SameSite cookies; the API takes Bearer tokens only and never sets cookies | No cross-site cookies between the web and API domains, no CSRF surface on the API | #55 |
| D130 | 11 Oct | The web reads all public content from one snapshot, `GET /api/v1/public/snapshot` (ETag, server to server), instead of the per-entity GET endpoints planned in A4 | One request per revalidation; the fixture repositories run unchanged on the snapshot; the admin's writes invalidate it and revalidate the web by key | #56 |
| D131 | 11 Oct | Public intake is server to server: the web keeps same-site, Turnstile and visitor limits; the API checks the intake key in constant time, adds per-visitor limits at twice the web's numbers and takes an Idempotency-Key header (UUID). Only successful outcomes are replayed (24 h); refusals release the key | A refused order must be fixable without a new page load (#61); a double tap must never make two leads or orders | #56 |
| D132 | 11 Oct | Orders lock the product documents (SELECT … FOR UPDATE) while pricing and taking stock | Launch volume makes the serialisation cheap and it rules out overselling; stock rows move to their own table with the D125 normalisation | #56 |
| D133 | 11 Oct | Emails go through a BullMQ queue (5 attempts, exponential backoff, failed jobs kept) when REDIS_URL is set and in process otherwise; staff alerts go to STAFF_ALERT_EMAIL until per-module recipients exist in Settings › Notifications; every email is logged | A slow mail provider never slows a submit; development and tests need no Redis | #56 |
| D134 | 11 Oct | OpenAPI 3.1 is built from a route table and the shared zod contracts (`z.toJSONSchema`) and served outside production only | No extra dependency; the contracts the API validates with are the ones documented | #56 |
| D135 | 11 Oct | Lead access by role: Travel Sales sees flights, hotels, packages, plan my trip, contact, EMI and bulk; Visa Officer sees visa; Shop Manager sees printing, trading and bulk; Admin and Super Admin see all. Content by area: home and content for Content Editor, travel for Content Editor and Travel Sales, visa for Visa Officer and Content Editor, shop for Shop Manager, settings for Admin (shipping for Shop Manager, payments for Accounts, announcements for Content Editor) | PRD §4 role table; a lead outside a person's modules answers 404, not 403, so references can't be probed | #57 |
| D136 | 11 Oct | The web switches to the API by environment (`WAAFA_API_URL` + `WAAFA_INTAKE_KEY`): reads run the fixture repositories on the cached API snapshot through a proxy, writes call `/api/v1/public/*` from the existing accessors with the visitor address and idempotency key; revalidation expires every tag | One tested read implementation for both sources; no page or component changes; a save in Admin shows on the next request | #64 |

## 9. Bugs and known issues

| Issue | Severity | Where | Status |
| --- | --- | --- | --- |
| Fixture images point at `/media/...` files that only land on `main` with A5 | P1 | fixtures, every image | Fixed by #5 (PR pending) |
| Boards disagree on two shop numbers: COD cap ৳20,000 (FAQ, Terms) vs ৳25,000 (admin sample); free delivery over ৳3,000 (admin) vs ৳5,000 (product page). Fixtures use ৳20,000 and ৳3,000 until the owner confirms | P2 | fixtures (shop settings) | Owner question |
| Phase A references restart at 0001 whenever the dev server restarts (no storage before the API) | P2 | lead intake | By design until Phase C |
| Visitors who dismissed the announcement may see it collapse right after hydration on their next visit | P2 | announcement bar | Accepted (D50); revisit if field CLS shows it |
| #39 Home first-load JS 346 KB and simulated LCP 4.1 s over budget (shell alone 308 KB, 84); picker open long tasks 180–430 ms at 4x CPU | P1 | `/`, search pickers | Open, due with A7 |
| #51 Lead steps lost travellers and rooms without a search; broken deep links; footer second logo; SEO gaps | P1 | flights, hotels, store bar, footer, SEO | Fixed in #51 |
| #60 VAT invoice BIN accepted only the letter d (regex lost its backslash), so every VAT-invoice order failed | P0 | checkout, shared contract | Fixed in #56 with a regression test |
| #61 After a refused order the checkout kept the idempotency key and the web cached the refusal, so fixing the cart did not help for 10 minutes | P0 | checkout | Fixed in #56 with a regression test |
| #52 Signature motion moments missing (flight path, results morph, route arc, add-to-cart arc, magnetic buttons) | P1 | home, flights, store | Open |
| Hotel stay picks past 30 nights reset the check-in | P2 | search card | Fixed in #8 with a regression test |
| Chip radios in the flights and hotels second steps were off-centre (the hidden radio stayed in the flow) | P2 | `/flights`, `/hotels` | Fixed in #11; e2e covers the steps |
| Package detail first-load JS about 440 KB, Lighthouse mobile 68 | P1 | `/tour-packages/[slug]`, `/plan-my-trip` | Tracked in #39 |
| Header links to routes not built yet (`/gallery`, `/feedback`) 404 on prefetch | P2 | header | `/visa-services` shipped in #12; the rest close with A17 |
| Dev error "URL data during prerendering" on package detail and other param pages | P2 | dynamic param pages | Fixed in #12 (D85) |

## 10. Cut list

If time runs out, cut in this order (PRD §17). Never cut security, lead capture, the admin leads module, compliance
or accessibility.
1. Gallery video embeds
2. Blog extras (related posts, contents list)
3. Part-code search in Find by model
4. Proposed now (behind by 3 issues): 21st.dev desktop-only flourishes (tilt, spotlight, magnetic) move to A22 polish; the About route map ships as a static SVG first
5. Proposed 10 Oct 01:20 (behind by 6 issues, Phase A due 11 Oct): admin builders (itinerary days, visa checklist, menus, home order) ship as ordered lists with move up/down buttons first, drag-and-drop (dnd-kit) after launch; admin catalogue and content screens (A19–A21) share one list + form pattern instead of bespoke layouts; A22 polish runs inside each issue's verify step, leaving A22 for the cross-route beat check only; Pick-d boards' two-month desktop calendar stays, the phone calendar shows a scrolling list of months

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
| 10 Oct 21:15–21:21 | B1 merged (#58); B2 staff auth, roles and audit log | #55 | see #55 block | API 15 passed |
| 10 Oct 20:45–21:07 | #51 merged (#53); Phase B launch issues #54 – #57 opened under epic #29; B1 API foundation and database (NestJS 12, Fastify, Prisma 7, seed, Docker, CI PostgreSQL) | #54 | see #54 block | API 8 passed |
| 10 Oct 20:40–20:42 | A17 merged (#50); review issues opened (#51 fixes, #52 motion, polish list on #22); #51 lead quality, navigation, links and SEO fixes; compliance grep clean | #51 | see #51 block | e2e 87 passed |
| 10 Oct 19:50–20:02 | A16 merged (#49); A17 branded 404, error boundary, global error, offline notice, maintenance screen, Live placeholder | #17 | see #17 block | e2e 81 passed |
| 10 Oct 18:00–19:45 | Session review (link/SEO and board-fidelity subagents; two audits stopped by the account rate limit); A16 information pages, feedback and payment-proof intake, page blocks, sitemap rewrite | #16 | see #16 block | unit 207 web + 48 shared + 82 fixtures · e2e 77 passed |
| 10 Oct 16:20–17:40 | A14 merged (#47); A15 service pages for printing and trading with PRN and TRD requests, shared ConsentField and StepActions | #15 | see #15 block | unit 192 web + 48 shared + 80 fixtures · e2e +3 |
| 10 Oct 15:40–16:10 | A13 merged (#46); A14 cart with server pricing and coupons, one-page checkout (COD cap, offline payment with proof, VAT invoice, pick-up), boarding-pass order success, track order by number and phone; globalThis store fix | #14 | see #14 block | unit 188 web + 48 shared + 79 fixtures · e2e 64 passed |
| 10 Oct 13:30–15:30 | A12 merged (#45); A13 Waafas World catalogue: store bar, store home rows, listings with attribute filters, product page with variants, finder, deals, corporate quote, guest cart | #12, #13 | #45 | unit 297 · e2e 60 · axe pass · Lighthouse 67–77 |
| 10 Oct 12:10–13:30 | A11 merged (#44); A12 visa list, country tabs with checklist ring and fee card, apply with local document checks, Visa Guide with sanitised rich text; Suspense for param pages; canonical fix for static pages | #11, #12 | #44 | unit 166 · e2e 54 · axe pass · Lighthouse 70–85 |
| 10 Oct 09:45–12:10 | A11 packages list, package detail with booking card and inline query, Plan my trip; chip radio fix in flights and hotels; lazy lightbox | #11 | see #11 block | unit 155 · e2e 50 · axe pass · Lighthouse 68–73 |
| 10 Oct 08:40–09:45 | A9 merged (#42); A10 hotels Manual on the shared results shell; request flow refactored into LeadRequestCard + ContactStep + Leads strings | #9, #10 | #42 | unit 148 · e2e 45 · axe pass |
| 10 Oct 06:15–08:40 | A7 Home merged (#41); A9 results shell, Flights Manual two-step request, lead intake API with idempotency and rate limits, boarding-pass success, group fares page and rail | #7, #9 | #41 | unit 144 · e2e 43 · axe pass |
| 10 Oct 01:00–06:15 | #34 A1b closed (inner-page competitor Lighthouse); A8 search card built, independent subagent review (15 findings, 14 fixed), merged; perf budget gap logged as #39; A7 Home built (13 sections from data, CSS reveals, snap rows, JSON-LD, robots and sitemap) | #34, #8, #39, #7 | #38, #40 | unit 245 · e2e 37 · axe pass · Lighthouse / 71–74 / 100 / 96 / 100 |
| 09 Oct 17:30–20:56 | A0 merged (#35) with branch protection; A1b docs pushed; A5 footage sourced by a subagent (7 real clips; power bank skipped, no free real footage); A6 layout shell built and verified at five widths; a usage limit paused work for about 90 minutes | #27, #34, #5, #6 | #35 | e2e 30 · unit all green |
| 09 Oct 16:30–17:20 | v4 PROMPT 1: audit, tool check (all MCPs and four skills), GitHub planning (labels, milestone F, epics #28–#33, A0 #27, sub-issues, Project fields, squash-only), A0 setup in progress | #27, #5 | — | guards + hook negative tests |
| 09 Oct 11:27 | A4 data layer and content model: contracts, Sample fixtures, repositories, cached accessors; admin-control matrix seeded (56 rows) | #4 | #26 | unit 168 · e2e 15 |
| 09 Oct 10:24 | A3 design system: 41 primitives, brand, MotionKit, media, styleguide; fixed overflow, radio names, tabs, OTP and lint issues; usage limit hit mid-issue; low memory stopped servers | #3 | #25 | unit 36 · e2e 15 |
| 09 Oct 06:46 | A2 foundation: workspaces, Next 16.4, tokens, fonts, shadcn, next-intl, Vitest, Playwright + axe | #2 | #24 | unit 20 · e2e 7 |
| 09 Oct 06:26 | A1 design direction and benchmark (docs only) | #1 | #23 | — |
| 09 Oct 06:10 | Step 0 (v3): tools tested, attribution off, labels, milestones, issues #1–#22 on Project #4 | — | — | — |

## 14. Next steps
1. A17 (#17): branded 404 (catch-all under [locale]), error and global-error pages, offline and maintenance pages, loading patterns, LiveBody placeholder.
2. Review-fix issue (from the 10 Oct reviews): flights step 2 travellers, hotels rooms and guests, visa list actions, store category row and Track order link, home metadata and h1 fallback, per-country visa descriptions, collection description fallback, service pages noIndex, broken deep links (/tour-packages?q=, /flights?to=…&fare=), empty office-and-stationery links, siteUrl production guard; signature moments (hero flight path, route arc, add-to-cart arc, magnetic buttons).
3. Launch-critical backend (Phase B lean): API with PostgreSQL for leads, orders, feedback, proofs and content, staff auth, email; then admin A18 – A21 on one list + form pattern; deploy staging 12 Oct, production 13 Oct (needs the owner accounts in section 11).

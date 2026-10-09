# WAAFA OTA Platform — tracker

| | |
| --- | --- |
| **Current phase** | A · Frontend |
| **Current issue** | A5 [#5](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/5) (A1–A4 done) |
| **Last updated** | 2026-10-09 11:35 (Asia/Dhaka) |
| **Overall progress** | Launch scope (A–C): 4 / 39 · all phases: 4 / 56 |
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
| ✅ | [#2](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/2) | A2 · Foundation: monorepo, Next.js app, tokens, fonts, i18n, test tooling | L |
| ✅ | [#3](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/3) | A3 · Design system in code + /styleguide | L |
| ✅ | [#4](https://github.com/mahedi-emon/Waafa-OTA-Platform/issues/4) | A4 · Data layer and content model (shared zod contracts + fixtures) | XL |
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
| `/styleguide` (dev only) | Brand, Tokens, Components, Components2, MotionKit, PCard, States | #3 | ✅ | ✅ | ✅ | ✅ | ✅ axe + keyboard | n/a |
| `/track`, `/login`, `/account` (P1) | Track, Track-nf, Login, Login-otp, Login-err, Account | D1 | — | — | — | — | — | — |

## Admin-control matrix

Every public element → the data field it reads → the admin screen that edits it → the API endpoint.
Seeded by A4 from the zod contracts; UI issues add rows for anything new, and Phase B confirms the endpoints.
Accessors live in `apps/web/src/lib/data/*.ts`; admin screen names follow the AdminSide board.

| Public element | Data field (accessor → field) | Admin screen | API endpoint (planned) |
| --- | --- | --- | --- |
| Brand names (header, footer, metadata) | `getSiteSettings()` → travelBrand, storeName, companyName | Settings › General | `GET /api/v1/settings/site` |
| Default SEO title, description, share image | `getSiteSettings()` → defaultSeo | Settings › General | `GET /api/v1/settings/site` |
| Header menu (7 items, order, visibility, Waafas World and More panels) | `getMenu("header")` → items[].label, href, icon, panel, visible | Settings › Footer and menus | `GET /api/v1/menus/header` |
| More panel and sheet (icon, title, one line) | `getMenu("more")` → items[].label, description, icon, href | Settings › Footer and menus | `GET /api/v1/menus/more` |
| Waafas World mega panel categories | `listCategories()` → level-1 name, description, icon, order | Waafas World › Categories | `GET /api/v1/shop/categories` |
| Announcement bar | `getActiveAnnouncement()` → text, link, startsAt, endsAt, enabled | Content › Home and banners | `GET /api/v1/announcements/active` |
| Hotline chip, Call and WhatsApp buttons, floating WhatsApp | `getContactSettings()` → phoneDisplay, phoneE164, whatsappE164 | Settings › General | `GET /api/v1/settings/contact` |
| Open now / Closed chip | `getContactSettings()` → officeHours, read with `getOfficeStatus()` in Asia/Dhaka | Settings › General | `GET /api/v1/settings/contact` |
| Need help? panel, drawer contact block, Contact page, Visit our office | `getContactSettings()` → addressLines, city, country, email, officeHoursText, closedText, mapUrl | Settings › General | `GET /api/v1/settings/contact` |
| Footer brand column | `getSiteSettings()` → footerTagline, footerAbout; `getContactSettings()` → socials | Settings › General | `GET /api/v1/settings/site` |
| Footer link columns | `getFooterSettings()` → columns[].title, menu; `getMenu("footer-travel" / "footer-shop" / "footer-help")` | Settings › Footer and menus | `GET /api/v1/settings/footer` |
| We accept | `getFooterSettings()` → paymentMethods (live ones only), paymentNote | Settings › Footer and menus | `GET /api/v1/settings/footer` |
| Trust badges (ATAB, TOAB, IATA once held) | `getFooterSettings()` → trustBadges | Settings › Footer and menus | `GET /api/v1/settings/footer` |
| Newsletter band | `getFooterSettings()` → newsletterTitle, newsletterPlaceholder, newsletterButton | Settings › Footer and menus | `GET /api/v1/settings/footer` |
| Bottom bar copyright and legal links | `getFooterSettings()` → copyrightHolder; `getMenu("legal")` | Settings › Footer and menus | `GET /api/v1/settings/footer` |
| Developer credit | Rendered from code (FR-FTR-06) | Not editable, by design | — |
| Manual or Live body; Send query or Book now | `getPublicConfig()` → modes.{flights, hotels, packages, shopPayment}.mode, liveLocked, lockReason | Settings › Booking modes | `GET /api/v1/config/public` |
| Online payment at checkout; cash-on-delivery cap | `getPublicConfig()` → onlinePaymentLive, codLimit | Settings › Payments and delivery | `GET /api/v1/config/public` |
| Maintenance page | `getPublicConfig()` → maintenance.enabled, message | Settings › General | `GET /api/v1/config/public` |
| Analytics and verification tags | `getTrackingSettings()` → ga4Id, gtmId, metaPixelId, searchConsoleToken | Settings › General | `GET /api/v1/settings/tracking` |
| Lead forms: consent line, email required, reply promise | `getLeadFormSettings()` → consentText, emailRequired, slaMinutes | Settings › General | `GET /api/v1/settings/lead-form` |
| Home section order, visibility and heading overrides | `listHomeSections()` → key, enabled, order, title, subtitle | Content › Home and banners | `GET /api/v1/home/sections` |
| Home trust strip | `listTrustItems()` → icon, title, detail, order | Content › Home and banners | `GET /api/v1/home/trust` |
| Home offers, store campaigns, results banners | `listBanners(placement)` → kicker, title, body, image, link, code, validityText, startsAt, endsAt, order, enabled | Content › Home and banners | `GET /api/v1/banners?placement=` |
| Airline strip | `listFeaturedAirlines()` → code, name, featuredOrder | Content › Home and banners | `GET /api/v1/airlines?featured=true` |
| Destination finder | `listDestinations()` → name, subtitle, iata, image, flightTime, visaNote, visaEasy, bestSeason, fromPrice, tags, order | Content › Home and banners | `GET /api/v1/home/destinations` |
| Why WAAFA values (Home, About) | `listValues()` → icon, title, body, order | Content › Home and banners | `GET /api/v1/home/values` |
| Journey timeline (Home, About) | `listTimeline()` → period, text, order | Content › Home and banners | `GET /api/v1/home/timeline` |
| Group fare cards (Home rail, group fares page, results) | `listGroupFares()`, `getGroupFare()` → airline, cabin, baggage, tripType, from, to, stops, departDate, returnDate, seatsLeft, farePerAdult, expiresAt, notes | Sales › Group fares | `GET /api/v1/group-fares` |
| Package cards, list filters and sort | `listPackages()` → title, placesLabel, categories, tags, months, durationDays, durationNights, includesShort, cover, fromPrice, popularity | Travel › Tour packages | `GET /api/v1/packages` |
| Package detail | `getPackage()`, `listRelatedPackages()` → summary, gallery, video, groupSize, visaNote, highlights, itinerary, inclusions, exclusions, prices, departures, anyDate, hotels, visa, terms, faqs, relatedSlugs, seo | Travel › Tour packages | `GET /api/v1/packages/{slug}` |
| Airport and hotel-city autocomplete | `searchAirports()`, `listPinnedAirports()`, `searchHotelPlaces()` → iata, city, name, country, pinnedRank; place name, city, popular | Seeded reference data (B6) | `GET /api/v1/airports?q=`, `GET /api/v1/hotel-places?q=` |
| Visa list and country cards | `listVisaCountries()` → name, flagCode, region, submission, popular, types[].type, processingTime, serviceCharge | Travel › Visa | `GET /api/v1/visa/countries` |
| Visa country page | `getVisaCountry()` → types[].processingTime, stay, entry, validity, checklist, embassyFee, embassyFeeNote, serviceCharge, notes; forms; faqs; guideSlug | Travel › Visa | `GET /api/v1/visa/countries/{slug}` |
| Visa Guide list and article | `listVisaGuides()`, `getVisaGuide()` → title, summary, cover, sections, tips, updatedAt, readingMinutes, seo | Content › Pages, blog and FAQs | `GET /api/v1/visa/guides` |
| Store home rows | `listStoreRows()` → key, enabled, order | Waafas World › Collections | `GET /api/v1/shop/store-rows` |
| Category grid and listing filters | `listCategories()`, `getCategory()`, `getAttributeSet()` → name, slug, icon, description, banner, parentId, level, attributeSetId, compatibility, order, seo; attributes[].filterable | Waafas World › Categories | `GET /api/v1/shop/categories` |
| Product cards and product page | `listProducts()`, `getProduct()` → title, shortTitle, badges, cardSpec, highlights, description, specs, warranty, images, video, options, variants (sku, price, mrp, stock, lowStockAt, preOrder, images), codEligible, bulkFrom, seo | Waafas World › Products | `GET /api/v1/shop/products` |
| Brands row and brand pages | `listBrands()`, `getBrand()` → name, logo, description | Waafas World › Products | `GET /api/v1/shop/brands` |
| Collections | `listCollections()`, `getCollection()` → name, description, image, rule, order | Waafas World › Collections | `GET /api/v1/shop/collections` |
| Deals with an end date | `listDeals()` → dealPrice, endsAt, product, variant | Waafas World › Products | `GET /api/v1/shop/deals` |
| Find by model | `listCompatibleModels()`, `findCompatibleProducts()` → brand, model, partCodes; product.compatibleModelIds | Waafas World › Products (compatibility CSV) | `GET /api/v1/shop/compatible-products` |
| Coupons at checkout | `findCoupon()` → code, type, value, minOrder, maxDiscount, startsAt, endsAt, enabled | Waafas World › Coupons | `POST /api/v1/shop/coupons/validate` |
| Delivery charges, estimates, free delivery, minimum order, office pick-up | `getShippingSettings()` → zones[].name, areas, charge, estimate; freeDeliveryThreshold; minimumOrder; officePickup | Settings › Payments and delivery | `GET /api/v1/settings/shipping` |
| Offline Payment page, checkout and order emails | `getPaymentSettings()` → offlineAccounts[].kind, title, lines, instructions | Settings › Payments and delivery | `GET /api/v1/settings/payments` |
| EMI page | `getEmiSettings()` → minimumAmount, tenuresMonths, cardsNote, appliesTo, interestNote; `listEmiBanks()` → name, tenuresMonths, note | Settings › Payments and delivery | `GET /api/v1/settings/emi` |
| Refund, Privacy, Terms and About Us text | `getPage(slug)` → title, summary, highlights, sections, lastUpdated, seo | Content › Pages, blog and FAQs | `GET /api/v1/pages/{slug}` |
| Blog list, post and Home blog strip | `listBlogPosts()`, `getBlogPost()`, `listRelatedBlogPosts()`, `listBlogCategories()` → title, excerpt, intro, sections, cover, category, author, publishedAt, readingMinutes, featured, cta, seo | Content › Pages, blog and FAQs | `GET /api/v1/blog/posts` |
| FAQs page and Home FAQ strip | `listFaqs()` → category, question, answer, link, order, onHome | Content › Pages, blog and FAQs | `GET /api/v1/faqs` |
| Baggage table | `listBaggageRules()` → airlineCode, airlineName, scope, cabinClass, cabinAllowance, checkedAllowance, notes, lastVerified | Content › Pages, blog and FAQs | `GET /api/v1/baggage-rules` |
| Gallery page, albums and Home strip | `listGalleryAlbums()`, `getGalleryAlbum()` → title, category, cover, items (photo or video, caption), publishedAt | Content › Gallery | `GET /api/v1/gallery/albums` |
| Testimonials wall and Home reviews | `listPublicFeedback()` → name, service, rating, comment, photo, submittedAt (approved with consent only; contact details never leave the server) | Content › Feedback | `GET /api/v1/feedback` |
| Facebook reviews link (until approved feedback exists) | `getSiteSettings()` → reviewsUrl | Settings › General | `GET /api/v1/settings/site` |
| Meet our team (Home bento, About grid) | `listTeam(placement)` → name, initials, designation, department, bio, photo, whatsappE164, email, linkedinUrl, featured, showOnHome, showOnAbout, visible, order | Content › Team | `GET /api/v1/team?placement=` |
| Customer emails (lead received, order placed, visa status) | NotificationTemplate → subject, body, variables, channel, enabled (admin repository arrives with A21) | Settings › Notifications | `GET /api/v1/admin/notification-templates` |
| Lead reference on success screens | `createLead()` → reference, createdAt | Sales › Leads | `POST /api/v1/leads` |

## Components inventory

| Component | Path | Source (shadcn / 21st.dev id / custom) | Used on |
| --- | --- | --- | --- |
| MotionProvider | `apps/web/src/components/motion/MotionProvider.tsx` | custom (LazyMotion strict + MotionConfig reducedMotion="user") | root layout |
| reducedMotion helpers | `apps/web/src/components/motion/reducedMotion.ts` | custom (`REDUCED_FADE`, `useRiseVariants`, `useSafeTransition`) | MotionKit (A3) |
| cn | `apps/web/src/lib/utils.ts` | shadcn (`cn` package) | every component |
| formatTaka, formatDate, formatTime | `packages/shared/src/format/` | custom | prices, dates (web + API) |
| shadcn primitives (41) | `apps/web/src/components/ui/` | shadcn radix-nova, restyled to the Components/States boards | everywhere |
| Button (pill, loading, 9 variants) | `components/ui/button.tsx` | shadcn, rewritten | everywhere |
| Badge (premium, discount, status) | `components/ui/badge.tsx` | shadcn, rewritten | cards, admin |
| Toaster | `components/ui/sonner.tsx` | shadcn + Sonner, light-only, above the tab bar | site layout |
| LogoLockup | `components/brand/LogoLockup.tsx` | custom (supplied logo cut-outs) | header, footer |
| RibbonBand · RibbonDivider · RibbonLine | `components/brand/` | custom (prototype ribbon geometry) | hero, dividers, tabs, progress |
| GoldTriangle | `components/brand/GoldTriangle.tsx` | custom | premium badges |
| BrandLoader | `components/brand/BrandLoader.tsx` | custom (W strokes, CSS) | route loading |
| PageTransition · Reveal · Stagger · StaggerItem · CountUp · Marquee · Parallax · PressScale · DrawCheck | `components/motion/` | custom on Motion (MotionKit) | site-wide |
| SmartImage · SmartVideo | `components/media/` | custom on next/image | photos, hero and package loops |
| EmptyState · ErrorState | `components/feedback/` | custom on shadcn Empty | lists, results, errors |
| WhatsAppIcon · FacebookIcon | `components/icons/` | Simple Icons 16.34.0 (CC0) | WhatsApp buttons, socials |
| zod contracts (settings, content, travel incl. FR-GS-08 models, search, leads, visa, shop, admin) | `packages/shared/src/schemas/` | custom (zod 4, `.strict()`) | web, fixtures, API (Phase B) |
| makeReference · parseReference · toDhakaIsoString · toDhakaDateString | `packages/shared/src/helpers/reference.ts` | custom | lead and order references, timestamps |
| toBdE164 · formatBdPhone · whatsappLink | `packages/shared/src/helpers/phone.ts` | custom | forms, contact links |
| getOfficeStatus · formatClock | `packages/shared/src/helpers/officeHours.ts` | custom (Asia/Dhaka) | Open now chip |
| Sample fixtures + `loadFixtures()` (parsed, frozen) | `fixtures/src/` | custom | fixture repositories, Phase B seed |
| Repository interfaces | `apps/web/src/lib/data/types.ts` | custom | data layer |
| Cached accessors (`'use cache'` + `CACHE_TAGS`) | `apps/web/src/lib/data/{settings,content,travel,visa,shop,leads}.ts` | custom on Next 16 Cache Components | every page |
| Fixture repositories | `apps/web/src/lib/data/fixtures/` | custom | Phase A data source (`source.ts`) |

## Benchmark (Lighthouse mobile)

Lighthouse 13.5.0 mobile (simulated Slow 4G, 4× CPU), median of 3 runs, 9 Oct 2026. Perf / A11y / Best practices / SEO · LCP.

| Page | gozayaan.com | sharetrip.net | akijair.com | obokash.com | Waafa (target / actual) |
| --- | --- | --- | --- | --- | --- |
| Home | 26 / 76 / 50 / 92 · 24.4 s | 1 / 72 / 73 / 100 · 29.2 s | 27 / 79 / 69 / 92 · 25.4 s | 35 / 88 / 54 / 92 · 12.5 s | ≥ 90 / ≥ 95 / ≥ 95 / 100 · ≤ 2.5 s / — |

Detail, weights and the area-by-area review: `docs/design/COMPETITOR_BENCHMARK.md`.

## Session log (newest first)

### 2026-10-09 11:35 (Asia/Dhaka) — A4 data layer and content model (#4)
- Shared zod contracts for every domain (strict objects, shared enums, FR-GS-08 normalised travel models, reference formats), plus reference, phone, office-hours and Dhaka-time helpers.
- Typed Sample fixtures from the prototype boards: settings and menus, policies and About, blog, FAQs, offers, destinations, gallery, team (initials), baggage, 9 group fares, 11 packages, 16 visa countries and 5 guides, a shop catalogue with variants, compatibility and orders, admin samples. Every record `sample: true`.
- Repository interfaces, fixture repositories (pure, take `now`) and cached accessors (`'use cache'`, `cacheLife`, `cacheTag`) in `apps/web/src/lib/data`; checked once in the real Next runtime with a temporary route (removed).
- Admin-control matrix seeded (56 rows).
- Found and fixed while writing fixtures: invented alt-text details (now the CREDITS subjects), a Sajek photo on a Sreemangal package (package dropped), possibly real phone numbers in samples (now the unassigned 010 prefix), an About intro over its 300-character limit (caught by the schema).
- Tests: Vitest 168 passed (shared 38, fixtures 75 incl. compliance checks, web 55); Playwright 15 passed. Lint, typecheck, build, Prettier clean.

### 2026-10-09 10:24 (Asia/Dhaka) — A3 design system (#3)
- 41 shadcn primitives restyled to the Components/States boards; brand pieces (logo lockup, ribbon, gold triangle, W loader); MotionKit; SmartImage/SmartVideo; empty/error states; taka glyph font; favicon and app icon; dev-only `/styleguide`.
- Found and fixed: horizontal scroll at 320/390 px (grid tracks), axe `button-name` on Radix radio cards (aria-labelledby), tabs without panels, OTP `defaultValue` console error, next/image aspect warning, `set-state-in-effect` lint errors (useSyncExternalStore).
- Tests: Vitest 36 passed; Playwright 15 passed (home + styleguide at 320/390/768/1440 with axe, keyboard dialog/accordion, toast, reduced motion). Lint, typecheck, build, Prettier clean.
- Usage limit hit mid-issue; resumed after reset. Background dev/prod servers were stopped by Claude Code for low memory (machine has ~1.2 GB free): run builds and e2e one at a time, `--workers=2`.

### 2026-10-09 06:46 (Asia/Dhaka) — A2 foundation (#2)
- pnpm workspaces + Turborepo (`apps/web`, `packages/shared`, `packages/config`, `fixtures`), cross-platform root scripts, `.gitattributes` LF, `.nvmrc` 22, `.editorconfig`.
- Next 16.4 on pnpm with Cache Components + Partial Prefetching; tokens in `globals.css` (D8 primary), palette locked to WAAFA colours, type-scale and container utilities; Plus Jakarta Sans + Inter via next/font.
- shadcn init (radix-nova, Lucide, pointer cursors); next-intl with `next/root-params`, `src/proxy.ts`, unprefixed English.
- Tests: Vitest 20 passed (taka, dates, cn, message-catalogue compliance guard); Playwright 7 passed (320/390/768/1440, axe, console, overflow, zoom, skip link, locale prefix). Lint, typecheck, build, Prettier clean.

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
| D12 | 2026-10-09 | TypeScript 6.0.3 and ESLint 9 (not TS 7.0 / ESLint 10) | typescript-eslint 8.71 supports TypeScript `<6.1`; eslint-config-next's plugins are proven on ESLint 9 |
| D13 | 2026-10-09 | One root layout `app/[locale]/layout.tsx`; site in `(site)`, admin in `[locale]/admin` (URL `/admin`) | `next/root-params` + next-intl without a second root layout; English URLs stay unprefixed via `src/proxy.ts` |
| D14 | 2026-10-09 | next-intl: `localeDetection: false`, `localeCookie: false` | Language changes only by the visitor's choice (PRD FR-GLB-07); responses stay cacheable |
| D15 | 2026-10-09 | Tailwind through `@tailwindcss/postcss` (documented in the bundled Next 16.4 docs) instead of the `@tailwindcss/turbopack` loader rule | Follow the framework's documented path |
| D16 | 2026-10-09 | Tailwind default palette removed (`--color-*: initial`); only WAAFA colours plus white/black exist | Off-brand colours fail to compile into anything, keeping every screen on the tokens |
| D17 | 2026-10-09 | shadcn `radix-nova` preset with Lucide and pointer cursors; `cn` from shadcn's `cn` package | Radix per the stack; Lucide per the PRD; cursor-pointer per UI UX Pro Max |
| D18 | 2026-10-09 | `framer-motion` removed; `motion` v14 only. pnpm `allowBuilds` denies `@parcel/watcher`, `@swc/core`, `unrs-resolver` scripts | Same library twice would duplicate the bundle; the three packages ship prebuilt binaries |
| D19 | 2026-10-09 | LogoLockup renders the supplied logo cut-outs through next/image, not a hand-traced SVG | Tracing the 3D gradients and silver edges would alter the logo (never recolour); vectors are an open owner question |
| D20 | 2026-10-09 | Buttons are full pills (48 / 38 / 56 px, icon 44 px); DESIGN.md corrected | Measured on the prototype's Components board |
| D21 | 2026-10-09 | Hover colours swap instantly or fade an overlay's opacity; shadcn's height-based accordion animation replaced by a fade | Transform/opacity-only rule (PRD §14, MOTION.md) |
| D22 | 2026-10-09 | "Waafa Taka": 2.6 KB subset of Hind Siliguri SemiBold (OFL, renamed) for the ৳ sign via next/font/local, unicode-range U+09F3 | Inter and Plus Jakarta Sans have no taka glyph; the Tokens board specifies Hind Siliguri for ৳ |
| D23 | 2026-10-09 | Every grid declares `grid-cols-1` at the phone base; carousel viewports use `contain: inline-size`; OTP boxes 40 px below 640 px | Found horizontal scroll at 320/390 px caused by auto grid tracks |
| D24 | 2026-10-09 | next-intl root provider passes `messages={null}`; client leaves get strings as props or a scoped provider (`pickMessages`) | next-intl v4 otherwise ships the whole catalogue to every page (JS budget) |
| D25 | 2026-10-09 | WhatsApp and Facebook glyphs from Simple Icons (CC0) | Lucide has no brand icons; visitors look for the WhatsApp mark |
| D26 | 2026-10-09 | `/styleguide` exists in dev and in `STYLEGUIDE=1` builds (CI e2e), 404 in production; Turbo's build task declares `STYLEGUIDE` | Dev-only page that CI still tests with axe |
| D27 | 2026-10-09 | UI reads data only through cached accessors in `apps/web/src/lib/data` (`'use cache'` + `cacheLife` + `cacheTag` from `CACHE_TAGS`); they call `repositories` from a `server-only` `source.ts`; fixture repositories are pure and take `now` | Phase C swaps one line in `source.ts`; repositories stay unit-testable outside Next; the tags match the API's revalidation webhook |
| D28 | 2026-10-09 | Fixtures are written as zod inputs, parsed by `loadFixtures()` (defaults applied) and deep-frozen | A broken fixture fails with an error naming the field; nothing can sort or edit shared data in place |
| D29 | 2026-10-09 | Pages, blog posts and visa guides store headed sections (id = anchor) instead of one HTML body | The "On this page" and "In this article" lists come from data; each body is sanitised rich text (API sanitises on save) |
| D30 | 2026-10-09 | Embassy fees default to null ("set by the embassy; confirmed before you pay"); stay, entry and validity are optional; only Thailand carries the prototype's sample figures | No invented visa facts for real countries |
| D31 | 2026-10-09 | Sample people use "Sample …" names, example.com emails and the unassigned 010 phone prefix; a test fails on any BD mobile except the company's | No real person can be reached through seed data |
| D32 | 2026-10-09 | Gallery albums are named after places while Unsplash photos stand in; feedback fixtures are pending only; team samples drop the prototype's Managing Director card and personal anecdotes | No invented trips, reviews or owner details (PRD §2) |
| D33 | 2026-10-09 | Packages carry `categories` (several) and `months`; the More menu item has no href; template variables allow snake_case; the Home airline strip is data (`featuredOrder`) | Matches the boards' filters and admin screens; everything visible stays admin-controlled |
| D34 | 2026-10-09 | Printing Solutions and International Trading live under `/shop` (`/shop/printing-solutions`, `/shop/international-trading`); category slugs are full words (`printers-and-supplies`) | PRD sitemap lists them as /shop children; readable URLs |
| D35 | 2026-10-09 | Phase A lead intake validates and returns a well-formed reference but stores nothing | No personal data kept in a dev server's memory; the API takes over in Phase C |

## Known issues and bugs
- Fixture images point at `/images/<key>.jpg` and `/images/products/*.jpg`, which are not in `apps/web/public` yet: A5 (#5) adds the Unsplash photos and the Better Day product shots.
- The boards disagree on two shop numbers: cash-on-delivery cap ৳20,000 (FAQ, Terms) vs ৳25,000 (admin sample), and free delivery over ৳3,000 (admin) vs ৳5,000 (product page). Fixtures use ৳20,000 and ৳3,000 until the owner confirms.
- Phase A references restart at 0001 whenever the dev server restarts (no storage before the API).

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
- [ ] Logo vector files (SVG or AI) — the header uses the supplied PNG cut-outs until then
- [ ] About Us mission and vision wording (sample text drafted from the tagline)
- [ ] EMI partner banks and their tenures; Better Day toner prices and the printer models each one fits (samples from the prototype)
- [ ] Staff names and roles for admin accounts; team members who agree to appear on the site
- [ ] SSLCommerz merchant account status
- [ ] Email provider for info@ and DNS access for the sending domain
- [ ] Hosting accounts: Vercel, VPS or Railway, Cloudflare (Turnstile, R2)

## Next steps
1. A5 (#5): real photos with credits in `apps/web/public/images` (Unsplash set + Better Day product shots), video loops and posters.
2. A6 → A22 in order, reading every visible field through `apps/web/src/lib/data` accessors.

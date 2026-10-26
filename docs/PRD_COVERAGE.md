# WAAFA — PRD coverage

Every requirement ID in `docs/PRD.md` with its status, evidence and the issue that finishes it. Written in the Step 0
audit of PROMPT 10 (#231, 25 Oct 2026) and kept current by every Phase D issue: when an issue closes, its rows turn
**done** with the evidence (route, component, API, test).

**Status words:** done = the code implements the whole requirement · partial · missing · waiting for owner account =
the adapter needs an outside account (it ships built, tested against the sandbox and switched off until the keys are
saved in Admin › Integrations).

**How it was checked:** the code on `main` (db6fe96) read requirement by requirement, then the gaps checked on the live
site with Playwright on 25 Oct: `/track` 404 (only `/shop/track`), `/bn` 404 and no `hreflang`, `/login` offers Google
only (no password or one-time code), no analytics tag loaded (no IDs set), `/emi` has the calculator but no request
form. Section-level IDs that the PRD writes as one bullet list (accounts, notifications, More pages, the leads screen,
the admin modules) are split into rows. `FR-AREA` is only the PRD's ID template; the PRD's `FR-FLT-L`, `FR-HTL-L` and
`FR-ADM-LEAD` are covered; operations, SEO, security, performance, compatibility and legal are the `NFR-*` rows.

Paths: `web/` = `apps/web/src/`, `site/` = `apps/web/src/app/[locale]/(site)/`, `adm/` =
`apps/web/src/app/[locale]/secure-admin-control/(panel)/`, `api/` = `apps/api/src/`, `shared/` = `packages/shared/src/`,
`e2e/` = `apps/web/e2e/`.

## Summary (updated 26 Oct 2026, after #233)

| Priority | Rows | Status |
| --- | --- | --- |
| P0 (launch) | 116 | done 99 · partial 16 · missing 1 |
| P1 (Phase D, due 13 Nov) | 17 | done 2 · partial 8 · missing 5 · waiting for owner account 2 |
| P2 (Phase E, live booking) | 8 | missing 8 |
| P3 (scale) | 1 | missing 1 |
| All | 142 | done 101 · partial 24 · missing 15 · waiting for owner account 2 |

**P0 not done (fixed first):** customer files never leave the browser (visa documents, payment proof, printing and
trading attachments, feedback photo: the Phase A rule D87/D106/D109 was never lifted) → #232; visa status email never
sent, staff alert recipients only in the server env, no low-stock alert, no EMI request form, no reason on mode changes
→ #233; no Bookings module (convert keeps only an amount) → #242; compatible-models CSV import → #248; first-load JS
over 200 KB on Home, Flights and Shop → fixed in #236 (Lighthouse 90 on Home, Hotels and Blog → #271); backups without an off-site copy → #239 (rate limits moved to Redis in #234); no
conversion events and one sitemap → #237; no error tracking → #238; Chromium-only tests → #259.

## §7 Global layout, dynamic footer, home and unified search

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| FR-GLB-01 | P0 | Sticky header, transparent over hero, solid with blur after 24 px | done | web/components/layout/SiteHeader.tsx; e2e/layout.spec.ts | — | — |
| FR-GLB-02 | P0 | Logo lockup (W mark, wordmark, desktop tagline) linking Home | done | web/components/brand/LogoLockup.tsx | — | — |
| FR-GLB-03 | P0 | Dismissible admin announcement bar with link and date range | done | web/components/layout/AnnouncementBar.tsx; content key `announcements` | — | — |
| FR-GLB-04 | P0 | Floating WhatsApp button, message names current page | done | web/components/layout/FloatingWhatsApp.tsx | — | — |
| FR-GLB-05 | P0 | Brand loader (W ribbon) for slow route changes; static on reduced motion | done | web/components/brand/BrandLoader.tsx | — | — |
| FR-GLB-06 | P0 | One shared style for toasts, skeletons, empty and error states | done | web/components/feedback/*; site/styleguide; e2e/system.spec.ts | — | — |
| FR-GLB-07 | P1 | English/Bangla switch; ৳ with lakh grouping | partial | shared/format (formatTaka); web/i18n/routing.ts | Bangla: `locales: ["en"]`, only messages/en.json, no /bn, no switch, no Bengali font | #254 |
| FR-FTR-01 | P0 | Footer brand column: white lockup, tagline, about, socials | done | web/components/layout/SiteFooter.tsx | — | — |
| FR-FTR-02 | P0 | Admin menu-builder link columns (Travel, Waafas World, Help) | done | SiteFooter.tsx; menus footer-travel/-shop/-help; adm/website/menus | — | — |
| FR-FTR-03 | P0 | Contact block: address, phone, WhatsApp, email, hours, map | done | SiteFooter.tsx; ContactRow.tsx; OfficeStatusChip.tsx | — | — |
| FR-FTR-04 | P0 | "We accept" logos per live method; trust badges only if held | done | SiteFooter.tsx (PAYMENT_ICONS, weAccept) | — | — |
| FR-FTR-05 | P0 | Newsletter signup | done | web/components/layout/NewsletterForm.tsx; app/api/newsletter; adm/subscribers | — | — |
| FR-FTR-06 | P0 | Bottom bar © + legal links; developer credit from code | done | web/components/layout/DeveloperCredit.tsx | — | — |
| FR-FTR-07 | P0 | Mobile accordions; credit last, centred | done | web/components/layout/FooterAccordion.tsx; e2e/layout.spec.ts | — | — |
| FR-HOME | P0 | 13 admin-ordered, hideable home sections | done | site/_components/home/HomeSections.tsx; adm/website/home; e2e/home.spec.ts | — | — |
| FR-SRCH-01 | P0 | Search tabs Flight/Hotel/Tour/Visa with animated indicator | done | web/components/search/SearchTabList.tsx, SearchCard.tsx | — | — |
| FR-SRCH-02 | P0 | Flight: trip types, 5 legs, travellers/class, airline, direct, ±3, student | done | FlightPanel.tsx, MultiCityPanel.tsx; shared/schemas/search.ts; web/lib/search/flightOptions.ts | — | — |
| FR-SRCH-03 | P0 | Hotel: autocomplete, ≤30 nights, 1–5 rooms, child ages, nationality | done | HotelPanel.tsx, RoomsPicker.tsx; search.ts (MAX_HOTEL_NIGHTS) | — | — |
| FR-SRCH-04 | P0 | Tour: keyword, month, travellers, budget → filtered /tour-packages | done | TourPanel.tsx, MonthPicker.tsx | — | — |
| FR-SRCH-05 | P0 | Visa: country, nationality, type → /visa/[country] | done | VisaPanel.tsx, VisaTypePicker.tsx | — | — |
| FR-SRCH-06 | P0 | Airport autocomplete with BD airports and top routes pinned | done | AirportPicker.tsx; app/api/search/airports; fixtures/src/travel.ts | — | — |
| FR-SRCH-07 | P0 | Mobile full-screen pickers with recent/popular, pinned Search | done | PickerSheet.tsx, QuickPicks.tsx | — | — |
| FR-SRCH-08 | P0 | Validation: From≠To, return ≥ departure, ≤ 9 travellers | done | shared/schemas/search.ts refinements; e2e/search.spec.ts | — | — |
| FR-SRCH-09 | P0 | Params in URL (shareable, back works); recent-search chips | done | web/lib/search/*Params.ts (nuqs); useRecentSearches.ts | — | — |
| FR-SRCH-10 | P0 | Every search logged async, never blocking navigation | done | app/api/search/log; api SearchLog model; `POST /public/search-logs` | — | — |

## §8 Flights and hotels

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| FR-RES-01 | P0 | One results shell: summary bar, filter rail/sheet, body, help card | done | web/components/results/TripSummaryBar.tsx, HelpCard.tsx; site/flights, site/hotels | — | — |
| FR-RES-02 | P0 | Page reads module mode, renders Manual or Live body | done | web/components/results/ResultsBody.tsx (bookingModes from snapshot) | — | — |
| FR-FLT-01 | P0 | "Best fare from experts" card, query form, matching group fares | done | site/flights; components/leads/LeadRequestCard.tsx; GroupFaresRail.tsx | — | — |
| FR-FLT-02 | P0 | Step 1 contact: name, phone (+880 validated), email (admin optional) | done | components/leads/ContactStep.tsx; lib/leads/contactForm.ts (emailRequired) | — | — |
| FR-FLT-03 | P0 | Step 2 trip prefilled + preferences + consent | done | site/flights/_components; e2e/flights.spec.ts | — | — |
| FR-FLT-04 | P0 | Turnstile, rate limits, idempotency key (one lead per double tap) | done | components/forms/TurnstileWidget.tsx; app/api/leads/route.ts; api/common/idempotency.service.ts | — (API limits in Redis since #234) | — |
| FR-FLT-05 | P0 | Success: check, ref FLT-YYMMDD-NNNN, copy, next steps, WhatsApp | done | components/leads/LeadSuccess.tsx; api/common/references.ts | — | — |
| FR-FLT-06 | P0 (panel + Telegram P1) | Customer confirmation email; instant staff alert | done (P0 scope) | api/public/intake.service.ts (lead-received-customer, lead-alert-staff) | P1: real-time panel is a 30 s polled bell, no Telegram | #243, #252 (P1 parts) |
| FR-FLT-07 | P0 | Admin group fares; /flights/group-fares; "Request this fare" | done | site/flights/group-fares; GroupFareCard.tsx; adm content/groupFares | — | — |
| FR-FLT-08 | P1 | Partial capture: abandoned form after step 1 saved as Incomplete lead | missing | — (no "incomplete" status or capture) | Whole feature | #250 |
| FR-FLT-L | P2 | Live offers, details, booking, payment, ticketing, manage booking | missing | web/components/results/LivePlaceholder.tsx only | Whole Live flight flow (Phase 2) | Phase E (#32) |
| FR-HTL-01 | P0 | Hotel two-step form (destination, dates, rooms, stars, budget) | done | site/hotels; e2e/hotels.spec.ts | — | — |
| FR-HTL-02 | P1 | Curated hotels with photos, amenities, rooms, "Request booking" | missing | — (no hotel property collection; `hotelPlaces` is autocomplete only) | Whole feature | #249 |
| FR-HTL-L | P2 | Live hotel results, detail, booking, voucher | missing | LivePlaceholder.tsx only | Whole Live hotel flow | Phase E (#32) |

## §9 Tour packages and visa services

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| FR-PKG-01 | P0 | Admin categories (no Hajj/Umrah) | done | shared/schemas/travel.ts; adm content/tourPackages | — | — |
| FR-PKG-02 | P0 | Listing filters, sort, keyword, mobile sheet, Load more | done | site/tour-packages/page.tsx; e2e/packages.spec.ts | — | — |
| FR-PKG-03 | P0 | Card: cover, title, destination, 4D/3N, from price, tags | done | web/components/travel/PackageCard.tsx | — | — |
| FR-PKG-04 | P0 | Detail: gallery+lightbox, itinerary timeline, price table, FAQs, share… | done | site/tour-packages/[slug]/_components/{PackageGallery,ItineraryDays,ShareButton}.tsx | — | — |
| FR-PKG-05 | P0 | Sticky booking card / mobile bar, Send query (Manual) | done | [slug]/_components/BookingCard.tsx, BookingBar.tsx | — | — |
| FR-PKG-06 | P0 | Package query lead PKG-… with package, date, travellers, room | done | [slug]/_components/PackageQuery.tsx; e2e/packages.spec.ts | — | — |
| FR-PKG-07 | P0 | Plan My Trip custom request lead CTR-… | done | site/plan-my-trip | — | — |
| FR-PKG-08 | P1 | Package reviews and wishlist | missing | — | Whole feature | #245, #246 |
| FR-PKG-09 | P2 | Instant booking with online payment and balance reminders | missing | — | Phase 2 | Phase E (#32) |
| FR-VISA-01 | P0 | Country list: search, region filter, cards with flag, fee, time | done | site/visa; components/visa/VisaCountryCard.tsx; e2e/visa.spec.ts | — | — |
| FR-VISA-02 | P0 | Country page tab per type: checklist, fees split, forms, FAQs | done | site/visa/[country]; shared/schemas/visa.ts (embassyFee, serviceCharge, forms) | — | — |
| FR-VISA-02a | P0 | Price range per visa type ("৳7,500 – ৳9,500" / "From …") | done | shared/schemas/visa.ts; #179 | — | — |
| FR-VISA-03 | P0 | Apply form with document uploads (≤5 MB), appointment; VSA-… | done | site/visa/[country]/apply/_components/VisaFileStep.tsx; web/components/forms/DocumentSlot.tsx; app/api/uploads; api/files/*; apps/api/test/files.test.ts; e2e/api-mode.spec.ts (issue 232) | — | #232 |
| FR-VISA-04 | P0 | Application statuses; customer email on each change | done | api/admin/leads.service.ts visa() emails visa-status-customer on each step forward; apps/api/test/admin.test.ts | — | #233 |
| FR-VISA-05 | P0 | Private bucket, 10-min signed links, 90-day deletion, logged downloads | done | api/files/customer-files.service.ts (private volume, 10-min signed links, audit file.link and file.download, purge); app/secure-admin-control/files/[key]; apps/api/test/files.test.ts | — | #232 |
| FR-VISA-06 | P1 | Track application by reference + phone; malware scan | partial | api/files/{clamd,fileScan}.ts; worker.ts; deploy compose `clamav`; admin Files panel | Tracking by reference + phone | #240 |
| FR-VGD-01 | P0 | Visa Guide per country, linked both ways with visa page | done | site/visa-guide, site/visa-guide/[slug] | — | — |

## §10 Waafas World

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| FR-CAT-01 | P0 | Category tree ≤ 3 levels with icon, banner, SEO | done | shared/schemas/shop.ts (CategorySchema level 1–3) | — | — |
| FR-CAT-02 | P0 | Attribute sets drive product form, filters, spec table | done | content key `attributeSets`; components/shop/ProductListing.tsx | — | — |
| FR-CAT-03 | P0 | Options and variants (SKU, price, MRP, stock, images) | done | shared/schemas/shop.ts; adm product editor (#198) | — | — |
| FR-CAT-04 | P0 | Manual or rule-based collections | done | shop.ts CollectionSchema (manual / rule) | — | — |
| FR-CAT-05 | P0 | Optional "Compatible with" list, imported by CSV | partial | content key `compatibleModels`; site/shop/finder | No CSV import (export only) | #248 |
| FR-CAT-06 | P0 | Launch catalogue from real stock; samples only in prototype | done (code) | fixtures + admin products | Real products are owner content (not verifiable in code) | — |
| FR-SHOP-01 | P0 | Store home rows (campaigns, deals, brands, recently viewed…) admin-ordered | done | site/shop/page.tsx; CampaignCarousel.tsx; storeRows; e2e/store.spec.ts | — | — |
| FR-SHOP-02 | P0 | Listings with brand/price/stock/attribute filters, sort, Load more | done | ProductListing.tsx; site/shop/{c,brand,collection,deals,search} | — | — |
| FR-SHOP-03 | P0 | Product card with MRP, % off, stock badge, add → stepper | done | ProductCard.tsx, StockBadge.tsx, AddToCartControl.tsx | — | — |
| FR-SHOP-03a | P0 | Show-price switch; "Price on request" with WhatsApp/Call | done | shop.ts `showPrice`; #178 | — | — |
| FR-SHOP-04 | P0 | Product page: zoom gallery, variants, delivery by zone, bulk quote… | done | site/shop/p/[slug]/_components/ProductView.tsx; BulkQuote*.tsx | — | — |
| FR-SHOP-05 | P0 | Find by model + part-code search | done | site/shop/finder/page.tsx | — | — |
| FR-SHOP-06 | P0 | Cart: qty, coupon, zone delivery, minimum, free-delivery bar, mini-cart | done | site/shop/cart; CartSummary.tsx; FreeDeliveryBar.tsx; useCart.ts | — | — |
| FR-SHOP-07 | P0 (online pay P1) | One-page checkout; COD with cap; offline payment with txn ID + proof | partial | site/shop/checkout/_components/CheckoutForm.tsx; PaymentOptions.tsx | Online payment waiting for owner account | #251 |
| FR-SHOP-08 | P0 | Order success ORD-…, instructions, WhatsApp, emails, staff alert | done | components/shop/OrderDone.tsx; intake.service (order-placed-*) | — | — |
| FR-SHOP-09 | P0 | Track order by number + phone with 7 statuses | done | site/shop/track; OrderTimeline.tsx; e2e/orders.spec.ts | — | — |
| FR-SHOP-10 | P0 | Stock per variant drops on order, returns on cancel; low-stock alerts | done | api/public/intake.service.ts (low-stock-staff when a variant reaches lowStockAt); apps/api/test/public.test.ts | — | #233 |
| FR-SHOP-11 | P0 | Printing Solutions page + quote form PRN-… with attachment | done | site/shop/printing-solutions; components/services/PrintingRequest.tsx | — | #232 |
| FR-SHOP-12 | P0 | Trading page + RFQ form TRD-… with attachments | done | site/shop/international-trading; TradingRequest.tsx | — | #232 |
| FR-SHOP-13 | P1 | Reviews, wishlist, save for later, campaign pages, flash sales, Q&A, Buy again, online pay | missing | product page has only a WhatsApp "ask a question" link | All of it; SSLCommerz/bKash = waiting-owner (stubs only) | #245, #246, #247, #251 |
| FR-SHOP-14 | P1 | Courier booking/tracking (Steadfast/Pathao/RedX) + SMS on dispatch | waiting for owner account | manual courier + tracking fields in admin/orders.service.ts | No courier adapter code at all; needs courier account | #253 |
| FR-SHOP-15 | P3 | Corporate accounts, negotiated price lists, VAT invoices | missing | — | Phase 3 | Phase 3 (later) |

## §11 Gallery, feedback, team, More pages, accounts, notifications

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| FR-GAL | P0 | Albums, masonry, lightbox, video embeds, admin bulk upload → WebP/AVIF | done | site/gallery, site/gallery/[slug]; media/PhotoLightbox.tsx; admin/media/MediaDropzone.tsx | — | — |
| FR-FDB | P0 | Approved-only wall, rating summary, Turnstile submit, moderation | partial | site/feedback/_components/FeedbackForm.tsx; adm/feedback | Photo now stored privately (#232); an approved photo is not yet shown on the wall | #245 |
| FR-TEAM | P0 | Team section/grid, initials, bento/carousel, admin order/featured/3:4 crop | done | components/team/TeamCard.tsx; content `team` (showOnHome/About, featured); ImageCropDialog 3:4 | — | — |
| FR-PAGE Refund/Privacy/Terms | P0 | Rich-text policy pages with last-updated date | done | site/{refund-policy,privacy-policy,terms-and-conditions}; PolicyPage.tsx | — | — |
| FR-PAGE Baggage | P0 | Searchable admin baggage table with disclaimer | done | site/baggage-information/_components/BaggageTable.tsx | — | — |
| FR-PAGE EMI | P0 | How EMI works, banks/tenures, "Request EMI plan" form | done | site/emi; components/content/EmiRequest*.tsx; lib/leads/emiLeadForm.ts; e2e/content.spec.ts | — | #233 |
| FR-PAGE EMI calculator | P1 | EMI calculator | done | site/emi/_components/EmiCalculator.tsx; lib/shop/emi.test.ts | — | — |
| FR-PAGE Offline Payment | P0 | Accounts from settings; proof form → Accounts verification queue | done | site/offline-payment/_components/PaymentProofForm.tsx; adm/payments | — | #232 |
| FR-PAGE Blogs | P0 | List with categories, search, featured; post with TOC, share, related | done | site/blog, site/blog/[slug]; ArticleContents.tsx | — | — |
| FR-PAGE FAQs | P0 | Categories, accordion, search, help block, FAQPage markup | done | site/faqs/_components/FaqBrowser.tsx | — | — |
| FR-PAGE About | P0 | Story, mission, values, timeline, brands, team grid | done | site/about-us | — | — |
| FR-PAGE Contact | P0 | Form → CNT-… lead, map, phones, hours, socials | done | site/contact/_components/ContactForm.tsx | — | — |
| FR-ACC sign-in | P1 | Phone OTP, email+password or Google; guest flows still work | partial | site/login; components/account/GoogleSignInButton.tsx; api/customers/googleOAuth.ts | Google only; no phone OTP (template `sign-in-code-customer` unused), no email+password | #241, #252 |
| FR-ACC my account | P1 | Queries timeline, visa apps, orders, wishlist, travellers, addresses, prefs, delete | partial | site/account/page.tsx; `GET /public/account`; e2e/account.spec.ts | Only requests, orders and delete; no wishlist, saved travellers, addresses, profile edit, notification prefs | #241, #246 |
| FR-ACC attach | P1 | Guest leads/orders attach once the same phone is verified | partial | api/customers/customers.service.ts (match by verified email) | Matches by Google email, not verified phone | #241 |
| FR-NTF P0 email | P0 | Emails: lead (cust), module-routed staff alert, order, visa status, feedback, proof | done | api/notifications/notification.service.ts notifyStaff (Settings › Forms and messages › Staff alerts by area, env fallback); visa status and low-stock emails | — | #233 |
| FR-NTF templates + queue | P0 | Admin-editable templates with variables; queue, retries, delivery log | done | notificationTemplates content; BullMQ queue (attempts 5) in notification.service.ts, api/worker.ts; adm/notifications | — | — |
| FR-NTF SMS | P1 | SMS via BD gateway adapter (OTP, lead ack, order status) | waiting for owner account | catalog stubs ssl-wireless, bulksmsbd, twilio in shared/schemas/providers.ts | Adapters only health-check; no send code | #252 |
| FR-NTF real-time | P1 | Real-time admin alerts with sound | partial | components/admin/AdminNotifications.tsx, useInboxSummary.ts (30 s poll) | No push/SSE, no sound | #243 |
| FR-NTF Telegram | P1 | Telegram alert to sales group | missing | — | Whole feature | #252 |
| FR-NTF P2 | P2 | WhatsApp Business templates; app push | missing | — | Phase 2 | Phase E (#32) |

## §12 The Golden Switch

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| FR-GS-01 | P0 | Mode settings per module (mode, providers, fallback); audit who/when/from/to/reason | partial | shared/schemas/settings.ts BookingModesSchema; AuditLog before/after | Mode changes are impossible until the Phase E Live gate (Live stays locked); the reason, providers and fallback come with that gate (D276) | Phase E (#32) |
| FR-GS-02 | P0 | Public config cached 60 s; switch purges cache + revalidates | done | modes in `GET /public/snapshot` ("use cache" snapshot tag); app/api/revalidate; lib/admin/contentActions.ts (updateTag) | No separate `/config/public` endpoint (same behaviour via snapshot) | — |
| FR-GS-03 | P0 | Admin Booking Modes switch per module, Live locked with reason | done | lib/admin/blueprints/settings.ts bookingModes; content-admin.service.ts assertLiveStaysLocked | — | — |
| FR-GS-04 | P2 | Live gate: Super Admin, creds, green health ≤5 min, gateway, typed confirm | missing | — (Live is hard-locked) | Phase 2 | Phase E (#32) |
| FR-GS-05 | P2 | Circuit breaker auto-fallback + kill switch | missing | — | Phase 2 | Phase E (#32) |
| FR-GS-06 | P0 | Flight/Hotel/Payment provider interfaces | done | api/providers/adapters.ts | — | — |
| FR-GS-07 | P0 | Manual providers; GDS/consolidator/payment stubs with contract tests; registry | partial | api/providers/catalogAdapters.ts, registry.ts (parallel, dedupe); providers.unit.test.ts; apps/api/test/providers.test.ts | Markup is stored but no pricing rules applied in the registry | Phase E (#32): markup applies to Live prices |
| FR-GS-08 | P0 | Normalised shared schemas (FlightOffer … CancellationPolicy) | done | shared/schemas/travel.ts (10 schemas) | — | — |
| FR-GS-09 | P0 | ResultsBody slot renders ManualBody or LiveBody | done | components/results/ResultsBody.tsx, LivePlaceholder.tsx | — | — |
| FR-GS-10 | P2 | Live mode still creates leads for failed bookings etc. | missing | — | Phase 2 | Phase E (#32) |

## §13 Admin panel

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| FR-ADM-LEAD list | P0 | Table/cards, filters, search, saved views, bulk assign/status, CSV+Excel | done | adm/leads/page.tsx (views mine/unassigned/overdue, bulk assign); leads/export; reports xlsx; e2e/admin-inbox.spec.ts | — | — |
| FR-ADM-LEAD detail | P0 | Status/assignee/priority, customer card, readable search, timeline | done | adm/leads/[id]; components/admin/{LeadActions,LeadFacts}.tsx | — | — |
| FR-ADM-LEAD statuses | P0 | 8 statuses; first change stamps response; Booked needs amount; reasons | done | shared/workflow (nextLeadStatus); leads.service.ts firstResponseAt | — | — |
| FR-ADM-LEAD convert | P0 | Manual booking record: PNR, tickets, amount, payment status, attachments | partial | leads.service.ts `convert` (amount + group-fare seats) | No PNR, ticket numbers, payment status or attachments | #242 |
| FR-ADM-LEAD duplicate | P0 | Same phone + module within 24 h flagged and linked | done | api/public/intake.service.ts DUPLICATE_WINDOW_MS | — | — |
| FR-ADM-LEAD P1 | P1 | Quote builder + PDF, kanban, reminders, @mentions, round-robin | partial | kanban: adm/leads/board, components/admin/board/LeadBoardDnd.tsx | Quote builder, follow-up reminders, @mentions, round-robin missing | #242, #243 |
| FR-ADM Dashboard | P0 | KPI cards, leads by module/status, top routes, activity | done | api/admin/dashboard.service.ts; components/admin/dashboard | P1 agent leaderboard missing | #244 (P1 leaderboard) |
| FR-ADM Search activity | P0 | Every search with device/source/converted; top routes; per day; rate | partial | adm/search/page.tsx; inbox.service.ts searchToLeadRate | No searches-per-day series; converted flag not shown per row; P1 funnel missing | #244 |
| FR-ADM Bookings | P0 | Booking records from converted leads, with documents and payments | missing | — (no bookings screen or model) | Whole module | #242 |
| FR-ADM Group fares | P0 | Create, edit, auto-expire | done | content `groupFares`; scheduler.service.ts expiresAt | P1 bulk CSV import missing | #248 (P1 CSV) |
| FR-ADM Tour packages | P0 | Rich editor, day builder, price table, departures, SEO, draft/publish, duplicate | done | adm/content/[key]/[id] package editor (#198); e2e/admin-editors.spec.ts | — (P1 scheduled publishing done, #194) | — |
| FR-ADM Visa | P0 | Countries/types/checklist/fees; pipeline with document viewer, notifying statuses | done | adm/visa-applications; VisaProgressPanel.tsx; Files panel (#232); status emails (#233) | — | #233 |
| FR-ADM Shop | P0 | Products/variants/attributes/tree/brands/collections, compat CSV, orders, zones, coupons | partial | adm/orders, adm/content/{products,categories,…}; admin/orders.service.ts | Compatibility CSV import missing | #248 |
| FR-ADM Content | P0 | Pages, blog, FAQs, banners, home order, gallery, team, menus, baggage, EMI banks | done | adm/content/*, adm/website/{home,menus}, adm/feedback | P1 redirect manager: automatic slug redirects only (#194) | — |
| FR-ADM Media | P0 | Uploads with required alt text and optimisation | done | adm/media; api/media/media.service.ts (sharp); e2e/admin-media.spec.ts | — (P1 usage tracking done) | — |
| FR-ADM Customers | P0 | Unified list, profile with history, notes, tags, export | partial | adm/customers, adm/customers/[phone]; api/admin/customers.service.ts | No notes, tags or export; P1 merge missing | #244 |
| FR-ADM Marketing/SEO | P0 | Per-page SEO, tracking codes, newsletter list, coupons | done | trackingSettings; adm/subscribers; content `coupons` | P1 campaign landing pages missing | #247 (P1 campaigns) |
| FR-ADM Reports | P0 | Leads by module/status/agent/source, response, sales, visa, CSV | partial | adm/reports; api/admin/reports.service.ts (CSV + XLSX); apps/api/test/reports.test.ts | No by-agent, by-source or visa-case breakdown; P1 scheduled email reports missing | #244, #237 |
| FR-ADM Users | P0 | Invite, roles, deactivate, reset password, login history | partial | adm/users; api/admin/users.service.ts; invite.controller.ts; api/auth/twoStep.service.ts (history, two-step reset) | P1 custom roles missing | #244 |
| FR-ADM Settings | P0 | General, footer, modes, payments/COD, shipping, recipients+templates, lead form, maintenance | done | adm/settings/[section]; Staff alerts in Forms and messages (#233) | — | #233 |
| FR-ADM later P1 | P1 | Leaderboard, funnel, CSV imports, invoices/slips, review moderation, SMS, merge, campaigns, scheduled reports, custom roles | partial | done: scheduled publishing, media usage, encrypted creds, report date ranges | All other listed P1 items missing | #242–#248, #252 |
| FR-ADM later P2 | P2 | Full ticketing, refund and reconciliation operations | missing | — | Phase 2 | Phase E (#32) |
| FR-ADM security | P0 | Hidden admin path, noindex, lockout 5/15 min, audit with before/after | done | secure-admin-control/layout.tsx (noindex); api/auth/auth.service.ts (LOCK_MINUTES); AuditLog; e2e/admin-path.spec.ts | — | — |
| FR-ADM 2FA | P1 | TOTP login, mandatory for Super Admin and Admin | done | api/auth/{totp,auth.service,twoStep.service}.ts; sign-in/_components/{CodeStep,EnrolStep,SavedStep}.tsx; adm/account; e2e/admin-two-step.spec.ts; test/twoStep.test.ts | — | #234 |
| FR-ADM usability | P0 | Data tables, Ctrl+K palette, shortcuts, optimistic updates, phone-usable | done | components/admin/table, AdminCommand.tsx; e2e/admin-staff-tasks.spec.ts | — | — |

## §14 Non-functional requirements

| ID | Priority | Requirement | Status | Evidence | Missing | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| NFR-PERF | P0 | LCP ≤ 2.5 s, INP, CLS; LH 90+; first-load JS ≤ 200 KB; RSC, next/image, fonts | partial | e2e/budget.spec.ts (31 routes ≤ 200 KB); scripts/lighthouse-run.mjs + apps/web/lighthouse.config.json (CI errors on a11y/BP/SEO/CLS); TRACKER #236 | 8 of 11 key routes at 90+ (Home 87, Hotels 86, Blog 88); lab LCP 2.6 to 4.0 s; performance and LCP are CI warnings (D298) | #271 |
| NFR-SEC | P0 | OWASP, argon2id, tokens, CSRF, Redis limits, CSP, encryption, scans, backups | partial | api/auth/auth.service.ts; lib/security/securityHeaders.ts; nginx HSTS; providers/secretBox.ts; ci.yml CodeQL; dependabot.yml | API limits in Redis with the 10/h per-phone lead limit (#234); per-IP lead limits stay at the web's 10/min (API 20) rather than 5; CSP uses 'unsafe-inline' not nonce (documented); backups keep 14 days, no off-site copy; malware scan with ClamAV since #235 | #239 |
| NFR-SEO | P0 | SSR titles, canonical, JSON-LD, split sitemap, OG images, llms.txt, GA4/GTM/Pixel events | partial | app/sitemap.ts, robots.ts, llms.txt; components/seo/*; e2e/seo.spec.ts | No conversion events (search, generate_lead, …, purchase); sitemap not split; OG = record photos, not generated images | #237 |
| NFR-A11Y | P0 | WCAG 2.2 AA: contrast, focus, keyboard, labels, 44 px, skip link, reduced motion | done | skip link in app/[locale]/layout.tsx; AxeBuilder in 24 e2e specs | — | — |
| NFR-OPS | P0 | 99.5% uptime, /health + /ready, Sentry, request-ID logs, envs, migrations, DLQ | partial | api/health/health.controller.ts; api/app.ts (pino, genReqId); deploy/* | Sentry not installed (no SDK; DSN waiting-owner); no staging environment; dead-letter only for email | #238, #239 (staging: owner decision) |
| NFR-L10N | P0 (Bangla P1) | English strings in next-intl from day one; Dhaka time; dates; ৳ lakh | done (P0 scope) | apps/web/messages/en.json; shared/format | Bangla P1 missing (see FR-GLB-07) | #254 (Bangla) |
| NFR-COMP | P0 | Last two versions of major browsers; Android 9+; layouts from 320 px | partial | e2e/public-screens.spec.ts (320–1440) | Only Chromium is tested; no Safari/Firefox/Samsung runs | #259 |
| NFR-LEGAL | P0 | Privacy, terms, refund, contact live; consent on forms; analytics notice | done | policy pages; components/forms/ConsentField.tsx; components/analytics/ConsentBar.tsx | — | — |

## Gaps the owner listed (PROMPT 10)

| Gap | Verdict | Evidence |
| --- | --- | --- |
| No unified /track (only /shop/track) | Confirmed | No `site/track` route; only site/shop/track; FR-VISA-06 visa tracking missing too |
| Customer sign-in Google only | Confirmed | api/customers/customers.controller.ts has only `auth/google*`; OTP template unused, no password flow |
| No Bangla (/bn) | Confirmed | web/i18n/routing.ts `locales: ["en"]`; only messages/en.json |
| No staff 2FA (TOTP) | Fixed in #234 | api/auth/totp.ts (RFC 6238), sign-in code and setup steps, recovery codes, trusted devices |
| No SMS, Telegram, courier or online payment adapters live | Confirmed | SMS (ssl-wireless, bulksmsbd, twilio) and payment (sslcommerz, bkash, nagad) are catalog stubs with health checks only; no Telegram or courier code |
| No reviews, wishlist, product Q&A, flash sales, campaign pages | Confirmed | No such schemas or routes; product page "questions" is a WhatsApp link; deals have a countdown but no campaign or flash-sale pages |
| No quote builder, reminders, round-robin, partial capture (FR-FLT-08) | Confirmed | No code; only an SLA "lead-overdue-staff" email exists (not follow-up reminders) |
| No invoice/packing-slip PDF or CSV import | Confirmed | Only CSV/XLSX export (reports.controller.ts); order page shows VAT invoice details as text; no PDF library |
| No conversion events (GA4/GTM/Pixel load after consent only) | Confirmed | ConsentBar.tsx loads gtag/fbq PageView only; no generate_lead / add_to_cart etc. |
| Search→results morph and card→detail transition not built | Confirmed | No `layoutId` or View Transitions anywhere; TRACKER #52 lists the morph as after launch |
| Lighthouse CI only warns | Confirmed | apps/web/lighthouserc.json: all assertions `"warn"` |
| EMI calculator | Refuted (built) | site/emi/_components/EmiCalculator.tsx, lib/shop/emi.test.ts. But the P0 "Request EMI plan" form is missing (WhatsApp link only) |
| Curated hotels (FR-HTL-02) | Confirmed missing | No hotel property collection in shared/content/registry.ts |
| Real-time admin alerts | Partial | Bell polls every 30 s (useInboxSummary.ts); no push, no sound, no Telegram |
| Lead kanban | Refuted (built) | adm/leads/board, components/admin/board/LeadBoardDnd.tsx |
| Reports | Mostly built | adm/reports with CSV + XLSX, date ranges; missing by-agent and by-source breakdowns and P1 scheduled email reports |

### Other findings

- **Customer file uploads were metadata only** (found in this audit): fixed in #232 (private storage, signed staff links, e2e).
- **The visa status email is never sent** (`visa-status-customer` template is seeded but has no caller).
- **Staff alerts go to one env address** (`STAFF_ALERT_EMAIL`); there are no module routing and no Settings › Notifications recipients.
- **There is no Bookings module**: convert-to-booking stores only an amount.
- **No CSV import for compatible models** (P0 FR-CAT-05).
- **Customers** has no notes, tags or export. **Reports** has no by-agent or by-source view. **Users** shows the sign-in history since #234.
- **The registry applies no pricing rules**: the markup is stored but never applied.
- **Rate limits** are in Redis since #234. **Backups** are kept 14 days with no off-site copy.
  **Sentry** SDK is not installed. **The sitemap** is not split.

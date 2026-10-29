# WAAFA — Build Tracker
Updated: 29 Oct Asia/Dhaka · Phase: A ✅ B ✅ C ✅ (live on https://waafasworld.com since 13 Oct) · D0 admin redesign ✅ (epic #201) · D · P1 completion (epic #31, due 13 Nov), owner's order of 28 Oct (D303): 1 Dependabot ✅ (#282), 2 #278 ✅, 3 #284 ✅, #287 ✅, #285 ✅, #237 ✅, #238 ✅, #239 ✅, #242 ✅, #298 ✅; owner's decisions of 28 Oct evening (D312): #302 rename ✅, #303 optimise ✅, OPTIMISE, then #243, #244, #245–#248, #249/#250, #251–#253, #254/#255, #271, #256–#258, #259, release candidate · Status: live; no deploys until the one release at the end (docs/RELEASE.md)

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
| A · Frontend | 11 Oct · epic #28 | 24 (A0, A1–A22, A1b) + #39, #52, #89 | 24 | 0 | 0 | ✅ 100% |
| B · Backend | 12 Oct · epic #29 | 5 (#54 – #57, #82 providers) + bugs #60, #61, #66, #72, #78 | 5 | 0 | 0 | ✅ 100% |
| C · Integration & Launch | 13 Oct · epic #30 (closed 25 Oct) | #64 C1, #69 Turnstile, #85 admin path, #96/#99 SEO, #102 security + analytics, #74 deploy (live 13 Oct) | 7 | 0 | 0 | ✅ 100% |
| D · P1 completion | 13 Nov · epic #31 | PROMPT 10 work order A–M (issues from #231; docs/PRD_COVERAGE.md) | 9 | 0 | 0 | 3 of 13 letters (Step 0, A, B, C) |
| D0 · Admin redesign | 3 Nov · epic #201 (under #31) | R0–R10 = #190–#200 (supersedes #71) | 11 | 0 | 0 | ✅ 100% |
| E · Live booking | — · epic #32 | waits for a provider contract | 0 | 0 | — | 0% |
| F · Licensed modules | — · epic #33 | waits for the licences | 0 | 0 | — | 0% |

## 2. Issue log

### #253 · Courier booking and tracking, Steadfast first — 🟡 In review
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 10 (PROMPT 10 letter J; FR-SHOP-14) and the integration-card brief (webhook URL with Copy, plain Test connection) |
| Built | Steadfast adapter (`api/src/couriers/steadfast.ts`, packzy API v1): create_order (invoice = order reference, 01… phone, address in one line, cash to collect only for unpaid cash on delivery), status_by_invoice, get_balance as Test connection; every refusal in one plain sentence. `CouriersService`: Book from the order page (confirmed or packing) → the order moves to Shipped with "Steadfast" and the tracking code through the normal step (so the "on its way" SMS goes out); the minute job asks Steadfast every 30 minutes about shipped parcels (45 days, 200 at most) and writes each new status once on the history; delivered marks the order Delivered; the webhook (`/api/couriers/steadfast/webhook` → API with the bearer token, compared in constant time; the token is derived from PROVIDER_SECRET_KEY, nothing stored) does the same at once. Admin: "Book with Steadfast" inside Mark shipped when the card is on; the card's guide shows the Callback URL and the Auth token with Copy buttons |
| Tests | API unit `steadfast.unit.test.ts` 7 (request shape, errors, phone, statuses); API DB `couriers.test.ts` 6 (off, card test, booking with roles and cash, refusal leaves the order, minute job once + delivered, webhook token); e2e `couriers.spec.ts` (unknown courier, no token, bad body, no API); QA plan `docs/qa/253-couriers.md` (CR-01..14); UAT U-37 |
| Migration | none (tracking lives on the order history) |
| Decision | D325 |
| Tools and skills | Serena (memories, symbols), Playwright; no new library |
| PR · CI minutes | (PR open) |

### #252 · SMS for status messages and Telegram alerts — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 10 (PROMPT 10 letter J; FR-NTF SMS for status messages only per D300, FR-NTF Telegram) and the integration-card brief ("Find my group", plain Test connection) |
| Built | SMS adapters for BulkSMSBD, SSL Wireless and Twilio (`api/src/notifications/smsGateways.ts`) with each gateway's error codes turned into one plain sentence; `ActiveIntegrations` (the card that is on, its mode's values, last test not failed, one-minute cache cleared on every card change) shared by the API and the worker; `IntegrationSms` + `deliverSms` through the same BullMQ queue (job "sms", 3 tries) and the notification log. Four SMS templates (request received, order placed, order step, visa stage; ASCII so one SMS is 160 characters) on/off in Admin › Notifications; sign-in codes have no SMS template. Calls: lead intake, order intake, order confirm/ship (courier + tracking)/deliver/cancel, visa stage. Telegram (`notifications/telegram.ts`): plain-text posts (no parse mode) for new requests, orders and payment proofs with the reference, a short summary and the admin link, never a phone or email; failures logged, never thrown into a submit. Admin: Telegram Test connection checks the token and posts "WAAFA test" in the group; "Find my group" reads the groups the bot has seen (typed or saved token) and fills Group chat ID; SMS cards have "Send a test SMS" (saved values, card on or off); Test connection on SMS cards reads the balance (BulkSMSBD) or the account (Twilio) |
| Tests | API unit: notification service 3 (off sends nothing, template off skipped, Telegram lines); API DB `messaging.test.ts` 6 (off, card test with the gateway's words, test SMS with roles and validation, request SMS sent and failure logged, template off, Find my group + Test + alert without phone, Telegram down); seed patch list; QA plan `docs/qa/252-sms-telegram.md` (SM-01..09, TG-01..05, SEC, A11Y, RWD, PERF); UAT U-36 |
| Migration | none; seed patch `2026-11-05-sms-templates` (adds the four SMS templates when missing) |
| Decision | D324 |
| Tools and skills | Serena (memories, symbols), Context7 not needed (no new library; Telegram Bot API and gateway HTTP contracts), Playwright |
| PR · CI minutes | #317 · 67 min (full-ci) |

### #251 · SSLCommerz, bKash and Nagad — 🟡 In review
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 10 (PROMPT 10 letter J; FR-SHOP-07 online pay) and the integration-card brief (Banglish steps, values to copy, server IP, plain Test connection) |
| Built | Real adapters behind PaymentProvider (`api/src/payments/gateways.ts`): SSLCommerz v4 session + validation API, bKash tokenized grant/create/execute (status on repeats), Nagad initialize/complete/verify with RSA sealing and signing. `PaymentsService`: start only for the order's own phone, session id = order + attempt, the order's total from the server; confirm asks the gateway, checks the amount (a mismatch is noted on the order, not accepted), marks paid once (placed → confirmed, "Paid online with … · trx"). Checkout offers "Pay online · <gateway>" only for gateways on, in Live mode, with Live keys (`IntegrationStatus.payment.gateways`); the API refuses online orders otherwise. Web: /api/payments/start (same-site), /api/payments/<gateway>/<success|fail|cancel|ipn|callback> (rate-limited, never trusted, IPN answers OK), /shop/payment result page (no order data, noindex). Admin: order shows online payment and refunds; Admin and Accounts record a refund made in the gateway's panel (never past the total, audited). Integration hub: every card has a Banglish "How to connect it" guide (`PROVIDER_SETUP`) with the panel values (IPN, success, fail, cancel, callback, webhook addresses) and the server IP (ipify) with Copy buttons; payment Test connection says in one sentence what is wrong |
| Tests | API unit `gateways.unit.test.ts` 8 (contract shapes for the three gateways, forged amounts ignored, plain health messages); API DB `payments.test.ts` 3 (nothing until live keys, own phone only, forged success, wrong amount, paid once, refunds with roles and cap, cancel/unknown gateway); e2e `payments.spec.ts` (no online option in this build, result page outcomes with axe, returns redirect, unknown gateway 404, no injection) and `admin-integrations-guide.spec.ts` (API mode); QA plan `docs/qa/251-online-payments.md` (OP-01..13); UAT U-35 (৳10 live test) |
| Migration | none (payment data lives on the order's payment JSON) |
| Decision | D323 |
| Tools and skills | Serena (symbols for the provider layer), Playwright; no new library (node:crypto for Nagad) |
| PR · CI minutes | (PR open) |

### #250 · Partial lead capture — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 9 (PROMPT 10 letter I; FR-FLT-08 P1) |
| Built | Step 1 of the flight, hotel, package, visa and plan-my-trip requests asks "If I don't finish, a travel expert may call me about this request" (native checkbox, off by default). Ticked, the form sends name, number (E.164), email, service and the page path to POST /api/leads/draft (same-site, 2 KB, 5 a minute) → API POST /public/leads/drafts (10 an hour per phone) → `LeadDraft`: one open draft per phone and service, nothing kept if that phone sent this service's request in 24 hours; the full request completes it inside the lead transaction. Admin › Leads › Incomplete requests (To call / Handled) lists drafts 30 minutes old for the person's services with call, WhatsApp, the page they were on, Contacted and Set aside (audited). The minute job sends one reminder (`lead-incomplete-customer`, seed patch `2026-11-04-incomplete-template`) when an email was given and the draft is under 2 days old, and deletes drafts after 30 days |
| Tests | API DB `leadDrafts.test.ts` 5 (one per phone, 30-minute window, other services hidden; completed by the full request; one reminder only with email, link to the page, purge; contacted/dismissed with roles and audit; consent, foreign page, bad phone refused); `seedPatches.test.ts` list; e2e `partial-capture.spec.ts` (opt-in only, request body, axe; cross-site and bad input refused); QA plan `docs/qa/250-partial-lead-capture.md` (PC-01..11); UAT U-34 |
| Migration | `20261104010000_lead_drafts` (additive) and seed patch `2026-11-04-incomplete-template` |
| Decision | D322 |
| Tools and skills | Serena (memories), Playwright; no new library |
| PR · CI minutes | #315 · 105 min (full-ci) |

### #249 · Curated hotels with Request booking — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 9 (PROMPT 10 letter I; FR-HTL-02 P1) |
| Built | Content list `hotels` (shared `HotelSchema`: name, slug, stars, city, country, area, search place, summary, description, cover and gallery, amenities from a fixed list of 14 with icons, 1 to 10 room types with beds, sleeps, size, features, image and a from price per night, check-in and check-out, list order, publish workflow, SEO, Sample). /hotels: "Hotels our team recommends" (cards: cover, stars, area, name, summary, from ৳ per night). /hotels/[slug]: gallery (the package gallery moved to `components/travel/PhotoGallery.tsx`), header, About, What the hotel offers, Rooms with Request per room, a sticky request card with WhatsApp and the indicative note, more hotels, Hotel JSON-LD, sitemap, 404 for unknown. Request opens /hotels?hotel=&room= with "You are asking about <hotel> · <room>", the stay step starts at "<hotel>, <city>", the lead carries optional hotelId, hotelName, roomType (dropped if the customer types another place); the lead summary and Admin lead facts name the room. Admin › Curated hotels (sidebar, New menu, link picker) with a sectioned editor. Three Sample hotels with five new real Unsplash photos (credited in MEDIA_CREDITS) |
| Tests | shared `hotels.test.ts` 2; web `hotelLeadForm.test.ts` +2, `leadFacts.test.ts` +1, sitemap; e2e `hotels-curated.spec.ts` (390 and 1440: list → hotel page with axe and scroll width → Request a room → HTL reference; 404), budget and public screens include the hotel page; QA plan `docs/qa/249-curated-hotels.md` (CH-01..11); UAT U-32, U-33 |
| Migration | none (content documents; lead payload fields are optional) |
| Decision | D321 |
| Tools and skills | Serena (memories), WebSearch/WebFetch for real Unsplash photos (checked by eye; 3D renders skipped), Playwright, ui-ux-pro-max checklist |
| PR · CI minutes | #314 · 62 min |

### #248 · Invoices and packing slips as PDF; CSV import with preview — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 8 (PROMPT 10 letter H; P0 FR-CAT-05 compatible models import; PRD §17 Shop P1 bulk CSV, invoices and packing slips) |
| Built | PDFs: the quote PDF's brand kit moved to `api/src/pdf/brandPdf.ts` (header with logo and ribbon, fonts, taka sign, footer); `orders/orderDocuments.ts` says what an invoice and a packing slip contain (testable apart from the drawing), `orders/orderPdf.ts` draws them. Invoice ("VAT invoice" when the customer asked): Bill to with the company and the customer's BIN, Ship to, lines, subtotal, coupon, delivery, total in ৳ with lakh grouping, "All prices include VAT" or the VAT worked back from the total at the rate set in Payment settings (`vatPercent`, new optional field), payment, the seller's name and contacts only. Packing slip: Ship to with the phone, lines with SKU and quantity and a tick box, units, the delivery note, the cash to collect for unpaid cash on delivery; no prices. `GET /admin/orders/:id/invoice` (Admin, manager, Accounts) and `/packing-slip` (Admin, manager); "Print" panel on the order page. CSV: `GET /admin/content/:key/export.csv` and `POST …/import/preview`, `…/import` for products (one line per variant: title, short title, show price, COD, printer models, SKU, price, MRP, stock, low stock, pre-order), group fares and compatible models; `parseCsv` reads what Excel saves and undoes the formula guard; the plan merges each line into the saved record, checks it with the list's schema and says per line what happens (adds, changes with the columns, unchanged, problem with column and plain words); import goes through the normal save (rules, History, audit "content.import", cache) plus one "content.import.file" audit entry, refuses the whole file while a line has a problem, never deletes, refuses new products and variants (they need photos). Admin list header: "Download CSV to edit" and "Import CSV" (dialog with the preview table) |
| Tests | API unit `contentCsv.unit.test.ts` 10 (parser quirks, round trip of all three exports, columns in any order, changed columns, plain-word problems, create/no delete/repeat id, file problems), `orderDocuments.unit.test.ts` 13 (invoice lines and totals, BIN, VAT maths, PDF title, page breaks, packing slip, phone format), quote PDF still passes; API DB `importsInvoices.test.ts` 4 (roles and 401/403/404, round trip saves nothing, edit + new fare + export back + audit, whole file refused); e2e `admin-imports.spec.ts` (API mode: both PDFs from the order page, export → edit → preview → import with axe on the dialog, a broken file can't be imported); screenshots at 390 and 1440, no horizontal scroll; QA plan `docs/qa/248-invoices-csv-import.md` (IC-01..15); UAT U-29..U-31 |
| Migration | none |
| Decision | D320 |
| Tools and skills | Serena (memories), Playwright (screenshots 390/1440), ui-ux-pro-max checklist (labels, focus, empty and error states); no new library (pdfkit already used for quotes) |
| PR · CI minutes | #313 · 10 min (full suite on main) |

### #247 · Campaign pages and flash sales — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 7 (FR-SHOP-13) |
| Built | Deals gain an optional start and a stock cap (a flash sale): `dealIsLive` (started, not ended) everywhere the site lists deals; the API prices orders with live deals only and, inside the order transaction after the product lock, counts units already sold at the deal price since the start (`soldAtDealPrice`, cancelled orders give units back) so a capped deal never sells past its cap (`dealsWithinCap`). New content list `campaigns` (title, slug, words, banner, start, end, products) with an Admin editor and a public page /shop/campaign/<slug>: banner, a strip read at request time ("On now · ends …" with the countdown, "Opens …" or "This campaign has ended"), its products priced like everywhere else; in the sitemap; Sample campaign in the fixtures |
| Tests | shared `flashSales.test.ts` 2; API DB `flashSales.test.ts` 2 (window, cap with cancelled units back); e2e `campaign.spec.ts` at 390 and 1440 with axe and scroll width + not found; budget 184 KB; QA plan `docs/qa/247-campaigns-flash-sales.md` (FS-01..11); UAT U-27, U-28 |
| Migration | none (deals and campaigns are content documents) |
| Decision | D319 |
| PR · CI minutes | #312 · 68 min |

### #246 · Save for later and Buy again — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 6 (FR-SHOP-13; the wishlist itself shipped in #278) |
| Built | Cart lines and "Saved for later" as two localStorage lists from one `createLineStore` (tabs stay in step; blocked storage keeps the page working); Save for later on each cart line, a Saved for later section with Move to cart and Remove, shown under the empty cart too. Buy again: the account view carries each order's items (ids, words, quantities); delivered or shipped orders get a Buy again button that adds today's price and stock (sold-out, removed or hidden-price items left out) and opens the cart |
| Tests | web unit `useCart.test.ts` 2, `buyAgain.test.ts` 1; e2e `cart-saved.spec.ts` at 390 and 1440 with axe and scroll width; budget cart 191 KB, account 182 KB; QA plan `docs/qa/246-save-for-later.md` (SL-01..10); UAT U-25, U-26. Found and fixed on the way: axe label-content-name-mismatch on the new buttons, an 84 px overflow at 390 px in the cart line row; and on #245 the admin Reviews page prerendering at build without the API |
| Migration | none |
| Tools and skills | Playwright e2e and budget; no new library |
| PR · CI minutes | #311 · 62 min |

### #245 · Reviews from real customers, product Q&A, feedback photos — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 5 (FR-PKG-08, FR-SHOP-13; approved feedback photos on the wall) |
| Built | Migration `20261103010000_reviews_questions` (Review, ProductQuestion). API `src/reviews/`: a review only from a signed-in customer with a booked package request or a delivered order with that product (the proof reference is stored), one per item, waits for staff; eligibility check; questions from any visitor (Turnstile in the web, limits), shown once answered; Admin queue with approve/reject + reply and answer/hide, audited; one public list cached under the tag `reviews`, expired by each decision. Web: ReviewsSection on product and package pages (stars, average, first name + initial, "travelled with us" / "bought from us", replies), WriteReview after hydration (sign-in link, not-eligible words, form with a radio rating), AskQuestion; Product JSON-LD gets AggregateRating and Review only from approved reviews (TouristTrip has no rating property, so packages show reviews without one); Admin › Reviews and questions with a sidebar count and a Today card. Feedback: on approval a clean private photo is optimised into the media library and the wall shows that copy; unscanned, infected or broken photos approve the words only |
| Tests | shared 2 (reviewerName, ratingSummary); API DB `reviews.test.ts` 4 (eligibility and refusals, once only, approval shows, delivery rule, Q&A answered only, feedback photo copy); e2e `admin-reviews.spec.ts` (question → answer in Admin → shows; signed-out sign-in link; axe) passed locally in API mode; budget: product and package pages 194 KB; QA plan `docs/qa/245-reviews-qa.md` (RV-01..17); UAT U-22..U-24 |
| Migration | `20261103010000_reviews_questions` (additive) |
| Decision | D318 |
| Tools and skills | Serena (memories); Playwright e2e and budget; no new library |
| PR · CI minutes | #310 · 93 min |

### #244 · Reports, summaries, customers and custom roles — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 4 (PROMPT 10 letter G; FR-ADM Reports, Search activity, Customers, Users P0 partials and FR-ADM later P1) |
| Built | Reports: by agent (leads, booked, won rate, median first reply; Unassigned row), visa cases by stage and by country with approved and refused, searches per day and the funnel searches → requests → answered → quoted → booked (`reportBreakdowns.ts`); by source already from #237. Summaries: areas "Daily summary" and "Weekly summary" in staff alerts, template `summary-report-staff` (seed patch `2026-11-02-summary-template`), the minute job sends at 09:00 Dhaka (weekly on Saturday) once each through the marker setting `_reportsSent`. Customers: tags (12, 30 characters, no repeats), notes, CSV export with the same filters (formulas neutralised, audited), merge a duplicate number into a customer (no self, no chains, Admin and Super Admin, audited) and unmerge; lists and the customer page fold merged numbers in, a merged number opens its customer. Custom roles: `CustomRole` = a name for built-in roles (never Super Admin or Admin), `StaffUser.customRoleIds`, roles expanded where the access token is signed, editing a role signs its people out, delete refused while in use; Users › Custom roles panel, a picker per person, the permission matrix with a column per custom role |
| Tests | API unit `reportBreakdowns.unit.test.ts` 2; API DB `customersRoles.test.ts` 5 (report fields and visa scope, summaries at 9 and on Saturday once, tags/notes/export and refusals, merge/unmerge with roles and no chains, custom roles CRUD with refusals), `auth.test.ts` custom role grants in the token without manager roles, `seedPatches.test.ts` list; QA plan `docs/qa/244-reports-customers-roles.md` (RC-01..21); UAT U-18..U-21 |
| Migration | `20261102010000_customers_roles` (additive) and seed patch `2026-11-02-summary-template` |
| Decision | D317 |
| Tools and skills | Serena (memories); no new library |
| PR · CI minutes | #309 · 64 min |

### #243 · Reminders, @mentions, round-robin and real-time alerts with sound — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 3 (PROMPT 10 letter G; FR-ADM-LEAD P1, FR-NTF real time) |
| Built | Migration `20261101010000_reminders_alerts`: Reminder, StaffAlert, StaffUser.takesLeads/lastLeadAt. API (`src/realtime/`): LiveBus (one Redis pub/sub channel per process, in-process without Redis), GET /admin/events (SSE: ready, live events filtered by `canSeeEvent`, 25 s heartbeat, 10-minute life), personal alerts (stored, pushed, read), reminders (own only, past times refused) and the minute job turning due ones into one alert each, round-robin (longest-waiting active person with the switch on whose roles open the service, advisory lock, office hours from Settings › Contact in Dhaka time, after-hours leads at opening, a lead ever assigned is never auto-assigned again, timeline and audit), @Full Name mentions in notes (one alert per colleague who can open the lead, never the writer). Intake publishes lead, order and proof events. Web: SSE through the BFF (`no-transform`, `X-Accel-Buffering: no`, a fetch without the 15 s timeout), `liveEvents` store with back-off, `LiveAlerts` (refresh now, chime, polite status), Web Audio chime unlocked by the first click, bell "Your alerts" tab with Mark all read and the per-device sound switch, reminders on the lead page and the dashboard, @ picker in the note box (combobox and listbox, arrows, Enter or Tab, Escape), Users › Takes new leads in turn |
| Tests | shared `mentions.test.ts` 4; API unit `liveBus.unit.test.ts` 3; API DB `realtime.test.ts` 5 (reminders with IDOR and validation, mentions, round-robin by office hours with the after-hours catch-up, Users switch audited, SSE filtering and 401); web unit `liveEvents`, `reminderTimes`, `mentionQuery` 6; e2e `admin-alerts.spec.ts` (reminder on a lead and the dashboard with axe; a visitor's request reaches an open tab through the stream before the poll; bell alerts tab axe); QA plan `docs/qa/243-reminders-alerts.md` (RA-01..21); UAT U-15..U-17 |
| Migration | `20261101010000_reminders_alerts` (additive); no seed patch (round-robin starts off for everyone) |
| Decision | D316 |
| Tools and skills | Serena (memories, replace_content); no new library (EventSource and Web Audio are browser APIs, ioredis already used); Playwright e2e |
| PR · CI minutes | #307 · 187 min |

### #303 · Lighter images, RAM and disk on the VPS — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's decisions of 28 Oct (evening), item 3 and OPTIMISE |
| Measured before | images (`docker images`): api 2.07 GB live (`7af26e7`) / 1.82 GB on main (`8694513`), web 571 / 599 MB, nginx 74 MB; API 199 MB and worker 198 MB RAM at rest; admin first-load JS lists ≈ 306 KB, editors 380–400 KB |
| Built | API image: Alpine with only the node binary; `scripts/build.mjs` bundles everything (Nest, Fastify, Prisma client and query compiler, pg) into dist/ with shared chunks; `scripts/collect-runtime.mjs` copies only sharp, argon2, pdfkit, bullmq and ioredis with their dependencies (46 MB); `prisma` moved to devDependencies; `dist/migrate.js` applies migrations with pg, compatible with `prisma migrate deploy` (same table, lock 72707369, SHA-256 checksums, one transaction per migration, P3009 stop). Web image: Alpine with only the node binary and the traced standalone server; Next image disk cache capped at 512 MB. Every image carries `org.opencontainers.image.revision` (deploy.sh exports GIT_REVISION when building); Status page shows release and commit. Compose (both): logs 10 MB × 3, API limit 512 MB, ClamAV `ConcurrentDatabaseReload no`, `./backups` read only into the API. backup.sh keeps `BACKUP_KEEP_DAYS` (default 7); deploy.sh removes unused images older than a week; Docker Hub keeps 10 releases plus `deploy/LIVE_RELEASE` (now `7af26e7`). Settings › System status: "What fills the disk" (database, photos and videos, customer files, backups; nginx 600 MB and image 512 MB caps). `scripts/measure-stack.sh` in the VPS smoke and Docker images workflow: image budgets (api 400, web 500, nginx 100 MB), revision labels, `docker stats` of every container, whole stack ≤ 3 GB. RELEASE.md from `7af26e7` with the server files and curl commands |
| Measured after | VPS smoke (server metric): api **182 MB**, web **321 MB**, nginx **45 MB**; memory with ClamAV loaded: api 101, worker 69, web 105, postgres 52, redis 4, nginx 6, certbot 2, clamav 952 MB = **stack 1.29 GB** (budget 3 GB); upgrade rehearsal from 7af26e7 passed |
| Tests | API DB `applyMigrations.test.ts` 4, `status.test.ts` 2; API unit `diskUsage.unit.test.ts` 2; container runs (fresh DB migrate + seed, sharp/argon2/pdfkit/bullmq, worker); VPS smoke: upgrade rehearsal from 7af26e7 + measure-stack; QA plan `docs/qa/303-optimise.md` (OP-01..20) |
| Migration | none; deploy/server compose.yml, deploy.sh, backup.sh change (RELEASE.md) |
| Decision | D313, D314, D315 |
| Tools and skills | Context7 (Next `images.maximumDiskCacheSize`); clamav-docker sources (CLAMD_CONF_ env); Docker Hub API; Serena memories |
| PR · CI minutes | #306 · 143 (first run found ./backups created as root; fixed) |

### #302 · Store renamed to Waafa’s World — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's decisions of 28 Oct (evening), item 4 and RENAME (first issue) |
| Built | "Waafa’s World" (typographic apostrophe) in every visible place: fixtures (store name, menus, footer column, COD note, templates, pages, team, timeline), messages, admin sidebar group, tab bar, mega panel, store bar, emails, docs (CLAUDE.md corrections 2–4, PRD, DESIGN.md, ADMIN.md, HANDOFF, ADMIN_GUIDE, README, prototype boards). Structured data: `lib/seo/schemaNames.ts` writes "Waafa's World" (plain apostrophe) with `alternateName` "Waafas World" on the OnlineStore, the About brand and Home's WebSite; product seller name plain. Guards: "Waafas World" fails in visible source except schemaNames.ts, a plain-apostrophe "Waafa's World" fails, the fixtures' store name must be the new one. Seed patch `2026-10-28-store-name` renames every stored string that still equals one of the 18 old defaults (`apps/api/src/seed/storeRenameTexts.ts`); staff wording is never touched. Route /shop and the domain waafasworld.com unchanged |
| Tests | web unit `schemaNames.test.ts` 4; API unit `renameStore` 3 (deep rename, staff wording kept, old list maps to today's fixtures); API DB `seedPatches.test.ts` (live copy with old defaults renamed, staff name kept); e2e `seo.spec.ts` (name and alternateName), `layout.spec.ts`, `store.spec.ts`, `admin-shell.spec.ts`; QA plan `docs/qa/302-rename.md` (RN-01..16); UAT U-14 |
| Migration | none; seed patch `2026-10-28-store-name` runs at the release |
| Decision | D311, D312 |
| Tools and skills | Serena (memories, replace_content on seedPatches.ts); guards planted-file check; Playwright e2e |
| PR · CI minutes | #304 (8be167e) · 61 |

### #298 · Quote builder: options, baggage, validity, branded PDF, accept page — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 6 (split from #242); PRD §6 leads P1, FR-ADM-LEAD P1 |
| Built | Quote model (migration `20261031010000_quotes`): QTN reference, up to five options (title, details, baggage, ৳ price), last valid day (Asia/Dhaka), note, status draft · sent · accepted · withdrawn (expired follows from the day). Admin: "Write a quote" on the lead's Quotes card → editor → quote page with Send by email (template `quote-customer`), Send on WhatsApp (wa.me with the link; recorded), the customer's link, Open the PDF, Withdraw; sending takes the lead's "Log quote" step (Quoted, timeline, audit). Customer: `/quote/<id>-<signature>` (HMAC of the id with JWT_SECRET; no dot, so the locale proxy serves it), first name only, options as native radio cards, Accept with Turnstile and limits (web 5, API 10 a minute), PDF download, WhatsApp; accepting withdraws the lead's other open quotes, writes the timeline and audit (actor Customer) and emails the staff of that service (`quote-accepted-staff`). Convert to booking starts with the accepted price. PDF: pdfkit in the API, A4, WAAFA logo, ribbon, Inter, Plus Jakarta Sans and Hind Siliguri (৳ and Bangla names) from `apps/api/assets` (OFL notice), copied into the image |
| Tests | shared `quotes.test.ts` 4; API unit `quotes.unit.test.ts` 3 (link signatures, PDF renders); API DB `quotes.test.ts` 4 (quote → email → accept → booking with audit, PDF to staff and customer, expired/withdrawn/tampered/no email/past day, roles); web `route.test.ts` 3, `quoteBadge.test.ts` 1; e2e `admin-workflow.spec.ts` quote → accepted → booking with axe, scroll width and screenshots at 390 and 1440; QA plan `docs/qa/298-quotes.md` (QT-01..14); UAT U-11..U-13 |
| Migration | `20261031010000_quotes` (additive) and seed patch `2026-10-31-quote-templates`; API image copies `apps/api/assets` |
| Decision | D310 |
| Tools and skills | Context7 (pdfkit fonts and rich text); Playwright MCP for the PDF render (৳ glyph caught missing with the WOFF2 subset, fixed with Hind Siliguri WOFF); Serena not used (edits by script); ui-ux-pro-max, design-review and shadcn MCP not run: design review owed in #259 |
| PR · CI minutes | #301 · 149 (three full runs: server icons, the added-option key bug caught by the e2e, seed patch list and staff alert address in the API tests) |

### #242 · Bookings from converted leads: PNR, tickets, payments, documents — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 6; FR-ADM Bookings and FR-ADM-LEAD convert (P0) |
| Built | Booking model (migration `20261030010000_bookings`), made in the convert transaction (BKG reference; a second convert corrects the amount and reopens a cancelled booking); Admin › Bookings list (search by reference, PNR, ticket, lead reference, name, phone; filters by status and payment) and booking page (status, PNR, tickets, supplier, travel date, amount, paid, Refunded, notes; payment status from the amounts; audited); documents through `POST /admin/files/attach` (private, scanned, ten-minute links); Accounts see every booking, others the bookings of leads they may open; seed patch `2026-10-30-bookings-for-booked-leads` |
| Tests | API `bookings.test.ts`; e2e `admin-workflow.spec.ts` (convert → booking → PNR and payment → search) and the admin-screens sweep; QA plan `docs/qa/242-bookings.md` (BK-01..13); UAT U-10 |
| Migration | `20261030010000_bookings` (additive) + seed patch; nginx (inside the image) allows 6 MB on the attach route |
| Decision | D309 |
| Tools and skills | Context7 (Prisma relations); Serena memories; design review owed in #259 |
| PR · CI minutes | #300 (582ea2b) · 68 |

### #239 · Backups, restore drill, off-site copy, alerts, lead limit, CSP, staging — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 5 |
| Built | deploy.sh (both) installs the 03:15 backup and the monthly restore drill in cron unless `BACKUP_CRON=off`; one backup.sh for deploy/ and deploy/server with `--drill` (restore into waafa_drill, check staff, content, settings, log lead and order counts, drop) and an off-site copy of each file through `node dist/offsite.js` (API: `files/offsiteStorage.ts`, S3 SigV4 PUT to the R2 or B2 card, no SDK; off = local only); the minute job emails the "system" alert recipients when disk is under 10 % or 2 GB or memory under 5 % (template `system-alert-staff`, seed patch `2026-10-29-system-alert-template`, at most every six hours); lead submits 5 a minute per address (web) and 10 (API) as the PRD sets; CSP without nonces documented as an exception in SECURITY.md; `deploy/staging` (README, env.example; `STAGING=1` lets staging run the live images) |
| Tests | API `rateLimit.test.ts` (10 a minute per address), `offsiteStorage.unit.test.ts`, `resourceAlert.unit.test.ts`; VPS smoke step "Backups (cron, backup, restore drill)"; QA plan `docs/qa/239-backups-security.md` (B-01..12) |
| Migration | none (seed patch); deploy/server: backup.sh and deploy.sh change; new optional .env lines BACKUP_CRON, STAGING |
| Decision | D308 |
| PR · CI minutes | #294 (1ab66f5) · 99 |

### #238 · Error tracking, System status page, dead-letter list — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct, step 5: error tracking for web, API and worker with release tags, a staff Status page, dead-letter handling for every queue |
| Built | API: `common/errorReporter.ts` (Sentry envelope API without the SDK, GlitchTip compatible; DSN read from the error tracking card every minute; release from `WAAFA_RELEASE`; 30 a minute; never throws) used by ProblemFilter (unknown errors), the worker (emails that used every try, malware scan failures) and `POST /public/errors` (web server errors from `instrumentation.ts` onRequestError); `GET /admin/status` (release, database, Redis, worker heartbeat, queue counts, memory, disk) and the dead-letter list with Retry and Discard (audited) for the one BullMQ queue (notifications); worker heartbeat in Redis; API image ARG RELEASE. Web: Settings › System status page. Browser-side errors are not sent: an SDK or even a listener would push public pages over 200 KB; web server errors cover rendering and route handlers |
| Tests | API unit `errorReporter.unit.test.ts` 3; admin-screens sweep includes the Status page; QA plan `docs/qa/238-status-errors.md` (E-01..14) |
| Migration | none; `deploy/compose.yml` api build arg RELEASE |
| Decision | D307 |
| PR · CI minutes | #293 (d02680e) · 129 |

### #237 · D measurement: conversion events after consent, UTM on leads and orders, Where leads come from — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct (D303) step 4: consented GA4, GTM and Pixel events (search, lead_submit, order_placed, payment_proof_sent, whatsapp_click, call_click, sign_up, login, add_to_cart, begin_checkout); UTM and referrer on leads and orders; "Where leads come from"; split sitemap and generated share images (moved to #287 to keep the PR small) |
| Built | Shared: LeadSourceSchema gains utm term and content, referrer and landing (all capped); OrderCreateInput takes an optional source. API: migration `20261029010000_order_source` (Order.source JSONB, additive); intake stores it; Reports summary `sources` (admin/leadSources.ts: UTM source with medium, known sites by name such as Google, Facebook, ChatGPT, else host, else channel, else Direct or unknown; leads, booked, orders, revenue). Web: the proxy remembers where a visit came from in the httpOnly first-party cookie `waafa_src` (UTM replaces, a plain referrer only fills, our own pages never count; no script on the page); /api/leads and /api/orders add it; `track()` announces conversions and `EventBridge`, mounted only inside the consented analytics scripts, sends each once to dataLayer, gtag (beacon) and the Pixel (standard names where Meta has one, BDT value), plus call and WhatsApp taps; Admin › Reports "Where leads come from" table |
| Tests | web `attribution.test.ts` 3, `sendConversion.test.ts` 3; API `leadSources.unit.test.ts` 2; e2e `api-mode.spec.ts` (a UTM visit sets the httpOnly cookie, the contact lead is credited as "Newsletter (email)" with its campaign in Reports); QA plan `docs/qa/237-measurement.md` (M-01..14) |
| Verify | guards, lint, typecheck, format, shared 155, web 701, API unit 101; web build; first-load JS / 200, /flights 192, package 192, product 192, checkout 183, /contact 197, /login 183 KB; the cookie checked on a local build |
| Migration | `20261029010000_order_source` (additive): goes into docs/RELEASE.md |
| Tools and skills | Serena; existing shadcn Table; Context7 and the design skills not run (one admin table in the existing report card style) |
| Decision | D305 |
| PR · CI minutes | #292 (b6d45f8) · 90 |

### #295 · Bug: Home first-load JS 201 KB after the integration hub — ✅ Done
| Field | Value |
| --- | --- |
| Found | The full suite on #291–#294: Home 201 KB first-load JS (budget 200); #286 added a client provider for the Turnstile key and the #283 dependency updates had used the last margin |
| Fix | Turnstile site key in a meta tag read on first use; the card cart control and its arc load after hydration (the placeholder still adds). Home 198.6 KB |
| PR · CI minutes | #296 (1e47138) · 61 |

### #285 · Release note and upgrade rehearsal from the live release — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct (D303): no deploys during development; docs/RELEASE.md as one cumulative note from the live release to main; an upgrade rehearsal in the VPS deploy smoke (main, nightly, full-ci); hands-on checks in docs/qa/UAT.md |
| Built | `docs/RELEASE.md` (from → to, migrations in order since the assumed live release, containers and memory, deploy/server files to copy, moved settings, keys for Admin, deploy steps with backup first); `deploy/LIVE_RELEASE` (541bd21 until the owner confirms the tag: on 28 Oct /track answered 404, so the live release is older than #280); `scripts/upgrade-rehearsal.sh` (starts the stack at the live release, adds a lead and an order through the public API, deploys this commit over it, checks leads, orders, staff accounts and the first password hash unchanged, content and settings not fewer, every migration finished) wired into the VPS deploy smoke (ci.yml: labelled PRs and nightly) and the Docker images workflow (main); `docs/qa/UAT.md` U-01..09 |
| Tests | the rehearsal itself in CI (no Docker on the build machine) |
| Migration | none |
| Tools and skills | Serena; no UI |
| Decision | D303 |
| PR · CI minutes | #291 (b4fced7) · 105; the rehearsal passed in CI from 541bd21 |

### #287 · Sitemap index per area and share cards for visa countries without a photo — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Split out of #237 (owner's order of 28 Oct, step 4): split sitemap, generated share images where a record has no photo |
| Built | `/sitemap.xml` route = sitemap index; `/sitemap/{pages,travel,visa,store,blog}.xml` route handlers over `lib/seo/sitemapEntries.ts` (the metadata sitemap file cannot sit beside a /sitemap.xml route); visa countries share their cover photo, or `/og/visa/<slug>.png` (next/og, text in the brand colours, no image; the .png keeps it out of the locale proxy) |
| Tests | `sitemap.test.ts` (every URL in one part); `seo.spec.ts` (index and parts, the India card 200 image/png under 300 KB) |
| PR · CI minutes | #290 (47d58cd) · 10 |
| Decision | D306 |

### #284 · Integration hub: every outside service set up from Admin › Integrations — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct (D303): one place for email, Google, Turnstile, GA4, GTM, Meta Pixel, Search Console, Bing, error tracking, off-site storage, payments, SMS, Telegram, couriers and the travel APIs; cards in plain words with a keys link, Test, Sandbox or Live, On or Off, a status chip and who changed it; secrets sealed and never sent to the browser; changes without a redeploy; Turnstile off the build-time variable; .env keeps infrastructure only |
| Built | Shared: provider kinds captcha, analytics, monitoring, storage, alerts, courier; 14 new catalog cards (turnstile, ga4, gtm, meta-pixel, search-console, bing, sentry, glitchtip, r2, b2, telegram, steadfast, pathao, redx) with `keysUrl`, `liveOnly`, `publicFields` and field patterns checked before saving; custom providers only for supplier kinds; `IntegrationStatus.public` (site key, IDs, codes, DSN) and `.features` (online payment, courier tracking, Telegram, off-site backup). API: `serviceChecks.ts` (Turnstile secret check at Cloudflare, Telegram getMe, DSN and storage reachability, shape checks), a failing last test keeps a service out of use, live-only cards always use the Live set, every change expires the site's `integrations` tag, `POST /public/integrations/turnstile/verify`, the reveal route removed, seed patch `2026-10-28-integration-cards` (Tracking IDs, verification codes and .env Turnstile keys onto their cards, never over staff edits). Web: `lib/data/integrations.ts` (cached, tag-expired), TurnstileKeyProvider in the site layout, Analytics and verification meta from the cards, setup checklist links to Integrations, Settings › Tracking tab and the two verification fields retired; Integrations page in eight tabs with keys links, status chips (Off, No keys saved, Not tested, Connected, Failing with error and time), Changed by, write-only secrets; ADMIN_GUIDE §11.1 in Banglish. Deploy: the web image no longer carries a Turnstile key (Dockerfile, compose, docker.yml, deploy.sh); check.sh says to empty the .env lines after the first deploy |
| Tests | shared `providers.test.ts` (keys links, public fields never secret, shapes, supplier-only custom); API `serviceChecks.unit.test.ts` 4, `providers.test.ts` (reveal gone, cards, live-only, public status without secrets, failing Telegram, Turnstile verify with and without keys), `seedPatches.test.ts` (import once, staff edit kept, bad Pixel left); web `cardStatus.test.ts`, `setupChecklist.test.ts`; e2e `api-mode.spec.ts` (tabs, write-only secret, Not tested chip, Changed by, keys link in a new tab, Search Console code reaches the home page HTML without a rebuild); QA plan `docs/qa/284-integration-hub.md` (IH-01..22) |
| Verify | guards, lint, typecheck, format, shared 157, web 691, API unit 117; web build; first-load JS / 200, /flights 192, package 190, visa apply 186, /login 182, /shop 195 KB. API database tests and the admin screen (API-mode e2e) run in CI only; no local Playwright MCP pass on the admin screen (no Docker or API on this machine) |
| Migration | none (seed patch only); deploy/ changed: copy compose.yml, deploy.sh and check.sh to /opt/waafa |
| Tools and skills | Serena (symbols and edits), existing shadcn primitives (Badge, ToggleGroup, Switch); Context7, ui-ux-pro-max, design-taste-frontend, frontend-design and design-superpowers not run in this session (no new visual pattern: the existing admin card gained a link, a chip and a line); design review owed in #259 |
| Decision | D304 |
| PR · CI minutes | #286 (0411c71) · 341 billed minutes over six runs (axe 4.14 findings on main fixed under #288: ask-for-price link, admin account, search, notifications and weekday buttons) |

### #282 · Dependabot: minor and patch updates with the axe 4.14 link-name fix — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 28 Oct (D303) step 1: merge #188; fix what breaks the home smoke in #275 |
| Built | #188 (docker/login-action v4) merged as is. #275's 37 updates taken on an owner branch; axe-core 4.14 adds label-content-name-mismatch (WCAG 2.5.3), which flagged the header logo link (tagline words inside the "WAAFA home" link): LogoLockup keeps the tagline beside the link, same look. #275 closed |
| PR · CI minutes | #283 (2b3f05a) · 14 billed minutes |
| Migration | none |

### #278 · D F2 · My account sections and the optional password — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 27 Oct (D300): My account with requests and their status timeline, visa applications, orders, wishlist, saved travellers (passport encrypted at rest), addresses, notification preferences, sign-in history, delete; an optional password (reset by email code) |
| Built | Migration `20261027150000_customer_account_sections` (Customer passwordHash, notifyOffers default off; CustomerWishlistItem, CustomerTraveller with the passport number sealed (AES-256-GCM) and its last 4, CustomerAddress). API `customerAccount.service.ts`: account view with each request's progress, wishlist add and remove, travellers (12) and addresses (8, one default) CRUD, preferences, sign out other devices, set and remove a password (argon2id), `POST /public/auth/password` (5 tries per email and address in 15 minutes, a dummy hash for unknown emails). Web: /account rebuilt with a sections bar, request and visa cards with "Show progress" (the /track timeline), wishlist with photos, TravellersEditor, AddressesEditor, AccountSettings; Save buttons on package and product pages (static pages, state after hydration through `/api/account/summary`); checkout fills empty fields from the default address; "Sign in with a password instead" on /login; Admin accounts show the Password method |
| Tests | API `customerAccount.test.ts` 7 (view with progress, wishlist, sealed passport never stored plain, address default rules, preferences and sign-out-others, password set, sign-in, wrong and unknown, limits, remove); shared schema tests; web unit `checkoutPrefill.test.ts` 5; e2e `account-sections.spec.ts` (API mode, Mailpit) at 390 (wishlist from a package page, traveller masked, address default and a refused phone) and 1440 (offers, password, a second browser signed out from the first) with axe |
| Migration | yes: owner runs `sh backup.sh` before `sh deploy.sh` |
| Decision | D302 |
| PR · CI minutes | #281 (606280a) · 105 billed minutes; review fixes: account code lazy (lazyAccountSections, lazy notify) so package, product and /account stay ≤ 200 KB; soft navigation into /account covered by e2e |

### #241 · D F1 · Email code sign-in and sign-up, guest records attach, admin account controls — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 27 Oct (D300, D301): email one-time code or Google, no phone OTP; sign-up on the same screen; guest flows stay and attach; header, drawer and More state; Admin Customers verified, method, last sign-in, Disable account, Sign out everywhere; rate limits, Turnstile, no enumeration, editable code email |
| Built | Migration `20261027090000_customer_sign_in` (Customer phone, emailVerifiedAt, signInMethod, disabledAt; CustomerSignInCode; customerId on Lead and Order; Google accounts backfilled verified). API: `POST /public/auth/email/{code,verify,complete}` (CustomerCodesService), shared attach rule (customerAuth.ts), My account lists by account; `GET/POST /admin/customers/accounts…` (list, detail, disable, enable, sign-out-everywhere, attach), audited and named in the audit log. Template `customer-sign-in-code` (seed patch; `{{code}}` required by the schema). Web: /login email → code → name and phone (EmailSignIn), route handlers with same-site, limits, Turnstile and idempotency, session plus readable hint cookie, AccountLink in header, phone drawer and More sheet; Admin › Customers › Accounts list and account page (controls, attach form); account card on the phone profile; CI API-mode job gets a Mailpit inbox |
| Tests | API `customerCodes.test.ts` (13: sign-up, sign-in, enumeration, disabled, 5 tries, expiry, single use, newest code, limits, ticket, attach rules, staff controls and audit, markup and Bangla names) and seed patch; shared schema tests; web unit (audit target); e2e `account-email.spec.ts` (API mode, Mailpit) at 390 and 1440 with axe; admin-screens covers the Accounts list; QA plan docs/qa/F-accounts.md |
| CI minutes | PR #279: 182 billed minutes |
| Migration | yes: owner runs `sh backup.sh` before `sh deploy.sh` |
| Decision | D301 |

### #240 · D F3 · One /track for requests, visa applications and orders — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner's order of 27 Oct (D300): one /track for any request, visa application or order by reference and phone; /shop/track redirects; no personal data beyond the status; rate limited |
| Built | Shared `TrackInputSchema`, `TrackResultSchema` (request: module, status, received, first reply and close dates, visa stage with documents count, submission and passport dates; order: as before). API `POST /public/track` (20 lookups per address in 10 minutes, the same 404 for a wrong phone, an unknown reference or spam), visa progress helpers moved to `common/visaProgress.ts`. Web `/track` (the old store page, generalised) with `RequestProgress` steps; `/shop/track` and `/bn/shop/track` 308 to `/track` with the query; every link, menu fixture and test moved to /track |
| Tests | API `track.test.ts` 5 (request without personal data, visa steps, order, same not found, limit); e2e orders (old link redirect, order timeline, not found), api-mode (a quoted request on /track, wrong phone) |
| CI minutes | PR #280: 60 billed minutes |
| Migration | none · live menus still point at /shop/track, which redirects (staff can edit the link) |

### #273 · D C · Lighthouse (manual) only on demand — ✅ Done
| Field | Value |
| --- | --- |
| Asked | The manual Lighthouse workflow ran on every push of a speed branch (150 billed minutes on PR #272, docs pushes included) |
| Built | `.github/workflows/lighthouse.yml` keeps `workflow_dispatch` only; the CI job stays the gate on main, nightly and full-ci PRs |
| Tests | CI quick set |
| Migration | none |

### #236 · D C · Speed: first-load JS 200 KB on every public route, Lighthouse mobile — ✅ Done
| Field | Value |
| --- | --- |
| Asked | PROMPT 10 letter C (NFR-PERF): Lighthouse mobile 90+ (median of 3) on the 11 key routes, first-load JS ≤ 200 KB gzip on every public route, LCP 2.5 s, INP 200 ms, CLS 0.1, LHCI assertions as errors |
| Built | Fewer client islands (server-drawn icons, one module per icon, server links, one card-effect listener); native radio group, checkbox, switch and tabs behind the shadcn API; next-intl messages compiled at build time; preferences sheet, corporate quote and EMI dialogs on first use (`PreferencesSheet`, `LazyDialog`); second steps of package, visa, plan-my-trip, printing and trading requests through `next/dynamic`; checkout form after hydration behind its placeholder; contact step without react-hook-form; tab-bar W drawn on the server; static detail pages; Lighthouse 13 runner over HTTP/2 (`scripts/lighthouse-run.mjs`, budgets and targets in `apps/web/lighthouse.config.json`); CLS fix on streamed list pages (fallbacks fill the screen) |
| Result | First-load JS (gzip): Home 220 → 200, Flights 242 → 192, Hotels 232 → 188, Package 224 → 191, Shop 217 → 196, Product 213 → 192, Checkout 226 → 182, Contact 214 → 196; all 31 public routes ≤ 200 in `e2e/budget.spec.ts`. Lighthouse mobile median of 3 (local, HTTP/2, 26 Oct): / 87, /flights 91, /hotels 86, /tour-packages 92, package 94, /visa 95, /visa/thailand 96, /shop 94, product 91, /blog 88, post 97; accessibility, best practices and SEO 100 everywhere; CLS 0 (Blog was 0.21). CI (PR #272, median of 3): / 88, /flights 94, /hotels 85, /tour-packages 93, package 94, /visa 96, /visa/thailand 96, /shop 92, product 90, /blog 88, post 97. Remaining: #271 |
| Bugs found | On the branch, never live: cart and checkout crashed after hydration (async LocalLink in client code, D297); double tap sent two idempotency keys (D296); empty plural branches broke compiled messages (D294); Blog CLS 0.21 from a short streaming fallback; detail pages without Suspense failed for new records in API mode (D299, API-mode e2e). All fixed with regression tests |
| Files | `apps/web/src/components/ui/{radio-group,checkbox,switch,tabs}.tsx`, `components/leads/{ContactStep,LeadRequestCard,PreferencesSheet,PreferencesDrawer}.tsx`, `components/layout/{LazyDialog,LazyDialogContent,TabBar}.tsx`, `components/forms/useSubmitOnce.ts`, `components/icons/server/*`, `components/services/*Step.tsx`, checkout `CheckoutFormLoader.tsx`, `next.config.ts`, `messages/en.json`, `app/globals.css` (`checkbox-tick`), `scripts/{lighthouse-run,h2-proxy}.mjs`, `apps/web/scripts/{client-boundary,server-icons,js-budget,js-diff}.mjs`, `ci.yml` (Guards, Lighthouse) |
| Tests | Unit 689 (native controls, useSubmitOnce, messages); e2e budget (31 routes), native-controls (keyboard), flights, hotels, packages, services, store, orders, visa, home, search, smoke, content, seo and the rest of the public suite green locally; QA plan docs/qa/C-speed.md (23 cases) |
| Tools and skills | Serena (symbols, replace_content, replace_in_files, memories), Context7 (next-intl precompile, Next inlineCss), Playwright MCP (checkout console), ui-ux-pro-max checklist on the native controls (focus rings, 44 px targets) |
| CI minutes | PR #272: 379 billed minutes (CI 228 over three full runs and one re-run of the flaky API-mode hero upload test; the manual Lighthouse workflow 150 on six pushes, made dispatch-only in #273) |
| Decision | D293–D299 |
| Migration | none · deploy bundle unchanged |

### #235 · D B · Malware scan for customer uploads (ClamAV) — ✅ Done
| Field | Value |
| --- | --- |
| Asked | FR-VISA-06 and NFR-SEC: a ClamAV container sized for the 8 GB VPS; the worker scans each customer file before staff can see it; a hit is quarantined and staff see a warning; deploy bundle change; EICAR covered in an integration test and the deploy smoke |
| Built | `clamd.ts` (INSTREAM over TCP, PING, no dependency), `fileScan.ts` (a pass over unscanned files: clean → visible, hit → `quarantine/` + infected + audit `file.infected` with the signature, no answer → stays waiting), the worker runs a pass every 10 s when `CLAMAV_URL` is set; the API refuses links and downloads until a file is clean (409 `scanning`) and lists `scan` (off, pending, clean, infected); the admin Files panel shows "Checking for viruses", "Virus-checked" or a red quarantine warning. Compose: `clamav` (clamav/clamav:1.5.4, 1.6 GB limit, `clamdata` volume), `CLAMAV_URL`, worker mounts `privatedata`; both deploy scripts start it |
| Files | `apps/api/src/files/{clamd,fileScan,customer-files.service}.ts`, `apps/api/src/worker.ts`, `apps/api/src/config/env.ts`, `apps/api/test/fileScan.test.ts`, `apps/web/src/components/admin/files/CustomerFiles.tsx`, `apps/web/src/lib/admin/customerFiles.ts`, `apps/web/src/app/secure-admin-control/files/[key]/route.ts`, `deploy/{compose.yml,deploy.sh,server/compose.yml,server/deploy.sh}`, `scripts/smoke-malware-scan.mjs`, `ci.yml` (deploy smoke step), docs (DEPLOY, SECURITY, ADMIN_GUIDE, PRD_COVERAGE) |
| Tests | API fileScan.test (verdicts, chunked stream, unreachable scanner, upload → pending → clean or quarantined with audit, links refused until clean, waiting when the scanner is down) against a clamd stand-in speaking INSTREAM; files.test unchanged; VPS deploy smoke with the real ClamAV: a clean PDF turns clean, an EICAR PDF is quarantined |
| Tools and skills | Serena; Docker Hub tags for clamav/clamav; ui-ux-pro-max checklist on the Files panel states |
| CI minutes | PR #270: 107 billed minutes (two full runs; the second accepted the CodeQL scanner upload) |
| Decision | D291–D292 |
| Migration | none (scanStatus existed since #232) · **deploy bundle changed**: copy deploy/server first |

### #234 · D B · Two-step sign-in, sign-in history, new-device email and Redis rate limits — ✅ Done
| Field | Value |
| --- | --- |
| Asked | FR-ADM 2FA (TOTP, required for Super Admin and Admin), login history in Users, an email on a sign-in from a new device, and NFR-SEC rate limits in Redis (per address and per phone), surviving a restart |
| Built | **API**: `totp.ts` (RFC 6238 on node:crypto, recovery codes), `/auth/login` answers with a session, a code step or an enrol step (5-minute signed challenge); `/auth/login/code` (authenticator or recovery code, replay-safe, counts toward the lockout), `/auth/login/enrol` (first code turns it on, ten recovery codes); trusted devices for 30 days; `StaffLoginEvent` history; `staff-new-device` email (seed patch); My account endpoints (status, start, confirm, new codes, off) and Super Admin `/admin/users/:id/logins` and `/two-step/reset`; required roles without it are signed out at the next refresh. `RateLimitService` in Redis for every API limit plus 10 lead requests an hour per phone. **Web**: the sign-in card gains the code step (six boxes, recovery code instead, trust this device), the setup step (QR drawn as SVG, key in fours) and the recovery-codes step (copy, download, "I saved them"); My account gets the two-step panel and recent sign-ins; Users shows two-step status, recent sign-ins and the reset |
| Files | `apps/api/prisma/{schema.prisma,migrations/20261026120000_staff_two_step}`, `apps/api/src/auth/{totp,device,twoStepSecret,twoStep.service,auth.service,auth.controller,tokens}.ts`, `apps/api/src/common/rateLimit.service.ts` (+ every controller that limited), `apps/api/src/seed/seedPatches.ts`, `packages/shared/src/schemas/{admin,settings}.ts`, `apps/web/src/lib/admin/{sessionActions,twoStep,twoStepActions}.ts`, `apps/web/src/components/admin/twoStep/*`, sign-in, account and users routes, `apps/web/e2e/{staff.setup,admin-two-step.spec,totp}.ts`, `playwright.config.ts`, `ci.yml` (Redis service, factor), docs (DEPLOY, SECURITY, ADMIN_GUIDE, PRD_COVERAGE) |
| Tests | API: totp.unit (RFC vectors, drift, replay, labels), twoStep.test (9: enrol, code, replay, recovery once, lockout, trusted device, history and email, refresh sign-out, account on/off, Super Admin reset, review fixes: lock doubles and emails, enrol once under a race), rateLimit.test (memory, factor, Redis fallback, shared across restart, per-phone), auth and seed patch tests · web 675 (twoStep helpers) · e2e admin-two-step 4/4 and the admin suite locally (failures only from reused local data: stock 0, an edited Sample visa country, a 4-digit badge count) |
| Tools and skills | Serena; Context7 (ioredis 6, uqr, Playwright project dependencies); shadcn input-otp; Playwright MCP (enrol 390/1440, code step 390, account 1440, 320 overflow fixed); ui-ux-pro-max checklist; design review of the steps; independent review subagent (no bypass; 7 findings fixed, D290) |
| CI minutes | PR #268: 100 billed minutes (two full runs: the first, then the review fixes) |
| Decision | D284–D290 |
| Migration | **yes, additive** (StaffUser columns, StaffRecoveryCode, StaffDevice, StaffLoginEvent): `sh backup.sh` before `sh deploy.sh` |

### #219 · D A · Admin lists stay fast on a 100-row page — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Bug from R5: on the 100-row leads page, Select all and closing the row sheet took 190 to 240 ms to paint on the low-memory machine |
| Built | Table rows no longer animate their background colour (every row restyled at once was the slow frame); dialog, sheet and alert overlays and the admin top bar and editor action bar lose backdrop blur (a solid scrim and white bars; glass stays only on the search card). The INP e2e now checks the 25-row and the 100-row page after the page settles, and runs with Playwright tracing off in that one file (tracing snapshots the DOM around every action and added 150 ms or more) |
| Files | `apps/web/src/components/ui/{table,sheet,dialog,alert-dialog}.tsx`, `apps/web/src/components/admin/{AdminTopBar,editor/EditorActionBar}.tsx`, `apps/web/e2e/admin-datatable.spec.ts`, `docs/design/DESIGN.md` |
| Tests | web 670 · admin-datatable e2e 4/4 locally (API mode, 500 tagged leads): Select all 96/80 → 64/48 ms, closing a sheet 128–192 → 56–88 ms; every interaction on 100 rows 40–112 ms |
| Tools and skills | Serena; Playwright MCP (Event Timing and long-task observers at 1440, sheet screenshot without blur); design-superpowers review of the scrim; ui-ux-pro-max checklist |
| CI minutes | PR #267: 11 billed minutes (quick set) |
| Decision | D283 |
| Migration | none |

### #224 · D A · First-load JS budget counts the page's own scripts — ✅ Done
| Field | Value |
| --- | --- |
| Asked | The budget e2e flaked by up to 56 KB between runs |
| Built | `budget.spec.ts` counts only the scripts the HTML references (`<script src>`, script preloads and modulepreloads) as transferred gzip bytes; idle-time prefetches of linked routes and on-tap code no longer count |
| Files | `apps/web/e2e/budget.spec.ts` |
| Tests | budget e2e stable across repeated local runs |
| CI minutes | PR #266: 8 billed minutes (quick set) |
| Decision | D282 |
| Migration | none |

### #229 · D A · Admin polish from the R10 review — ✅ Done
| Field | Value |
| --- | --- |
| Asked | The R10 independent review's larger items: lists outside the DataTable (Trash, Newsletter, Sent messages, Search activity, Audit log), Booking modes as read-only grey fields, integrations jargon, phone numbers asked twice and ISO codes for the phone picker, native US-format date inputs, template status words and Trash on fixed records, group fare thumbnails, Add staff outside the page header |
| Built | **Lists**: Trash, Newsletter (a tab beside Customers, `CustomerTabs`), Sent messages (email chips Waiting/Sent/Failed, template names in words), Search activity (top routes above, no sideways scroll) and the Audit log (sentence rows, changes in the sheet, person and area as table filters) on `AdminDataTable` with a search box (`q` on the five API list queries). **Dates**: `AdminDateRange` (originui range-calendar pattern rebuilt on our Calendar and Popover; presets, one month, Show and Clear; loads on open) on Reports and the Audit log; `ListFilters` removed. **Booking modes**: one card per service (mode chip, Live booking locked chip, the lock reason as the only field). **Integrations**: Test account / Real account, Keys and passwords, provider summaries without GDS, PNR, consolidator or adapter; switch help on full width. **Phones**: the number as shown is worked out from the number with country code (`phoneDisplay` auto rule, contact and extra numbers); phone picker countries chosen by name in order (`CountriesField`, first = default). **Templates**: On / Sent when it applies, Off / never sent. **Fixed lists** (templates, home sections, page images, store rows, service pages, menus): no Move to Trash in the editor or bulk bar, API 409 `fixed`. **Group fares and airlines**: the airline logo as the list thumbnail. **Users**: Add staff in the page header opens a dialog |
| Files | `apps/api/src/admin/{admin.controllers,inbox.service,content-admin.service,users.service}.ts`, `packages/shared/src/{schemas/admin.ts,content/registry.ts,workflow/chips.ts}`, `apps/web/src/app/[locale]/secure-admin-control/(panel)/{trash,subscribers,notifications,search,audit,customers,reports,users,content/[key],integrations}/…`, `apps/web/src/components/admin/{AdminDateRange,AdminDateRangePanel,CustomerTabs}.tsx`, `apps/web/src/components/admin/schema/{BookingModesField,CountriesField}.tsx`, `apps/web/src/lib/admin/{dateRangeStrings,statusChips}.ts`, blueprints (types, build, automatic, settings), `apps/web/messages/en.json`, `apps/api/test/adminLists.test.ts`, `apps/web/src/lib/admin/blueprints/engine.test.ts` |
| Tests | shared 148 · web 670 (phone shown from the number with country code) · API 206 (fixed lists answer 409, search in subscribers, sent emails, search activity, audit, trash) · API-mode e2e locally on a fresh database: every admin spec passes (task 10 now types the number with country code, Trash restores from the row sheet, newsletter row), admin routes at 390 and 1440 with axe and no sideways scroll; three timing flakes passed on retry (sign-in on the low-memory machine) |
| Tools and skills | Serena; magic (21st.dev: compared sean0205 range calendar with presets, originui range calendar with presets, kuratlielia two-month range picker; picked originui for no new dependency and our Calendar primitives, D197); Playwright MCP (390 and 1440); ui-ux-pro-max checklist |
| CI minutes | PR #265: 9 billed minutes (quick set) |
| Decision | D278–D281 |
| Migration | none |

### #233 · D · P0 notification gaps and the EMI request form — ✅ Done
| Field | Value |
| --- | --- |
| Asked | P0 requirements the #231 audit found partial: visa status email to the customer (FR-VISA-04), staff alert recipients by module and editable (FR-NTF), low-stock alert (FR-SHOP-10), EMI "Request EMI plan" form (FR-PAGE EMI), a reason on booking-mode changes (FR-GS-01) |
| Built | **Visa status emails**: each step forward (documents complete, submitted, approved, not approved, passport returned) emails the customer with `visa-status-customer`; an unticked document sends nothing. **Staff alerts by area**: `leadFormSettings.staffAlerts` (email + areas: every request module, orders, payments, feedback, low stock) edited in Settings › Forms and messages › Staff alerts; `notifyStaff(key, area)` sends one email per recipient and falls back to `STAFF_ALERT_EMAIL` while nobody covers an area (no change on deploy). **Low stock**: an order that takes a variant to its `lowStockAt` mark sends `low-stock-staff` (new template, seed patch `2026-10-26-low-stock-template`). **EMI request**: /emi card "Want to pay in instalments?" opens a dialog with the two-step request (amount over the minimum, months from Settings, the card's bank from Settings or Not sure yet, what for, consent) → EMI lead; the form loads when the dialog opens. **Mode-change reason**: moved to Phase E (D276) |
| Files | `apps/api/src/admin/{leads.service,scheduler.service}.ts`, `apps/api/src/notifications/notification.service.ts`, `apps/api/src/public/intake.service.ts`, `apps/api/src/seed/seedPatches.ts`, `packages/shared/src/schemas/{settings.ts,staffAlerts.test.ts}`, `fixtures/src/settings.ts`, `apps/web/src/lib/admin/blueprints/settings.ts`, `apps/web/src/components/content/EmiRequest{,Dialog,Form}.tsx`, `apps/web/src/lib/leads/emiLeadForm{,.test}.ts`, `apps/web/src/app/[locale]/(site)/emi/page.tsx`, `apps/web/messages/en.json`, API tests (admin, public, seedPatches), e2e content.spec |
| Tests | shared 148 · web 669 · API 204 (visa emails per step, routing by area with env fallback, low-stock crossing, seed patch, alert areas cover every module, EMI form rules) · e2e content.spec EMI request (API mode, local) |
| CI minutes | PR #264: 48 billed minutes (one full run) |
| Decision | D275–D277 |
| Migration | none (seed patch adds the low-stock template; staff alerts default to empty) |

### #232 · D · Customer files reach private storage (P0) — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Audit finding (#231): visa documents, payment slips, printing and trading attachments and the feedback photo never left the browser (Phase A rule D87/D106/D109 never lifted); FR-VISA-03, FR-VISA-05, FR-SHOP-07/11/12, FR-FDB, Offline Payment |
| Built | **API** `CustomerFile` table (migration `20261026010000_customer_files`, additive), `api/files`: upload (intake key, bytes sniffed as JPEG/PNG/PDF, 5 MB, rate limit, private volume `PRIVATE_FILES_DIR`), claim inside the lead/order/proof/feedback transaction (expired keys never fail a record; a lead gets a "did not arrive" note), staff list by record with role checks, 10-minute HMAC signed links (`file.link` and `file.download` audited), minute-job purge (unclaimed after 6 h, visa documents 90 days after the lead closes; marked first, removed only if still unclaimed), upload quotas (40 MB unclaimed per visitor, 2 GB in total, 2 GB free disk), claim checks the stored type and counts races, deleted files listed as deleted, PDFs served without the sandbox Chrome refuses, uploads pause in production when the folder is not a mounted volume, tokens redacted from request logs, PDF body parser. **Web** `/api/uploads` (same site, 20/min, sniffed, capped), DocumentSlot uploads on pick (Uploading state, abort, retry words), storage keys carried by every form, `/secure-admin-control/files/[key]` (session, signed link, stream; outside the proxy), Files panel on the lead and order pages, Open the slip on Payments, Open the photo on Feedback; the visa privacy note no longer says files stay on the device. **Deploy** `privatedata` volume in both compose files, backup.sh keeps `*.private.tar.gz` (owner-only), nginx `/api/uploads` 6 MB |
| Files | `apps/api/prisma/{schema.prisma,migrations/20261026010000_customer_files}`, `apps/api/src/files/*`, `apps/api/src/{app,features}.ts`, `apps/api/src/common/redact.ts`, `apps/api/src/public/{intake.service,public.module}.ts`, `apps/api/src/admin/{admin.module,scheduler.service}.ts`, `apps/api/src/config/env.ts`, `apps/api/Dockerfile`, `apps/api/test/files.test.ts`, `packages/shared/src/{helpers/customerFiles*,schemas/files.ts,schemas/leads.ts,index.ts}`, `apps/web/src/app/api/uploads/route.ts`, `apps/web/src/app/secure-admin-control/files/[key]/route.ts`, `apps/web/src/components/forms/DocumentSlot.tsx`, `apps/web/src/components/admin/files/CustomerFiles.tsx`, `apps/web/src/lib/{data/files,admin/customerFiles,admin/expectedFiles}.ts`, form callers and libs, admin lead/order/payments/feedback pages, `apps/web/src/proxy.ts`, `apps/web/messages/en.json`, `deploy/{compose.yml,server/compose.yml,backup.sh,server/backup.sh,nginx/*.template}`, e2e visa + api-mode |
| Tests | shared 146 · fixtures 84 · web 666 · API 199 (files: sniffing, sizes, intake key, claim and missing note, double claim, role checks, link and download audit, tampered and expired tokens, accounts slips, purge at 24 h and 90 days; log redaction, header names) · e2e: visa apply refuses a fake JPEG and sends the storage key; API mode: a passport uploaded on the site opens for staff byte for byte, signed out it redirects to sign-in |
| Widths checked | visa document slot at 390 (no sideways scroll, Added state); lead Files panel at 390 and 1440 (Open hit area 44 px through the sm button's extended target) |
| Tools and skills | Serena, Context7 (Next 16 route handler params and streaming), Playwright MCP (screenshots .playwright-mcp/232-*), ui-ux-pro-max (errors announced, progress state, recovery path) |
| Review | Independent subagent review: no P0; P1 disk fill through unclaimed uploads and PDFs blank in Chrome under a sandbox CSP; P2 send during an upload, purge query growth; P3 claim and purge races, type check on claim, deleted label, retention notes, cross-site opens, stale "metadata only" comments. All fixed with tests (quota, type on claim, deleted rows, PDF headers, feedback photo storage key: its strict schema had refused it) |
| CI minutes | PR #262: 85 billed minutes (two full runs: a CodeQL acceptance comment on the upload write and the month-end hotel e2e, #263) |
| Decision | D270–D274 |
| Migration | `20261026010000_customer_files` (additive): owner copies the new `deploy/server` bundle (compose.yml with the `privatedata` volume, backup.sh), runs `sh backup.sh`, then `sh deploy.sh` |

### #231 · D Step 0 · Audit, CI budget and docs after D0 — ✅ Done
| Field | Value |
| --- | --- |
| Asked | PROMPT 10 Step 0: docs/PRD_COVERAGE.md for every FR-ID checked in code and on the live site; a normal PR at 15 CI minutes or less with the full suite on main, nightly and the `full-ci` label; the API image without source or tests and a Docker Hub clean-up; TRACKER, CLAUDE.md and DEPLOY.md for the live site; prompts v5 committed |
| Built | **Coverage**: docs/PRD_COVERAGE.md, 142 rows (P0 88 done, 26 partial, 2 missing; P1 1 done, 7 partial, 7 missing, 2 waiting for owner account), each gap with its issue; live checks on waafasworld.com (no /track, no /bn or hreflang, Google-only sign-in, no analytics IDs). New P0 finding: customer files never leave the browser (#232). 28 work-order issues #232–#259 under epic #31. **CI**: quick set vs full suite (D266), `full-ci` label + re-run workflow, nightly, CodeQL folded in, Turborepo cache, `scripts/ci-minutes.mjs`. **Image**: esbuild-compiled API (D267), multi-stage Dockerfile, compat stand-in, image check in Docker images, `scripts/dockerhub-cleanup.mjs` (15 releases). **Docs**: CLAUDE.md live-site and CI budget rules, DEPLOY.md private Docker Hub steps and bundle changes table, TRACKER header, section 11 for the VPS and Phase D accounts, section 14, fixed bug rows; epic #30 closed |
| Files | `.github/workflows/{ci,docker,full-ci-label}.yml` (codeql.yml removed), `apps/api/{Dockerfile,package.json,scripts/build.mjs,scripts/tsx-compat.sh}`, `deploy/{compose.yml,server/compose.yml}`, `scripts/{ci-minutes,dockerhub-cleanup}.mjs`, `CLAUDE.md`, `docs/{PRD_COVERAGE,DEPLOY,TRACKER,claude-code-prompts}.md`, `pnpm-lock.yaml` |
| Tests | Compiled API vs tsx on the same database: identical snapshot; the production image locally: migrations, seed, API ready, worker through the old command; guards, format, API lint and typecheck |
| CI minutes | PR #260: 54 billed minutes (full suite with the `full-ci` label + Docker images; it touched deploy/). Baseline PR #230: 60 |
| Tools and skills | Serena (memories), Context7 (Prisma 7 config, Docker Hub API), Playwright MCP (live-site checks), a general-purpose subagent for the FR-ID audit (spot-checked: visa files, visa status email, staff alert address) |
| Decision | D266–D269 |
| Migration | none (owner: copy the deploy/server bundle when convenient; Docker Hub private steps in DEPLOY.md) |

### #200 · D0 R10 · Usability QA, 14 staff tasks and the staff guide — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201: the 14 staff tasks as Playwright e2e with visible, labelled controls (1440, plus 390 for inbox jobs); axe on every admin route; screenshots at 390, 768, 1024 and 1440; an independent subagent review of every screen against ADMIN.md with everything fixed; docs/ADMIN_GUIDE.md (Banglish, with screenshots) |
| Built | **Staff tasks**: new `admin-staff-tasks.spec.ts` for task 2 (hero photo and headline), 8 (banner for next Friday), 12 (customer by phone, 1440 and 390) and 13 (a wrong price undone with Restore); the map of all 14 in ADMIN.md (R10). **Every route**: `admin-screens.spec` adds axe, a sideways-scroll check and screenshots at 390 and 1440 for every other admin route (each list, each settings section, the builder, Trash, the package editor). **Review fixes**: list names from the record (group fares "Dhaka → Dubai · Emirates", store rows by name) instead of keys; no empty Price or Status columns (`listPriceOf` undefined read as a price); system editors in words ("the sample data", "a site update", "a store order"); the editor's chip follows a banner's dates (Scheduled, Ended); group fares "Ends soon" within a week; sentence-case table headers, rail labels and the Sample badge (also on phone cards); no extra "Content" crumb on sidebar lists; "*" reads "All other areas"; named Remove buttons; one-row editor action bar on phones; single-section editors without the empty rail; wrapping settings tabs and edge fades on scrolling rows; the matrix cells by container width; scrolling tables as named, focusable regions; a site-update audit sentence; leads say "No leads yet" when nothing filters them; plainer setup checklist words with the count; ticked open days; no zero pager or export on empty lists. **Guide**: `docs/ADMIN_GUIDE.md` with seven screenshots in `docs/admin-guide/` |
| Files | `apps/web/e2e/{admin-staff-tasks,admin-screens}.spec.ts`, `.github/workflows/ci.yml`, `packages/shared/src/workflow/{chips,chips.test}.ts`, `apps/web/src/app/[locale]/secure-admin-control/(panel)/{content/[key],leads,media,reports/**,search,notifications,subscribers}`, `components/ui/{table,badge}.tsx`, `components/admin/{table/*,editor/*,schema/{MediaField,VideoField,TagsField,WeekdaysField,VariantsMatrixField},settings/*,SetupChecklist,StatusTabs,inbox/{LeadModuleTabs,Timeline},board/LeadBoardFrame,LeadActions,OrderSteps,VisaProgressPanel}.tsx`, `lib/admin/{format,chipWords,statusChips,blueprints/display,blueprints/engine.test}.ts`, `messages/en.json`, `docs/ADMIN_GUIDE.md`, `docs/admin-guide/*.png`, `docs/design/ADMIN.md` (R10) |
| Tests | shared 144 · web unit 664 (banner window states, group fare ending soon) · e2e API job 79 on a fresh database (new staff tasks 5; every other route 42 at 390 and 1440 with axe) |
| Widths checked | every admin screen at 390 and 1440 with axe and no sideways scroll; the main screens at 320 / 390 / 768 / 1024 / 1440 |
| Review | Independent subagent review of every screen against ADMIN.md (166 screenshots): P1 raw keys and ids as names, "Not found:" in empty pickers (fixed in R8), "something" in the audit log, "*" in delivery zones; P2 empty columns, "seed" as an editor, extra crumbs, uppercase headers, cut tabs and chip rows, a three-row action bar on phones, the empty rail on single-section editors, Sample missing on phone cards. All fixed here, except the larger items filed as #229 (lists still outside the DataTable, booking modes cards, integrations words, phone typed twice and a country picker, a themed date-range picker, template status words and Trash, airline logos) |
| Admin first-load JS | script transferred on load at 1440 (gzip): dashboard 276 KB, leads 310, orders 307, tour packages list 376, new package 392, media 285, home page builder 305, settings 353, reports 272, audit 273 (admin only; editors and the drag code load on demand; the public budgets are unchanged) |
| Tools and skills | Serena (memories); Playwright MCP (guide screenshots at 1280, the matrix at 1280, first-load JS per admin route through CDP); an independent general-purpose subagent for the review; ui-ux-pro-max checklist (forms, tables, touch targets, contrast) on the fixes; design-taste-frontend and frontend-design on the screenshots |
| Decision | D262–D265 |
| Migration | none |

### #199 · D0 R9 · Dashboard v2, Settings, users, audit log, notifications, reports — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201 / ADMIN.md §5.2 and §5.6: a dashboard with Today queue cards, KPI cards with sparklines, leads by module and by day, recent activity and a self-ticking setup checklist; Settings as one page with a left sub-navigation and plain sections; users and roles (invite by email, role picker, deactivate, last active, read-only permission matrix); the audit log as readable sentences with filters; email and SMS templates with a live preview and insert buttons; reports with a date-range picker, CSV and Excel, search activity; Integrations restyled |
| Built | **Dashboard**: Today cards from the inbox counts (oldest wait on New leads, Past the reply target in red, "Nothing waiting" at zero), This week KPIs with 14-day sparklines and the change in words, Leads by day (server-drawn line, table one click away), Leads by service, Recent activity, the setup checklist; API `series`, `weeks`, `oldestNewAt` (orders and revenue only for order roles). **Settings**: `SettingsFrame` with twelve sections, link tabs for split documents and lists, the embedded editor layout, old `/content/<setting>` addresses redirect, Users / Integrations / Audit log / Sent messages inside the frame, the setup checklist on `/settings`. **Users**: invite by email by default (hashed token, 7 days, `staff-invite` template, `/secure-admin-control/welcome`, Send the invite again; a password set by the Super Admin closes the invite), permission matrix. **Audit log**: sentences, Show what changed, person / area / Dhaka-day filters (API `area`, `from`, `to`). **Templates**: Insert buttons and a live email or SMS preview. **Reports**: one-tap ranges, Excel and CSV per download (API `.xlsx` writer), What people searched |
| Files | `apps/api/src/admin/{dashboard.service,users.service,reports.service,reports.controller,admin.controllers,invite.controller,admin.module}.ts`, `apps/api/src/common/{xlsx,xlsx.unit.test}.ts`, `apps/api/src/seed/seedPatches.ts`, `apps/api/prisma/{schema.prisma,migrations/20261025090000_staff_invites}`, `apps/api/test/{admin,reports,seedPatches}.test.ts`, `packages/shared/src/schemas/{admin,settings}.ts`, `fixtures/src/settings.ts`, `apps/web/src/app/[locale]/secure-admin-control/{(panel)/page.tsx,(panel)/settings/**,(panel)/audit,(panel)/reports/**,(panel)/users/**,(panel)/notifications,(panel)/integrations,(panel)/content/[key]/page.tsx,welcome/**,sign-in/**}`, `components/admin/{settings/*,dashboard/*,SetupChecklist,KpiCard,AdminPanel,ListFilters}.tsx`, `components/admin/schema/{TemplateTextField,TemplatePreview,SchemaField,wideWidgets}.tsx?`, `components/admin/editor/ContentEditor.tsx`, `lib/admin/{settingsSections,setupChecklist,loadSetup,auditText,templateText,dateRanges,todayQueue,inviteActions,opsActions,tokens,types}.ts`, `lib/admin/blueprints/{types,settings}.ts`, `messages/en.json`, `e2e/{admin-settings,admin-shell,admin-screens,api-mode}.spec.ts`, `.github/workflows/ci.yml`, `docs/design/ADMIN.md` §5.2 and §5.6.1 |
| Tests | shared 144 · fixtures 84 · web unit 663 (settings sections cover every part of a split document; setup checklist; audit sentences; template insert and fill; Dhaka report ranges; Today queue and week change) · API 192 (audit by area, person and Dhaka days; invite create, accept once, expired, resend, rate limit; dashboard series and weeks by role; reports .xlsx; the xlsx writer read back, and checked with openpyxl; staff-invite seed patch) · e2e API job 71 (new `admin-settings.spec.ts` 7: dashboard, staff task 10 office hours and phone to the contact page with the audit sentence, template Insert and preview, report ranges and Excel, invite and the welcome page, axe at 390 and 1440 on seven screens; `admin-screens` adds Payments, Email and SMS and the audit log) · fixture build and the security and SEO specs green |
| Widths checked | 390 · 768 · 1024 · 1440 on the dashboard, Settings home, Office hours, Payments and delivery, Email and SMS, a template, the audit log, reports and users; the welcome page at 390 and 1440; axe at 390 and 1440 on seven of them in the new spec |
| Review | Design review with design-taste-frontend, frontend-design and the ui-ux-pro-max pre-delivery checklist on the 390 and 1440 screenshots (design-superpowers is not installed in this session). Fixed before the PR: the users page widened at 390 and 1024 (screen-reader text in the matrix cells sat outside its scroller; cells and scroller are positioned now, and the scroller is a named, focusable region for axe); the Booking rate card was shorter than its row and Recent activity stretched to the checklist height; nine Today cards ran long on phones (shorter cards, two KPIs per row); chart labels would have shrunk to 5 px on phones (HTML labels); the message subject box was half width and its help still said to type curly brackets; seed updates read "made a change to something" (now "A site update changed 2 records"); "Notification templates" renamed Email and SMS messages; the setup checklist panel was not a named region (AdminPanel takes an id). Accepted: settings documents keep the editor's Status and History (useful after a wrong change) |
| Tools and skills | Serena (memories, symbols); Context7 (Next.js 16 `generateMetadata` and `connection()` under Cache Components); Playwright MCP (every screen at four widths, the console); ui-ux-pro-max (forms, charts and the pre-delivery checklist); shadcn MCP (radio-group for the invite choice); 21st.dev magic (dashboards and uploads searched in R8; the chart and KPI sparklines are server SVG so the dashboard ships no chart library); design-taste-frontend and frontend-design on the screenshots |
| Decision | D255–D261 |
| Migration | **20261025090000_staff_invites** (two nullable columns and a unique index on StaffUser): run `sh backup.sh` before deploying |

### #225 · Bug · A missing admin record shows the error page instead of not found — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Found during the R8 screenshots: a mistyped, old or deleted record address showed "This page didn't load" with Try again and logged React error #441 |
| Built | Record pages (content records, leads, orders) read with `adminFind` (null on 404) and show `AdminNotFound` in place: "We can't find this", what may have happened, Open Trash and Go to the dashboard, no Try again (a `notFound()` thrown inside the streamed page made React fall back to the client and log #419). Other reads: `adminGet` calls `notFound()` on a 404 and `(panel)/not-found.tsx` shows the same screen (calls with `.catch(() => null)` still get null). `AdminEmpty` takes `titleAs="h1"` when the state is the whole page |
| Files | `apps/web/src/lib/admin/adminApi.ts`, `app/[locale]/secure-admin-control/(panel)/{not-found.tsx,content/[key]/[id]/page.tsx,leads/[id]/page.tsx,orders/[id]/page.tsx}`, `components/admin/{AdminNotFound,AdminEmpty}.tsx`, `messages/en.json`, `e2e/admin-shell.spec.ts` |
| Tests | e2e admin-shell: a missing tour package shows the not-found screen inside the admin, no Try again, Open Trash opens Trash, zero console errors; admin-editor and admin-inbox green |
| Widths checked | 390 · 1440 (the not-found screen in the admin frame) |
| Tools and skills | Serena; Playwright MCP (the error page at 1440 before the fix) |
| Decision | D254 |
| Migration | none |

### #198 · D0 R8 · Purpose-built editors: package, product, visa country, blog post and the quick forms — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201 / ADMIN.md §5.4: editors in the order staff think (tour package: Basics → Photos → Itinerary → Prices and dates → Inclusions → Hotels and visa notes → SEO; product: Basics → Photos → Variants matrix with the default by radio → Price and stock → Specs and compatibility → SEO; visa country: Basics → Visa types with fee ranges → Documents → FAQs → SEO; blog post as a full-width writing view; group fare as a one-screen quick form; flight route, team member, gallery album with multi-upload, coupon and banner); staff tasks 1, 7, 9 and 11 as e2e; usable at 768, best from 1024 px; axe |
| Built | Blueprint sections in staff order for tour packages, products, visa countries, blog posts, group fares ("Flight, fare and seats"), banners and team members ("Person and photo", "How to reach them"). **Variants matrix** (`VariantsMatrixField`, `lib/admin/variantMatrix.ts`): one row per mix of option values with Sell, a suggested stock code, price, price before discount and stock; "Variant shown first" by radio; variants whose values are gone listed with Remove; a product without options sells one Standard variant. **Automatic**: a package's Price from (`lowestPrice`) and number of days (`itineraryDays`), a member's initials (`initialsFromName`). **Writing layout** for blog posts (`layout: "writing"`: no section list, a centred column, side panel at the right from 1280 px). **Bulk photos** for gallery albums (`bulkPhotos`: drop or choose several, each upload with progress and Retry becomes an item). **New records**: `startWith` (a new team member is shown), "Next: <section>" at the end of each section, a new repeater card opens ready to fill, the browser tab says "New tour package". Accessible names: the Optional chip reads " (optional)" to screen readers; an empty optional group's Add button names its group |
| Files | `apps/web/src/lib/admin/{variantMatrix.ts,variantMatrix.test.ts}`, `lib/admin/blueprints/{types,build,automatic,engine.test,travel,shop,visa,content,home}.ts`, `components/admin/schema/{VariantsMatrixField,BulkPhotoDrop,RepeaterField,SchemaField,FieldShell,ObjectField,useStableKeys,wideWidgets}.tsx?`, `components/admin/editor/{ContentEditor,EditorSection}.tsx`, `components/admin/media/VideoFileSlot.tsx`, `app/[locale]/secure-admin-control/(panel)/content/[key]/new/page.tsx`, `messages/en.json`, `e2e/{admin-editors,admin-media}.spec.ts`, `.github/workflows/ci.yml`, `docs/design/ADMIN.md` §7.2 |
| Tests | web unit 647 (variant matrix: combinations, suggested stock codes, stray variants; automatic lowest price, itinerary days and initials) · e2e API job: new `admin-editors.spec.ts` 6 (task 1 tour package with 5 photos, 3 days and 2 prices published and on the site; task 7 product with 2 variants and stock published; task 9 team member with a photo on About; task 11 Sample visa country (Malaysia, kept apart from the inbox spec's Thailand) gets fees, a price range and a document, no longer Sample, on the site; axe, no sideways scroll and no "Not found:" on six new editors at 768 and 1440), the whole API job 67 green locally on the final build (fresh database) |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 on the new tour package, product, visa country, blog post, group fare and team member editors (no page overflow at any width); the variants matrix at 390 (cells stacked), 768 and 1440 |
| Review | Design review with design-taste-frontend, frontend-design and the ui-ux-pro-max pre-delivery checklist on the 390 and 1440 screenshots (design-superpowers is not installed in this session). Fixed before the PR: the matrix's wrapped "Price before discount" label pushed its box out of line; a new package's Photos section showed a tick with no photo; empty airline and airport pickers on a new group fare said "Not found:"; an empty optional group's button was a bare "Add"; the Optional chip joined the label's accessible name ("Up toOptional"). Accepted: a visa country with four types opens all four cards (the R2 rule of up to four open), so the page is long at 1440; the section list jumps between sections. Found and filed: #225 (a missing record shows the error page instead of not found). First CI run on #226: the fixture build stopped on the new tab title (`generateMetadata` reads the address, and without the API the panel shows its unavailable screen and never renders the page, so nothing marked it as per request): the panel's unavailable screen now calls `connection()`. The workflow spec's Schedule click hit a toast lying over the sticky action bar (hovering kept it open): admin toasts now sit above the action bar at every width, with a regression check in task 11 |
| Tools and skills | Serena (memories, symbols, `replace_content`); Context7 (Next.js 16 `generateMetadata` with Promise params under Cache Components); Playwright MCP (six editors at 390–1440, the matrix, the console); ui-ux-pro-max (UX search for forms and the pre-delivery checklist); shadcn MCP (`@shadcn/radio-group` for Variant shown first; checkbox already installed); 21st.dev magic (searched variant/inline-edit tables: ruixen table-edit, arihantcodes inventory-table; multi-upload drops: joyco file-dropzone, uvain file-upload. The matrix follows the inline-edit row pattern as cards on shadcn primitives so it works at 768 px; bulk photos reuse the R3 MediaDropzone and upload queue; no new dependency); design-taste-frontend and frontend-design on the screenshots |
| Decision | D251–D253 |
| Migration | none |

### #197 · D0 R7 · Website builder: home page, menus, link picker, preview, edit on site — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201 / ADMIN.md §5.8: home sections in order with drag, a Show switch, thumbnails and Edit in a side sheet with a live preview; the hero editor with a preview; menus as drag-and-drop lists with a link picker for any page or record; banner and announcement scheduling from dates; Preview of unpublished changes on Next.js draft mode with its banner; Edit on site (a hint cookie at sign-in, a lazy Edit this page at no cost to visitors, Edit sections outlines); public budgets unchanged |
| Built | **Website › Home page** (`/website/home`): 13 sections with thumbnail, Shown/Hidden chip, Show switch, drag (mouse, long press) or arrows on phones, order saved at once (`reorderContent`); section sheet (small line, heading, line under it with the standard words as grey placeholders, Show, links to the content, live preview); hero sheet (headline, second line, line under it, label, places, media summary with Change photo or video, preview). **Website › Menus** (`/website/menus`): ten menus grouped Header / Phone / Footer, each item in words with Show, Edit and Remove with Undo, Add an item, drag or move; the item sheet shows only the parts that menu uses; the tab bar keeps five tabs on show. **Link picker** for every `href` field and menu item (site pages, records with pages, a checked website, phone or email; cmdk with a word filter; lists say where a link goes). **Preview of unpublished changes**: Preview on site in the editor for drafts and scheduled records → `/secure-admin-control/preview` (session) → draft mode; `readSnapshot` reads a fresh snapshot with `previewDrafts`; banner with Exit preview (`/api/preview/exit`), sign-out ends it. **Edit on site**: `waafa_staff` hint (sign-in, proxy backfill), `StaffToolsLoader` → `StaffTools` (Edit this page by `editTargetFor` and role, Edit sections outlines on the `data-edit` marks, Exit preview, Hide), words and links from `/secure-admin-control/api/staff-tools`. **Framing**: staff browsers may frame the site from itself; the admin may frame the site and is never framed |
| Files | `apps/web/src/app/[locale]/secure-admin-control/(panel)/{website/home,website/menus,preview,api/staff-tools}/**`, `app/api/preview/exit/route.ts`, `app/[locale]/(site)/{layout.tsx,_components/home/HomeSections.tsx}`, `components/admin/website/*`, `components/admin/schema/{LinkPicker,LinkField,LinkTargetText,IconPicker,IconField,SchemaField,useContentOptions}.tsx`, `components/admin/editor/EditorSidePanel.tsx`, `components/staff/*`, `components/layout/{PreviewBanner,PreviewExitLink}.tsx`, `lib/admin/{linkTargets,commandFilter,editLinks,preview,homeSections,navigation,contentActions,sessionActions}.ts`, `lib/admin/blueprints/{infer,build,types,editorMessages}.ts`, `lib/data/api/{snapshot,previewDrafts}.ts`, `lib/staffHint.ts`, `lib/security/securityHeaders.ts`, `proxy.ts`, `next.config.ts`, `messages/en.json`, `e2e/admin-website.spec.ts`, `.github/workflows/ci.yml` |
| Tests | shared 144 · web unit 643 (link targets with filtered links and stray percent signs, word filter, edit links, preview path with dot segments, previewDrafts with drafts, scheduled posts and future banners, security headers) · API 186 (#222: `NotificationService.idle` unit test; intake tests wait between cases) · e2e API job 61 (new `admin-website.spec.ts` 9: hero words with preview, standard words and fresh sheets, hide and move on a phone with focus kept, menu item by name then a typed website with Enter, Remove with Undo, tab bar locked, draft preview for staff only with Exit and the open-redirect check, staff tools and outlines with keyboard, axe at 390 and 1440); `admin-media` racy title locator fixed; the Google sign-in flow test gets 90 s (three saves and a 30 s wait inside a 30 s test) · budget e2e within ceilings: / 218, /flights 260, /tour-packages 189, /visa 187, /shop 216, /contact 299 KB |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 on Website › Home page and Website › Menus (no page overflow; menu rows put their controls on a second line on the narrowest phones), the hero and section sheets at 1440, the link picker at 1440, the public home with the staff tools at 390 and 1440, Edit sections at 390, the preview banner at 390 and the editor's Preview on site at 1440; axe clean on both builder pages at 390 and 1440 |
| Review | Independent subagent review of the diff: 2 P1, 7 P2, 11 P3, all fixed before the PR (open redirect through `/.//` in the preview path; Enter in the picker's typed form saving the item sheet; drafts outliving the session; stale sheets saving over newer changes; Undo reverting later changes; a remount on every save dropping focus; drag-only reorder at 640 px and up; the preview reloading before the site had the save; the preview frame in the tab order; filtered links shown bare; a stray % crashing a page; admin modules in the public bundle; hint lifetime; outline focus; dated banners in preview; non-idempotent e2e clicks; cookie-conditional framing). Design review with design-taste-frontend, frontend-design and the ui-ux-pro-max pre-delivery checklist on the 390 and 1440 screenshots (design-superpowers is not installed in this session): the hero sheet jumped to its preview on opening (fixed), empty heading boxes gave no hint (grey standard words), the menus page ran 5,500 px long at 1440 (two columns from 1280 px), menu labels truncated at 320 px (controls wrap). Accepted: the staff tools pill sits over the hero search card's first tab at 1440 x 900 for staff only, with Hide on offer. First CI run on #223: CodeQL flagged the staff-tools path's trailing-slash regex as polynomial (now a loop, with a 50,000-slash test and a 512-character cap); the fixture smoke job caught two specs that still expected the old DOM and headers (`home.spec` reads sections inside their `data-edit` marks; `security.spec` expects 'self' framing on public pages and 'none' on the admin); the budget spec's first-attempt flake predates R7 (#224) |
| Tools and skills | Serena (memories, symbols, `replace_content`; Edit tool where Serena hit a Windows file lock); Context7 (Next.js 16 draft mode with `use cache` and Cache Components: `isEnabled` readable in cache scopes, enable/disable only in route handlers or server actions, off during prerender without dynamic marking); Playwright MCP (sign-in, home manager, sheets, menus, link picker, public staff tools and outlines, preview banner at 320–1440); ui-ux-pro-max (design-system run and the pre-delivery checklist; UX search for reorder lists); shadcn MCP (dropdown-menu checkbox items for the staff menu); 21st.dev magic (floating toolbars: cnippet toolbar, ruixen toolbar-dock; kept the in-house pill on Radix, no new dependency); design-superpowers design-review and design-taste-frontend on the 390 and 1440 screenshots; independent subagent review of the diff |
| Decision | D243–D248 |
| Migration | none |

### #196 · D0 R6 · Inbox: leads, visa applications, orders and payment proofs — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201 / ADMIN.md §5.5: one inbox pattern (list, detail with next actions as buttons, timeline) fully usable at 390 px; lead module tabs; a board whose drag runs the same transitions and asks for the same inputs; reply timer and overdue; visa applications by checklist stage; order steps; proof matching; feedback; customer by phone; e2e at 1440 and 390 for reply, convert, verify proof, ship order |
| Built | **Shared**: `leadStepForMove` (board move → the lead page's step or a refusal in words), `boardColumnOf`, `LEAD_BOARD_COLUMNS`, `replyTimer`. **API**: open counts per module on the leads list (the tabs), a `closed` view (lost and cancelled), the customer card on the lead (other requests and orders by phone, by role), `GET /admin/visa-applications` (stage per lead from its country checklist, stage counts, spam left out), `canSeeOrders` shared by customers, reports and leads. **Web**: `components/admin/inbox/` (InboxSplit with its own handle, InboxListPane with ScrollToCurrent, ReplyTimer, Timeline, CustomerCard, PhoneActionBar, LeadModuleTabs, LeadContactButtons), `LeadStepDialog` shared by the lead page and the board, `components/admin/board/` (LeadBoardView, LeadBoardDnd on dnd-kit, in the board chunk, LeadBoardCard with Move to…, LeadBoardColumn, LeadBoardFrame); lead page rebuilt (name, status, reply timer; steps; facts; customer card; timeline by day; queue pane; phone bar); leads list with service tabs and Show chips; board with six columns; `/visa-applications` on the DataTable; order page with its queue, phone bar and proof words; queues carried in the address (`lib/admin/queues.ts`); sidebar Visa applications moved to its page (query-aware active state) |
| Files | `packages/shared/src/{workflow/leads,schemas/admin}.ts`, `apps/api/src/admin/{leads,customers,reports}.service.ts`, `apps/api/src/admin/{access,admin.controllers,admin.module}.ts`, `apps/api/test/inbox.test.ts`, `apps/web/src/components/admin/{inbox,board}/*`, `components/admin/{LeadActions,LeadStepDialog,OrderSteps}.tsx`, `components/admin/table/{types,chipSpec}.ts`, `app/[locale]/secure-admin-control/(panel)/{leads,leads/[id],leads/board,visa-applications,orders,orders/[id]}/page.tsx`, `lib/admin/{queues,format,navigation,statusChips,types}.ts`, `messages/en.json`, `apps/web/e2e/{admin-inbox,admin-workflow,api-mode}.spec.ts`, `.github/workflows/ci.yml` |
| Tests | shared 144 (board moves against the status rules for every stage pair, reply timer agreeing with the overdue mark) · web unit 623 (Dhaka time and day for timelines, query-aware sidebar state) · API 184 (new inbox.test: module counts per role and only when asked, the closed view, the customer card by role, visa applications by stage without spam and closed to travel sales; the visa checklist moves a new lead to In progress) · e2e in the CI API-job order on a fresh database 52/52, with admin-inbox 10 (reply and convert, verify a proof from its sheet, confirm, pack and ship an order, each at 1440 and 390; the queue beside a lead and Full list; the board's drag asking for the quote, Move to… asking for the close reason, a refused move; Move to… on a phone; visa applications by stage beside their list) |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 on the leads list, a lead, the board, visa applications, a visa lead and an order; no page overflow (an sr-only count inside the scrolling tabs widened the page at 320 until the tab and every status chip became positioned); axe clean on the lead page at 1440 and 390 and the phone board |
| Review | design-superpowers review on the 390 and 1440 screenshots: the queue keeps its place while a lead is worked, the header says who, what and how long they have waited, one main step, the customer card answers "have they asked before". Fixed in review: the order page put its next step under the items on narrow screens (now first). Independent subagent review of the diff: 10 findings, all fixed (D242): closed view dropped from the list, touch long press never dragging, the work item remounting when the panes took over (InboxSplit rebuilt as one grid, D241), a waiting visa lead moving on any checklist step, focus lost after a board move, Move to… label in name, the queue scrolled to the top, Visa applications reading whole rows, module counts on every list call, a raw payment account key. Known limits: the page skeleton still replaces the queue for a moment when moving to the next lead; Visa applications look at the newest 2,000 visa leads (D236) |
| Tools and skills | Serena (memories, symbols, symbol edits); Context7 (react-resizable-panels 4: pixel sizes, `useDefaultLayout`, Group and Separator props); shadcn MCP and CLI (`@shadcn/resizable` added, then replaced by an in-house grid, D241); 21st.dev magic MCP (kanban, card movement and timeline searches; the `diceui/kanban` install stopped in the shadcn CLI and used the day's retrievals, D235); ui-ux-pro-max (touch targets and spacing, focus order, loading feedback, Sheet and Dialog rules); Playwright (e2e at 1440 and 390, drag gestures, axe, screenshots in `test-results/admin-audit/r6/`); design-superpowers design review |
| Decision | D232–D242 |
| Migration | none |

### #195 · D0 R5 · DataTable v2 on every list — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201 / ADMIN.md §10: one TanStack DataTable for leads, orders, proofs, customers, feedback, users and every content list: search, filter chips, sort, saved views, column visibility, bulk actions, server pagination with totals, skeletons, designed empty states, a side sheet per row, cards below 768 px, INP under 200 ms on 500 rows |
| Built | **Web** `components/admin/table/`: `AdminDataTable` (server, scoped messages) → `DataTableView` (TanStack Table v9 with row selection and column visibility only; memoised rows and cards with stable handlers; sortable headers with aria-sort; ↑/↓, Enter, Space; skeleton rows while the next address loads; only the layout on screen after hydration), `DataTableToolbar` (search, saved views, columns, export, filter chips with aria-pressed), `DataTableBulkBar` (steps with an optional choice and a confirm, export selected), `DataTablePager` (range, 25 / 50 / 100, previous / next), `DataTableSheet`, `RowChips`, `RowThumbnail`, `useListPreferences` (D227), `listQuery` (address state, `pageSizeOf`, `sortOf`), `csv` (formula cells defused). Pages: every content list (photo or initials, chips with reasons, price, updated; Publish / Unpublish / Archive / Move to Trash; Earlier / Later in the sheet), Leads (views as tabs, module and status chips, Assign and Mark as spam, Call and WhatsApp on cards, the leads export), Orders (status chips, sort by total or date), Payment proofs (queue tabs, Verify / Reject in the sheet), Customers (sort by orders, spent, last activity), Feedback (Approve / Reject one by one or in bulk, a "No consent to publish" chip), Users (state chips; roles, password and deactivate in the sheet; Add staff above). The name links to the editor (D230); queues stay tabs (D231). **Shared**: record chips and `photoOf` / `listPriceOf` moved to `packages/shared`; list query schemas for content, bulk and move; `q` and `sort` for feedback and proofs. **API**: `GET /admin/content/:key/records`, `POST /admin/content/:key/bulk`, `POST /admin/content/:key/:id/move`; sort for leads, orders and customers (and a page size), search and sort for feedback and proofs. Checkbox indicator force-mounted (D229) |
| Files | `apps/web/src/components/admin/table/*`, `components/ui/checkbox.tsx`, `app/[locale]/secure-admin-control/(panel)/{content/[key],leads,orders,payments,customers,feedback,users}/**`, `lib/admin/{chipWords,contentActions,leadActions,opsActions,statusChips,types}.ts`, `messages/en.json`, `packages/shared/src/{workflow/chips,helpers/photo,schemas/admin,index}.ts`, `apps/api/src/admin/{content-admin,leads,orders,inbox,customers}.service.ts`, `apps/api/src/admin/{admin.controllers,reports.controller}.ts`, `apps/api/src/common/photo.ts`, `apps/api/test/datatable.test.ts`, `apps/web/e2e/{admin-datatable,admin-editor,admin-media,admin-workflow,api-mode}.spec.ts`, `.github/workflows/ci.yml` |
| Tests | shared 137 · web unit 622 (address state with page sizes and sorts, CSV formula cells, message catalogue) · API 181 (new datatable.test: search, chip filter, sort, pages and rejected sizes; bulk unpublish / archive / skipped publish / trash with audit rows; Earlier / Later; feedback and proof search and sort; customer sort unit test) · e2e in the CI API-job order on a fresh database 42/42, with admin-datatable 4 (content search, chip, sort, saved view, hidden column after reload; 500 leads paged by the server, sheet, bulk assign of 100, INP under 200 ms on the 25-row page; axe and cards at 390 and 1440) |
| Widths checked | 390 · 768 · 1024 · 1440 on packages, FAQs, leads, orders, proofs, customers, feedback, users, the row sheet and the bulk bar; no page overflow; axe clean at 390 and 1440 |
| Review | design-superpowers review on the 390 and 1440 screenshots: one table language for every list, the name and one secondary line, chips with reasons, numbers right-aligned in tabular figures. Fixed in review: the sheet opened with its first chip focused (tooltip showing on its own; the sheet now takes focus), "Updated" said twice on content rows (the line now names who changed it), sortable headers lost the uppercase style, phone filter chips took six rows (one scrolling row per filter), phone cards hid the reference (cards now show the secondary line). Known limit: the 100-row page near 200 ms on the low-memory machine (#219) |
| Tools and skills | Serena (memories, symbols); Context7 (TanStack Table v9 features API, next-intl getTranslations types); ui-ux-pro-max (data-table checklist: sticky header, aria-sort, 44 px targets, visible focus, designed empty states, plain counts); shadcn primitives (table, checkbox, sheet, dropdown-menu, select, alert-dialog, skeleton) restyled with tokens; magic MCP (no new pick: ADMIN.md §14 keeps TanStack for tables); Playwright (e2e, Event Timing INP, Chrome traces, screenshots in `test-results/admin-audit/r5/`); design-superpowers design review |
| Decision | D227–D231 |
| Migration | none |

### #194 · D0 R4 · Status automation, scheduling, Trash and slug redirects — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201 / owner: "Status is a manual dropdown everywhere … must follow from actions and dates automatically"; Trash with a 30-day restore, slug redirects, Sample auto-clear, the minute job |
| Built | **Shared** `packages/shared/src/workflow/` (no zod, D202): content buttons → status, publish time and live-since (`nextContentStatus`, `contentChip`, `isDue`); lead steps (`nextLeadStatus`, `isOverdueLead`); order steps with restock and proof decisions (`nextOrderStatus`, `proofMatches`, `nextProofStatus`); derived group fare, coupon, window, stock, staff and visa stages. Action input schemas in `schemas/workflow.ts`; `scheduled` joins the publish statuses with `publishAt` / `liveSince`; coupons get `maxUses`. **API**: content writes take the editor's button and write the status themselves (a plain save and a History restore keep it, D216); first staff save clears Sample (`sampleCleared`, Undo with `keepSample`); Delete moves to `TrashItem` (list, restore, delete forever for the Super Admin, D217); live link changes leave `SlugRedirect`s (chains flattened, the snapshot carries them, D218); the minute job in the API process (scheduled publishing, window refreshes, Trash purge after 30 days, one overdue alert per lead, D215, D226); lead actions with the timeline, visa checklist / submission / outcome / passport (`Lead.progress`, D225), group-fare seats on booking (D224); order actions (confirm on call or by proof, pack, ship with courier and tracking, deliver, cancel / return with a reason and restock, D221); proofs matched by reference and amount, Verify confirms the order, Reject emails the reason (D222); coupon use limit at checkout (D223); seed patch for the two new email templates. **Web**: editor buttons Save draft · Schedule… · Publish / Publish now · Update · Unpublish · Cancel schedule · Restore with dated reasons; Sample and Trash Undo toasts; list chips for every list (content, windows, coupons, fares, stock); Trash page and sidebar item; lead Next step card (WhatsApp / Call / Email log the contact, D220), visa panel with a progress ring, board one-press steps, bulk Mark as spam; order Next step card and notes; proofs with Matched, the order they match, Verify and Reject with a reason; staff chips Invited / Active / Locked / Deactivated; public record pages follow redirects |
| Files | `packages/shared/src/{workflow/*,schemas/{workflow,admin,common,content,leads,settings,shop,travel,visa}.ts,content/{registry,publicPaths}.ts}`, `fixtures/src/{index,settings}.ts`, `apps/api/prisma/{schema.prisma,migrations/20261024040000_status_automation}`, `apps/api/src/admin/{content-admin,leads,orders,inbox,scheduler}.service.ts`, `apps/api/src/admin/{workflow,redirects,admin.controllers,admin.module}.ts`, `apps/api/src/{content/content.service,public/intake.service,notifications/notification.service,seed/seedPatches,config/env,docs/openapi}.ts`, `apps/web/src/components/admin/{LeadActions,OrderSteps,ProofDecision,VisaProgressPanel,ProgressRing,TakaInput}.tsx`, `components/admin/editor/{ScheduleDialog,EditorActionBar,EditorSidePanel,ContentEditor,useEditorState}`, `lib/admin/{recordChips,statusChips,contentActions,leadActions,opsActions,types,navigation}.ts`, `lib/admin/blueprints/{display,problems,build,shop}.ts`, `lib/data/{content,movedRecord,tags,types}.ts`, `(panel)/{trash,leads,orders,payments,users,content}/**`, ten public record pages, `e2e/admin-workflow.spec.ts` |
| Tests | shared 131 (workflow rules 35) · web unit 622 (list chips, scheduled and live-since status, workflow problems, blueprints with the coupon use limit) · API 176 (content buttons, restore keeps status, Sample undo, redirects with chains, Trash restore / conflict / Super Admin purge, minute job: scheduled publish, Trash purge, one overdue alert; lead steps, group-fare seats, visa checklist; order steps with restock and cash-on-delivery paid; proof match / verify once / reject; coupon use limit; seed patch) · e2e API-job order on a fresh database 32 + admin-workflow 8 (schedule then publish now, Trash restore, slug redirect, WhatsApp reply → In progress, convert, matched proof → order confirmed, ship with courier, axe at 390 and 1440) |
| Widths checked | 390 · 1440 (editor scheduled, schedule dialog, package list chips, Trash, proofs, orders, leads and lead Next step, users, coupons); no page overflow; axe clean at 390 and 1440 on Trash, lead and proofs |
| Review | design-superpowers review on the 390 and 1440 screenshots (test-results/admin-audit/r4/): one main step per card, every chip with its reason, dialogs say what happens. Found and fixed: the editor side panel ran under the sticky action bar on short screens (Move to Trash out of reach; the panel now scrolls on its own); list rows showed raw ids (removed). Known limit: a moved record redirects inside the stream (308 marker and refresh) because record pages have a static shell |
| Tools and skills | Serena (memories, symbol overviews, replace_symbol_body for the services); Context7 (next-intl createNavigation permanentRedirect with href and locale); ui-ux-pro-max (pre-delivery checklist: one primary action per card, reasons on every chip, 44 px targets, dialogs that say what happens); shadcn primitives (dialog, alert-dialog, radio-group, checkbox, calendar, select, tooltip) restyled with tokens; magic MCP (no new pick: the R1/R3 picks cover chips, dialogs and empty states; the kanban board pick waits for R6); design-superpowers design review on the 390 and 1440 screenshots; Playwright MCP screens |
| Decision | D215–D226 |
| Migration | `20261024040000_status_automation` (two new tables, four nullable columns): run `sh backup.sh` before `sh deploy.sh` |

### #193 · D0 R3 · Media: upload everywhere, crop and focal point, library v2 — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201 / owner: "image upload" everywhere; photo fields were address boxes (D200), galleries long lists of address cards, videos four address fields; the library was a list of cards with "copy the address" |
| Built | **API** (08a4721): usage index over content documents and settings, list filters (words, photos / videos, not used yet), usage per file, crop into a new WebP asset, Replace everywhere through the normal save path (version, History, audit), delete guard (409 in use), MP4 / WebM up to 50 MB with byte sniffing and a size read, byte ranges (206 / 416), photo credit columns (migration). **Web**: photo frames per field (D208); MediaField (drop, paste a file or address, upload, library; frame line and size, too-small warning, Replace, Crop, Focal point, description from the item's or record's name, credit folded, web address fallback with its size measured); GalleryField (tiles in the frame's shape, Cover, dnd-kit grid with Move earlier / later and Make cover, many files at once two at a time, library multi-pick, side sheet per photo, Remove with Undo); VideoField (MP4 and WebM each uploaded, chosen or linked, phone versions folded, poster from the clip at one second, Video credit); media library v2 (Library · Site images, multi-upload, search, filters, grid / list, details sheet with Where it shows, Replace everywhere, delete only when unused); SmartImage focal point on public pages (D209); `/uploads` proxy passes video byte ranges; nginx 51 MB on the video upload route only (D211) |
| Files | `packages/shared/src/{helpers,schemas}/media.ts`, `apps/api/src/media/*`, `apps/api/src/admin/media-replace.service.ts`, `apps/web/src/components/admin/media/*`, `components/admin/schema/{MediaField,GalleryField,VideoField,Lazy*Field}.tsx`, `lib/admin/blueprints/*` (frames), `lib/admin/photoFrame.ts`, `app/[locale]/secure-admin-control/(panel)/media/**`, `(panel)/api/media/**`, `app/uploads/[...path]/route.ts`, `components/media/SmartImage.tsx` + 26 public images, `deploy/nginx/*.template`, `e2e/admin-media.spec.ts` |
| Tests | shared 96 (media rules, address id) · web unit 617 (blueprints for all 50 keys incl. "every photo has a frame, every video is a video field"; photo frames and alt suggestion; upload queue; linked media addresses; the /uploads route with byte ranges; admin JSON-route matcher) · API 163 (media library v2: uses, unused, usage, delete guard, Replace everywhere with the new file's words and credit and no old focal point, video format kept, crop, MP4 ranges and 416; swapMedia unit tests) · e2e in the CI API job order, fresh and used database, 30/30: admin-editor 8, admin-media 7 (library upload, words and delete; an 11 MB photo and a 12 MB video through the proxy-free upload routes; pick from the library, Where it shows, delete guard and Replace everywhere; upload in a field, crop to 4:5 and a focal point by keyboard that survives a reload; gallery multi-upload and Make cover; axe at 390 and 1440), admin-screens 2, admin-shell 4, api-mode 9 (the library upload test moved to v2) · smoke (fixture mode, styleguide build) 132 passed, 63 API-only skipped, budget included |
| First-load JS (admin, gzip) | Editors without photos 307–308 KB (FAQ, contact settings; R2 303–304) · team member with a photo 322 · tour package with photo, gallery and video 340 (the media widgets are their own chunks, D202) · media library 256 · dashboard 244 (unchanged); public routes: SmartImage and SmartVideo gain the focal point only |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 (library grid, details sheet, site images, package photos / gallery / video, team photo, picker, crop, focal point); no page overflow; axe clean at 390 and 1440 |
| Review | design-superpowers L2 (visual, UX, a11y) on the library grid and list, details sheet, site images, package photos, gallery and video, team photo, picker, crop and focal point at 1440, 1024, 768, 390 and 320. Working: every photo says where it shows and how big it must be; one drop language for photos, galleries, videos and the library; where a file shows before it can go. Fixed in review: no space between the drop zone and the toolbar, a "Not used" badge repeated on every tile, video file names cut by their buttons, gallery tiles 113 px wide (container queries), a 575 px tall preview (capped at 20 rem), the focal dialog pushing its buttons off screen, filter chips hidden at 320 px, a Replace section on unused files, the section name read twice on an empty photo field, editors without photos carrying 18 KB of media code (the widgets are their own chunks). Independent subagent review, every finding checked in the code: P1 uploads over 10 MB were cut by the Next proxy (uploads moved out of it; an 11 MB photo and a 12 MB video in e2e), P1 Replace everywhere kept the old credit, focal point and description and let a WebM replace an MP4 (fixed in the API, unit tests); P2 ended sessions redirected uploads and JSON reads (now 401 and the session dialog), web addresses the public image optimiser refuses (site paths, Unsplash and Pexels only, remotePatterns), video posters ignored their focal point; P3 wording, two posters at once, Try again on a failed replace, unreadable files, the gallery limit, settings named by key, chatty live regions, 40 px view links, focus after choosing, removing and deleting. The e2e run found the replace confirmation closing at once (shared dialog state) and a too-loose URL check in the test itself |
| Tools and skills | Serena (memories, symbols, edits); Context7 (react-dropzone 20 accept / onDrop, @origin-space/image-cropper Root / CropArea props, next/dynamic); ui-ux-pro-max (progress for every upload, no autoplay video, optimised thumbnails; media-library page notes); magic MCP (quota checks; `uvain/file-upload` refused as a paid marketplace item, D207); shadcn primitives (dialog, sheet, alert-dialog, slider, switch, toggle-group, progress, table, dropdown-menu); Playwright MCP (screenshots in `test-results/admin-audit/r3/`, console, overflow); independent subagent review |
| Decision | D207–D212 |
| Migration | `20261020050000_media_credit` (two nullable columns on `MediaAsset`): run `sh backup.sh` before `sh deploy.sh` |

### #213 · Security · Next.js 16.4.2, sanitize-html and fastify patches — ✅ Done
| Field | Value |
| --- | --- |
| Found | 23 Oct: a local `next build` stopped with "Your version of Next.js is affected by a known security vulnerability"; `pnpm audit` showed two critical advisories for `next@16.4.0` (unauthenticated remote code execution in the Image Optimization API with SVG files, GHSA-2464-fhr4-w9xw, and in `use cache` functions returning typed arrays, GHSA-673q-mjm6-r5xr) and a high one (Server Actions denial of service, GHSA-p3m5-59mp-jv5r), all fixed in 16.4.1; plus `sanitize-html` (moderate) and `fastify` (low). The live site runs 16.4.0 |
| Built | `next` and `eslint-config-next` 16.4.2 (the 16.4.1 security fixes plus Turbopack stability fixes), `sanitize-html` 2.18.1, `fastify` 5.12.7 and a pnpm override for the 5.12.5 copy `@nestjs/platform-fastify` 12.1.2 pins. No code change |
| Tests | `pnpm audit` critical 0 (left: Prisma CLI's MySQL driver and config helper, unused with PostgreSQL and run only at migrate and seed time; the shadcn CLI's glob and socks helpers, a dev tool) · lint, typecheck · shared 91, fixtures 83, web unit 555, API 155 · fixture build with the styleguide · smoke e2e (fixture mode) 132 passed, 56 API-only skipped, budget included |
| Decision | D213 |
| Migration | none; deploy with `sh deploy.sh` once the Docker images workflow is green |

### #210 · CI · CodeQL on main: developer download scripts — ✅ Done
| Field | Value |
| --- | --- |
| Found | After #209 the push to `main` ran a full analysis (pull request runs report only changed lines) and failed on `js/http-to-file-access` in `scripts/fetch-airline-logos.mjs:147` and `docs/design/photos/get-waafa-photos.mjs:237`, two developer download tools that save fetched images under fixed names. It also spent minutes retrying a database upload a private repository refuses |
| Built | `.github/codeql/codeql-config.yml` with `paths-ignore` for those two files and the reason; `codeql.yml` uses it, skips the database upload while private, and its path filter includes `.github/codeql/**` |
| Tests | CodeQL on the push to `main` after the merge (the full analysis) |
| Decision | D206 |

### #192 · D0 R2 · Form engine v2 — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201: editors were raw data forms (ids, slugs, a JSON tab, popularity, created at, a row of "+ field" chips); staff must never type an id, slug, URL, JSON or a date the system knows |
| Built | Typed blueprints for all 50 CONTENT_MODEL keys, grouped by area (D193): sections, widget per field, automatic fields (ids, keys, dates, day numbers, reading time, category level, list order), references, visibility, public address and publish needs; words in messages (`Admin.blueprints`, `fieldNames`, `fieldHelp`, `choices`) resolved on the server (D194). `ContentEditor` on the SchemaEditor widgets: section list with ticks (Jump to below 1024 px), side panel (status chip with its reason, Visibility, Publishing with Before you publish, Google snippet, edited when and by whom, History, Duplicate, Delete; folded above the form below 1280 px), sticky action bar (Discard, Save draft, Publish / Update, Ctrl or Cmd+S), History in sentences with Restore this version and Restore the version before this change, drafts kept on the device, the leave guard (links, Ctrl K, closing the tab), the edit-conflict dialog, plain errors with links to fields and Retry, the session-ended dialog. Widgets: text with counters, number, money, slug, date, date-time, time of day, weekdays, months, switch, choice, choices, tags, lines, repeater (dnd-kit after hydration, Move, Duplicate, Remove with Undo), reference picker (search, thumbnails, Sample / Draft badges, many, group keys like a package's destination), icon, colour, phone, SEO panel, map, variant, read-only, interim photo (D200). API: history that follows slug changes (D198), audited restore (either side of a change), duplicate as a hidden draft (D199), picker options; list order owned by the list (#205, D195). Lead page: labelled facts instead of the raw JSON toggle |
| Tests | shared 91 · web unit 555 (blueprints for all 50 keys: coverage, plain words, one name per section; engine: paths, slugs, automatic fields, validation, history sentences, problems, status, layout; lead facts; pasted lines; FieldShell) · API 155 (history across renames, restore of either side, duplicate of every list, product copies with their own variants, options access, inner ids, list order, orders beside a draft copy) · e2e in the CI API job order 23/23: api-mode 8 (rich-text policy edit updated for the folded sections and Update), admin-shell 4, admin-screens 2, admin-editor 9 (edit with Ctrl S, History restore and undo of the first change; draft after Leave, an ignored offer and a reload; edit conflict between two tabs; new FAQ with the category picker and Duplicate; airline picker fills the name and restores; lead facts; axe at 390 and 1440); admin-path 2 · e2e in the CI smoke job (fixture mode, STYLEGUIDE build) 132 passed, 56 API-only skipped; budget 6/6 with public routes unchanged (home 217, flights 258, packages 189, visa 187, shop 215, contact 299 KB; one run at 2 local workers counted idle-loaded overlay chunks on /visa and passed alone) |
| First-load JS (admin, gzip) | Editors 303–304 KB (package, FAQ, contact settings; the old schema editor was 250; zod and the month calendar kept out took it from 364, D202) · Dashboard 244 · Leads 252 · Settings 244 · Orders 245; public routes unchanged (no public code in this PR) |
| Review | design-superpowers L2 on the package, contact settings and FAQ editors at 1440 and 390. Working: plain words and pickers everywhere; the three questions answered by the section ticks, side panel and bar; one widget language; safety in view. Fixed in review: half-width titles and questions, radio cards cut in a half column, a doubled "Office hours" title, raw dates in card titles, "by seed", "Before you publish" on live records, months typed as codes, a destination picker that pointed at the wrong list, editor state reset after every save, a section's name repeated on its one field (25 editors; now said once, with a unit test) and on a field beside others (FAQ "Question" → "Question and answer", "Which menu", "Price options" and 6 more), the rail heading at 4.4:1 (axe at 1440), no status chip on lists and settings without drafts (now Live: "Changes show on the site as soon as you save"), "Not saved yet" twice on new records, a new-record lead that promised a publish step to lists without one, sentences cut in lines on phones (now growing rows; a pasted list becomes rows), a Remove button squeezed to 22 px beside long picked titles, Enter during Bangla input composition adding rows and tags, controls under 44 px on phones (38 px buttons, chips, drag handles, remove buttons, breadcrumbs, switches: invisible hit areas, probed by tapping 21 px around each control at 390 px), zod (31 KB) and the calendar in the editor's first load (D202). Left for R3: photo address boxes, long photo lists, four video address fields |
| Tools and skills | Serena (symbols, memories, edits); Context7 (dnd-kit classic vs `@dnd-kit/react`, react-day-picker 10, next-intl `t.has` and rich text); ui-ux-pro-max (form UX: labels, validate on blur, aria-live errors, submit feedback, confirm destructive; shadcn stack: RHF only for fixed forms, D187); magic MCP (21st.dev, at least three options per need: sortable 23550, 38206, 544, 12556, 29175; date 31520, 28800, 483, 2808; combobox 34820, 26118, 11405, 6072; icon 2313, 1785, 23525; colour 23374, 28302, 31443; unsaved bar 9576, 573, 1631; retrieval quota 0, so built on primitives, D197); shadcn primitives (popover, command, calendar, radio-group, select, alert-dialog, collapsible, tabs, dropdown-menu, input-group); Playwright MCP (1440 and 390 screenshots in `test-results/admin-audit/r2/`); design-superpowers design-review |
| Code review | Independent subagent review of the whole diff (CLAUDE.md step 7), every finding checked in the code before fixing. P1: a copied product kept the original's variant ids, so the draft copy shadowed the live product and orders were refused (copies now get their own variant ids and SKUs; pricing and stock read published products only); top store categories saved as level 0 against the 1–3 rule (now 1, children parent + 1, unknown parent keeps the stored level); two changes in one event overwrote each other (airline picker lost the code, Undo duplicated a removed card; the editor now builds on its newest value); Leave and an ignored draft banner deleted the draft (drafts now go only on save, Discard, Drop, Delete or editing back). P2: any staff member could read every list's picker choices, coupon codes included (open lists only, D203); typing during a save was thrown away; slug-keyed lists could repeat an inner id (the API refuses it, new records check both). P3: error links couldn't reach folded cards or lines; Duplicate offered on fixed lists (D204); flush buttons shared touch areas. Regression tests for each (shared 91, web 555, API 155, e2e admin-editor 8) |
| Decision | D193–D204 |
| Migration | none |

### #208 · CI · CodeQL runs on the private repository — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 20 Oct: "why is CI skipped? It is very important: run all of it, check everything, so nothing fails" (CodeQL showed "skipping" since #206, and an R2 run had been cancelled to save minutes) |
| Built | `.github/workflows/codeql.yml`: the skip is gone; the analysis writes SARIF instead of uploading while the repository is private; a Findings step (`scripts/codeql-findings.mjs`) annotates each finding on its file and line, lists them in the job summary and fails on any error or warning (notes are shown, not blocking); the SARIF is kept 7 days as an artifact. The workflow file itself is in the path filter |
| Tests | Script checked on sample SARIF (no findings → pass; an error → fail with `::error file=…,line=…`); the first real run on the pull request caught js/incomplete-sanitization in the new script itself (table cells escaped pipes, not backslashes); fixed in the same PR, and the next run was green with every other check |
| Decision | D205 (replaces D192). No more cancelled runs: every push's CI finishes and is fixed to green |

### #191 · D0 R1 · Admin shell, design system and sign-in — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Epic #201: staff can't tell where things are or what needs them; one shell for every screen |
| Built | Sidebar from the new IA (Home, Inbox, Travel, Waafas World, Website; Settings in the footer) on the shadcn Sidebar: groups fold (remembered per device), folds to icons on desktop (Ctrl+B, cookie), a sheet below 1024 px; count badges from `GET /admin/inbox` (new and overdue leads, visa, orders to confirm, proofs, feedback, low stock, group fares ending, Sample left), rendered with the page and polled every 30 s while the tab is visible. Top bar: Ctrl K, + New (records the role can edit), notification bell (popover / bottom sheet, All and New for you, Mark all as seen), View site, account. Ctrl K: actions, every page with its one-line help, and records from `GET /admin/search` (leads by reference, name or phone; orders; customers by phone; content records the role can edit). Breadcrumbs and the page header pattern (title, status chip, one line, primary action) on every page. StatusChip (icon + word + colour + "why", D185) on leads, orders and customers. Settings index (one door, plain sections). Empty, loading and error states; offline banner. Sign-in: brand panel, plain wrong-password and paused messages, Show password, Keep me signed in with what it means. Role rules moved to `packages/shared` (helpers/access.ts) so the admin shows exactly what the API allows |
| Tests | shared 87 · web unit 325 · API 145 · e2e admin-shell 4/4, admin-screens 2/2 (axe at 390 and 1440, five widths), budget 6/6 |
| Code review | PR #203 owner review (D159): Ctrl K customers by phone read every lead and order whatever the role (P1), so a visa officer could see a store customer's name; now the same sources as the customer profile (leads of the person's modules, orders for order roles). Proofs to verify counted for shop managers, who can't verify (P3); Sample count cast could fail the inbox (P3). Fixed with regression tests (both fail on the old code) |
| First-load JS (admin, gzip) | Dashboard 242 · Leads 251 · Settings 242 · Package editor 250 · Orders 243 KB (the Ctrl K palette and the bell's list and phone sheet load on first use: −20 KB on every admin page); public budgets unchanged (Home 217, Flights 258, Packages 189, Visa 187, Shop 215, Contact 299) |
| Tools and skills | shadcn MCP (sidebar via registry view, collapsible, hover-card, context-menu; CLI declined to overwrite our primitives), magic MCP (21st.dev 10479 patrick-xin/vercel-notification-popover and 1435 serafimcloud/empty-state retrieved and rebuilt on our primitives; free tier 2 a day), ui-color-palette tokens from R0 (D185), ui-ux-pro-max pre-delivery checklist, design-superpowers design-review on the 390/1440 shots, Context7 (next-intl nested providers), Playwright MCP, Serena |
| Decision | D188–D191 |

### #190 · D0 R0 · Admin audit and redesign plan (ADMIN.md) — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 19 Oct: the admin is confusing and looks bad; redesign it first (statuses set automatically, image upload everywhere, readable tables, section-wise control of the website, understandable at a glance), then the rest of Phase D. Epic #201 with R0–R10 = #190–#200 on Project #4 (all fields) |
| Found | 54 screens × 1440 and 390 px captured on a production build against a fresh local database (Sample content + 15 Sample leads, 5 orders, 4 proofs, 3 feedback), local only in `test-results/admin-audit/before/`. Every problem mapped to the principles in ADMIN.md §15: schema editors with ID, Slug, Brand ID, Src/Width/Height, Related slugs, Popularity, a JSON tab and "+ field" chips (package editor 12,600 px tall); free status dropdowns on leads and orders; lead facts as "Search › Legs › 1 › To" with a Raw JSON toggle; lists without thumbnails, status or pagination; 40-item flat sidebar; US-format date inputs; "Paid to acc-bkash" on proofs; raw audit events; "1 records" |
| Built | `docs/design/ADMIN.md` (principles, tool decisions, IA and routes, tokens and status families, page patterns, field widget catalogue, blueprints, status machines, safety nets, DataTable, media, motion, words, component set with sources, before → after by issue); `docs/design/design-system/waafa-admin/` (MASTER.md + dashboard, list-table, editor-form, media-library, inbox, reconciled); DESIGN.md deviation row, HANDOFF admin row and the old `waafa/pages/admin.md` point to it |
| Tools and skills | **ui-ux-pro-max**: design system persisted as WAAFA Admin + 5 pages; kept Minimalism & Swiss, high-density data views, 12-column grid, one or two animated elements per view; UX rules (labels, validate on blur, submit feedback, error next steps, bulk bar, tables to cards, breadcrumbs); shadcn rules (Sidebar in a provider, DataTable, Command groups, Sheet sides, sonner); rejected its App Store pattern, sky/orange palette and Fira fonts (PRD §16). **design-superpowers** creative (read from the synced plugin files; not listed in this VS Code session): L2, Refresh Strategist depth Evolution with keep/evolve/retire, Layout Strategist 12 columns, 8 px base, compact tables, list-detail. **ui-color-palette** MCP `get_palette` (TAILWIND, OKLCH v3, sources locked) → sky-700, success-700, warning-800, danger-700; pairs ≥ 6.2:1 (D185). **shadcn MCP**: registry check, TanStack Table v9 data-table example; to add sidebar, collapsible, resizable, chart, hover-card, context-menu. **magic MCP (21st.dev)** + **21st-ui** workflow: 12 needs × 6 results, picks D186. **design-taste-frontend** (dials 3/3/6, anti-template list) and **frontend-design**. Playwright MCP (capture script), GitHub (epic, issues, sub-issues, Project fields), Serena |
| Decision | D183–D187 |

### #185 · Images: lighter photos and share previews, backup check — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 14 Oct: images are too heavy; make them smaller and keep them safe on the server with working backups |
| Found | Visitors already got AVIF/WebP at the right width (Home 345 KB of images at 412 px over 46 photos); link previews used the full JPEG (up to 813 KB, over WhatsApp's 300 KB); shipped JPEGs at q87 |
| Built | `qualities: [65, 90]` (photos 65 through `SmartImage`/`SmartVideo`, logo 90), `deviceSizes` up to 2560 (1440 added, 3840 gone), `minimumCacheTTL` 31 days; `shareImageSrc`/`sharePreview` send every og:image through the optimiser at 1200 px (a JPEG for crawlers); shipped photos re-encoded mozjpeg q80 at the same size (7.5 MB → 4.9 MB). Uploads already become WebP ≤ 2560 px without metadata; `backup.sh` already keeps the database and every uploaded photo (14 days) |
| Before → after (image KB, 412 px / 1440 px) | Home 345 → 259 / 345 → 255 · Tour packages 311 → 226 / 134 → 97 · Flights 173 → 132 / 133 → 101 · Shop 147 → 117 / 133 → 103 · Package page 132 → 99 / 117 → 84 · Gallery 176 → 131 / 147 → 106 · Blog 212 → 158 / 162 → 120 |
| Tested | Vitest: shareImageSrc, sharePreview (5); Playwright seo.spec: og:image is the 1200 px optimiser URL and returns a JPEG under 300 KB; screenshots 390 and 1440 |
| Decision | D182 |

### #184 · SEO: titles and structured data for brand and travel searches, llms.txt — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 14 Oct: Waafa, Waafa Tours and Travel, Waafa International, travel, visa, flight and tour searches should find the site; professional SEO that needs no more work |
| Built | Search-intent titles and descriptions: Air Tickets from Dhaka, Hotel Booking in Bangladesh and Worldwide, Tour Packages from Bangladesh, Visa Processing in Dhaka, {country} Visa from Bangladesh (meta title only, the h1 stays), About Waafa Tours and Travel and Waafa International, Contact Waafa: Travel Agency in Motijheel, FAQs, Travel Blog. Home default SEO "Waafa Tours and Travel: Travel Agency in Dhaka, Bangladesh" with every service and both brands; seed patch `2026-10-14-home-seo` updates the live text only while it is the launch wording. Home JSON-LD: Organization email, address and a ContactPoint per office number; TravelAgency `knowsAbout` and `hasOfferCatalog` (air tickets, hotels, tour packages, visa processing with their pages), `sameAs`. `/llms.txt` from admin data (brands, services, visa countries, guides, packages, routes, contact; no prices) |
| Not code | Google Business Profile, Search Console requests, Bing, links from Facebook and directories, reviews: owner steps in the close-out. hreflang left out while the site has one language (Bangla P1 adds it) |
| Tested | API: updateHomeSeo unit (2) and patch database test (API 143); Playwright seo.spec: Home title, offer catalogue and contact points, llms.txt; titles ≤ 60 and descriptions ≤ 155 on every public page |
| Decision | D181 |

### #183 · SEO: every published page is indexable (Sample no longer noindex) — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 14 Oct (Search Console): https://waafasworld.com/about-us "Excluded by 'noindex' tag"; full SEO with no manual steps later |
| Why | #168 made Sample records noindex; every seeded live record is Sample, so About Us, the policies and every visa, route, package, product and post page were hidden from Google |
| Built | `isIndexable` = not SEO › noindex (Sample ignored); robots meta and sitemap follow it on every record page. Admin Sample note reworded |
| Tested | Vitest: indexing (4), sitemap (6: Sample listed, noindex left out, categories and brands, photos); Playwright seo.spec: record pages `index, follow` and in the sitemap |
| Decision | D180 (replaces D172) |

### #181 · Contact: second office number and more numbers from Admin — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 14 Oct: contact numbers +880 1823 232241 and +880 1823 232242, more addable from the admin panel |
| Built | `ContactSettings.extraPhones [{ display, e164 }]` (up to 6, Admin › Settings › Contact). `contactPhones()` in `packages/shared` (main number first, repeats dropped). Footer, Help panel (one Call row each) and the Contact page Call card (each number its own tel: link) list every number; Home, About, Contact and store JSON-LD carry them all as `telephone`. Seed patch `2026-10-14-second-phone` adds 01823-232242 to the live contact when it still has only 01823-232241 |
| Tested | Vitest: contactPhones (shared), addSecondPhone (API unit), seed patch database test (API 140 passed); Playwright: both numbers on Contact and in the footer with axe (full e2e 120 passed); screenshots 390 and 1440, no overflow |
| Tools and skills | Playwright, GitHub MCP |
| Decision | D179 |

### #179 · Visa: price shown as a range per visa type, never a fixed price — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct: visa prices should read as a range (like "৳7,500 – ৳9,500"), not one fixed price |
| Built | `VisaType.priceRange { min, max? }` (Admin › Visa › Countries › each type › Price range). `visaPrice`, `lowestVisaPrice`, `visaPriceFor` in `packages/shared`; `formatVisaPrice` in web. With a max: "৳7,500 – ৳9,500"; without: "From ৳7,500"; no range yet: "From" embassy fee + service charge. Visa cards ("Price from"), country fee card and phone bar, apply summary (per applicant and group), visa guide, `AggregateOffer` low/high price. Note: a visa expert confirms the exact amount before payment |
| Tested | Vitest: visaPrice (shared), formatVisaPrice (web); Playwright: range on the Thailand page and in JSON-LD; visa, seo, home, search e2e 30 passed; screenshots 390 and 1440, no overflow |
| Tools and skills | Serena, Playwright, GitHub MCP |
| Decision | D178 |

### #178 · Waafas World: prices hidden by default, Ask for price on WhatsApp, per-product Show price — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct: no prices in Waafas World, products only; the admin chooses which products show a price |
| Built | `Product.showPrice` (default off: every live product hides its price after the deploy; Admin › Waafas World › Products › Show price). Hidden: card and product page "Price on request", Ask for price on WhatsApp (product named) and Call, no cart, Buy now, %-off chip, deal row or Offer JSON-LD; `publicProduct` blanks variant prices on the server; price bands skip it and price sorts put it last; shared `priceCart` never sells it (web quote and API orders). Recently viewed keeps no price for it. Sample fixtures: CF280A toner, T-shirt, power bank and headphones show prices; CRG 070H and HP 151A toners do not |
| Tested | Vitest: priceCart drops hidden products, publicProduct blanks prices, repository bands and sorts (shared 78, web 316); Playwright: hidden product page (no price in HTML, WhatsApp link, no cart, axe) and mixed cards; store, orders, home, budget, seo specs 33/33 |
| Decision | D177 |

### #176 · Visa moves to /visa, and the live menu reads "Visa" — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct: the live nav still showed "Visa Services" after #172; label "Visa" and URL /visa |
| Why | #172 changed the default menu data only; live menus are admin data in PostgreSQL and the seed never overwrites them |
| Built | Route `/visa-services` → `/visa` (list, country, apply) with 308 redirects from every old path (also `/en/…`). `apps/api/src/seed/seedPatches.ts`: one-time patches run by the start-up seed and recorded in `_seedPatches` (+ an audit log entry); patch `2026-10-13-visa-route` moves every stored `/visa-services…` link to `/visa…` and renames the header and drawer item to "Visa" (footer keeps its label). Canonicals, sitemap, structured data, CI smoke paths and docs follow |
| Tested | API: patch unit tests (5) and a database test (moves links, renames once, skipped on the next deploy); API suite 136 passed. Web unit 313, e2e 114 + redirect test |
| Decision | D176 |

### #173 · SEO on-page: one H1, titles ≤ 60, descriptions ≤ 155, alt text, internal links, brand names — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct (part 3 of 3): exactly one H1, unique title (≤ 60) and description (≤ 155), image alt text, internal links on every public page; searches for Waafa, Waafa International, Waafa Tours and Travel should find the site |
| Audit | 48 routes at 390 px: one H1 everywhere; titles over 60 on Hotels, Visa services, Waafas World, Printing Solutions and long visa guides; descriptions over 155 on Packages, Visa services and long records; no duplicates; logo mark alt empty; 1–4 body links on Hotels, Plan my trip, Feedback, EMI, Offline payment, Contact, Group fares, Baggage, visa countries, visa guides, gallery albums |
| Built | `lib/seo/metaText.ts` (`clampText`, `fitTitle`) used by `withSocial` on every public page: the "| Waafa" suffix only when the title fits, titles and descriptions cut at a word within 60 / 155 whatever an admin record holds. Shorter UI copy (Hotels, Visa, Waafas World titles; Packages, Visa descriptions; Printing Solutions sample title). Home h1 includes the brand eyebrow (no visual change). Home structured data: WebSite, Organization and TravelAgency carry the other brand names (WAAFA, Waafa International, Waafa Tours and Travel, Waafas World). Logo mark alt "WAAFA". `ExploreMore` + `LinkPill`: "Explore more" links from Admin records (visa countries, packages, routes, guides, articles) on eleven pages with few links |
| Tested | Vitest metaText (9); Playwright seo.spec: one h1, title ≤ 60 and unique, description ≤ 155, no img without alt on 27 routes; Home h1 and structured data name the brand; Explore more on four pages without a self-link; full e2e 114 passed; screenshots at 320 / 390 / 1440 (no overflow, no console errors) |
| Tools and skills | Serena, Playwright (audit script, screenshots), GitHub MCP |
| Decision | D175 |

### #172 · Header menu: "Visa Services" becomes "Visa" — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct: in the nav bar, "Visa Services" should read "Visa" |
| Built | Default menu data: header and phone drawer item label "Visa" (route stays /visa-services); footer column keeps "Visa Services". Menus are admin data and the seed never overwrites them, so the live site changes in Admin › Content › Menus › header (owner told) |
| Tested | Fixture repository test and the desktop header e2e expect "Visa" |

### #170 · Performance: Lighthouse mobile on Home, Flights, Packages, Visa, Shop — ✅ Done (Packages, Visa 90 in CI; Home, Flights, Shop below 85: follow-up)
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct: performance is an SEO factor; Lighthouse mobile Home 64, Flights 67 → 85+ on Home, Flights, Packages, Visa, Shop; focus LCP, first-load JS, CLS stays 0; before/after here. P1, part 2 of 3 |
| Found | Home: the hero **video's first frame became the LCP** after hydration (5+ s in CI), not the poster. Flights: the lead card's text streamed late behind about 370 KB of scripts; the hidden search card (behind Edit), the second step and zod + libphonenumber all loaded up front. Shop: zod + libphonenumber + the corporate quote form loaded up front; the banner image was preloaded but fetched at Low priority |
| Built | `SmartVideo`: a hero loop (`preloadPoster`) starts on the first scroll, touch, pointer move or key, so the poster stays the LCP. `DeferredSearchCard` (+ `loadSearchCard`, `DeferredSearchCardClient`): Flights and Hotels load the search card island only when Edit opens. `lazyResolver`: lead forms load zod, the schema and libphonenumber on the first check; Flights' TripStep and Hotels' StayStep load when step 2 is reached (`flightTrip.ts`, `hotelStay.ts` keep the defaults zod-free; `buildLead` may be async). `BulkQuoteForm` loads when the corporate quote dialog opens. `LeadCardHeader` shared by the card and the Flights loading preview, so the largest text is in the first HTML. `SmartImage`: a preloaded image is fetched at high priority. Budget ceilings lowered: flights 355 → 275 KB, shop 335 → 230 KB |
| Tried and dropped | `experimental.inlineCss` (FCP 1.5 → 2.0 s: the stylesheet is larger than the request it saves); `content-visibility: auto` on Home sections and the footer (TBT −80 ms, but axe flags off-screen links as 0 px touch targets; tests stay strict) |
| Tested | Vitest `lazyResolver` (3) + leads suites; full e2e except the five-width screens 111 passed (budget, flights, hotels, store, home, search, layout, seo); Playwright at 320/390/768/1024/1440 on /flights (Edit opens the prefilled card, contact errors show, no overflow, no console errors); Home loop mounts after the first interaction |
| Tools and skills | Serena, Lighthouse 12.8 (local, median of 3 after a warm-up run), CPU profiles via Playwright CDP, GitHub MCP |
| Decision | D173, D174 |
| PR | #171 (squash) |

Lighthouse mobile (simulated slow 4G, 4× CPU). Performance · LCP · TBT; CLS 0 everywhere, A11y / Best practices / SEO 100.

| Route | CI before (main, 13 Oct) | Local before (median of 3) | Local after (median of 3) | CI after (#171, 1 run) |
| --- | --- | --- | --- | --- |
| / | 59 · 5.3 s | 80 · 4.0 s · 310 ms | **86** · 4.0 s · 120 ms | 57 |
| /flights | 69 · 5.5 s | 69 · 4.9 s · 510 ms | **80** · 4.0 s · 310 ms | 74 |
| /tour-packages | 77 | 89 · 3.6 s · 90 ms | **90** · 3.6 s · 60 ms | 90 |
| /visa-services | 92 · 3.3 s | 89 · 3.4 s · 160 ms | **91** · 3.4 s · 100 ms | 90 |
| /shop | 84 · 4.1 s | 83 · 4.5 s · 130 ms | **88** · 3.8 s · 100 ms | 84 |
| /hotels | — | — | 82 · 3.9 s · 280 ms | — |

First-load JS (gzip, budget e2e): flights 338 → 259 KB, shop 315 → 215 KB, home 217 KB, packages 189 KB, visa 187 KB.

CI runners score Home lower than a laptop (1 run, slower CPU: Home's 1,900 nodes take longer to parse and hydrate); the live site is measured with PageSpeed Insights after deploy. Home and Flights below 85 in CI stay open as a follow-up (Next steps).

### #168 · SEO: Sample records are noindex,follow and stay out of the sitemap — ✅ Done
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct (site live): any package, visa guide, blog post, flight route, product or offer still marked Sample gets noindex,follow and stays out of sitemap.xml; Sample off → indexed again; tests. P0, first of three SEO parts |
| Built | `lib/seo/indexing.ts`: `isIndexable` (not Sample, not SEO › noindex) and `recordRobots` (noindex, follow). Every record page's `generateMetadata` uses it: packages, flight routes, visa countries and guides, blog posts, products, categories, brands, collections, gallery albums, About, policies, Printing and Trading pages. `sitemap.ts` keeps only indexable records; a category or brand needs an indexable product. Offers (Home offer banners, group fares, deals) have no page of their own; their list pages stay indexed. Admin record note says the page is hidden from search until Sample is off |
| Tested | Vitest: indexing (7), sitemap with Sample on/off, noindex, photos (6); Playwright seo.spec: Sample record pages send `noindex, follow`, list pages `index, follow`, sitemap leaves Sample records out; routes, packages and 404 specs green |
| Tools and skills | Serena (memories, overview), GitHub MCP (issue, commits through the API: the cloud session's git identity is not the owner's) |
| Decision | D172 |

### #164 · Image-only server bundle (no code on the server) — ✅ Done (with #166)
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct: no code on the server, only Docker Hub images; GitHub will be private; env ready to copy; deploy setup with nginx in chat; save it locally |
| Built | `deploy/server/`: compose.yml (images only), deploy.sh (pull, start, refresh, Let's Encrypt, rollback by IMAGE_TAG), setup-server.sh (moved from deploy/bootstrap-server.sh), backup.sh, revalidate.mjs (moved); `.env` beside them and `waafa-server.tgz` on the PC only (gitignored); guards keep both compose files in step |
| Tested | The bundle's deploy.sh ran the local Docker stack end to end |
| Decision | D171 |

### #163 · Remove the group fare card from the hero media — ✅ Done (with #165)
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct (screenshot): remove the US-Bangla DAC → KUL card from over the video |
| Built | HeroFareCard, its data reads and messages removed; chip flags, ribbon line and glows kept; D169 updated |

### #158 · Production env check and the VPS go-live runbook — ✅ Done (with #160)
| Field | Value |
| --- | --- |
| Asked | Owner, 13 Oct: env ready for production, everything needed to deploy on the VPS with nginx, commands in chat, push to GitHub |
| Built | `deploy/bootstrap-server.sh` (updates, Asia/Dhaka, 4 GB swap, ufw 22/80/443, Docker + log rotation, frees 80/443, /opt/waafa); DEPLOY.md quick start = DNS → ssh → bootstrap → clone → scp env → check → deploy → backups; web cap 768 MB → 1 GB (measured ~750 MB); check.sh checks the Google pair |
| Env | deploy/.env.production validated on the PC (all required values, LF); stays out of git |
| Decision | D170 |

### #157 · More attractive Home hero — ✅ Done (with #161)
| Field | Value |
| --- | --- |
| Built | Next group fare card on the media from 1024 px (airline logo, route with flags, date, seats, indicative price, Sample badge) anchored over the route's departure dot; flags in the rotating chip (destination → airport, else airport city); ribbon line under the headline; masked static radial glows |
| Checked | 320, 390, 1024, 1440, 1920 (dot under the card at every height) |
| Decision | D169 |

### #156 · Airline logos that appear on their own, with an admin override — ✅ Done (with #159)
| Field | Value |
| --- | --- |
| Built | `scripts/fetch-airline-logos.mjs` → 89 square marks in /media/airlines (placeholder detected by hash; 2A and KB dropped after a visual check); `logo` optional on Airline; AirlineLogo (Admin logo → bundled mark → code) in the strip, fare cards, route pages, airline filter |
| Tests | airlineLogoSrc.test.ts |
| Decision | D168 |

### #154 · Bug: search e2e date locator matched an outside day — ✅ Done (with #153)
| Field | Value |
| --- | --- |
| Found | 13 Oct 00:07 Dhaka, CI on #153 right after midnight (today+75 = 27 Dec, also an outside day of January) |
| Fix | `td[data-day=…]:not([data-outside]) button` in pickDay and the two direct locators |

### #148 · Larger hero media, cleaner flight-path motion — ✅ Done (with #153)
| Field | Value |
| --- | --- |
| Asked | Owner, 12 Oct 22:00 with screenshots: the flight-path line crossed the lead and the Open now chip; make the hero video bigger and more beautiful |
| Branch · PR | `feat/148-hero-polish` · #153 |
| Built | Media panel 4:3 / 16:10 / `clamp(480px, 58vh, 620px)` from 1024 px with soft top and bottom shade; FlightPath redrawn inside the panel sky (dashed route, departure dot, plane flying at the tip with SVG animateMotion, resting at the top right); reduced motion shows the end state |
| Checked | 320 (no horizontal scroll), 390, 1024 (reduced motion), 1440 (mid-flight and resting) |
| Tools · skills | Serena, Playwright MCP, ui-ux-pro-max (search-first hero); magic (21st.dev) timed out, so the motion follows MOTION.md §8 |
| Decision | D167 |

### #147 · Real country flags wherever a country appears — ✅ Done (with #152)
| Field | Value |
| --- | --- |
| Asked | Owner, 12 Oct: download every country flag and show it everywhere |
| Branch · PR | `feat/147-country-flags` · #152 |
| Built | flag-icons 7.2.3 (MIT): 256 ISO flags plus EU, SVGO-optimised, in `/media/flags`; `CountryFlag` (cva sizes xs–lg, empty alt beside the name, two-letter fallback) on visa cards and the country page, visa, destination and airport pickers, destination tiles (flag from the destination airport) and both ends of group fare cards; CountryCode removed |
| Tests | `countryFlagSrc.test.ts` (case, UK/EL aliases, EU, unknown and path input) |
| Tools · skills | Serena, Playwright MCP |
| Decision | D164 |

### #149 · Production email through Resend and Google sign-in keys — ✅ Done (with #151)
| Field | Value |
| --- | --- |
| Asked | Owner, 12 Oct: fix Resend mail, set the Google OAuth client, production ready for a 2 vCPU / 4 GB server |
| Branch · PR | `chore/149-mail-google-prod` · #151 |
| Built | Resend domain waafasworld.com verified (checked through the API); RESEND_API_KEY, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the gitignored deploy/.env.production and the local deploy/.env only; API reads the Google pair from the environment while Admin has no Google record (admin record wins, admin-off stays off); Resend refusals log their reason; DEPLOY.md 5b (redirect URIs, Publish app) |
| Tests | `customers.unit.test.ts` (4 states); a live test email went out through Resend |
| Sizing | compose limits already fit 4 GB (about 2.8 GB of limits) with the 4 GB swap file from DEPLOY.md |
| Decision | D165, D166 |

### #146 · Visible Log in button, store byline and category copy — ✅ Done (with #150)
| Field | Value |
| --- | --- |
| Asked | Owner, 12 Oct: Log in button missing; "Mice" → "Mouse"; "Waafa International’s online store" → "Waafas World by Waafa International" |
| Branch · PR | `fix/146-login-store-copy` · #150 |
| Built | Header Log in: navy pill with words from 1280 px, icon from 1024 px; header tagline from 1440 px so the grid holds; Accounts live on by default for new installs; mega menu byline "by {company}"; store bar tagline "by Waafa International"; SEO lines; "Mouse, keyboards, cables" |
| Tests | account.spec (default on: Log in with words, /login opens soon, /account → /login); API-mode header grid adds 1439 px and the logo gap |
| Tools · skills | Serena, Playwright MCP |
| Decision | D165 |

### #138 · Bug: header overflow at 1024 px with accounts on; delete account ended on the error page — ✅ Done (with #139)
| Field | Value |
| --- | --- |
| Found | 12 Oct 19:00, local end-to-end check of Google sign-in on the Docker stack (Docker Hub images), Accounts live on: horizontal scroll 39 px at 1024 px on every page; Delete account → "Something went wrong" (React #412) although the account was deleted |
| Branch · PR | `fix/138-account-header-and-delete` · #139 (review: null origin refused) |
| Fix | Header Log in icon-only from 1024 px, words from 1280 px; Log out and Delete are plain form posts to `/api/account/sign-out` and `/api/account/delete` (same-origin check, 303 to a relative path, cookie cleared) instead of server actions; every sign-in redirect is relative except Google's redirect URI |
| Tests | unit (seeOther, isSameOrigin) · fixture e2e (cross-site post 403, relative 303s, confirmation, no session) · API-mode e2e (no horizontal scroll at 1024, 1280, 1440 on / and /login with accounts on) · local rerun of the whole flow |

### #134 · Customer sign-in with Google (FR-ACC part), off until the owner adds the keys — ✅ Done (with #135)
| Field | Value |
| --- | --- |
| Opened → closed | 12 Oct 16:00 → 12 Oct 18:30 |
| Branch · PR | `feat/134-google-sign-in` · #135 |
| Review | Code review on #135 from the owner’s account: 1 finding (whitespace or backslash in the return path could become a protocol-relative redirect) fixed with tests; API-mode e2e timing fixed (wait for the settings to reach the site) |
| Built | Shared: provider kind `auth`, catalog `google` (client ID, sealed client secret), customer schemas (PKCE verifier, sign-in input, session, account view). API: `Customer` + `CustomerSession` (migration 20261012120000), `googleOAuth.ts` (code exchange at Google with the client secret; ID token claims: issuer, audience, expiry, verified email), `CustomersService` (redirect must be the site's callback, upsert by Google ID then email, 30-day opaque sessions stored as SHA-256, account by verified email, sign-out, delete without touching requests or orders), `public/auth/google/config`, `public/auth/google`, `public/account`, `account/sign-out`, `account/delete` with rate limits; Google health check (client ID shape and Google discovery). Web: Integrations › Sign-in tab with the redirect URI to paste into Google; `/api/auth/google/start` (state + PKCE S256 in a 10-minute httpOnly cookie scoped to the callback) and `/callback` (timing-safe state check, session cookie httpOnly, Lax, Secure); `/login` (Google button or a guest note, errors), `/account` (initials, requests, orders, log out, delete with confirmation); Log in on the phone menu; robots disallow /account; everything 404s while Settings › Accounts live is off |
| Tests | shared 77 · API 126 (unit: claims, exchange; DB: off until connected, redirect check, refused or unverified, sign-in, account by email, sign-out, delete) · web unit 273 (PKCE, authorize URL, safe next, pending cookie) · e2e fixture (hidden while off, start and callback refuse) · API-mode e2e (admin connects Google, Accounts live, button, redirect with PKCE, /account asks to log in) |
| Not in this issue | Phone OTP (needs the SMS gateway) and email + password stay in FR-ACC (#31); the Google profile photo is not loaded (initials) |
| Decisions | D163 |

### #130 · Deploy: prebuilt images on Docker Hub, server pulls instead of building — ✅ Done (with #131)
| Field | Value |
| --- | --- |
| Opened → closed | 12 Oct 14:00 → 12 Oct |
| Branch · PR | `chore/130-docker-hub-images` · #131 |
| Built | Workflow **Docker images** (`.github/workflows/docker.yml`): on every push to main builds api, web (prerendered from a throwaway API in the runner, SITE_URL https://waafasworld.com) and nginx with `deploy.sh --build`, checks routes, gzip, canonical domain and image labels through nginx, scans env/labels/history for the build secrets, then pushes `emon6107/waafa-ota-platform:{api,web,nginx}-<sha>` and `-latest`; PRs that touch the recipe build and check without pushing. compose names images by `IMAGE_REPO`/`IMAGE_TAG`; `deploy.sh` pulls by default (`docker pull`, so a failed pull stops), refuses a web image built for another SITE_URL or Turnstile key, refreshes web caches with a signed call (`deploy/revalidate.mjs`), `--build` keeps the old path; check.sh memory rule 3.5 GB in pull mode and an x86_64 check; DEPLOY.md server size, Docker Hub flow, GitHub variables, rollback by tag. Production settings for waafasworld.com created locally in `deploy/.env.production` (gitignored) |
| Tests | Docker images workflow on the PR (build, smoke, secret scan) · CI VPS deploy smoke (build mode) · local: sh -n, node --check, compose config; local run from the pushed images |
| Review | Code review on #131 from the owner's account: 1 finding (compose pull only warns for buildable services) fixed |
| Decisions | D161, D162 |

### #125 · SEO: structured data for the store home, About, Gallery, Visa Guide index and visa services — ✅ Done (with #129)
| Field | Value |
| --- | --- |
| Opened → closed | 12 Oct 08:00 → 12 Oct |
| Branch · PR | `feat/125-structured-data` · #129 |
| Built | Stable `@id`s for website, company, agency and store (`lib/seo/schemaIds.ts`, Home uses them); `CollectionPageJsonLd` (CollectionPage or ImageGallery with its ItemList as main entity); /shop OnlineStore + best sellers ItemList (same query as the row); /about-us AboutPage + Organization with both brands, address, socials; /gallery ImageGallery of every album; /visa-guide CollectionPage of the guides; /visa-services/[country] Service with the agency as provider, Bangladesh as area and one indicative Offer per visa type (fee card total, BDT, VAT included; pending embassy fee says so). Admin data only; no ratings or reviews |
| Tests | unit CollectionPageJsonLd (order, absolute URLs, no empty list) · e2e seo.spec structured data on the five routes, no aggregateRating/review |
| Admin rows | No new fields: names, descriptions, photos, prices and contact details come from the existing Store, Page, Gallery, Visa Guide, Visa and Settings screens |
| Review | Code review posted on the PR from the owner's account before merge |
| Tools and skills | Serena (symbol reads and edits), ui-ux-pro-max SEO rules, Playwright e2e |

### #126 · Server optimisation for the 2-core VPS — ✅ Done (with #127)
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 19:30 → 12 Oct |
| Branch · PR | `perf/126-server-optimisation` · #127 |
| Built | gzip in nginx (text types; Next compression off in the standalone image only); nginx proxy cache for `/_next/static` (30 days), `/_next/image` (7 days, one entry per AVIF/WebP/original) and `/media/` (1 day); PostgreSQL `random_page_cost=1.1`, `effective_io_concurrency=200`; review fixes: deploy.sh clears the cache after `up -d` (image URLs have no content hash), cache key zone 8 MB in the 96 MB nginx container |
| Tests | CI VPS deploy smoke (Docker Compose, nginx -t, routes through nginx), Lint/build/e2e smoke, API-mode e2e |
| Review | Code review on #127 from the owner's account: 2 findings (stale optimised photos after a deploy; key zone size), both fixed in the PR |

### #119 · Bug: first lead after an API restart failed on the 5 s transaction timeout — ✅ Fixed (with #120)
| Field | Value |
| --- | --- |
| Found | 12 Oct 01:00 in the local production rehearsal: the first contact lead after an API restart took 14 s and returned 500 (Prisma interactive transaction expired while the query compiler and connections warmed up); reports page logged a Date.now() prerender error |
| Branch · PR | `fix/119-cold-start-transactions` · #120 |
| Fix | 15 s transaction timeout (maxWait 5 s) in the API and worker, warm-up queries at start-up; reports page calls connection() before reading the clock; integrations e2e safe to rerun |
| Tests | unit regression (options, warm-up order); local stack rerun |

### Local production rehearsal 2 (final main) — ✅ Done
| Field | Value |
| --- | --- |
| When | 12 Oct 00:00–01:15 |
| Results | deploy.sh from main twice (after #110 and after #117); all public routes 200, /admin 404, `/uploads/*` served by nginx from the API (WebP, immutable cache) and optimised by next/image; API-mode e2e 8/8 against nginx (lead, staff flow, FAQ edit, newsletter, integrations on with markup and reveal, media upload, rich text policy edit); admin walk-through of Integrations, Media library, Reports, Customers, Lead board and the rich text editor at 390 and 1440: axe clean, no horizontal scroll, no console errors; CSV download; nightly backup now archives the photos (archive contents listed; the photo restore command was not run); found and fixed #119 |

### #116 · Rich text editor (part of #71) — ✅ Done (with #117)
| Field | Value |
| --- | --- |
| Opened → closed | 12 Oct 00:10 → 12 Oct |
| Branch · PR | `feat/116-rich-text-editor` · #117 |
| Built | tiptap editor (admin-only, loaded when a rich text field is on screen) for every `RichTextSchema` field (About, Blog, Visa Guide and policy bodies): paragraph, heading (h3, as the site renders), bold, italic, lists, quote, safe links (https, mailto, tel, site paths), undo/redo, labelled toolbar; `format: html` on the shared schema; server sanitising unchanged |
| Tests | unit (field detection) · e2e edit a refund policy line in API mode |
| Decisions | D158 |

### #113 · Lead board (part of #71) — ✅ Done (with #114)
| Field | Value |
| --- | --- |
| Opened → closed | 12 Oct 00:20 → 12 Oct |
| Branch · PR · merge | `feat/113-lead-board` · #114 · `d270fa0` |
| Built | Admin › Leads › Board: open leads in five stage columns (New, Pending, In progress, Quoted, Booked) by service, cards with reference, customer, service, summary, age, owner and overdue mark; labelled arrow buttons move a card one stage (Booked opens the lead for the amount); focusable sideways scroll |
| Tests | admin screens job (five widths, axe) |
| Tools and skills | Serena (symbols, memories), gh |

### #111 · Reports with CSV and customers (part of #71) — ✅ Done (with #112)
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 23:55 → 12 Oct |
| Branch · PR · merge | `feat/111-reports-customers` · #112 · `c42c28c` |
| Built | Admin › Reports: date range in Dhaka days, leads, booked rate, median first reply, orders sold, revenue, average order, sign-ups, per-day CSS bars with a screen-reader table, breakdowns, best sellers, feedback; CSV for leads, orders, feedback and sign-ups (BOM, formula-safe). Admin › Customers: one row per phone across leads and orders with search and a profile; role scoped |
| Tests | unit 5 (median, Dhaka days, best sellers, CSV, merge) · API 5 (CI PostgreSQL) · admin screens |
| Admin control | read-only views |
| Decisions | D157 |

### #109 · Media library (part of #71) — ✅ Done (with #110)
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 23:20 → 12 Oct 00:50 |
| Branch · PR · merge | `feat/109-media-library` · #110 · `2fe00a7` |
| Built | Admin › Media library: upload JPEG, PNG, WebP or AVIF up to 12 MB with required alt text, copy the `/uploads/...` address, rename, delete (audited); API re-encodes with sharp (auto-rotate, max 2560 px, WebP, no EXIF or GPS); `mediadata` volume; nginx serves `/uploads/` from the API (immutable cache) and allows 13 MB on the upload route only; the web route covers development and next/image; nightly photo archive in `backup.sh` |
| Tests | unit 4 · API 4 (CI PostgreSQL) · e2e upload in API mode · admin screens |
| Admin control | AC-115 |
| Decisions | D156 |

### #107 · Integrations manager — ✅ Done (with #108)
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 22:20 → 12 Oct |
| Branch · PR · merge | `feat/107-integrations-manager` · #108 · `0571db8` |
| Built | Owner request: `IntegrationSetting` per provider (Active, Sandbox / Live credentials, markup none / percentage / fixed for flights and hotels); SMS (SSL Wireless, BulkSMSBD, Twilio) and email (Resend, SMTP) in the catalog; custom providers per category with generic fields (base URL, client ID, auth header, extra headers, key, secret); audited secret reveal (no-store); `getIntegrationConfig` and `resolveCategory` with the manual fallback for flights and hotels; public `GET /public/integrations/status` without names or keys; email goes through the active Resend or SMTP provider, else the environment mailer. Admin tabs: Flight APIs, Hotel APIs, Payment gateways, SMS and email |
| Tests | shared 20 (catalog, custom keys, settings, markup) · API unit 36 · API 15 (CI PostgreSQL) · e2e connect, turn on with markup, reveal, add custom SMS |
| Admin control | AC-110 updated, AC-114 |
| Decisions | D155 |

### #91 · Performance: first-load JS and hydration — ✅ Done (with #106)
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct (after #39) → 12 Oct 00:40 |
| Branch · PR · merge | `fix/91-first-load-perf` · #106 · `fbd4af8` |
| Built | Motion, toasts, header and tab-bar sheets, the help popover and the desktop mega menu out of the first load (first use, idle or desktop only); native `<details>` accordions; lazy Intl formatters; zod jitless before hydration (no CSP issue); hero layout shift fixed. Tried and dropped: next-intl message precompile (placeholder labels broke), content-visibility on sections (axe false positives), per-section Suspense (no gain, broke section order) |
| Results (CI) | first-load JS / 318 → 215 KB, /tour-packages 189, /visa-services 186, /flights 338, /shop 315, /contact 298; Lighthouse mobile / 45 → 64, visa 91, shop 83, packages 79, flights 67; A11y, BP, SEO 100; CLS 0 |
| Tests | budget ceilings lowered; accordion e2e on details; full CI |
| Decisions | D154 |

### #102 · C4/C5 Security headers with CSP, analytics after consent — ✅ Done (with #103)
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 18:20 → 11 Oct 19:30 |
| Branch · PR · merge | `feat/102-csp-analytics` · #103 |
| Built | CSP and hardening headers on every web route (D151); nginx keeps HSTS only; GTM, GA4 and Meta Pixel from Settings › Tracking load only after consent; Search Console token from Tracking also feeds the verification tag; `docs/SECURITY.md` (OWASP Top 10 map, dependency audit: no exploitable runtime finding, D152); verify job 45 min |
| Tests | unit CSP 4 · e2e security.spec (headers, no CSP violations, no tracker without IDs) |
| Decisions | D151, D152 |

### Launch rehearsal on the owner's PC (Docker Desktop) — ✅ Done
| Field | Value |
| --- | --- |
| When | 11 Oct 18:10–18:30 |
| Built | `deploy/compose.yml` + `deploy/deploy.sh` exactly as on the VPS (domain localhost): API, worker, web, nginx, certbot, PostgreSQL, Redis, plus Mailpit for email |
| Results | all routes 200, /admin 404; API-mode e2e 6/6 against the stack (lead → admin, FAQ edit → site, newsletter, Integrations); staff alert email delivered through the worker; backup + restore into a scratch database identical (319 content documents, 1 staff user); stack memory about 560 MB |
| Decisions | D153 |

### #99 · SEO: flight route landing pages — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 15:50 → 11 Oct 17:15 |
| Branch · PR · merge | `feat/99-flight-routes` · #100 · squash |
| Built | `flightRoutes` collection (Admin › Travel › Flight routes) and `/flights/[route]` pages: photo banner with the route arc, indicative from-fare, prefilled request, flight time, airlines, best time, the route's group fares, tips, visa link, FAQPage, popular routes (ItemList); Popular routes on /flights; sitemap images; absolute image URLs in all structured data |
| Tests | e2e routes.spec.ts (390 and 1440, axe, prefill, not found), seo.spec, public screens |
| Admin control | AC-113 |
| Decisions | D149 |

### #96 · SEO: share previews, admin defaults, richer structured data — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 15:00 → 11 Oct 16:40 |
| Branch · PR · merge | `feat/96-seo` · #97 · `ee62a1d` |
| Built | `withSocial` on all 40 public generateMetadata (own og:title, description, url, image with admin fallback, Twitter large card); layout uses Settings › General default SEO, googleBot large image previews, Search Console and Bing verification fields; Home WebSite + fuller TravelAgency; ItemList on package, visa and blog listings; sitemap images |
| Tests | e2e seo.spec.ts (11 routes) |
| Admin control | AC-112 |
| Decisions | D148 |

### #22 · A22 Frontend QA and polish against the boards and the benchmark — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 09 Oct → 11 Oct 15:30 |
| Branch · PR · merge | `test/22-public-screens` #87 · `feat/22-board-parity` #88 · `test/22-lighthouse` #93 · docs #92 |
| Built | CI checks all 32 public routes at five widths with screenshots; the review against `docs/design/thumbs` fixed the gaps: photo banners on Packages and Visa, chips and instant filters (packages, group fares, store), the Home hero head (eyebrow, live Open now chip, phone), balanced bento, request card headers, the office card, the product photo bug (#89); motion from the HANDOFF effects list: card spotlight and tilt, hover-to-play package clips, WhatsApp shimmer, Ken Burns on banners; Lighthouse CI on five routes |
| Screens matched | Home, Home-m, Packages, Packages-m, Visa, Visa-m, GroupFares, Flights, Hotels, ShopProduct, About, Contact, Gallery, Feedback, Error and the rest of screens.csv's public boards |
| Tests | e2e public screens 32 × 5 widths · e2e flows (packages chip + instant radio, store instant select, product photo size) · Lighthouse mobile: Accessibility, Best practices and SEO 100 on all five routes; Performance 45–87 |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 (CI) |
| Tools and skills | Serena, gh, CI Playwright screenshots, PIL tiling for review, Lighthouse CI; design review against the board thumbnails (Playwright MCP, context7, shadcn and magic MCPs were disconnected this session) |
| Decisions | D146, D147 |
| Bugs and follow-ups | #89 (fixed), #91 (performance to 90 and 200 KB), #71 (bespoke admin editors) |

### #89 · Bug: product page photo collapsed to zero width — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 12:40 → 11 Oct 13:20 |
| Branch · PR · merge | `fix/89-product-photo` · #90 · squash |
| Built | The zoom button around the main product photo had no width, so every product page showed an empty gallery; it is now a full-width block |
| Tests | e2e store.spec.ts: the photo is visible and larger than 200 × 200 px |
| Tools and skills | Serena, CI screenshots review (PIL tiles), gh |

### #85 · Admin panel at /secure-admin-control, /admin is a 404 — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 10:00 → 11 Oct 11:30 |
| Branch · PR · merge | `fix/85-admin-path` · #86 · `d41e678` |
| Built | Owner request: admin routes moved from the guessable /admin to /secure-admin-control (folder, links, redirects, session proxy, API email links through the shared `ADMIN_BASE_PATH`); /admin falls through to the ordinary 404; robots.txt names no admin path |
| Tests | unit path matchers; e2e /admin 404 and robots; API email link; VPS smoke behind nginx |
| Decisions | D143 |

### #82 · B5 Provider adapters and external API connections (FR-GS-06 to 08) — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 08:45 → 11 Oct 10:05 |
| Branch · PR · merge | `feat/82-provider-adapters` · #83 · squash |
| Built | `FlightProvider`, `HotelProvider`, `PaymentProvider` interfaces; Manual providers; contract-tested stubs for Sabre, Amadeus, Travelport, FlyHub, BDFare, another flight API, Hotelbeds, another hotel API, SSLCommerz, bKash, Nagad; registry search (parallel, time limit, schema check, de-duplicate, price sort); `ProviderCredential` table with AES-256-GCM sealed secrets (`PROVIDER_SECRET_KEY`); Admin › Settings › Integrations (Super Admin): connect, sandbox or production, enable, test reachability, remove, all audited without secret values. Live stays locked |
| Tests | shared 8 · API unit 31 · API database suite · API-mode e2e (connect Sabre, secret masked) · admin screens at five widths with axe |
| Admin control | AC-110 |
| Decisions | D142 |

### #74 · C3 Deploy: Docker Compose on the owner's VPS with nginx — ✅ Done (C8: live on https://waafasworld.com, 13 Oct, HTTPS on)
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 04:30 → 13 Oct (owner deployed the Docker Hub images on the VPS) |
| Branch · PR · merge | `feat/74-vps-docker` · #81 · squash |
| Built | `deploy/compose.yml` for one 2 vCPU / 4 GB VPS: PostgreSQL 16, Redis 7, API, worker, Next.js standalone web, nginx (reverse proxy, Let's Encrypt via certbot, POST rate limit, www → apex) and certbot; only nginx is public. `deploy/deploy.sh` starts the API before the web build; `deploy/backup.sh` keeps 14 daily dumps; `deploy/.env.example`; `docs/DEPLOY.md` rewritten |
| Tests | CI "VPS deploy smoke (Docker Compose)" runs the whole stack and checks nine routes through nginx plus the /admin 404 |
| Decisions | D141 |
| Bugs and follow-ups | Needs the owner's SSH access, DNS A records, email sender and ACME email (section 11) |

### #39 · Performance: first-load JS — ✅ Done (target continues in #91)
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct → 11 Oct 13:40 |
| Branch · PR · merge | `perf/39-first-load-js` · #84 · `8dd16a9` |
| Built | zod out of every public first load (footer newsletter: tested email pattern; search card: zod-free `@waafa/shared/constants`, plain recent-search checks); `e2e/budget.spec.ts` measures six routes in CI with per-route ceilings. Home 353 → 318 KB gzip |
| Decisions | D144, D145 |
| Bugs and follow-ups | #91 (200 KB target, picker long tasks), Phase D |

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

### #52 · Signature motion moments — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 10 Oct → 11 Oct 05:50 |
| Branch · PR · merge | `feat/52-motion-moments` · #77 · `db279a8` |
| Built | `FlightPath` (Home hero, desktop: server SVG, CSS draw 1.2 s after 300 ms, SMIL dot on the last fifth), `RouteArc` (flight request summary bar from 640 px: arc draws 900 ms, plane glides 1.6 s and rests), `flyToCart` (ghost flies to the visible `data-cart-target`, header cart or tab bar disc, 600 ms; badge pops), `Magnetic` (Search, Send, Place order lean up to 6 px on fine pointers). Boarding-pass success and the visa checklist ring were already in place |
| Tests | e2e home, flights, store, orders, smoke, services 32 passed |
| Decisions | D140 |
| Bugs and follow-ups | Search → results morph after launch (needs React View Transitions) |

### #69 · C2 Turnstile on every public form — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 01:45 → 11 Oct 02:00 |
| Branch · PR · merge | feat/69-turnstile · #70 · 73e4b62 |
| Built | useTurnstile + TurnstileWidget: script loads on a form’s first focus, managed widget only when Cloudflare asks, token reset after each submit; leads, contact, feedback, payment proofs, checkout and newsletter send it; /api/newsletter verifies. Off until NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are set |
| Tests | e2e content, orders, layout, flights, visa 37 passed (keys off) |

### #18 · A18 Admin: shell, sign-in, dashboard, leads, search activity (launch admin) — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 01:00 → 11 Oct 01:40 |
| Branch · PR · merge | `feat/18-admin-shell` · #68 · `277a46c` |
| Built | `/admin` (noindex, X-Robots-Tag): sign-in with wrong-password and locked states (API lockout), BFF session in httpOnly cookies (access 15 min, rotating refresh, "Keep me signed in"), refreshed in `proxy.ts` a minute before expiry; navy sidebar from the AdminSide board filtered by role, phone sheet, Ctrl K palette (pages and references), account menu; dashboard (KPIs, leads by module and status, top routes, activity); leads (views All, Open, My leads, Unassigned, Overdue; module and status filters; search; table from 768 px and cards on phones with call and WhatsApp; age red past the admin SLA; bulk assign and status; CSV export), lead detail (status, assignee, priority with Booked amount and Cancelled/Lost reason, first response, duplicate links, readable request plus raw JSON, customer card with call, WhatsApp with the reference and email, source, timeline with notes, calls, emails and WhatsApp); orders list and detail (workflow, courier and tracking to ship, payment verified, history, proofs); feedback moderation (approve only with consent); payment proofs (verify marks the order paid); search activity; newsletter; audit log; email log; users and roles (Super Admin); my password; and the generic content editor for every CONTENT_MODEL key (D138): list with search, move up and down, delete; record and settings forms drawn from JSON Schema (groups, repeaters, kinds, enums, switches, Dhaka date-times, image previews, JSON fallback), JSON tab, optimistic versions, API field errors in place, Sample notice |
| Files and components | `apps/web/src/proxy.ts`, `lib/admin/{adminApi,tokens,sessionActions,leadActions,opsActions,contentActions,navigation,format,flatten,schema,editorStrings,contentGroups,types}.ts`, `components/admin/*` (AdminShell, AdminNav, AdminTopBar, AdminCommand, AdminBrand, AdminPageHeader, AdminPanel, AdminEmpty, AdminPagination, ListFilters, StatusTabs, KpiCard, BarList, LeadStatusBadge, JsonDetails, ActionButton, schema/*), `components/ui/table.tsx`, `app/[locale]/admin/**`, `e2e/api-mode.spec.ts`, CI job "API mode e2e" |
| Screens matched | AdminLogin, AdminLogin-error, AdminLogin-locked, AdminLogin-m, AdminSide, AdminTop, AdminNav-m, AdminCmd, AdminDash, AdminDash-m, AdminLeads, AdminLeads-bulk, AdminLeads-m, AdminLead, AdminLead-lost, AdminLead-m, AdminSearch; plus AdminOrders, AdminOrders-open, AdminFeedback, AdminUsers and every content board through the generic editor |
| Admin control | Every Section 4 row has its editor: `/admin/content/:key` (generic) or a dedicated screen |
| Tests | web unit +29 (session tokens, navigation by role, formatting, request flattening, editor schema helpers incl. a valid empty record for every content collection); API-mode e2e (public intake, staff sign-in, lead workflow, FAQ edit reaching the public site, newsletter) in CI |
| Widths checked | CI only so far (local database stopped; Playwright MCP disconnected) |
| Tools and skills | Serena; Next.js 16 bundled docs (proxy, cacheLife, revalidateTag) |
| Decisions | D137 – D139 |
| Bugs and follow-ups | #66 concurrent refresh sign-out (fixed, PR #67). Cut to after launch: bespoke editors (package day builder, product card preview, category tree drag, rich text with tiptap, media uploads to R2), customers, reports, bookings and convert to booking, lead board (P1), recharts |

### #64 · C1 Web on the API: snapshot source, intake forwarding, revalidation — ✅ Done
| Field | Value |
| --- | --- |
| Opened → closed | 11 Oct 00:40 → 11 Oct 01:12 |
| Branch · PR · merge | `feat/64-web-api-source` · #65 · `18feba6` |
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
| Bugs and follow-ups | #78 Pre-launch review (independent subagent): the seed re-added deleted Sample records on every API start (P0); a Redis outage hung submissions after the write; login limits bypassable through X-Forwarded-For and parallel guesses; double restock on a double cancel; rejecting a verified proof left the order paid; staff email links to missing pages; a stale snapshot could be cached after a save; record list hid new records; priceCart ready with a dropped line; admin lists crashed on odd page numbers; every order expired every cache | P0–P2 | API, web | Fixed in #78 with regression tests |
| #72 Booking modes could be switched to Live from the generic editor (unlock and Live in one save) | P0 | API settings | Fixed in #72: the API refuses unlocking Live or turning a module Live until Phase E; regression test |
| #66 Two refreshes at the same moment (a page and its prefetches near token expiry) were taken for a stolen refresh token and signed staff out | P0 | API auth | Fixed in #66: a token rotated in the last 30 seconds still opens a session; regression test |
| #60 VAT invoice BIN regex (fixed here), #61 checkout stuck after a refusal (fixed here). The local PostgreSQL was stopped by the system for low memory on 11 Oct; API database tests ran in CI |

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

Since 11 Oct the CI step "Public screens at five widths" (#87) opens all 32 public routes at 320, 390, 768, 1024 and 1440 px (no horizontal scroll, no console errors) and uploads screenshots for the board review; the Lighthouse job (#93) measures five routes on every change.

| Route | Screens | Issue | 320 | 390 | 768 | 1024 | 1440 | Tests | Lighthouse mobile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Home, Home-t, Home-m, Home-help, Home-mfull, Home-mfull2, Home-lower, Home-m-drawer, Home-m-more, Home-shopmenu, Home-moremenu | #7 (#6, #8) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 45 / 100 / 100 / 100 · LCP 5.9 s (CI, 11 Oct) |
| `/flights` | Flights, Flights-2, Flights-done, Flights-err, Flights-edit, FlightsFare, Flights-m-*, Pick-* | #9 (#8) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 78 / 100 / 100 / 100 · LCP 4.4 s (CI, 11 Oct) |
| `/flights` Live placeholder | FlightsLive (placeholder only; full Live bodies in Phase E) | #17 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| `/flights/group-fares` | GroupFares, GroupFares-empty, GroupFares-m, GroupFares-m-empty | #9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `/hotels` | Hotels, Hotels-2, Hotels-done, Hotels-m-* | #10 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `/tour-packages` | Packages, Packages-empty, Packages-m, Packages-m-filters | #11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 71 / 100 / 100 / 100 · LCP 5.6 s (CI, 11 Oct) |
| `/tour-packages/[slug]` | PackageDetail, -photos, -query, -done, PackageDetail-m-* | #11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 68 / 100 / 96 / 100 |
| `/plan-my-trip` | PlanTrip, PlanTrip-4, PlanTrip-done, PlanTrip-m-* | #11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 68 / 100 / 96 / 100 |
| `/visa-services` | Visa, Visa-none, Visa-m | #12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 87 / 100 / 100 / 100 · LCP 3.9 s (CI, 11 Oct) |
| `/visa-services/[country]` (+ `/apply`) | VisaCountry, -medical, VisaApply, -2, -3, -4, -err, -done, -m-* | #12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 76 / 99 / 96 / 100 · apply 70 / 100 / 96 / 69 (noindex) |
| `/visa-guide`, `/visa-guide/[country]` | VisaGuide, VisaGuidePost (+ -m) | #12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 85 and 82 / 100 / 96 / 100 |
| `/shop` | Shop, Shop-m, Shop-mega, Shop-suggest, Shop-bulk | #13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 77 / 100 / 100 / 100 · LCP 4.6 s (CI, 11 Oct) |
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

C2 audit (11 Oct): every snapshot row goes through one pipeline (admin save → content document + audit → signed revalidation → the web's snapshot tag expires → the page re-renders). The pipeline was verified end to end with the API-mode e2e (an FAQ edited in Admin appears on the site) in CI and again on the production Docker stack on the owner's PC (nginx, worker, PostgreSQL, Redis); intake rows (POST) are each covered by an e2e flow (leads, orders, proofs, feedback, newsletter, search logs) and by the staff alert email through the queue.

| # | Public element | Data field (accessor → field) | Admin screen | API endpoint | Verified |
| --- | --- | --- | --- | --- | --- |
| AC-01 | Brand names (header, footer, metadata) | `getSiteSettings()` → travelBrand, storeName, companyName | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-02 | Default SEO title, description, share image | `getSiteSettings()` → defaultSeo | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-03 | Header menu (7 items, order, visibility, Waafas World and More panels) | `getMenu("header")` → items[].label, href, icon, panel, visible | Website › Menus | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-04 | More panel and sheet (icon, title, one line) | `getMenu("more")` → items[].label, description, icon, href | Website › Menus | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-05 | Waafas World mega panel categories | `listCategories()` → level-1 name, description, icon, order | Waafas World › Categories | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-06 | Announcement bar | `getActiveAnnouncement()` → text, link, startsAt, endsAt, enabled | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-07 | Hotline chip, Call and WhatsApp buttons, floating WhatsApp | `getContactSettings()` → phoneDisplay, phoneE164, whatsappE164 | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-08 | Open now / Closed chip | `getContactSettings()` → officeHours, read with `getOfficeStatus()` in Asia/Dhaka on the client | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-09 | Need help? panel, drawer contact block, Contact page, Visit our office | `getContactSettings()` → addressLines, city, country, email, officeHoursText, closedText, mapUrl | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-10 | Footer brand column | `getSiteSettings()` → footerTagline, footerAbout; `getContactSettings()` → socials | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-11 | Footer link columns | `getFooterSettings()` → columns[].title, menu; `getMenu("footer-travel" / "footer-shop" / "footer-help")` | Website › Menus (items); Settings › Footer and menus (column titles) | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot · 24 Oct R7 e2e |
| AC-12 | We accept | `getFooterSettings()` → paymentMethods (live ones only), paymentNote | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-13 | Trust badges (ATAB, TOAB, IATA once held) | `getFooterSettings()` → trustBadges | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-14 | Newsletter band | `getFooterSettings()` → newsletterTitle, newsletterPlaceholder, newsletterButton | Settings › Footer and menus | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-15 | Bottom bar copyright and legal links | `getFooterSettings()` → copyrightHolder; `getMenu("legal")` | Settings › Footer and menus (copyright); Website › Menus (legal links) | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-16 | Developer credit | Rendered from code (FR-FTR-06) | Not editable, by design | — | — |
| AC-17 | Manual or Live body; Send query or Book now | `getPublicConfig()` → modes.{flights, hotels, packages, shopPayment}.mode, liveLocked, lockReason | Settings › Booking modes | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-18 | Online payment at checkout; cash-on-delivery cap | `getPublicConfig()` → onlinePaymentLive, codLimit | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-19 | Maintenance page | `getPublicConfig()` → maintenance.enabled, message | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-20 | Analytics and verification tags | `getTrackingSettings()` → ga4Id, gtmId, metaPixelId, searchConsoleToken | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-21 | Lead forms: consent line, email required, reply promise | `getLeadFormSettings()` → consentText, emailRequired, slaMinutes | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-22 | Home section order, visibility and heading overrides | `listHomeSections()` → key, enabled, order, title, subtitle | Website › Home page | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot · 24 Oct R7 e2e |
| AC-23 | Home trust strip | `listTrustItems()` → icon, title, detail, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-24 | Home offers, store campaigns, results banners | `listBanners(placement)` → kicker, title, body, image, link, code, validityText, startsAt, endsAt, order, enabled | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-25 | Airline strip | `listFeaturedAirlines()` → code, name, featuredOrder | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-26 | Destination finder | `listDestinations()` → name, subtitle, iata, image, flightTime, visaNote, visaEasy, bestSeason, fromPrice, tags, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-27 | Why WAAFA values (Home, About) | `listValues()` → icon, title, body, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-28 | Journey timeline (Home, About) | `listTimeline()` → period, text, order | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-29 | Group fare cards (Home rail, group fares page, results) | `listGroupFares()`, `getGroupFare()` → airline, cabin, baggage, tripType, from, to, stops, departDate, returnDate, seatsLeft, farePerAdult, expiresAt, notes | Sales › Group fares | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-30 | Package cards, list filters and sort | `listPackages()` → title, placesLabel, categories, tags, months, durationDays, durationNights, includesShort, cover, fromPrice, popularity | Travel › Tour packages | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-31 | Package detail | `getPackage()`, `listRelatedPackages()` → summary, gallery, video, groupSize, visaNote, highlights, itinerary, inclusions, exclusions, prices, departures, anyDate, hotels, visa, terms, faqs, relatedSlugs, seo | Travel › Tour packages | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-32 | Airport and hotel-city autocomplete | `searchAirports()`, `listPinnedAirports()`, `searchHotelPlaces()` → iata, city, name, country, pinnedRank; place name, city, popular | Seeded reference data (B6) | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-33 | Visa list and country cards | `listVisaCountries()` → name, flagCode, region, submission, popular, cover, types[].type, processingTime, serviceCharge | Travel › Visa | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-34 | Visa country page | `getVisaCountry()` → types[].processingTime, stay, entry, validity, checklist, embassyFee, embassyFeeNote, serviceCharge, notes; forms; faqs; guideSlug | Travel › Visa | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-35 | Visa Guide list and article | `listVisaGuides()`, `getVisaGuide()` → title, summary, cover, sections, tips, updatedAt, readingMinutes, seo | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-36 | Store home rows | `listStoreRows()` → key, enabled, order | Waafas World › Collections | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-37 | Category grid and listing filters | `listCategories()`, `getCategory()`, `getAttributeSet()` → name, slug, icon, description, banner, parentId, level, attributeSetId, compatibility, order, seo; attributes[].filterable | Waafas World › Categories | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-38 | Product cards and product page | `listProducts()`, `getProduct()` → title, shortTitle, badges, cardSpec, highlights, description, specs, warranty, images, video, options, variants (sku, price, mrp, stock, lowStockAt, preOrder, images), codEligible, bulkFrom, seo | Waafas World › Products | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-39 | Brands row and brand pages | `listBrands()`, `getBrand()` → name, logo, description | Waafas World › Products | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-40 | Collections | `listCollections()`, `getCollection()` → name, description, image, rule, order | Waafas World › Collections | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-41 | Deals with an end date | `listDeals()` → dealPrice, endsAt, product, variant | Waafas World › Products | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-42 | Find by model | `listCompatibleModels()`, `findCompatibleProducts()` → brand, model, partCodes; product.compatibleModelIds | Waafas World › Products (compatibility CSV) | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-43 | Coupons at checkout | `findCoupon()` → code, type, value, minOrder, maxDiscount, startsAt, endsAt, enabled | Waafas World › Coupons | snapshot `coupons` (web quote); `POST /api/v1/public/orders` reprices | ✅ 11 Oct · snapshot |
| AC-44 | Delivery charges, estimates, free delivery, minimum order, office pick-up | `getShippingSettings()` → zones[].name, areas, charge, estimate; freeDeliveryThreshold; minimumOrder; officePickup | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-45 | Offline Payment page, checkout and order emails | `getPaymentSettings()` → offlineAccounts[].kind, title, lines, instructions | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-46 | EMI page | `getEmiSettings()` → minimumAmount, tenuresMonths, cardsNote, appliesTo, interestNote; `listEmiBanks()` → name, tenuresMonths, note | Settings › Payments and delivery | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-47 | Refund, Privacy, Terms and About Us text | `getPage(slug)` → title, summary, highlights, sections, lastUpdated, seo | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-48 | Blog list, post and Home blog strip | `listBlogPosts()`, `getBlogPost()`, `listRelatedBlogPosts()`, `listBlogCategories()` → title, excerpt, intro, sections, cover, category, author, publishedAt, readingMinutes, featured, cta, seo | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-49 | FAQs page and Home FAQ strip | `listFaqs()` → category, question, answer, link, order, onHome | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-50 | Baggage table | `listBaggageRules()` → airlineCode, airlineName, scope, cabinClass, cabinAllowance, checkedAllowance, notes, lastVerified | Content › Pages, blog and FAQs | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-51 | Gallery page, albums and Home strip | `listGalleryAlbums()`, `getGalleryAlbum()` → title, category, cover, items (photo or video, caption), publishedAt | Content › Gallery | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-52 | Testimonials wall and Home reviews | `listPublicFeedback()` → name, service, rating, comment, photo, submittedAt (approved with consent only) | Content › Feedback | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-53 | Facebook reviews link (until approved feedback exists) | `getSiteSettings()` → reviewsUrl | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-54 | Meet our team (Home bento and carousel, About grid) | `listTeam(placement)` → name, initials, designation, department, bio, photo, whatsappE164, email, linkedinUrl, featured, showOnHome, showOnAbout, visible, order | Content › Team | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-55 | Customer emails (lead received, order placed, visa status) | NotificationTemplate → subject, body, variables, channel, enabled | Settings › Notifications | `GET /api/v1/admin/notification-templates` | ✅ 11 Oct · e2e |
| AC-56 | Lead reference on success screens | `createLead()` → reference, createdAt | Sales › Leads | `POST /api/v1/public/leads` | ✅ 11 Oct · e2e |
| AC-57 | Phone drawer main links | `getMenu("drawer")` → items[].label, href, icon, visible | Website › Menus | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-58 | Phone tab bar (five tabs, Waafas World third, More last) | `getMenu("tabbar")` → items[].label, href, icon, panel (the schema enforces the shape) | Website › Menus (labels, links, icons; five tabs always on show) | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-59 | Phone More sheet extras (Gallery, Feedback, Track order) | `getMenu("more-phone")` → items[] | Website › Menus | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-60 | Waafas World panel: store intro and service cards | `getSiteSettings()` → storeIntro; `getMenu("shop-panel")` → items[].label, description, cta, href, icon | Settings › General; Website › Menus (panel cards) | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-61 | Help panel line and Visit row | `getContactSettings()` → helpLine, visitLabel | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-62 | Floating WhatsApp prefilled message | `getContactSettings()` → whatsappMessage (`{page}` placeholder) | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-63 | Header Log in (hidden until accounts ship) | `getSiteSettings()` → accountsLive | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-64 | Page-level photos and videos (home hero, flights, group fares, visa, printing, trading headers and form side images) | `getMediaSlot(key)` → image or video (mp4, webm, phone files, poster, credit) | Content › Media library | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-65 | Search card From default, Popular flight chips | `getSearchSettings()` → defaultOrigin, popularFlights[] | Settings › General › Search | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-66 | Hotel nationality list | `getSearchSettings()` → hotelNationalities[] (names from Intl) | Settings › General › Search | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-67 | Tour tab destinations and Popular chips | `listDestinations()` → slug, name, subtitle, iata, tags (domestic), order | Content › Destinations | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-68 | Visa tab countries, regions, types, Popular chips | `listVisaCountries()` → slug, name, flagCode, region, popular, types[].type | Visa › Countries | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-69 | Preferred airline list | `listAirlines()` → code, name | Flights › Airlines | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-70 | Flight help line (Manual vs Live) and Live hotline | `getPublicConfig()` → modes.flights.mode; `getContactSettings()` → phoneDisplay, whatsappE164 | Settings › Booking modes; Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-71 | Search activity (every submitted search) | `logSearch()` → module, summary, params, device, source | Admin › Search activity (A18) | `POST /api/v1/public/search-logs`, `GET /api/v1/admin/search-logs` (B4) | ✅ 11 Oct · e2e |
| AC-72 | Hero headline, accent line, lead, rotating destinations | `getHomeContent()` → hero.title, titleAccent, lead, rotatingLabel, rotating[] | Website › Home page (Hero sheet); hero photo or video in Site images | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot · 24 Oct R7 e2e |
| AC-73 | Home section order, visibility, kicker, heading, lead | `listHomeSections()` → key, enabled, order, kicker, title, subtitle | Website › Home page (section sheet) | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot · 24 Oct R7 e2e |
| AC-74 | Home offers | `listBanners("home-offers")` → kicker, title, body, image, link, code, validityText, schedule | Content › Home and banners | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-75 | Home trust strip | `listTrustItems()` → icon, title, detail, order | Content › Home | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-76 | Why WAAFA figure and story; values; journey | `getHomeContent()` → why; `listValues()`; `listTimeline()` | Content › Home; Content › About | `GET /api/v1/public/snapshot`, `/values`, `/timeline` | ✅ 11 Oct · snapshot |
| AC-77 | Waafas World band copy and perks; services row | `getHomeContent()` → store; `getMenu("shop-panel")`; `listCategories()`; `listProducts({sort:"popular"})` | Content › Home; Settings › Footer and menus; Waafas World | `GET /api/v1/public/snapshot`, `/menus/shop-panel`, `/shop/*` | ✅ 11 Oct · snapshot |
| AC-78 | Reviews cards (Facebook link, Leave feedback) and testimonials | `getHomeContent()` → reviews; `getSiteSettings()` → reviewsUrl; `listPublicFeedback()` (approved only) | Content › Home; Content › Feedback moderation | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-79 | Closing band and office card | `getHomeContent()` → cta; `getContactSettings()`; `getMediaSlot("office")` | Content › Home; Settings › General; Media library | `GET /api/v1/public/snapshot`, `/settings/contact` | ✅ 11 Oct · snapshot |
| AC-80 | Home JSON-LD (Organization, TravelAgency) | `getSiteSettings()`, `getContactSettings()` → names, address, hours, socials | Settings › General | — (rendered from settings) | ✅ 11 Oct · e2e |
| AC-81 | Flight request form options: email required, consent text, phone countries | `getLeadFormSettings()` → emailRequired, consentText, phoneCountries | Settings › Lead form options | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-82 | Flights booking mode (Manual body vs Live body) | `getPublicConfig()` → modes.flights.mode | Settings › Booking modes | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-83 | Preferences airlines and trip airline list | `listFeaturedAirlines()`, `listAirlines()` | Flights › Airlines | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-84 | Group fares page, rail and fare banner | `listGroupFares({to, month})`, `getGroupFare(id)` → airline, route, dates, baggage, seats, fare, expiry | Flights › Group fares | `GET /api/v1/public/snapshot`, `/group-fares/:id` | ✅ 11 Oct · snapshot |
| AC-85 | Flight leads (reference, contact, trip, preferences, group fare) | `POST /api/leads` → `createLead()` → LeadCreated | Leads (A18) | `POST /api/v1/public/leads` | ✅ 11 Oct · e2e |
| AC-86 | Hotels booking mode | `getPublicConfig()` → modes.hotels.mode | Settings › Booking modes | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-87 | Hotel leads (place, dates, rooms, nationality, budget band, meals, preferences) | `POST /api/leads` → `createLead()` | Leads (A18) | `POST /api/v1/public/leads` | ✅ 11 Oct · e2e |
| AC-88 | Package booking card and bar (from price, prices per sharing, departures with seats, any date) | `getPackage()` → fromPrice, prices, departures, anyDate | Travel › Tour packages | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-89 | Package leads (package, departure, travellers, room sharing, contact preference, notes) | `POST /api/leads` → `createLead()` | Leads (A18) | `POST /api/v1/public/leads` | ✅ 11 Oct · e2e |
| AC-90 | Plan my trip place chips (In Bangladesh, Abroad) | `getSearchSettings()` → planTripPlaces | Settings › Search | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-91 | Plan my trip leads (places, month or dates, nights, travellers, trip for, budget band, hotels, interests, flights, visa) | `POST /api/leads` → `createLead()` | Leads (A18) | `POST /api/v1/public/leads` | ✅ 11 Oct · e2e |
| AC-92 | Visa fee card and phone bar (embassy fee, service charge, total per type) | `getVisaCountry()` → types[].embassyFee, embassyFeeNote, serviceCharge | Travel › Visa | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-93 | Visa office visit days and address on the apply step | `getContactSettings()` → officeHours.days, addressLines | Settings › Contact and hours | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-94 | Visa applications (country, type, travel date, applicants, document metadata, visit, notes) | `POST /api/leads` → `createLead()` (Phase C: files to the private bucket, signed and logged links) | Leads and Visa applications (A18) | `POST /api/v1/public/leads`, `POST /api/v1/visa/files` | ✅ 11 Oct · e2e |
| AC-95 | Store bar (store name, tagline, search suggestions index, finder link when a category has compatibility) | `getSiteSettings()` → storeName; `getShopContent()` → tagline; `listCategories()`, `listBrands()`, `listProducts()` | Settings › General; Content › Store; Waafas World › Products | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-96 | Store row headings | `listStoreRows()` → title, subtitle (fallback to defaults) | Waafas World › Store home | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-97 | Store strips, corporate band, service cards and trust row | `getShopContent()` → bulkStrip, finderStrip, corporate, services[] (title, sub, body, cta, href, mediaSlot), trust[]; `getMediaSlot()` | Content › Store; Media library | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-98 | Product page delivery and COD lines | `getShippingSettings()` → zones (name, charge, estimate); `getPaymentSettings()` → codLimit | Settings › Shipping; Settings › Payments | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-99 | Corporate and bulk quotes | `POST /api/leads` → `createLead()` (QTE reference) | Leads (A18) | `POST /api/v1/public/leads` | ✅ 11 Oct · e2e |
| AC-100 | Cart and checkout delivery charges, free-delivery threshold, minimum order, office pick-up | `getShippingSettings()` → zones, freeDeliveryThreshold, minimumOrder, officePickup | Settings › Shipping | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-101 | Coupons at the cart | `findCoupon(code)` → Coupon | Waafas World › Coupons | snapshot `coupons` (web quote); `POST /api/v1/public/orders` reprices | ✅ 11 Oct · snapshot |
| AC-102 | Payment accounts, cash-on-delivery limit, per-product COD eligibility | `getPaymentSettings()` → offlineAccounts, codLimit; `Product.codEligible` | Settings › Payments; Products | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-103 | Orders and Track order (status, courier, tracking number, payment verified) | `createOrder()`, `findOrder()` → Order | Waafas World › Orders | `POST /api/v1/public/orders`, `POST /api/v1/public/orders/track` | ✅ 11 Oct · e2e |
| AC-104 | Service page copy: hero, facts, services, steps, form heading, questions, SEO | `getServicePage(key)` → ServicePage | Content › Pages › Service pages | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-105 | Service page photos and the trading loop | `getMediaSlot("printing-header" | "printing-quote-side" | "trading-header" | "trading-rfq-side")` | Content › Media library | `GET /api/v1/public/snapshot` | ✅ 11 Oct · e2e |
| AC-106 | Information page cards (About services and routes, baggage facts and rules, EMI and offline payment steps) | `listPageBlocks(page)` → icon, title, body, link, tone, order | Content › Page blocks | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-107 | Feedback form (pending until moderated) | `POST /api/feedback` → `createFeedback()` | Content › Feedback moderation | `POST /api/v1/public/feedback` | ✅ 11 Oct · e2e |
| AC-108 | Offline payment proofs | `POST /api/payment-proof` → `submitPaymentProof()` | Waafas World › Orders; Leads (payments) | `POST /api/v1/public/payment-proofs` | ✅ 11 Oct · e2e |
| AC-109 | Contact page messages (CNT) | `POST /api/leads` (module contact) → `createLead()` | Leads | `POST /api/v1/public/leads` | ✅ 11 Oct · e2e |
| AC-110 | External API connections (flight, hotel, payment providers) | `ProviderCredential` (settings, sealed secrets, health per environment) | Settings › Integrations (Super Admin) | `GET/POST/DELETE /api/v1/admin/providers` | ✅ 11 Oct · e2e |
| AC-111 | Tour packages banner photo | `mediaSlots[packages-header]` | Content › Media library | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-112 | Search Console and Bing site verification | `siteSettings.googleSiteVerification`, `bingSiteVerification` | Settings › General | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-113 | Flight route landing pages (/flights/[route]) and Popular routes on /flights | `flightRoutes` collection | Content › Flight routes | `GET /api/v1/public/snapshot` | ✅ 11 Oct · snapshot |
| AC-114 | External API provider switches and markup (Active, Sandbox / Live, markup; custom providers; SMS and email) | `IntegrationSetting` + `ProviderCredential` | Settings › Integrations (Super Admin) | `GET/POST/DELETE /api/v1/admin/providers*` | ✅ 12 Oct · e2e |
| AC-115 | Every photo and video on the site can come from the media library (uploaded in any photo or video field, or chosen from the library) | `MediaAsset` (alt, credit, credit link) + media volume | Website › Media library (Library tab) and every photo, gallery and video field | `GET/POST /api/v1/admin/media`, `POST /api/v1/admin/media/video`, `GET/PATCH/DELETE /api/v1/admin/media/:id`, `GET /api/v1/admin/media/:id/usage`, `POST /api/v1/admin/media/:id/crop`, `POST /api/v1/admin/media/:id/replace`, `GET /uploads/*` | ✅ 20 Oct · media.test, admin-media e2e |
| AC-133 | The part of each photo kept in view when the site crops it (cards, heroes, phones) | `image.focal` on every ImageSchema photo → SmartImage `object-position` | Focal point in every photo field | `PUT /api/v1/admin/content/:key/:id` | ✅ 20 Oct · admin-media e2e |
| AC-134 | Fixed-place photos and videos (home hero, page headers, office) | `mediaSlots` records | Website › Media library › Site images (card per place → its editor) | `PUT /api/v1/admin/content/mediaSlots/:id` | ✅ 20 Oct · admin screens |
| AC-116 | Log in link (header on desktop, phone menu) and /login, /account pages | `getSiteSettings()` → accountsLive | Settings › Site (Accounts live) | `GET /api/v1/public/snapshot` | ⬜ after the owner turns it on |
| AC-117 | Continue with Google button and the Google redirect | `googleSignInConfig()` → `IntegrationSetting(google)` + `ProviderCredential` (client ID, sealed client secret) | Settings › Integrations › Sign-in | `GET /api/v1/public/auth/google/config`, `POST /api/v1/public/auth/google` | ✅ 12 Oct · API-mode e2e (config, redirect with PKCE) |
| AC-118 | My account: requests and orders | `readAccount()` → `Customer` + leads and orders with the verified email | Leads, Orders (status changes show here) | `GET /api/v1/public/account` | ✅ 12 Oct · API tests |
| AC-119 | Header Log in button | `site.accountsLive` | Content › Site settings › Accounts live | `PUT /api/v1/admin/settings/siteSettings` | ✅ 13 Oct · account.spec |
| AC-120 | Waafas World byline "by Waafa International" (mega menu, store bar) | `site.companyName`, `shopContent.tagline` | Settings › General; Content › Store | `PUT /api/v1/admin/settings/{siteSettings,shopContent}` | ✅ 13 Oct |
| AC-121 | Country flags | `visaCountry.flagCode`; `airport.countryCode` (destinations, group fares, pickers) | Visa › Countries; Travel › Airports | `PUT /api/v1/admin/content/{visaCountries,airports}/:id` | ✅ 13 Oct · countryFlagSrc test |
| AC-122 | Google sign-in keys | Integrations › Sign-in record, server env fallback | Settings › Integrations › Sign-in | `POST /api/v1/admin/providers/google/:environment`, `POST /api/v1/admin/providers/google/setting` | ✅ 13 Oct · customers.unit.test |
| AC-123 | Airline logos (strip, fare cards, route pages, filter) | `airline.logo` (else bundled by `airline.code`) | Travel › Airlines › Logo | `PUT /api/v1/admin/content/airlines/:id` | ✅ 13 Oct · airlineLogoSrc test |
| AC-124 | Search indexing of a record page (robots meta, sitemap entry) | record `seo.noIndex` → `isIndexable` (Sample no longer counts, #183) | The record's editor (SEO › noindex) in Travel, Visa, Content, Waafas World | `PUT /api/v1/admin/content/:key/:id` | ✅ 14 Oct · indexing + sitemap tests, seo e2e |
| AC-125 | Explore more links (visa countries, packages, routes, guides, articles) | `listVisaCountries` (popular first), `listPackages` (popular), `listFlightRoutes`, `listVisaGuides`, `listBlogPosts` | Visa › Countries, Travel › Tour packages and Flight routes, Content › Visa guides and Blog | `GET /api/v1/public/snapshot` | ✅ 13 Oct · seo e2e |
| AC-126 | Store price shown or Price on request + Ask for price | `product.showPrice` | Waafas World › Products › Show price | `PUT /api/v1/admin/content/products/:id` | ✅ 13 Oct · store e2e |
| AC-127 | Visa price range per type ("৳a – ৳b" or "From ৳a") | `visaCountry.types[].priceRange.{min,max}` | Visa › Countries › type › Price range | `PUT /api/v1/admin/content/visaCountries/:id` | ✅ 13 Oct · seo e2e |
| AC-128 | Office phone numbers (footer, Help panel, Contact, JSON-LD) | `contactSettings.phoneDisplay/phoneE164` + `contactSettings.extraPhones[]` | Settings › Contact › Extra phones | `PUT /api/v1/admin/content/contactSettings` | ✅ 14 Oct · content e2e |
| AC-129 | Home search title and description | `siteSettings.defaultSeo.{title,description}` | Settings › General › SEO | `PUT /api/v1/admin/content/siteSettings` | ✅ 14 Oct · seo e2e |
| AC-130 | llms.txt (brands, services, visa countries, guides, packages, routes, contact) | site and contact settings + visa, guide, package and route records (SEO › noindex leaves one out) | Settings › General and Contact; each record's editor | `GET /llms.txt` (web) | ✅ 14 Oct · seo e2e |
| AC-131 | Order of FAQs, team, home sections, trust items, values, timeline, destinations, banners, page blocks, store categories, collections, store rows and flight routes | each record's `order` (owned by the list, D195) | the list's Move up / Move down (drag in R5 and R7) | `PUT /api/v1/admin/content/:key/order` | ✅ 19 Oct · contentOrder.test (#205) |
| AC-132 | Every content and settings field | the key's `CONTENT_MODEL` record | its blueprint editor (form engine v2: sections, pickers, History, Duplicate) | `GET/PUT /api/v1/admin/content/:key/:id`, `…/history`, `…/restore`, `…/duplicate`, `…/options` | ✅ 19 Oct · contentHistory.test, admin-editor e2e |
| AC-135 | Whether a package, product, visa country or guide, blog post or flight route is on the site, and from when | record `status` + `publishAt` / `liveSince`, written by the API from the editor's buttons | the record's editor: Save draft · Schedule… · Publish · Update · Unpublish · Archive · Restore | `PUT /api/v1/admin/content/:key/:id` with `action` | ✅ 23 Oct · workflow.test, admin-workflow e2e |
| AC-136 | Old record addresses after a link change | `SlugRedirect` (in the snapshot as `slugRedirects`) | the record's editor (Edit link) | `PUT /api/v1/admin/content/:key/:id` | ✅ 23 Oct · workflow.test, admin-workflow e2e |
| AC-137 | Deleted records and their restore | `TrashItem` (30 days, then the minute job) | Website › Trash (Restore; Delete forever for the Super Admin) | `GET /api/v1/admin/trash`, `POST /api/v1/admin/trash/:id/restore`, `DELETE /api/v1/admin/trash/:id` | ✅ 23 Oct · workflow.test, admin-workflow e2e |
| AC-138 | Lead status, first response, booked amount, close reason | `Lead` + `LeadActivity` | the lead's Next step (reply, quote, ask, convert, close, spam, reopen), the board, bulk Mark as spam | `POST /api/v1/admin/leads/:id/actions` | ✅ 23 Oct · admin.test, admin-workflow e2e |
| AC-139 | Visa application stage (documents, submission, outcome, passport) | `Lead.progress` + the country's checklist | the visa lead's Visa application panel | `POST /api/v1/admin/leads/:id/visa` | ✅ 23 Oct · admin.test |
| AC-140 | Order status, courier and tracking, restock | `Order` + `OrderEvent` + product variant stock | the order's Next step | `POST /api/v1/admin/orders/:id/actions` | ✅ 23 Oct · admin.test, admin-workflow e2e |
| AC-141 | Payment proof decision and the customer's rejection email | `PaymentProof` (`orderId`, `decidedBy`) + template `payment-proof-rejected-customer` | Inbox › Payment proofs (Verify, Reject with a reason); Settings › Notifications | `POST /api/v1/admin/payment-proofs/:id/actions` | ✅ 23 Oct · admin.test, admin-workflow e2e |
| AC-142 | Coupon use limit (Used up) | `coupon.maxUses` | Waafas World › Coupons › Use limit | `PUT /api/v1/admin/content/coupons/:id` | ✅ 23 Oct · workflow.test |
| AC-143 | Reply alert for unanswered leads | template `lead-overdue-staff`, `leadFormSettings.slaMinutes` | Settings › Notifications; Settings › Forms | `PUT /api/v1/admin/content/notificationTemplates/:id` | ✅ 23 Oct · workflow.test |
| AC-144 | Order of records on the site (FAQs, team, destinations, banners, store rows…) | record `order` / position | every content list › row sheet › Earlier / Later (also the editor) | `POST /api/v1/admin/content/:key/:id/move` | ✅ 24 Oct · datatable.test |
| AC-145 | Publish, unpublish, archive or trash many records at once | record status (workflow buttons) | every content list › select › bulk bar | `POST /api/v1/admin/content/:key/bulk` | ✅ 24 Oct · datatable.test |
| AC-146 | Invite email to a new staff member | template `staff-invite` | Settings › Forms and messages › Email and SMS | `PUT /api/v1/admin/content/notificationTemplates/:id` | ✅ 25 Oct · admin.test |
| AC-147 | Office hours, phone numbers and brand names on the site | `contactSettings`, `siteSettings` | Settings › Office hours; Settings › Business and contact | `PUT /api/v1/admin/content/contactSettings` | ✅ 25 Oct · admin-settings.spec (task 10) |
| AC-148 | Who gets staff alert emails, by area | `leadFormSettings.staffAlerts` (email, areas) | Settings › Forms and messages › Staff alerts | `PUT /api/v1/admin/content/leadFormSettings` | API test public.test (issue 233) |
| AC-150 | New-device sign-in email to a staff member | template `staff-new-device` | Settings › Forms and messages › Email and SMS | `PUT /api/v1/admin/content/notificationTemplates/:id` | API test twoStep.test (issue 234) |
| AC-151 | Email when sign-in pauses at the code step | template `staff-code-locked` | Settings › Forms and messages › Email and SMS | `PUT /api/v1/admin/content/notificationTemplates/:id` | API test twoStep.test (issue 234) |
| AC-152 | Sign-in code email (/login) | template `customer-sign-in-code` (`{{code}}` required) | Settings › Notifications | `PUT /api/v1/admin/content/notificationTemplates/:id` | ✅ 27 Oct · customerCodes.test, account-email e2e |
| AC-153 | Customer accounts: verified, sign-in method (code, Google, password), last sign-in, Disable, Sign out everywhere, attach a record | `Customer` + `CustomerSession` | Customers › Accounts | `GET/POST /api/v1/admin/customers/accounts…` | ✅ 27 Oct · customerCodes.test, admin-screens e2e |
| AC-154 | My account wishlist, saved travellers, addresses, offer emails, password, sign-ins (the customer's own data, not admin content; staff see the account and its sign-ins) | `CustomerWishlistItem`, `CustomerTraveller`, `CustomerAddress`, `Customer.notifyOffers`, `Customer.passwordHash` | Customers › Accounts (account page) | `POST /api/v1/public/account/…` | ✅ 27 Oct · customerAccount.test, account-sections e2e |
| AC-155 | Turnstile widget and check on every public form (site key, secret) | `IntegrationSetting` + `ProviderCredential` turnstile | Settings › Integrations › Sign-in and security | `GET /public/integrations/status`, `POST /public/integrations/turnstile/verify`, `/admin/providers/turnstile/*` | ✅ API test + e2e (#284) |
| AC-156 | GA4, GTM, Meta Pixel IDs (consent bar and scripts) | provider cards ga4, gtm, meta-pixel | Settings › Integrations › Measurement | `GET /public/integrations/status` | ✅ API test (#284) |
| AC-157 | Search Console and Bing verification meta tags | provider cards search-console, bing | Settings › Integrations › Measurement | `GET /public/integrations/status` | ✅ e2e: code reaches the home page HTML (#284) |
| AC-158 | Features that need an outside service (online payment, courier tracking, Telegram alerts, off-site backup) shown only when On and healthy | `IntegrationStatus.features` | Settings › Integrations (each card) | `GET /public/integrations/status` | ✅ API test (#284); used by #238, #239, #251–#253 |
| AC-149 | EMI request form: minimum, months, bank choices | `getEmiSettings()` → minimumAmount, tenuresMonths; `listEmiBanks()` → name | Settings › Payments and delivery › EMI, EMI banks | snapshot | e2e content.spec (issue 233) |
| AC-159 | Customer quote page and PDF: options (title, details, baggage, price), last valid day, note | Quote record (options, validUntil, notes) | Admin › a lead › Quotes › the quote | `POST /admin/leads/:id/quotes`, `PATCH /admin/quotes/:id`; `GET /public/quotes/:token` | ✅ API test + e2e (#298) |
| AC-161 | Invoice and packing slip PDFs: seller name, contacts; VAT rate | siteSettings.companyName, storeName; contactSettings; paymentSettings.vatPercent | Settings › Site, Contact, Payment settings (Invoices) | `GET /admin/orders/:id/invoice`, `/packing-slip` | ✅ API DB test + e2e (#248) |
| AC-162 | Products, group fares, printer models changed in bulk | products, groupFares, compatibleModels records | Admin › each list › Download CSV to edit / Import CSV | `GET /admin/content/:key/export.csv`, `POST /admin/content/:key/import[/preview]` | ✅ API DB test + e2e (#248) |
| AC-164 | The reminder for an unfinished request | notificationTemplates `lead-incomplete-customer` | Admin › Settings › Notifications | content API | ✅ API DB test (#250) |
| AC-163 | Curated hotels on /hotels and /hotels/[slug]: name, stars, area, photos, amenities, rooms, from prices, order | hotels records | Admin › Curated hotels | `/admin/content/hotels` (content API); public snapshot | ✅ e2e (#249) |
| AC-165 | Online payment options at checkout; integration setup guides | integration settings (active, Live mode, keys) | Admin › Integrations (payment cards) | `/admin/providers/*`, `/public/integrations/status` | ✅ API DB + e2e (#251) |
| AC-166 | Status SMS to customers (request received, order placed and steps, visa stage) | notificationTemplates `lead-received-sms`, `order-placed-sms`, `order-status-sms`, `visa-status-sms` (text, on/off); SMS card (BulkSMSBD, SSL Wireless or Twilio) | Settings › Forms and messages › Email and SMS; Admin › Integrations › SMS (Test connection, Send a test SMS) | `PUT /api/v1/admin/content/notificationTemplates/:id`, `/admin/providers/:provider/:environment/test-sms` | API DB `messaging.test.ts` |
| AC-167 | Telegram alerts to the sales group | Telegram card (bot token, group chat ID, On) | Admin › Integrations › Alerts (Find my group, Test connection) | `/admin/providers/telegram/groups`, `/admin/providers/telegram/production/test` | API DB `messaging.test.ts`, e2e admin-integrations-guide |
| AC-168 | Courier booking and the parcel's status on the order and /track | Steadfast card (API key, Secret key, On); order history (courier, tracking, status lines) | Admin › Integrations › Couriers (Test, Callback URL and Auth token to copy); Admin › Orders › Mark shipped › Book with Steadfast | `/admin/orders/:id/courier`, `/admin/couriers`, `/public/couriers/steadfast/webhook` | API DB `couriers.test.ts` |
| AC-160 | Quote email and the "quote accepted" staff alert | notificationTemplates quote-customer, quote-accepted-staff | Settings › Forms and messages › Email and SMS | `PUT /api/v1/admin/content/notificationTemplates/:id` | ✅ API test (#298) |

## 5. Components inventory

| Component | Path | Source (shadcn · 21st.dev id · custom) | Used on |
| --- | --- | --- | --- |
| AdminFrame · AdminSidebar · AdminNavContext · useAdminInbox · useInboxSummary · useStoredValue | `apps/web/src/components/admin/` | shadcn **sidebar** (registry, sheet below 1024 px, icon rail 3.5rem, reduced motion) + **collapsible**; group pattern after 21st.dev felipemenezes098/collapsible-05 | admin shell |
| AdminTopBar · AdminNewMenu | `components/admin/` | shadcn dropdown-menu, button | admin shell |
| AdminCommand | `components/admin/AdminCommand.tsx` | cmdk + shadcn dialog, kbd | Ctrl K everywhere in Admin |
| AdminNotifications | `components/admin/AdminNotifications.tsx` | 21st.dev patrick-xin/vercel-notification-popover (10479) rebuilt on shadcn popover, drawer (vaul) and line tabs | top bar |
| AdminEmpty | `components/admin/AdminEmpty.tsx` | 21st.dev serafimcloud/empty-state (1435) restyled, no hover motion | admin lists, error state |
| StatusChip · LeadStatusBadge · OrderStatusChip · statusChips | `components/admin/`, `lib/admin/statusChips.ts` | custom cva on shadcn tooltip; tones from ui-color-palette (D185) | leads, orders, customers (all lists from R5) |
| AdminBreadcrumbs · AdminPageHeader | `components/admin/` | shadcn breadcrumb | every admin page |
| OfflineBanner | `components/admin/OfflineBanner.tsx` | custom | admin frame |
| collapsible · hover-card · context-menu · sidebar | `components/ui/` | shadcn registry (@shadcn) | admin |
| ContentEditor · useEditorState · EditorSection · EditorSectionRail · EditorSectionJump · EditorSidePanel · EditorActionBar · EditorHistory · RestoreVersionButton · EditorAdvanced · EditorNoticeBanner · DraftBanner · ConflictDialog · LeaveDialog · drafts | `components/admin/editor/` | custom on shadcn tabs, collapsible, alert-dialog, select, button; sticky bar after the 21st.dev unsaved-bar pattern (9576 compared with 573, 1631) | every content and settings editor (D0 R2) |
| SchemaField (widget dispatch) · ObjectField · UnionField · RepeaterField · SortableList · SortableDnd · SortableRow · useStableKeys · FieldShell · useField · fieldIds · wideWidgets | `components/admin/schema/` | custom; SortableDnd on `@dnd-kit/core` 6.3.1 + sortable 10 + modifiers 9 (diceui/sortable pattern, 21st.dev 544 compared with 23550, 38206, 12556, 29175), loaded after hydration | editors |
| TextField · NumberField · MoneyField · SwitchField · ChoiceField · ChoicesField · TagsField · LinesField · MonthsField · SlugField · DateField · DateTimeField · TimeOfDayField · WeekdaysField · PhoneField · ReadOnlyField · RichTextField · RawJsonField | `components/admin/schema/` | shadcn input, input-group, textarea, radio-group, select, switch, popover, calendar (react-day-picker 10; patterns of 21st.dev 31520, 28800, 483, 2808) | editors |
| ReferenceField · useContentOptions · IconField · ColourField · SeoField · MapField · VariantField | `components/admin/schema/` | shadcn popover + command (combobox pattern of 21st.dev 34820, compared with 26118, 11405, 6072); icon grid compared with 2313, 1785, 23525; colour compared with 23374, 28302, 31443 | editors |
| MediaField · GalleryField · VideoField (photo, gallery and video widgets) | `components/admin/schema/` | custom on MediaDropzone, MediaThumb, shadcn dropdown-menu, sheet, progress; SortableList grid (dnd-kit) | every photo, gallery and video field (D208) |
| MediaDropzone · useUploadQueue · uploadQueue · uploadMedia · MediaPickerDialog · ImageCropDialog · FocalPointPicker · FocalPointDialog · VideoFileSlot · MediaThumb · posterFromVideo · photoFromAsset · useMediaLibrary · useProblemText | `components/admin/media/` | react-dropzone 20.1.2 (uvain/file-upload pattern), @origin-space/image-cropper 0.1.9 (originui/image-crop pattern), shadcn dialog, switch, slider, toggle-group, skeleton; picker, cropper and focal point load on first use (D202, D207) | photo fields, media library |
| MediaLibraryUploader · MediaBrowser · MediaDetailsSheet · SiteImages | `app/[locale]/secure-admin-control/(panel)/media/_components/` | custom on MediaDropzone, shadcn sheet, table, alert-dialog | media library v2 |
| AdminThumb · RelativeTime · LeadFacts · SessionWatch · sessionStore · navigationGuard | `components/admin/` | custom (next/image, date-fns) | pickers, editors, lead page, admin frame |
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
| DeferredSearchCard · DeferredSearchCardClient · loadSearchCard | `components/search/` | custom (next/dynamic) | /flights, /hotels (card behind Edit, #170) |
| LeadCardHeader · lazyResolver | `components/leads/`, `lib/forms/` | custom | lead cards, Flights loading preview, lead forms (#170) |
| LeadActions · OrderSteps · ProofDecision · VisaProgressPanel · ProgressRing · TakaInput | `apps/web/src/components/admin/` | custom on shadcn dialog, radio-group, checkbox, textarea, input-group (D0 R4) | lead, order and payment proof screens |
| ScheduleDialog | `components/admin/editor/ScheduleDialog.tsx` | shadcn dialog + calendar (lazy) + select | the editor's Schedule… and Change time |
| TrashActions | `(panel)/trash/_components/` | shadcn alert-dialog, button | Website › Trash |
| recordChips · RECORD_CHIPS | `lib/admin/recordChips.ts`, `lib/admin/statusChips.ts` | custom on the shared workflow rules | every content list |
| BulkQuoteForm | `components/shop/` | custom (loaded when the dialog opens) | corporate quote dialog (#170) |
| LinkPicker · LinkField · LinkTargetText · linkTargets · wordFilter | `components/admin/schema/`, `lib/admin/{linkTargets,commandFilter}.ts` | shadcn popover + command (cmdk with a word filter), input; custom | every link field in the editors, menu items (D0 R7) |
| VariantsMatrixField · variantMatrix | `components/admin/schema/VariantsMatrixField.tsx`, `lib/admin/variantMatrix.ts` | shadcn radio-group, checkbox, input, TakaInput; custom | product editor: one row per mix of option values, Variant shown first (D0 R8) |
| BulkPhotoDrop | `components/admin/schema/BulkPhotoDrop.tsx` | MediaDropzone + useUploadQueue (R3), progress; custom | photo-item lists (gallery albums): several photos at once, each its own item (D0 R8) |
| SettingsFrame · SettingsNav · SettingsSectionTabs · SettingEditor · SettingsRecordList · PermissionMatrix | `components/admin/settings/` | custom on tokens; ContentEditor (embedded) | Settings as one page (D0 R9) |
| SetupChecklist · TodayCard · Sparkline · LineChart | `components/admin/`, `components/admin/dashboard/` | AdminPanel, ProgressRing; server SVG | dashboard and Settings home (D0 R9) |
| TemplateTextField · TemplatePreview | `components/admin/schema/` | shadcn input and textarea | message templates (D0 R9) |
| IconPicker | `components/admin/schema/IconPicker.tsx` | shadcn popover + command | icon fields, menu items |
| HomeSectionManager · SectionSheet · HeroSheet · SitePreview · SectionThumb | `components/admin/website/` | custom on SortableList (dnd-kit), shadcn sheet, switch, input, textarea; an iframe of the live page | Website › Home page |
| MenuCard · MenuItemSheet | `components/admin/website/` | custom on SortableList (dnd-kit), shadcn sheet, switch, sonner (Undo) | Website › Menus |
| StaffToolsLoader · StaffTools · SectionOutlines | `components/staff/` | custom (next/dynamic behind the staff hint) on shadcn dropdown-menu; 21st.dev floating toolbars looked at, not installed | every public page, staff browsers only |
| PreviewBanner · PreviewExitLink | `components/layout/` | custom (server, draft mode only) | every public page in Preview of unpublished changes |

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
| ui-color-palette | MCP (plugin) | ✅ reachable | 19 Oct | Palette scales and contrast; the plugin is not loaded in the VS Code session, so `get_palette` is called over HTTP JSON-RPC from a local client (admin status families, D185) |
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
| design-superpowers:design-review | Skill | ✅ synced (files read from disk; not listed in the VS Code session) | 19 Oct | Review pass on every finished screen |
| design-superpowers:design | Skill | available | — | Composing features from the design system |
| design-superpowers:creative | Skill | ✅ used from the synced files | 19 Oct | Visual direction, moodboards |
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
| 21st:21st-ui | Skill | ✅ used from the synced files | 19 Oct | Choosing and adapting 21st.dev components |
| ui-color-palette:* (14 skills) | Skill | ✅ audit-palette and scale-palette followed with the MCP | 19 Oct | build-color-system, scale-palette, audit-palette, generate-code, generate-semantic-code, generate-source-colors, manage-palettes, figma, penpot, framer, sketch, help, gh-cli, gitlab-cli-skills |
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
| Home | 26 / 76 / 50 / 92 · 24.4 s | 1 / 72 / 73 / 100 · 29.2 s | 27 / 79 / 69 / 92 · 25.4 s | 35 / 88 / 54 / 92 · 12.5 s | **45 / 100 / 100 / 100 · 5.9 s** (CI runner, 1 run, 11 Oct) | Ahead of all four on every axis; below our own 90 / 2.5 s target (#91) |
| Package listing (1 run, 10 Oct) | 35 / 73 / 50 / 92 · 5.6 s | 1 / 72 / 73 / 100 · 26.5 s | 27 / 93 / 73 / 100 · 23.4 s | 34 / 85 / 54 / 100 · 16.2 s | **71 / 100 / 100 / 100 · 5.6 s** (CI, 11 Oct) | GoZayaan `/tour` redirects to its home Tour tab; measured for Waafa in A11 and A22 |

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
| D87 | 10 Oct | Superseded by D270–D273 (#232): In Phase A visa files never leave the browser; only name, type and size go with the lead, and the visa desk collects files after the call | No private bucket before Phase B; documents must never be public (PRD FR-VISA-05) | #12 |
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
| D106 | 10 Oct | Superseded by D270–D273 (#232): Payment proof is metadata only in Phase A (same as visa files, D87); DocumentSlot moved to components/forms | Reuse | #14 |
| D107 | 10 Oct | Stock is not decremented in Phase A; mini-cart drawer, save for later and cart corporate quote are cut to A22 | Time; stock transactions are Phase B | #14 |
| D108 | 10 Oct | Service pages are one admin-edited ServicePage record each; form labels and option lists are UI chrome (next-intl); the request card is the shared LeadRequestCard | Copy editable in Admin, same flow as every Manual module | #15 |
| D109 | 10 Oct | Superseded by D270–D273 (#232): Printing and trading attachments follow the Phase A rule: metadata only (D87) | Uploads arrive with the API | #15 |
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
| D137 | 11 Oct | Dashboard figures are CSS bar lists, not recharts | Readable at every width, no chart bundle; recharts can come with Reports after launch | #18 |
| D138 | 11 Oct | Launch admin edits every content key and setting through one generic editor drawn from the shared zod schemas (JSON Schema via zod's toJSONSchema), with a JSON tab; bespoke editors (package builder, product card, category tree, tiptap, media uploads) follow after launch | Thirty-plus content types in one day; one path validated by the same schemas the API uses keeps every public element admin-controlled on day one | #18 |
| D139 | 11 Oct | Staff sessions: API tokens in httpOnly SameSite=Lax cookies set by server actions; `proxy.ts` refreshes a token with under a minute left before the page renders; admin links are not prefetched; a refresh token rotated in the last 30 seconds still opens a session | The browser never holds a token; pages render with a valid token; prefetch bursts can't sign staff out (#66) | #18, #66 |
| D140 | 11 Oct | Flight path on desktop only, route arc from 640 px, search → results morph after launch | On phones the headline fills the width and the summary bar has no room; the morph needs React View Transitions, not worth the risk two days before launch | #52 |
| D141 | 11 Oct | Production runs on the owner's VPS (2 vCPU, 4 GB, Docker) with Docker Compose and nginx (Let's Encrypt via certbot) instead of Railway and Vercel; only nginx is public, the API also listens on 127.0.0.1:4000 for the web build | Owner decision; one server, no monthly platform fees; the web build prerenders from the API snapshot, so deploy.sh starts the API first | #74 |
| D142 | 11 Oct | External APIs plug in through provider adapters; connections live in `ProviderCredential` with AES-256-GCM sealed secrets keyed by `PROVIDER_SECRET_KEY`; stubs answer health checks but refuse every booking call until a certified adapter replaces them | PRD FR-GS-06 to 08 (P0) were missing; the owner wants to connect suppliers without a rebuild, and nothing may fake live availability | #82 |
| D143 | 11 Oct | Admin lives at /secure-admin-control; /admin is the ordinary 404 and robots.txt names no admin path | Owner request (no guessable admin URL); noindex headers stay | #85 |
| D144 | 11 Oct | Client code imports option lists and limits from the zod-free `@waafa/shared/constants` (and helpers by subpath); Motion's DOM features stay synchronous | zod cost ~30 KB on every first load; loading Motion features after hydration left AnimatePresence duplicates in e2e | #39 |
| D145 | 11 Oct | Before launch the first-load budget is enforced as per-route ceilings (e2e/budget.spec.ts), not the 200 KB target | Reaching 200 KB needs picker and form-step splits that are too risky two days before launch; continues in #91 | #39 |
| D146 | 11 Oct | Listing banners (Packages, Visa) are an inset rounded photo panel (`BannerHero`) like the Home hero, not the boards' full-bleed band; Ken Burns starts after 1.2 s on desktop only | One consistent hero language; the photo is the LCP element, so it paints still | #22 |
| D147 | 11 Oct | Card spotlight, 3D tilt, hover-to-play package clips and the WhatsApp shimmer are built in-house (`CardFx`, `HoverVideo`) following the HANDOFF 21st.dev references | The 21st.dev install path is unavailable this session (MCP disconnected); our versions write one transform and one CSS variable per frame, mouse only, reduced-motion aware | #22 |
| D148 | 11 Oct | Every public page passes its metadata through `withSocial` | Next merges metadata shallowly: without it most pages shared the site-wide og:title and no image on Facebook and WhatsApp | #96 |
| D149 | 11 Oct | Flight route landing pages are a content collection (`flightRoutes`) edited in the generic admin editor, with facts written as typical values and fares labelled indicative | Route pages are how OTAs earn search traffic; no live prices or availability before Phase E | #99 |
| D150 | 11 Oct | The owner deploys by hand: `deploy/init-env.sh` writes the settings with fresh secrets, `deploy/check.sh` verifies the server, `docs/DEPLOY.md` opens with a quick start | Owner request; fewer manual steps, no secrets typed by hand | #74 |
| D151 | 11 Oct | CSP without nonces: scripts allow 'self', inline Next payloads, Turnstile and the consented analytics hosts; everything else is locked (object-src none, frame-ancestors none, base-uri and form-action self) | A nonce makes every page dynamic and drops static shells and Cache Components | #102 |
| D152 | 11 Oct | Ship with the three `pnpm audit` highs open (mysql2 and deepmerge-ts inside the Prisma CLI, braces in lint tooling) | None is reachable at runtime; no lockfile churn the night before launch; Dependabot will update them | #102 |
| D153 | 11 Oct | Rehearse the deploy on the owner's PC with Docker Desktop before the VPS | Same compose file and scripts; proves migrations, seed, web build against the API, nginx, emails and backups | #74 |
| D154 | 12 Oct | Cut first-load JS by loading overlays, toasts and the desktop menu on use, CSS for page and word motion, native details for accordions; keep runtime message formatting | Home 318 → 215 KB, CLS 0; precompiled messages broke placeholder labels and content-visibility upset axe, so both were dropped | #91 |
| D155 | 12 Oct | One setting row per provider (Active, Sandbox or Live, markup) next to per-environment sealed credentials; custom providers use generic fields; secrets revealed only on an audited Super Admin request | Owner asked for UI-managed APIs; keeps secrets server-side, keeps the manual fallback and the Golden Switch | #107 |
| D156 | 12 Oct | Media uploads on the VPS volume, re-encoded by sharp in the API (added as a dependency), served at /uploads/ by nginx | No R2 account yet; strips GPS from owners' photos; next/image still optimises them | #109 |
| D157 | 12 Oct | Customers keyed by phone across leads and orders until accounts land (Phase D) | No customer table yet; the phone is the stable identifier in every request and order | #111 |
| D158 | 12 Oct | tiptap for rich text bodies, one heading level (h3), output still sanitised on the server | Owner edits policies and posts without HTML; the sanitiser already maps headings to h3 | #116 |
| D159 | 12 Oct | Every PR gets a code review before merge, posted from the owner's GitHub account (COMMENT review with inline comments, findings fixed and answered on the thread); never Copilot | Owner rule: reviews count on the owner's profile; GitHub does not let an author approve their own PR, so own PRs get COMMENT reviews and bot PRs can be approved | #126 |
| D160 | 12 Oct | nginx compresses (gzip) and caches `/_next/static` (30 d), `/_next/image` (7 d, per image format) and `/media/` (1 d); Next compression off in the Docker image only; deploy.sh clears the cache | Node on a 2-core VPS spends its CPU on rendering; image URLs carry no content hash, so a deploy must drop cached copies | #126 |
| D161 | 12 Oct | Production images are built by GitHub Actions and pushed to the public Docker Hub repository emon6107/waafa-ota-platform as api-, web- and nginx- tags (sha + latest); the VPS pulls them | Owner request; the 2-core server never runs the 2 GB web build, deploys take minutes, rollback is a tag; the site address and Turnstile site key are build-time, so they are GitHub variables and image labels checked at deploy | #130 |
| D162 | 12 Oct | Dependabot PRs are approved from the owner's account and squash-merged; their merge commit keeps dependabot[bot] as author | GitHub sets the PR author on squash merges; rewriting history is not allowed; the attribution rule targets AI and co-author trailers, not the dependency bot | #128 |
| D163 | 12 Oct | Google sign-in ships now behind two switches (Integrations › Sign-in active and Settings › Accounts live); the API exchanges the code with the secret from Integrations, the web keeps an opaque session token in an httpOnly cookie; My account lists requests and orders by verified email | Owner asked for Google login before launch; FR-ACC is Phase 1B, so it stays off until the owner adds Google keys; no customer table links leads yet, and the verified email is the safe join | #134 |
| D164 | 13 Oct | Real country flags (flag-icons, MIT, self-hosted SVG) replace the two-letter marks; the mark stays as fallback | Owner request; flags are national symbols, not illustrations, so correction 7 does not apply | #147 |
| D165 | 13 Oct | Log in shows its words from 1280 px, the header tagline from 1440 px; Accounts live defaults to on for new installs | Owner could not find the icon-only button; the tagline is the only element that can give up the room | #146 |
| D166 | 13 Oct | Google sign-in keys may come from the server env (GOOGLE_CLIENT_ID/SECRET) while Admin has no Google record; Admin always wins | Production signs in from the first start without a manual admin step; the admin screen stays the control | #149 |
| D167 | 13 Oct | Home hero media taller (clamp 480–620 px from 1024 px) and the flight path drawn inside the media sky | Owner request; the old line crossed text | #148 |
| D168 | 13 Oct | Airline logos: bundled square marks by IATA code (script, pics.avs.io), Admin logo wins, code fallback; shown as "We book", never partners | Owner request; staff adding an airline see its logo with no upload | #156 |
| D169 | 13 Oct | Hero gets the next group fare card over the route's start, flags in the destination chip, ribbon line and static glows | Owner request for a more attractive hero; all from Admin data; glass stays on the search card | #157 |
| D170 | 13 Oct | Web container cap 1 GB; one-shot bootstrap script for the VPS | Measured ~750 MB; fewer manual steps on launch day | #158 |
| D171 | 13 Oct | The VPS gets no source code: deploy/server bundle (images only) copied with tar + scp; repo deploy path kept as an alternative | Owner: GitHub goes private, the server only pulls Docker Hub images | #164 |
| D172 | 13 Oct | A record still marked Sample is noindex, follow and out of the sitemap, for every record with its own page (not only the six named types), including About and the policies; categories and brands need an indexable product to be listed | One predictable rule for staff: real content = Sample off; placeholder text never reaches Google | #168 (replaced by D180, #183) |
| D173 | 13 Oct | The hero loop starts on the visitor's first scroll, touch, pointer move or key; the poster alone until then | Its first frame replaced the poster as LCP after hydration (Home 59 in CI); every visitor who scrolls or moves the mouse still sees it (MOTION.md) | #170 |
| D174 | 13 Oct | Hidden or later UI loads on demand: results-page search card, lead step 2, form validation (zod, libphonenumber), corporate quote form; `inlineCss` and `content-visibility` rejected | Cuts flights 79 KB and shop 100 KB of first-load JS; inline CSS slowed first paint; content-visibility broke axe target-size checks | #170 |
| D175 | 13 Oct | Titles and descriptions are fitted in code (60 / 155, cut at a word), not only by admin validation; Explore more links on pages with few links; Home h1 carries the brand eyebrow | Admin records can be any length; a page's main heading and structured data should name the brand for brand searches | #173 |
| D176 | 13 Oct | Visa lives at /visa (308 from /visa-services); data changes that must reach the live database ship as one-time seed patches (`_seedPatches`), never by overwriting admin data wholesale | Owner request; the seed must not overwrite admin edits, but a renamed route has to move stored links | #176 |
| D177 | 13 Oct | Store prices hidden by default per product (Show price in Admin); hidden prices are blanked server-side and never sold online | Owner: products only, admin chooses which show a price; a hidden price must not leak through the page data, filters or the cart | #178 |
| D178 | 13 Oct | Visa prices show as an admin range per type, never one fixed amount; no range falls back to "From" fee + charge | Owner: visa costs vary by file; a range is honest and the expert confirms before payment | #179 |
| D179 | 14 Oct | Extra office numbers are a list after the main number (`extraPhones`); WhatsApp stays on the main number; live data gets the second number through a one-time seed patch | Owner: two numbers now, more from Admin; seed never overwrites admin data | #181 |
| D180 | 14 Oct | Every published record page is indexed whatever its Sample flag; only SEO › noindex hides one. Replaces D172 | Owner: About Us noindex in Search Console, wants the site ranked with no manual steps; the live records are all seeded as Sample, so D172 hid the pages that rank (visa, routes, packages, products) | #183 |
| D181 | 14 Oct | Meta titles and descriptions use search wording (air tickets, visa processing, tour packages, Dhaka, Bangladesh) while h1s keep the board copy; live admin SEO text changes only through a one-time patch that leaves edited wording alone; `/llms.txt` lists links, never prices | Owner: rank for brand and travel searches; people in Bangladesh search "air ticket" and "visa processing"; prices are confirmed by a person | #184 |
| D188 | 19 Oct | Admin shell on the shadcn Sidebar: IA groups that fold, icon rail on desktop (Ctrl+B, cookie), a sheet below 1024 px; Settings is one door in the sidebar footer (`/settings` index now, left sub-navigation in R9); badges and the bell from `GET /admin/inbox` (rendered with the page, polled every 30 s while visible); Ctrl K searches `GET /admin/search` | Owner: staff can't tell where things are or what waits; one settings door keeps the sidebar short (Shopify, Linear); tablets need the full width for editors | #191 |
| D189 | 19 Oct | Role rules live in `packages/shared/src/helpers/access.ts`; the API enforces them and the admin uses them to show only what the API allows (Menus and the footer stay with managers) | One source of truth, no links that end in "not for your role" | #191 |
| D190 | 19 Oct | Frame strings reach client leaves through a scoped NextIntlClientProvider with nested paths (`pickMessagePaths`); the rest of the catalogue stays on the server | Plural counts render on the client; next-intl documents nested providers with picked messages | #191 |
| D191 | 19 Oct | Lead `pending` reads "Waiting for customer", order `processing` reads "Packing"; stored values unchanged | Plain words (ADMIN.md §13); live data keeps its meaning | #191 |
| D192 | 19 Oct | CodeQL is skipped while the repository is private (`if: github.event.repository.private == false`) | Code scanning on a private repository needs GitHub Code Security (paid); every run failed at upload after about five Actions minutes. It comes back by itself if the repository is made public | #204 |
| D193 | 19 Oct | Blueprints are grouped by area (`blueprints/settings.ts`, `home.ts`, `content.ts`, `travel.ts`, `visa.ts`, `shop.ts`) with one typed blueprint per key in `registry.ts` (`Record<ContentKey, Blueprint>`), not 52 files | Same type safety (a missing key fails the build) with far less file churn; ADMIN.md §7 updated | #192 |
| D194 | 19 Oct | Blueprints are plain data; words come from messages (`Admin.blueprints.<key>`, then `Admin.fieldNames`, `fieldHelp`, `choices`), resolved on the server into a `ResolvedBlueprint` prop; widget chrome reaches the client through a scoped `Admin.editor` provider | No message catalogue in the browser, one source for Bangla later; unit tests prove every visible label and choice has plain words | #192 |
| D195 | 19 Oct | The admin list owns each record's `order`: a reorder writes it, new records and copies go last, a save or restore never changes it; the editor hides it | The site sorts by `order` while the reorder only wrote `position` (#205); one owner means no silent reshuffles | #205 |
| D196 | 19 Oct | dnd-kit classic (`core` 6.3.1, `sortable` 10, `modifiers` 9, `utilities` 3.2.2) for reordering, loaded after hydration; Move up / Move down stay as the single-pointer way | Mature and React 19 safe; `@dnd-kit/react` 0.5 is pre-1.0 and days old. WCAG 2.5.7 needs a non-drag path | #192 |
| D197 | 19 Oct | R2 widgets follow 21st.dev patterns compared on the catalogue (ADMIN.md §14) but are built on our primitives (popover, command, calendar, dnd-kit) | The free tier's two daily retrievals were used; the patterns, not the code, were what we needed | #192 |
| D198 | 19 Oct | History follows slug changes through time-bounded audit segments; Restore re-applies an entry's saved version and is itself audited (`content.restore`, `settings.restore`); a stale save returns who saved last | A record keeps its whole story across renames, and a later record reusing an old slug never mixes in | #192 |
| D199 | 19 Oct | Duplicate saves a hidden draft: "(copy)" in the title, `-copy` id and slug (`-copy-2` …), Show on website and similar switches off, never Sample | A copy can't appear on the site twice by accident | #192 |
| D200 | 19 Oct | Until R3, photo fields show a preview, the photo address, its description and a folded credit; upload and the library replace the address box in R3 | R2 is "all widgets except media"; nothing about photos regresses meanwhile | #192 |
| D201 | 19 Oct | Sessions: the 30 s inbox poll keeps tokens fresh while the tab is open; an ended session shows "Your session has ended" before any save, editor actions get a 401 back instead of a redirect, and signing in returns to the same screen with the draft | Staff never lose typed work to an expired session | #192 |
| D202 | 20 Oct | Editor bundle: schemas are checked on the server (admin routes, server actions), never with zod in the browser; widgets with heavy parts load them on first use (the month calendar when a date picker opens, the rich-text editor), and R3's upload and crop follow the same rule | zod alone was 31 KB gzip of the editor's first load; staff on phones open editors on mobile data | #192 |
| D203 | 20 Oct | Picker choices (`GET /admin/content/:key/options`) are open to every staff member only for `PICKER_KEYS` in packages/shared (the 12 lists editors pick from); every other list's choices need edit access to it; a web test keeps the blueprints' references inside that list | Review: a sales agent could read every coupon code through the picker endpoint | #192 |
| D204 | 20 Oct | Duplicate: lists of fixed places or codes (menus, notification templates, home sections, service pages, media slots, store rows, airports, airlines, coupons) can't be copied (`canCopy`, API 409, no button); a copied product gets its own variant ids and SKUs; slug-keyed lists keep inner ids unique (API 409 "exists"); a long title keeps its words when " (copy)" won't fit | Review: a product copy shared variant ids with the original and broke its orders | #192 |
| D205 | 20 Oct | CodeQL runs on every pull request and push again (replaces D192): on the private repository the analysis keeps its SARIF (`upload: never`, `output: codeql-results`) and `scripts/codeql-findings.mjs` turns each finding into an annotation and a job-summary row and fails the check on any error or warning; the SARIF is kept 7 days as an artifact; on a public repository it uploads as before | Owner, 20 Oct: every CI check must run and pass, nothing skipped. Same queries (security-extended), same path filters, about five minutes a run | #208 |
| D206 | 20 Oct | `.github/codeql/codeql-config.yml` leaves out two developer download tools (`scripts/fetch-airline-logos.mjs`, `docs/design/photos/get-waafa-photos.mjs`): they save fetched logos and photos under fixed names, are never shipped or run in CI, and `js/http-to-file-access` there is their job. Everything else is analysed. While private, the CodeQL database isn't uploaded (no retries) | Pull request runs report only alerts in changed lines; the first full run on `main` met these two older files | #210 |
| D207 | 20 Oct | Upload and crop are built in-house on the planned libraries: `MediaDropzone` + `useUploadQueue` on react-dropzone 20.1.2 after the 21st.dev `uvain/file-upload` pattern, `ImageCropDialog` on `@origin-space/image-cropper` 0.1.9 (the headless package behind 21st.dev `originui/image-crop`, MIT, no dependencies), the focal point picker in-house; react-dropzone pinned five weeks old (20.1.4 was three days old) | `uvain/file-upload` is a paid marketplace item (the shadcn add answered "Marketplace membership required") and that refused install used the day's last free retrieval; the patterns were what we needed (as D197) | #193 |
| D208 | 20 Oct | Photo frames: every photo field names the frame it shows in on the site (`FRAME` in `lib/admin/blueprints/common.ts`, from the SmartImage ratios: wide 16:9 ≥ 1600, landscape 4:3 ≥ 1600, card 16:10 ≥ 1200, portrait 3:4 ≥ 900, person 4:5 ≥ 600, square 1:1 ≥ 1000, poster 16:9 ≥ 1280, share 1.91:1 ≥ 1200, logo and free); the field draws the photo in it, crops to it and warns below the width; a blueprint test fails a photo without a frame or a video drawn as a plain group | Staff see "4:3, at least 1600 px wide" where they choose the photo, and a new photo field can't ship without its frame | #193 |
| D209 | 20 Oct | A photo's focal point is stored with it (`focal {x, y}` in percent on ImageSchema); SmartImage turns it into `object-position` on every cropping public image (contained logos and cart thumbnails keep the centre) | One photo fits cards, heroes and phones without new files | #193 |
| D210 | 20 Oct | A crop is saved as a new library photo (sharp extract to WebP), never over the original; Replace everywhere writes each record or setting through the normal save path (version check, History, audit) and reports the ones it couldn't change; Delete only when nothing shows the file (API 409) | Other places keep the original; every swap can be undone from History; no broken images from a delete | #193 |
| D211 | 20 Oct | Videos: MP4 and WebM up to 50 MB on their own upload route (nginx 51 MB there only; the route handler streams the body with a length check and lives outside the Next proxy, which keeps only the first 10 MB of a body it sees), stored as they arrive (no transcoding: ffmpeg isn't on the server), byte ranges served for seeking (API and the web's `/uploads` route); when no poster is set the browser takes one from the clip at one second and uploads it | No raised body limit elsewhere; the schema needs a poster, and a still of the clip is real footage (CLAUDE.md media rule) | #193 |
| D212 | 20 Oct | Words for a part named for what it belongs to come first: `fieldNames.<owner>_<name>` (and `fieldHelp`) before `fieldNames.<name>`, so a video's credit reads "Video credit" | One shared catalogue without per-record words for every video | #193 |
| D213 | 23 Oct | Security patches go out on their own branch and PR ahead of feature work: Next.js to the latest patch of the line in use (16.4.2 over 16.4.1, which adds Turbopack fixes), runtime packages to their patched releases, and a pnpm `overrides` entry only for a copy a framework pins (fastify inside `@nestjs/platform-fastify`), removed once the framework ships the patch | Two critical unauthenticated RCE advisories on the live version; a patch release changes no behaviour, so it ships before the media work and its migration | #213 |
| D214 | 23 Oct | CodeQL findings are fixed in code first (raw upload bodies pass `rawBody()`, which refuses strings and arrays before the Buffer check). A finding that is the feature itself is accepted only with `// codeql[<rule id>] <reason>` on the line above it; `scripts/codeql-findings.mjs` honours that comment, needs the reason, and lists every accepted finding as a notice and in the job summary. The first one: saving a staff video upload to disk (`js/http-to-file-access`) | Writing uploaded bytes is what a media library does; a rule-wide exclusion would hide the next real case, a comment keeps it per line and reviewed | #193 |
| D215 | 23 Oct | The minute job (publish due records, refresh window lists, purge Trash, overdue alerts) runs in the API process, not the BullMQ worker, with a Postgres advisory lock so one instance runs it; `SCHEDULER_INTERVAL_MS` (60 s; 3 s in the CI e2e job; off in API tests, which call `tick()`) | The public snapshot cache and the batched web revalidation live in the API: a worker flipping a record could not drop them | #194 |
| D216 | 23 Oct | A record's workflow fields (`status`, `publishAt`, `liveSince`) are written only by the API, from the button the editor sends (`action`); a plain save keeps them; History's "Restore this version" keeps today's status; a record going live shows that day as its `publishedAt` date (blog posts, packages) | A free status in the data was the old dropdown in disguise; restoring an old text must never unpublish or republish a record | #194 |
| D217 | 23 Oct | Trash is its own table (`TrashItem`), not a deleted flag on `ContentDocument`: Delete moves the record there in one transaction, Restore checks that its address is still free, the minute job purges after 30 days, Delete forever is Super Admin only | Every existing read of content stays correct without a filter that one forgotten query would break | #194 |
| D218 | 23 Oct | Slug redirects (`SlugRedirect`) for lists with their own page (`ROUTED_KEYS`): a changed link leaves a permanent redirect, chains are flattened, a new record at an old address wins; the snapshot carries them and each public record page redirects before its 404 | Shared links and search results keep working after a rename | #194 |
| D219 | 23 Oct | Draft preview (Next.js draft mode with a banner) ships with R7, as its issue scopes it; R4's editor offers View on site for live records | One preview implementation, built with the website builder that needs it most | #194 |
| D220 | 23 Oct | Lead contact buttons (WhatsApp, Call, Email) log the contact as they open it: the first response is stamped and a new or waiting lead moves to In progress in one press; internal notes never change the status | Staff task 4 ("reply on WhatsApp and see it move") without a second step | #194 |
| D221 | 23 Oct | Orders: "Confirmed on call" is for cash on delivery only; advance payments are confirmed by verifying their proof (which confirms a placed order by itself); Mark delivered on cash on delivery records the cash as received; "payment verified" is no longer a free toggle | ADMIN.md §8.4; a toggle could mark an unpaid order paid | #194 |
| D222 | 23 Oct | A payment proof matches an order by itself when its reference names the order and its amount covers the total (customers round up); a decided proof stays decided, and a wrong verification is undone by cancelling the order with a reason | ADMIN.md §8.5; undoing money decisions silently is how books go wrong | #194 |
| D223 | 23 Oct | Coupons get an optional use limit (`maxUses`); uses are orders with the code that were not cancelled; checkout refuses a used-up code and the list shows Used up | ADMIN.md §8.6 "Used up" needs a limit to reach | #194 |
| D224 | 23 Oct | Converting a group-fare lead to a booking takes its travellers off the fare's seats (never below 0) and refreshes the site | ADMIN.md §8.6: seats drop when a lead on that fare is booked | #194 |
| D225 | 23 Oct | Visa application progress lives on the visa lead (`Lead.progress`, additive JSON): checklist items received, submission date and reference, outcome, passport returned; the stage is derived with `visaStage`; R6 builds the visa inbox on it | The visa pipeline is a lead today; one record keeps its timeline | #194 |
| D226 | 23 Oct | A lead still new and unanswered past the reply target alerts the desk once (template `lead-overdue-staff`, an "overdue" timeline entry marks it), within a day of arrival | The manager is told once, not every minute | #194 |
| D227 | 24 Oct | Saved views and hidden columns stay on the device (per list, `waafa.admin.views.<list>` / `waafa.admin.columns.<list>`); a view is the list address without the page | No new table or endpoint for a convenience; the address already carries the view, so it can also be shared as a link | #195 |
| D228 | 24 Oct | The INP bar for lists is checked on the default 25-row page of a 500-lead list in CI; the 100-row page measured 190 to 240 ms on the low-memory machine and is tracked in #219 | Rows, cards and handlers are memoised and React work is about 25 ms; the rest is the browser recalculating the whole page's style, which needs its own investigation | #195, #219 |
| D229 | 24 Oct | The checkbox indicator is always mounted and hidden by its state (`forceMount`, `data-[state=unchecked]:invisible`) | Radix Presence read computed style on every toggle; selecting a page of rows forced one style recalculation per checkbox | #195 |
| D230 | 24 Oct | In a list the name links to the editor or detail page; the rest of the row opens the summary sheet with the row's actions and Open | One click to edit what you came for, one to look without leaving the list; the name link is out of the tab order so Tab reaches each row once | #195 |
| D231 | 24 Oct | Lead views (All, Open, Mine, Unassigned, Overdue) and the proof and feedback queues stay as tabs above the table; module, status and chip filters are the table's chips | A queue is where staff work from; the tabs keep the other filters, the chips narrow inside a queue | #195 |
| D232 | 24 Oct | Inbox panes: from 1280 px the queue the person came from stays left of the lead or order (320 to 560 px, width remembered on the device, D241), each pane scrolling on its own; narrower screens show the work item alone with Back. The queue travels in the address (list parameters on every row link, `queue=visa` from Visa applications) | Working down a queue needs the next item one click away and Back to land where the person left; no client store or extra fetch | #196 |
| D233 | 24 Oct | Lead service tabs with open counts (the modules the person works on) replace R5's module chips; Open, Mine, Unassigned and Overdue become the table's Show chips. Proof and feedback queues stay tabs (D231 otherwise unchanged) | ADMIN.md §3.1 names the service tabs; services are where work is split between people, views narrow inside one | #196 |
| D234 | 24 Oct | Board moves run `leadStepForMove` (shared) and open the lead page's own dialog (`LeadStepDialog`); refused moves say why and the card stays. Columns New · In progress · Quoted · Waiting for customer · Booked · Lost or cancelled; drag with a mouse or a long press (dnd-kit in the board chunk, rendered from the first paint), Move to… on every card | One rule set and one dialog: the board can't do what the lead page can't, and asks for the same inputs (ADMIN.md §5.5) | #196 |
| D235 | 24 Oct | The 21st.dev `diceui/kanban` install stopped in the shadcn CLI (a registry dependency path missing for the radix-nova style) and used the day's two free retrievals; the board and the timeline are built in-house on dnd-kit and list markup after `diceui/kanban`, `rmahammad/kanban-card-movement` and `olewandowski1/timeline-3` | Same path as D196 and D207: the pattern, not the files; nothing new to install beyond shadcn resizable | #196 |
| D236 | 24 Oct | Visa applications at `/visa-applications`: the API works out each visa lead's stage from its country's checklist (up to 2,000 per query) and leaves spam out; an application opens on its lead page with the visa queue, and the sidebar stays on Visa applications (query-aware active state) | The stage lives in the checklist, not a column; one lead page for every service keeps the steps in one place | #196 |
| D237 | 24 Oct | Call and WhatsApp in list rows, row sheets, phone cards and board cards log the contact like the lead page | D220 everywhere: a reply from any screen moves a new lead and stops its timer | #196 |
| D238 | 24 Oct | The reply timer is a client chip from the shared `replyTimer` (counts down to the target, then the minutes past it, every 30 s) and replaces the server Overdue chip in the lead header | Time-dependent words render on the client (CLAUDE.md); the same line as `isOverdueLead` | #196 |
| D239 | 24 Oct | Lead and order pages on phones get a bottom bar: WhatsApp, Call and the main step (contact buttons become icons beside a step so it fits at 320 px); pages leave room for it and toasts sit above it | ADMIN.md §5.5 and the inbox page notes: contact actions within thumb reach | #196 |
| D240 | 24 Oct | The lead's customer card lists the same phone's other requests (the person's modules) and orders (store and accounts roles), five each with counts, and links the customer profile; `canSeeOrders` is one helper in `admin/access.ts` | ADMIN.md §5.5 customer card; the same role rule the profile and reports use | #196 |
| D241 | 24 Oct | `InboxSplit` is one CSS grid at every width with the list width as a variable and an in-house separator (pointer drag, arrow keys, Home, End); shadcn resizable was dropped | Swapping between a plain layout and resizable panes remounted the work item after hydration and at 1280 px, closing dialogs and losing typed reasons (independent review) | #196 |
| D242 | 24 Oct | Review fixes before the PR: the board uses mouse and touch sensors (a pointer sensor lost every long press to scrolling) and returns focus to the moved card; Move to… names itself with its visible words first (WCAG 2.5.3); "Lost or cancelled" is a Show chip on the list; a document received moves a waiting visa lead on, unticking never does, and the audit keeps the status; module counts only when asked (`counts=1`); Visa applications read the needed columns and only the named countries; payment accounts show their names | Independent subagent review of the diff (10 findings, all fixed) | #196 |
| D243 | 24 Oct | Framing: public pages may be framed by the site itself only (`frame-ancestors 'self'`, X-Frame-Options SAMEORIGIN) for everyone; admin pages are never framed (`'none'`, DENY) and may frame the site (`frame-src 'self'`). The first cut sent 'self' only to browsers with the staff hint through a cookie-conditional header; the review dropped it (no Vary on a cookie rule, previews broken for sessions without the hint) | The home manager's live preview frames the real site; same-origin framing is no clickjacking risk, other sites stay blocked. The e2e caught the admin's own `frame-src` blocking the preview before the PR | #197 |
| D244 | 24 Oct | Website › Home page manages `homeSections` (order, Show, headings) and `homeContent.hero` in side sheets, each with the live home page at phone width in a frame (out of the tab order), scrolled to the section through `data-edit` marks (`display: contents`, measured on the first child) by scrolling the frame only; a sheet mounts afresh for every opening and saves on the version it opened with (or its own last save), so a change made elsewhere is a conflict, not lost; the standard words show as grey placeholders; Move up and down sit in every row at every width (WCAG 2.5.7); moves and switches save one after another and keep keyboard focus; the hero's photo or video stays in its media slot | One screen in page order instead of six content lists; the frame is the real page, so the preview never drifts from the site; the review found stale sheets and lost focus | #197 |
| D245 | 24 Oct | Website › Menus edits the ten `menus` records as ordered lists grouped Header, Phone and Footer; the panels are menus of their own, so the tree is that grouping plus "Opens the More panel". Changes save at once, one after another (a queue, the list refreshed when it drains); each item has Show, Edit and a menu with Move up, Move down and Remove; Undo puts the one removed item back into the list as it is now, and a newer change replaces the toast; focus moves to the next item after Remove; the item sheet shows only the parts that menu uses and ignores a second Enter; the tab bar keeps five tabs in fixed places, always on show, the middle one locked | `MenuSchema` has no nesting; the review found Undo reverting later changes, a remount on every save and refused tab-bar moves | #197 |
| D246 | 24 Oct | One link picker for every `href` field (`infer.ts` gives `href` the `link` widget; a sibling `external` flag follows the pick and is hidden) and for menu items: site pages, records with a page, or a checked website, phone number or email; cmdk matches typed words (`wordFilter`), not letters spread over words; the popover is as wide as the field; the typed form stops its submit from reaching a form around the picker; `describeHref` puts a link in words for lists and shows a filtered link (`?…`, `#…`) as it is | ADMIN.md: staff never type a path; one picker keeps links valid everywhere; the review found Enter in the typed form saving the item sheet | #197 |
| D247 | 24 Oct | Draft preview lives in the web: in draft mode `readSnapshot` reads a fresh snapshot and `previewDrafts` shows drafts and scheduled records of the publish-workflow lists as Live and starts banners and announcements whose start is still to come (the snapshot already carries every record, so the API needs no drafts endpoint); the page's reads share one fetch for 1 s (on globalThis, dropped by saves and /api/revalidate). On at `/secure-admin-control/preview?path=` (session checked; signed out goes through sign-in and back), off at `/api/preview/exit`, at sign-out, and by the proxy on any public page once no staff session can be alive (no refresh cookie, no access token in date); `previewPath` checks the path again after the URL parser collapses dot segments (no `//other.site`) | Next.js 16 runs `use cache` bodies on every draft-mode request without storing them, and draft mode reads as off during the build, so public pages stay static (Context7); the review found an open redirect through `/.//` and drafts outliving the session | #197 |
| D248 | 24 Oct | Staff tools on the public site load only behind the hint (`StaffToolsLoader` + `next/dynamic`, never in frames) and take their words and admin links from `/secure-admin-control/api/staff-tools` (session and role checked; 401 when signed out, 503 when the API is away); a 401 drops the hint, stops asking and ends a preview; Edit this page follows `editTargetFor` (page screens, record editors, the feedback screen by its roles); Edit sections outlines the `data-edit` marks, focuses the first link and closes on Escape; the hint lives as long as the session can (past the browser session only with Keep me signed in); the Exit preview link builds on `lib/previewLinks.ts`, which imports nothing | Zero cost for visitors: no strings or admin modules in the public HTML, RSC payload or bundle | #197 |
| D249 | 24 Oct | Admin saves through `saveRecord`, `saveSetting` and `reorderContent` call `updateTag` for every data tag (read your own writes) and drop the preview read; the API's signed revalidation still follows for the site as a whole | The website builder's preview reloads right after Save and must show the save; Next 16 `updateTag` makes the next request wait for fresh data (Context7) | #197 |
| D250 | 24 Oct | `NotificationService.idle()` resolves once every email started in the process has been handled; intake tests wait for it after each case, so a test counts only its own emails | Intake emails are fire and forget; the last test's emails landed in the next test's count and failed main's CI after #221 (#222) | #222 |
| D251 | 25 Oct | Purpose-built editors are blueprint data, not forks: section order per record type, `layout: "writing"` for blog posts, `startWith` for a new record's first values (a new team member is shown), `bulkPhotos` for lists of photo items, and the automatic rules `lowestPrice`, `itineraryDays` and `initialsFromName` | One engine keeps every editor consistent and testable; staff never type a figure the record already knows | #198 |
| D252 | 25 Oct | Product variants are edited as a matrix of the option values (Sell, suggested stock code, price, price before discount, stock) with "Variant shown first" as a radio; variants whose values are gone are listed with Remove instead of being dropped silently | Staff task 7: typing variant ids and option maps by hand was the most common mistake in the R0 audit | #198 |
| D253 | 25 Oct | The "Optional" chip beside a label is hidden from screen readers and replaced by a visually hidden " (optional)", so a field's accessible name reads "Up to (optional)" instead of "Up toOptional" | Accessible names must read as words; e2e locators by name found the joined form | #198 |
| D254 | 25 Oct | Admin page reads treat the API's 404 as not found (`notFound()` in `adminGet`) and show the panel's own not-found screen with Trash and the dashboard | A missing record is not a failure; Try again can't help, and Trash is where a deleted record usually is | #225 |
| D255 | 25 Oct | Settings are one page: `SETTINGS_SECTIONS` maps twelve sections to settings documents (whole or by blueprint section), short lists and screens; documents are edited at `/settings/[section]` in the embedded editor and old `/content/<setting>` addresses redirect there; Users, Integrations, Audit log and Sent messages keep their addresses inside the same frame | One place for every setting without moving screens that already work; a split document (contact details and office hours) saves whole, so no field is lost | #199 |
| D256 | 25 Oct | The setup checklist is computed from settings on every view (`setupSteps`), never ticked by hand; Search Console counts either the Site settings code (which the site uses first) or the tracking one; Turnstile reads the web server's environment and shows to managers only | A checklist that can lie is worse than none; the site's own fallback decides what counts | #199 |
| D257 | 25 Oct | Staff are invited by email by default: a 32-byte token in the link, only its SHA-256 and expiry (7 days) stored, accept at `POST /auth/invite` (5 tries per address in 15 minutes), the welcome page sets the password; wrong, used and expired links read the same; a password set by the Super Admin closes the invite | People choose their own password and no password travels by email or chat; the page never tells which emails have accounts | #199 |
| D258 | 25 Oct | The audit log reads as sentences from the action and the record's own name (`auditText`), with History-style change lines; areas are action prefixes (`AUDIT_AREAS`) and days are Dhaka days | Staff read who changed which record, never ids or JSON | #199 |
| D259 | 25 Oct | Message templates are edited with Insert buttons for the template's own details and a live preview with sample details; the stored variable list stays as it is (`keep`) | Staff never type curly-bracket codes by hand, and they see the message as it will arrive | #199 |
| D260 | 25 Oct | Report downloads come as Excel and CSV; the API writes `.xlsx` itself (one sheet, inline strings, bold frozen header, stored zip with its own CRC-32) instead of adding a spreadsheet library | Excel opens it without the CSV encoding prompt; inline strings never run as formulas; no new dependency for one sheet | #199 |
| D261 | 25 Oct | Dashboard charts and sparklines are SVG drawn on the server with HTML labels and a table alternative; a panel's heading names its section | No chart library in the admin bundle for a 14-point line; labels stay readable at 390 px | #199 |
| D262 | 25 Oct | Lists name a record the way its editor does (`headingOf`: the blueprint heading or the label of a keyed title), never by its key; columns show only when a row has something for them | Group fares and store rows showed ids and keys; empty Price and Status columns read as missing data | #200 |
| D263 | 25 Oct | Records with a start and end date (banners, deals, announcements) get their own editor states, Scheduled (shows from …) and Ended, apart from publish scheduling; group fares closing within a week read "Ends soon" | The editor said "Shown" for a banner that starts next Friday; the sidebar counted fares ending this week that every row called Open | #200 |
| D264 | 25 Oct | System saves are named in words wherever a person's name would show ("the sample data", "a site update", "a store order") | "Last change by seed" and "Edited by order" meant nothing to staff | #200 |
| D265 | 25 Oct | Admin chrome is sentence case: table headers, rail labels and the Sample badge; a table that can scroll gets `scrollLabel` and becomes a named, focusable region; tab rows wrap or fade at the edge | ADMIN.md §4.2 and §13; axe scrollable-region-focusable; nothing cut off on a 390 px phone | #200 |
| D266 | 25 Oct | CI budget (#231): a normal PR runs guards, attribution, format, lint, typecheck, unit tests, build and `e2e/smoke.spec.ts`; the full suite (all e2e, public screens, API-mode e2e, VPS smoke, Lighthouse, CodeQL) runs on main, nightly (skipped when main's head already passed) and on PRs labelled `full-ci`; PRs touching the schema, deploy/, the API Dockerfile, sign-in, payments, checkout or lead intake fail without the label; adding it re-runs CI (`full-ci-label.yml`, labels read live); CodeQL moves into ci.yml (the D205 check stays, its own workflow goes); the VPS smoke skips main pushes because Docker images builds and checks the same stack there; Turborepo cache on PRs, forced off in the full suite | PR #230 cost 60 billed minutes; the private repo used about 1,870 of 2,000 free minutes in a week | #231 |
| D267 | 25 Oct | API image compiled with esbuild (`apps/api/scripts/build.mjs`): main, worker and seed bundled with the workspace packages, npm dependencies external, no source maps, names kept; the runtime stage holds dist, production dependencies, schema, migrations and prisma.config.ts only (@waafa/* and tsx move to devDependencies); a `tsx` stand-in maps the old worker command for one release; Docker Hub keeps the newest 15 releases (`scripts/dockerhub-cleanup.mjs`, warns without delete rights) | The public Docker Hub image exposed the backend source; workspace packages export TypeScript, so tsc alone cannot run them; image 2.07 → 1.7 GB | #231 |
| D268 | 25 Oct | Phase D order: #232 customer files (P0) and #233 P0 notification gaps first, then A (#229, #219, #224), B (#234, #235), C #236, D #237, E (#238, #239), F (#240, #241), J (#251–#253), K (#254, #255), G (#242–#244), H (#245, #246, #248, #247), I (#249, #250), L (#256, #258, #257), M #259 | The audit found P0 gaps (files never stored); J before K and G because OTP sign-in and online payment are PRD 1B headlines and SMS sender approval takes days; K before G and H so later screens ship with Bangla; inside H the PRD's reviews first | #231 |
| D269 | 25 Oct | The provider markup (FR-GS-07) applies to Live prices only and moves to Phase E; staging stays a local Docker rehearsal plus the CI deploy smoke (one VPS) unless the owner asks for a second server | Manual mode has no provider prices to mark up; a staging VPS costs money | #231 |
| D270 | 26 Oct | Customer files (#232): upload when picked, claim when the record is saved; an expired or failed file never fails a lead (note on the lead, "not received" in the Files panel); orders get no history note because customers see order history | Lead capture first; customers must not see staff notes | #232 |
| D271 | 26 Oct | Staff open a file through one admin route that asks the API for a 10-minute HMAC link and streams it at once (the browser never holds a lasting address); link and download are both audited; the token rides in the query (longer than Fastify's 100-character path limit) and is redacted from logs | FR-VISA-05 signed links without a reusable URL | #232 |
| D272 | 26 Oct | Files live on their own `privatedata` volume; in production uploads pause (503, the form still sends) when the folder is not a mounted volume, so a server with the old bundle never stores files that a deploy would wipe | The owner copies deploy/server by hand | #232 |
| D273 | 26 Oct | File types are decided by their first bytes (shared `sniffCustomerFile`), checked in the web route and again in the API | Names and declared types are visitor-controlled | #232 |
| D274 | 26 Oct | Upload limits beside the rate limits: 40 MB of unclaimed files per visitor, 2 GB in total, uploads pause under 2 GB free disk, unclaimed files go after 6 hours; a form sent while a file is still uploading asks the visitor to wait (shared in-flight counter) | A full disk would take PostgreSQL down with it | #232 |
| D275 | 26 Oct | Staff alert recipients live in `leadFormSettings.staffAlerts` (email and areas: the request modules, orders, payments, feedback, low stock), edited in Settings › Forms and messages; each alert goes to everyone listed for its area, one email each; while nobody covers an area its alerts go to `STAFF_ALERT_EMAIL` as at launch | No new settings document or screen; deploys change nothing until staff fill the list | #233 |
| D276 | 26 Oct | The booking-mode change reason, active providers and fallback (FR-GS-01 rest) ship with the Phase E Live gate (FR-GS-04): until then no save can change a mode (Live stays locked), so a reason prompt would never show | Avoids dead UI; the gate needs the reason, typed confirmation and health checks together | #233 |
| D277 | 26 Oct | The EMI request (PRD §11) is a card under the calculator that opens the shared two-step request in a dialog, loaded on open (like the corporate quote, D174); banks come from Settings › EMI banks with "Not sure yet" | The board has no form (only "Ask for EMI on my booking"); the PRD wins on scope | #233 |
| D278 | 26 Oct | Admin date ranges use one themed picker (`AdminDateRange`): presets plus a one-month range calendar in a popover, loaded on open, written to the address as from/to; native date inputs stay only inside forms that need a single day | Browsers showed US mm/dd/yyyy; one control for every list and report | #229 |
| D279 | 26 Oct | Fixed lists (message templates, home sections, page images, store rows, service pages, menus) can't be moved to Trash: shared `canDelete`, the editor and bulk bar hide it, the API answers 409 `fixed` | The site's code expects every record in them; staff switch one off instead | #229 |
| D280 | 26 Oct | Office phone numbers are typed once with the country code; the number as shown follows (`phoneDisplay` auto rule, libphonenumber national format, e.g. 01712-345678); the phone picker's countries are picked by name and the first is the default | The review found each number asked twice and ISO codes staff don't know | #229 |
| D281 | 26 Oct | Newsletter is a tab beside Customers (ADMIN.md §3.1) shown to roles that may open it; Sent messages, Search activity and the Audit log join the DataTable with a search box; the Audit log keeps its sentences and shows the changes in the side sheet instead of day groups | One list pattern everywhere (ADMIN.md §10) | #229 |
| D282 | 26 Oct | First-load JS = the scripts a page's HTML references (`<script src>`, script preloads), counted as transferred gzip bytes; later prefetches and on-tap code are not counted | The old count (every script until load) varied by up to 56 KB with idle-time prefetch timing | #224 |
| D283 | 26 Oct | Admin lists on 100 rows (issue 219): table rows lose their colour transition and overlays and admin bars lose backdrop blur; the INP e2e checks the 100-row page too | Headless measurements: Select all 96/80 → 64/48 ms without row transitions; closing a sheet 128–192 → 56–88 ms without blur | #219 |
| D284 | 26 Oct | Two-step sign-in is TOTP (RFC 6238, SHA-1, 6 digits, 30 s, one step of drift) written on node:crypto and checked against the RFC vectors; secrets sealed with AES-256-GCM under a key derived from JWT_SECRET; the last accepted step is stored so a code works once | No new auth dependency; JWT_SECRET is the one secret every API already has (PROVIDER_SECRET_KEY is optional) | #234 |
| D285 | 26 Oct | Super Admin and Admin must set it up before their first session (`TWO_STEP_REQUIRED_ROLES`), and a refresh for such a person without it ends the session; other roles turn it on in My account. Ten one-time recovery codes (hashes only); wrong codes count toward the same 5-try lockout; "Trust this device for 30 days" needs the browser's httpOnly device cookie | PRD §11 FR-ADM 2FA; the trusted device keeps daily sign-ins quick without weakening a new device | #234 |
| D286 | 26 Oct | Sign-in history keeps every attempt on a known account for a year (minute job); a new-device email (`staff-new-device`, seed patch) goes out only when the person had signed in from another device before, so the first sign-in after the release sends nothing | Useful alert without a flood on release day | #234 |
| D287 | 26 Oct | API rate limits live in Redis (fixed windows, hashed keys, fall back to the process when Redis is unreachable, never off) with the NFR-SEC 10 lead requests an hour per phone; per-address lead limits keep the web's 10 a minute (API 20) instead of the PRD's 5, because one office address can send several real requests; `RATE_LIMIT_FACTOR` raises limits for e2e only | NFR-SEC; D-level choice logged as a deviation | #234 |
| D288 | 26 Oct | The QR code is drawn as one SVG path from a matrix made on the server with `uqr` (zero dependencies, about 10 KB, server-only) | No QR library in any browser bundle | #234 |
| D289 | 26 Oct | E2E: a Playwright setup project signs the seed Super Admin in once (enrolling on a fresh database), trusts that browser and keeps only its device cookie as every spec's storage state; the secret stays in git-ignored e2e/.auth for local runs | Every spec keeps its own sign-in, and no test-only bypass exists in the API | #234 |
| D290 | 26 Oct | From the independent review: each lock in the last day doubles the next (15, 30, 60 minutes… up to a day); a lock reached at the code step emails the person (`staff-code-locked`, seed patch); enrolment claims `totpEnabledAt` atomically; the two-step cookie path is `/` (locale prefixes); focus moves to each new step's heading; a reset for optional roles says it turns two-step off | Someone with the password could otherwise guess codes five at a time forever, unseen | #234 |
| D291 | 26 Oct | Malware scan runs in the worker as a 10-second pass over unscanned files (no queue); with `CLAMAV_URL` set staff open only clean files, a hit moves to `quarantine/` and stays for the normal retention; without it (development, tests, an old bundle) files open as before | The worker owns background work; polling survives restarts and a scanner outage without lost jobs | #235 |
| D292 | 26 Oct | ClamAV 1.5.4 official image with freshclam inside, 1.6 GB limit, signatures in a volume; the VPS minimum becomes 8 GB | Owner's 8 GB VPS (PROMPT 10 letter B); clamd needs about 1.2 GB | #235 |
| D293 | 26 Oct | Radio group, checkbox, switch and tabs keep the shadcn API but render native inputs and buttons (`components/ui/{radio-group,checkbox,switch,tabs}.tsx`); the tick is a CSS mask (`checkbox-tick`), the switch thumb a pseudo-element; tab triggers carry `data-active` so the intended active styles finally apply | Radix roving focus, collection and presence cost about 8 KB gzip on every page with a form or the search card; native radios give arrow keys and one tab stop for free | #236 |
| D294 | 26 Oct | next-intl messages compile at build time (`precompile: true`); messages may not use empty plural or select branches (a unit test checks) and `t.raw` is not used (pass a placeholder back instead) | Saves the ICU parser (about 9 KB gzip) on every page; the earlier attempt (D154) broke on exactly those two patterns | #236 |
| D295 | 26 Oct | Overlays and second steps load on first use: preferences sheet (`PreferencesSheet`), corporate quote and EMI dialogs (`LazyDialog`), package, visa, plan-my-trip, printing and trading second steps (`next/dynamic`), checkout form after hydration behind the same placeholder; the contact step drops react-hook-form | Every public route at 200 KB or less (Home 200, Flights 192, Shop 196, Checkout 182); the first step is three fields | #236 |
| D296 | 26 Oct | Submit handlers keep the busy flag and idempotency key in a ref (`useSubmitOnce`) | With validation loading on first use both taps of a double tap reached submit before a re-render and sent two keys (caught by the flights e2e; never live, main validates synchronously) | #236 |
| D297 | 26 Oct | `pnpm guards` and the CI Guards job run `client-boundary.mjs`: no Client Component may import LocalLink, next-intl/server, server-only or next/headers, directly or through a shared file (Server Actions excepted) | An earlier commit on the branch put the async LocalLink into EmptyCart and CheckoutSummary, which the cart and checkout render on the client: both pages crashed after hydration | #236 |
| D298 | 26 Oct | Lighthouse in CI fails on accessibility, best practices, SEO (95) and CLS (0.1); performance 90, LCP 2.5 s and TBT 200 ms are `targets` reported as warnings until every key route meets them (#271) | Eight of eleven key routes reach 90 after #236; Home 87, Hotels 86 and Blog 88 need structural work (streamed Suspense reveal, RSC payload), and a failing job would block every full-ci merge meanwhile | #236 |
| D299 | 26 Oct | Record detail pages (package, product, visa country and apply, blog post, visa guide, album, flight route) keep their Suspense boundary; its fallback fills the screen | In API mode (production) the snapshot reads `draftMode()`, which is request data: without the boundary a record added after the build (or a moved slug) failed with "uncached or runtime data during prerendering" (caught by the API-mode e2e on PR #272, never live) | #236 |
| D300 | 27 Oct | Owner's work order replaces D268: #276 flaky test, F (accounts and /track, email code sign-in), then D, E, G, H, I, J, K, #271, L, M, content readiness; PRs touching public pages carry `full-ci` (CI Lighthouse) | Owner, 27 Oct: accounts and tracking before measurement; no SMS for sign-in | #276 |
| D301 | 27 Oct | Customers sign in with an email one-time code (6 digits, 10 minutes, single use, 5 tries, HMAC-stored, newest code only) or Google; no phone OTP or SMS for sign-in. Sign-up on the same screen (code, then a 15-minute ticket in an httpOnly cookie, then name and phone; phone not verified). Every code request gets the same answer; limits 5 an hour per email and 20 per address. Guest records attach by verified email, or by phone only when the record has no email; staff attach by hand (audited). Header, drawer and More read a readable hint cookie so the page shell stays static. Admin can turn an account off and sign it out everywhere | Owner, 27 Oct: no SMS cost or sender approval for sign-in; one screen for sign-in and sign-up; no enumeration | #241 |
| D302 | 27 Oct | My account (issue 278): offer emails are opt-in (off until the customer turns them on); service emails about requests and orders always go. Saved travellers keep the passport number sealed with AES-256-GCM (key from the server secret) and only its last 4 digits readable, shown masked even to the owner; editing without a new number keeps the old one. A password is optional (argon2id, 10 to 128 characters), never required; a forgotten one is replaced by an email code sign-in; 5 wrong passwords per email and address in 15 minutes are refused with one neutral message. Save buttons and checkout prefill read `/api/account/summary` after hydration so package, product and checkout pages stay static | Owner, 27 Oct: optional password later, reset by email code; passport fields encrypted at rest | #278 |
| D303 | 28 Oct | Owner's order of 28 Oct replaces D300: finish every P0 and P1 PRD row (exceptions: waiting for an owner account with the adapter built and off; Phase E and P3 rows); no deploys during development, one release at the end with docs/RELEASE.md and an upgrade rehearsal; an integration hub before D and E; checkpoints with local screenshot paths; hands-on checks in docs/qa/UAT.md; QA numbers in docs/qa/SUMMARY.md | Owner, 28 Oct | #284, #285 |
| D304 | 28 Oct | Integration hub: every outside service is a provider card (new kinds captcha, analytics, monitoring, storage, alerts, courier). The site reads only catalog-listed public fields through `GET /public/integrations/status` in a cached accessor that every save expires (hours lifetime, seconds when the API is unreachable), so a change needs no rebuild and pages stay static. Turnstile tokens are checked by the API with the sealed secret; the web image carries no key. Saved secrets never come back (the audited reveal is removed; last 4 only). Measurement, monitoring, storage and Telegram cards have one Live set. A service whose last test failed is not used until a test passes. Settings › Tracking and the two verification fields retire (kept in the record, hidden); a seed patch moves their values and .env Turnstile keys onto the cards once | Owner, 28 Oct: one place, no redeploy, secrets never in the browser | #284 |
| D306 | 29 Oct | Sitemap: /sitemap.xml is a route-handler index of five parts (/sitemap/<part>.xml); Next cannot serve a metadata sitemap beside it. Share images: a record photo when there is one (visa countries now share their cover), else a next/og text card in the brand colours at /og/<kind>/<slug>.png (text only, so no drawn or generated picture; the extension keeps it out of the locale proxy) | Owner, 28 Oct | #287 |
| D305 | 28 Oct | Measurement: UTM, referrer and landing page remembered by the proxy in the httpOnly first-party cookie waafa_src (no script; UTM replaces, a referrer only fills, our own host never counts) and added to leads and orders (Order.source); conversions announced by track() and sent only by the EventBridge mounted inside the consented analytics scripts, once per reference; Reports "Where leads come from" | Owner, 28 Oct | #237 |
| D307 | 29 Oct | Error tracking without an SDK: the API posts Sentry envelopes (GlitchTip reads them) to the DSN of the card that is On, read every minute by a Nest provider started after boot; the worker reports final job failures and scan errors; the web server reports request errors through instrumentation onRequestError → POST /public/errors. Browser errors are not sent (the 200 KB budget). Dead letters = the BullMQ failed list of the notifications queue, with audited Retry and Discard on Settings › System status | Owner, 28 Oct | #238 |
| D308 | 29 Oct | Backups install themselves (cron from deploy.sh, BACKUP_CRON=off to opt out); one backup.sh for deploy/ and deploy/server with --drill; the off-site copy goes through the API (S3 SigV4 PUT, no SDK) to the R2 or B2 card; disk and memory alerts from the minute job (10 % or 2 GB disk, 5 % memory, six hours apart); lead limit 5 a minute per address (web) and 10 (API); CSP nonces stay out (documented exception); staging is an optional second VPS behind Cloudflare Access running the live images (STAGING=1) | Owner, 28 Oct | #239 |
| D183 | 19 Oct | The admin follows `docs/design/ADMIN.md` (epic #201); the Admin* boards are no longer the floor; HANDOFF's admin row and the old admin page rules point to it | Owner feedback 19 Oct: confusing admin, raw forms, manual statuses; the boards encoded the same generic patterns | #190 |
| D184 | 19 Oct | Admin sidebar stays midnight-950 (text mist-300 12.7:1, muted mist-400 8.3:1) with a light work surface | ui-ux-pro-max did not recommend a light sidebar; dark navigation separates moving around from working and keeps the brand | #190 |
| D185 | 19 Oct | Status chips: six families (info, progress, success, warning, danger, neutral), each icon + word + colour + a "why" tooltip; new tokens sky-50 #ECF6FE, sky-700 #00459C, success-700 #005836, warning-800 #8C4A00, danger-700 #AF120D from ui-color-palette scales; existing hex values unchanged | Every chip pair ≥ 6.2:1; colour is never the only signal | #190 |
| D186 | 19 Oct | 21st.dev picks (ADMIN.md §14): uvain/file-upload, originui/image-crop + in-house focal point, diceui/sortable, diceui/kanban + Move menu, corr/stepper, uvain/revenue-charts-kpi with an SVG sparkline, olewandowski1/timeline-3, cnippet-dev/v-combobox-13, serafimcloud/empty-state, sean0205/c-calendar-16, felipemenezes098/collapsible-05 on shadcn Sidebar, patrick-xin/vercel-notification-popover; installed when the issue that needs them starts | Owner: compare at least three options per need; picks favour keyboard support, dnd-kit and react-dropzone (pre-approved) and calm motion | #190 |
| D187 | 19 Oct | Record editors stay on the generic SchemaEditor with a typed blueprint per content key (no fork); React Hook Form + zod only for small fixed forms; content URLs stay `/content/[key]`, new routes for website/home, website/menus, visa-applications and settings/[section] | Owner rule (engine, not a fork); stable URLs need no redirects | #190 |
| D182 | 14 Oct | Photos at quality 65 (AVIF ≈ 41), logo at 90, widths up to 2560, image cache 31 days, share images at 1200 px through the optimiser, shipped JPEGs at mozjpeg q80 | Owner: lighter images; 65 is 25 to 28% smaller than 75 with no visible change (side-by-side crops); WhatsApp drops previews over 300 KB | #185 |

| D309 | 30 Oct | Bookings: one Booking per lead, created in the same transaction as Convert and kept when the lead is reopened (a second Convert corrects the amount); payment status follows amount and paid unless Refunded; Accounts see every booking, other roles follow lead access; documents reuse the customer files store (owner "booking") | Owner, 28 Oct | #242 |
| D310 | 31 Oct | Quote builder: the customer's link is `<quote id>-<HMAC signature>` with JWT_SECRET (staff can copy it again; withdrawing closes it; a dot would send it past the locale proxy); emails carry the link, not an attachment (the queue stays small) and the PDF is rendered on demand by the API with pdfkit 0.20.2 (new dependency: the smallest maintained Node PDF writer that embeds fonts and mixes them in a line, needed for ৳) with Inter, Plus Jakarta Sans and Hind Siliguri WOFF files in apps/api/assets; accepting withdraws the lead's other open quotes; Convert starts with the accepted price; sending is the lead's "Log quote" step | Owner, 28 Oct | #298 |
| D311 | 28 Oct | The store is "Waafa’s World" (was "Waafas World"): typographic apostrophe in visible copy; structured data "Waafa's World" with alternateName "Waafas World" (only `lib/seo/schemaNames.ts` may hold the old name, enforced by guards); route /shop and domain unchanged; the live rename is a seed patch that changes only strings still equal to an old default, across every content document and setting (wider than menus, home and store so emails and pages follow; exact match keeps it safe) | Owner, 28 Oct evening | #302 |
| D312 | 28 Oct | Owner's decisions of 28 Oct evening: (1) no hotfix, no deploy until the one release; the live server runs **7af26e7** (Docker images run #30, PR #187, 14 Oct; api/worker `sha256:b52c4bb5…a61a8e1`, web `sha256:023a177a…6a3d6a`, 13 Oct deploy/server bundle), so RELEASE.md and the upgrade rehearsal start there; (2) photos, videos, documents and backups stay on VPS volumes, no R2 or other outside storage now (the off-site card stays built, off, optional); (3) keep the software light (OPTIMISE issue: image sizes, RAM, disk, front-end budgets); (4) rename (D311). Integration cards (every existing card and #251–#253): Banglish step-by-step help to get the keys, every value to paste into the provider's panel (callback, IPN, success, fail, cancel, webhook URLs, server IP) with Copy, a Telegram "Find my group" helper, and one plain sentence when Test connection fails; nothing ever needs code or the server .env | Owner, 28 Oct evening | #302, OPTIMISE, #251–#253 |
| D313 | 28 Oct | Images: API and web on Alpine with only the node binary (no npm, corepack, pnpm); the API bundles every npm dependency except sharp, argon2, pdfkit, bullmq and ioredis (copied with their dependencies by collect-runtime.mjs) and applies migrations with its own pg runner compatible with `prisma migrate deploy` (Prisma CLI is a dev tool only). Budgets enforced by measure-stack.sh: api 400 MB, web 500 MB, nginx 100 MB, stack 3 GB. The web target of 250 MB is not met: 127 MB is the node binary and about 110 MB the prerendered pages and their prefetch segments (`partialPrefetching`), which keep pages instant; dropping them would trade speed for disk, so it stays and is revisited with #271 | Owner targets (D312); measured: api 2.07 GB → 270 MB, web 571 → 464 MB | #303 |
| D314 | 28 Oct | ClamAV stays always on (customer uploads are scanned within seconds) with `ConcurrentDatabaseReload no`: one signature set in memory, so the daily reload no longer doubles the peak; scans wait about a minute during that reload (the worker retries every 10 s). On-demand clamscan was rejected (each scan loads the whole database, about 20 s and the same peak memory) and stopping clamd when idle needs the Docker socket in a container (a security cost) | Steady stack under 3 GB with clamd loaded; the trade-off is a one-minute pause a day | #303 |
| D315 | 28 Oct | Disk: container logs 10 MB × 3; backups `BACKUP_KEEP_DAYS` (default 7, was 14), compressed; unused images older than a week removed after each deploy; Docker Hub keeps 10 releases and always `deploy/LIVE_RELEASE`; Next image cache 512 MB; nginx cache 600 MB (existing); uploads already stored once as WebP; Trash already purged after 30 days. Admin first-load JS measured (lists ≈ 306 KB, editors 380–400 KB with heavy parts on demand); further admin splitting goes with #257 rather than risk the shell now | Owner (D312 item 3) | #303 |
| D316 | 28 Oct | Real-time alerts are Server-Sent Events, not WebSockets: one API stream per tab (`GET /admin/events`) passed through the web (the BFF keeps the token in an httpOnly cookie), events fanned out from one Redis channel per process and filtered per person; the 30-second inbox poll stays as the fallback and the stream only says "something arrived" (the data comes from the inbox call). Personal alerts (mention, due reminder, lead handed out) are stored per person and read in the bell; no email for them (staff alert emails by area already exist). The chime is two notes made with Web Audio (no sound file), on by default per device, playable only after the first click (browser rule). Round-robin: a per-person switch "Takes new leads in turn", the service from the person's roles, longest waiting first, only in office hours (after-hours leads at opening), and a lead ever assigned is never auto-assigned again so a deliberate unassign sticks | Owner order step 3; no new dependency; nginx and Next compression must not buffer (`no-transform`, `X-Accel-Buffering: no`) | #243 |
| D317 | 28 Oct | Custom roles are named bundles of built-in roles (Travel sales, Visa officer, Content editor, Shop manager, Accounts), never Super Admin or Admin, expanded into the token when it is signed, so every existing role rule keeps working and two-step rules stay with built-in roles; a finer per-screen matrix would need every check in the API rewritten. Customers stay keyed by phone (D157): merge points one number at another and lists fold it in (reversible). Summary emails reuse staff alert areas and the queue (no new setting screen); 09:00 Dhaka, weekly on Saturday | Owner order step 4; safest change to access control | #244 |
| D318 | 28 Oct | Reviews: only signed-in customers whose account holds a booked package request or a delivered order with the product (the API refuses everyone else, so no review can be invented), one per item, approved by staff before they show; names as first name + initial. Structured data: Product gets AggregateRating and Review from approved reviews only; packages (TouristTrip) get none because schema.org has no rating there. Questions: anyone may ask (Turnstile, limits), shown only with a staff answer. Feedback photos: copied into the public media library at approval only when the scan passed (or no scanner), the private upload stays private | Owner order step 5; "never invent reviews" | #245 |
| D319 | 28 Oct | Flash sales are deals with an optional start and stock cap, enforced only by the API when it takes an order (counting units sold at the deal price since the start, inside the locked order transaction); a cart may show the flash price until the cap is reached and the order is then charged the normal price (the confirmation shows it). Campaign pages are a content list with a request-time strip in its own Suspense so the rest prerenders; no slug redirects for them (short-lived pages) | Owner order step 7: "price and cap enforced on the server" | #247 |
| D320 | 29 Oct | CSV import (products, group fares, compatible models) merges each line into the saved record and saves through the normal editor save, so rules, History, audit and cache stay one path; the whole file is refused while any line has a problem; it never deletes; products update existing products and variants only (new ones need photos, added in the editor). Invoices are drawn from the order's price snapshot; the seller block shows only the name and contacts (no licence or ID numbers), the customer's BIN only when they asked for a VAT invoice; the VAT amount shows only when Admin sets a rate (no invented number) | Owner order step 8; CLAUDE.md "Never show licence or ID numbers" | #248 |
| D322 | 29 Oct | Partial capture keeps step 1 in its own table (`LeadDraft`), not as a half-valid lead: leads keep one strict contract, and the Incomplete queue, its retention (30 days) and its single reminder stay separate. It is opt-in on step 1 (consent, PRD FR-FLT-08), shown to staff only after 30 minutes, and the full request completes it in the same transaction, so there is never a duplicate. The reminder links only to a path on this site | Owner order step 9; PRD §13 privacy | #250 |
| D321 | 29 Oct | Curated hotels are a content list with their own pages; Request booking reuses the hotel request (/hotels?hotel=&room=) instead of a second form, so one lead flow and one set of rules; the hotel fields ride along only while the place still names the hotel. Amenities are a fixed list (icons and words in code and messages) so cards stay consistent; prices are "from" per night and labelled indicative. Sample hotels use real Unsplash room, lobby and pool photos (no renders) and say they are samples | Owner order step 9; FR-HTL-02; CLAUDE.md media and "never fake live availability" | #249 |
| D325 | 29 Oct | Courier booking ships for Steadfast first: one adapter, the order reference as the courier's invoice (so status is read by it and nothing new is stored), tracking through the existing ship step (SMS and history for free), status by webhook plus a 30-minute check as the safety net. Pathao and RedX keep their cards and Test connection; their booking adapters wait until the owner opens those accounts (cut list). The webhook token is an HMAC of PROVIDER_SECRET_KEY, so there is no new secret to store or rotate | Owner order step 10; FR-SHOP-14; CLAUDE.md "outside services through Admin › Integrations" | #253 |
| D324 | 29 Oct | SMS carries status messages only (request received, order placed and its real steps, visa stage) from four admin-editable SMS templates; sign-in codes have no SMS template (D300). SMS text stays ASCII ("WAAFA:" instead of the store name) so one message is one 160-character GSM SMS, not three Unicode parts. The first SMS card that is on, in its mode, with a last test that did not fail, sends; nothing is logged while SMS is off. Telegram posts plain text (no parse mode) with the reference, a short summary and the admin link, never phone, email or documents, because the group is outside our access control. Find my group reads getUpdates without a webhook, so the owner never types a chat ID | Owner order step 10 and the integration-card brief; PRD §13 privacy; D300 | #252 |
| D323 | 29 Oct | Online payment goes through the existing PaymentProvider adapters; the gateways call back to the web app (/api/payments/…), which passes the fields to the API, and the API believes only the gateway's own answer (validation, execute, verify) with the order's server-side total. Only gateways on, in Live mode and with Live keys are offered, so a sandbox never takes a customer's money and nothing shows before the owner's keys. Refunds are made in the gateway's panel and recorded on the order (no refund API calls until each gateway's refund contract is certified). The Nagad contract follows Nagad's published v-0.2.0 flow and is verified in its sandbox when the keys arrive | Owner order step 10; PRD FR-SHOP-07; CLAUDE.md "Never show online payment before it is live" | #251 |

## 9. Bugs and known issues

| Issue | Severity | Where | Status |
| --- | --- | --- | --- |
| #276 API-mode hero photo task flaky: continued on any level-1 heading before the editor loaded, uploaded into the first empty zone, clicked before hydration (PR #272, passed on re-run) | P1 (test only) | apps/web/e2e/admin-staff-tasks.spec.ts | ✅ Fixed in #276 (URL wait, whenHydrated, exact Photo field, preview change) |
| #263 Hotel stay e2e checked a day the desktop calendar did not show when check-in fell near a month's end (CI on 26 Oct, check-in 31 Oct) | P2 (test only) | apps/web/e2e/search.spec.ts | ✅ Fixed in #232 (goes to the next month to check it) |
| #232 Customer files (visa documents, payment slips, attachments, feedback photo) never left the browser; staff got only the file names (Phase A rule D87/D106/D109 never lifted). Found in the #231 audit | P0 | forms, API | Fixed in #232 (private storage, signed links, e2e) |
| #224 Budget e2e: the first attempt on /tour-packages, /visa and /shop counts about 100 KB more first-load JS on a freshly started CI server; the retry passes (seen on #221 and #223) | P2 (test only) | apps/web/e2e/budget.spec.ts | ✅ Fixed in #224: the spec counts only the scripts the page HTML references (idle-time prefetches made it racy, cold or warm); stable over cold and warm runs |
| #225 Admin: opening a record that does not exist shows "This page didn't load" (adminGet throws on the API's 404; no not-found screen in the panel) | P2 | apps/web/src/lib/admin/adminApi.ts | Fixed (adminGet → notFound, panel not-found screen, e2e in admin-shell) |
| Main CI after #223 (9b0b5cb): the workflow spec could not click Schedule because a toast lay over the sticky action bar and hovering kept it open | P2 (test and staff) | components/admin/AdminShell.tsx | Fixed in #226 (toasts above the action bar, regression check in admin-editors task 11); main CI green on 137428f |
| #222 Intake tests counted emails from the test before (fire-and-forget emails landed after the next test emptied the list); main's CI failed after #221 | P1 (test only) | apps/api/test/public.test.ts | ✅ Fixed in the #197 PR: `NotificationService.idle()` and an afterEach wait, with a unit test (D250) |
| Media library e2e looked for the sheet by its old title after Save renamed it (a race the PR run won and a local run lost) | P2 (test only) | apps/web/e2e/admin-media.spec.ts | ✅ Fixed in the #197 PR: the sheet is found by its new title |
| R7 review before the PR (2 P1, 7 P2, 11 P3): open redirect through `/.//` in the preview path, Enter in the link picker's typed form saving the item sheet, drafts outliving the session, stale sheets, Undo reverting later changes, remounts dropping focus, drag-only reorder, preview reloading too early, preview frame in the tab order, and smaller ones | P1 | website builder, preview, staff tools | ✅ Fixed in the #197 PR with unit and e2e tests (D243–D249) |
| #219 Admin DataTable on a 100-row page: Select all and closing the sheet take 190 to 240 ms to paint on the low-memory machine (style recalculation of the whole page); the 25-row default stays under 130 ms | P2 | admin lists | ✅ Fixed in #219: no row transitions, no blur behind overlays; 100 rows stay under 200 ms in the e2e |
| Local `next dev` on the H: drive reloads admin pages in a loop and compiles very slowly with about 1 GB free (19 Oct) | P2 (local only) | apps/web dev server | Workaround: `next build` + `next start` on :3100 against the API on :4000 and a dev PostgreSQL on :5433; production and CI unaffected |
| #154 Search e2e picked today+75 days; on 13 Oct that is 27 Dec, which the stacked phone calendar also shows as an outside day in January, so the locator matched two buttons | P2 (test only) | apps/web/e2e/search.spec.ts | ✅ Fixed in #153: date locators skip outside days |
| #142 From 1280 px the Log in words pushed the header controls about 25 px past the page grid (no scroll, off the grid); the server-rendered nav skipped More until hydration, shifting the header | P1 | header | Fixed in the #142 PR: icon-only Log in on every desktop width (words in the phone menu), nav items 6 px apart below 1280 px and 8 px from 1280 px (CI fonts render ~14 px wider: 1024 px was 9 px past the grid there), More rendered in the static nav; e2e: no-JS nav shows More, grid and nav-gap check at 1024 to 1920 px |
| #140 Header still 8 px too wide at exactly 1280 px (xl) once the Log in label showed, and at 1440 px the label wrapped to two lines (design review of the local screenshots); CI fonts render narrower, so only the local Docker run caught it | P1 | header | Fixed in the #140 PR: words from 1360 px (theme breakpoint `hd`, 85rem) on one line, icon-only 1024–1359 px, nav items 8 px apart below 1280 px (CI fonts render wider: its 1024 px frame showed the icon cut off); measured locally at 1024–1440 px; CI overflow loop at 1024/1280/1300/1360/1440 |
| #138 With Accounts live on, the desktop Log in button pushed the header 40 px past a 1024 px screen; deleting an account ended on the error page (server action redirect into the streaming /login, React error 412); sign-in redirects sent local runs to the production domain | P1 | header, /account, sign-in routes | Fixed in the #138 PR with unit, fixture e2e and API-mode e2e regression tests and a local run on the Docker stack |
| #119 First lead after an API restart failed (5 s transaction timeout on a cold start); reports prerender log | P1 | API intake, admin reports | Fixed in #120 with a regression test |
| #89 Product page photo had zero width (zoom button without width) | P0 | /shop/p/* | Fixed in #90 with an e2e size check |
| Fixture images point at `/media/...` files that only land on `main` with A5 | P1 | fixtures, every image | ✅ Fixed in #5 |
| Boards disagree on two shop numbers: COD cap ৳20,000 (FAQ, Terms) vs ৳25,000 (admin sample); free delivery over ৳3,000 (admin) vs ৳5,000 (product page). Fixtures use ৳20,000 and ৳3,000 until the owner confirms | P2 | fixtures (shop settings) | Owner question |
| Phase A references restart at 0001 whenever the dev server restarts (no storage before the API) | P2 | lead intake | By design until Phase C |
| Visitors who dismissed the announcement may see it collapse right after hydration on their next visit | P2 | announcement bar | Accepted (D50); revisit if field CLS shows it |
| #39 / #91 Home first-load JS over budget | P1 | `/`, search pickers | Issues closed (#106: home 318 → 215 KB); still over 200 KB on Home 217, Flights 258, Shop 215: PROMPT 10 letter C |
| #51 Lead steps lost travellers and rooms without a search; broken deep links; footer second logo; SEO gaps | P1 | flights, hotels, store bar, footer, SEO | Fixed in #51 |
| #60 VAT invoice BIN accepted only the letter d (regex lost its backslash), so every VAT-invoice order failed | P0 | checkout, shared contract | Fixed in #56 with a regression test |
| #61 After a refused order the checkout kept the idempotency key and the web cached the refusal, so fixing the cart did not help for 10 minutes | P0 | checkout | Fixed in #56 with a regression test |
| #52 Signature motion moments missing (flight path, results morph, route arc, add-to-cart arc, magnetic buttons) | P1 | home, flights, store | ✅ Fixed in #52 (flight path, route arc, add-to-cart arc, magnetic buttons, boarding pass, visa ticks); the search → results morph and the card → detail transition (D140) are PROMPT 10 letter L |
| Hotel stay picks past 30 nights reset the check-in | P2 | search card | Fixed in #8 with a regression test |
| Chip radios in the flights and hotels second steps were off-centre (the hidden radio stayed in the flow) | P2 | `/flights`, `/hotels` | Fixed in #11; e2e covers the steps |
| Package detail first-load JS about 440 KB, Lighthouse mobile 68 | P1 | `/tour-packages/[slug]`, `/plan-my-trip` | Improved in #39/#106/#170; re-measured in PROMPT 10 letter C |
| Header links to routes not built yet (`/gallery`, `/feedback`) 404 on prefetch | P2 | header | ✅ Fixed (every linked route exists since A17) |
| Dev error "URL data during prerendering" on package detail and other param pages | P2 | dynamic param pages | Fixed in #12 (D85) |

## 10. Cut list

If time runs out, cut in this order (PRD §17). Never cut security, lead capture, the admin leads module, compliance
or accessibility.
Proposed 25 Oct for Phase D (lowest impact first; applied only if progress falls behind at a checkpoint): 1) admin dark
mode #257; 2) custom roles, search funnel, scheduled reports and merge customers #244; 3) campaign pages and flash
sales #247; 4) benchmark extras beyond fixes #258; 5) Buy again and save for later (wishlist stays) #246. Applied 29 Oct (D325): Pathao and RedX booking adapters wait for the owner's accounts (Steadfast ships first). Never cut:
#232 files, #233, security #234 #235, payments #251, accessibility, compliance.

1. Gallery video embeds
2. Blog extras (related posts, contents list)
3. Part-code search in Find by model
4. Proposed now (behind by 3 issues): 21st.dev desktop-only flourishes (tilt, spotlight, magnetic) move to A22 polish; the About route map ships as a static SVG first
6. Applied 11 Oct (D138): bespoke admin editors (package day builder, product card preview, category tree drag, rich text, media uploads), customers, reports, bookings and convert to booking, lead board, charts move after launch; the generic editor covers every content key on launch day
5. Proposed 10 Oct 01:20 (behind by 6 issues, Phase A due 11 Oct): admin builders (itinerary days, visa checklist, menus, home order) ship as ordered lists with move up/down buttons first, drag-and-drop (dnd-kit) after launch; admin catalogue and content screens (A19–A21) share one list + form pattern instead of bespoke layouts; A22 polish runs inside each issue's verify step, leaving A22 for the cross-route beat check only; Pick-d boards' two-month desktop calendar stays, the phone calendar shows a scrolling list of months

## 11. Blockers and owner actions

Hosting today: the owner's VPS (D141) runs the Docker Compose stack from images that GitHub Actions pushes to Docker
Hub (`emon6107/waafa-ota-platform`, D161, D171); email goes out through Resend (D155); photos live on the VPS media
volume (D156). Steps: `docs/DEPLOY.md`. Keys go into Admin › Integrations (or the named line of the server `.env`),
never into chat, code or the repository. Each Phase D adapter ships switched off until its keys are saved.

| Item | What I need from the owner | Exact steps | Needed for |
| --- | --- | --- | --- |
| GitHub Actions minutes | A decision: the private repository used about 1,870 of 2,000 free minutes between 19 and 25 Oct | github.com/settings/billing → check usage; either add a payment method with a small Actions budget, or make the repository public again (minutes free). #231 cuts a normal PR from about 60 to about 10 minutes, but each merge to main still runs the full suite | every PR |
| Docker Hub private | Read-only access token on the server, then the repository private | `docs/DEPLOY.md` → Private repositories (token → `docker login -u emon6107` on the server → Make private → `sh deploy.sh`) | now (#231) |
| Docker Hub token for clean-up | The GitHub secret `DOCKERHUB_TOKEN` with Read, Write and Delete access | Docker Hub → Personal access tokens → new token (Read, Write, Delete) → GitHub repo → Settings → Secrets → Actions → `DOCKERHUB_TOKEN` | keeping 15 releases (#231) |
| Deploy R9 and R10 | Backup first (R9 has a migration) | `cd /opt/waafa && sh backup.sh && sh deploy.sh` | now |
| Dependabot alerts | Turn on alerts and security updates | GitHub repo → Settings → Code security → Dependabot alerts → Enable; Dependabot security updates → Enable | now |
| SSLCommerz | Sandbox store now, live merchant later | developer.sslcommerz.com → sandbox store ID + password → Admin › Integrations › SSLCommerz | letter J |
| bKash payment gateway | Merchant account with the PGW (tokenized checkout) | Talk to bKash merchant sales → sandbox app key, secret, username, password → Admin › Integrations › bKash | letter J |
| SMS gateway | BulkSMSBD or SSL Wireless account and an approved sender ID (takes days: start early) | Sign up → API key + sender ID → Admin › Integrations › SMS | letters F (phone OTP), J |
| Courier | Steadfast merchant account (then Pathao or RedX) | Steadfast panel → API key + secret → Admin › Integrations › Courier | letter J |
| Telegram alerts | A bot and the sales group | @BotFather → /newbot → token; add the bot to the sales group; send me nothing, paste the token and group into Admin › Integrations › Telegram | letter J |
| Error tracking | sentry.io free account (or self-hosted GlitchTip) | New projects for Next.js and Node → DSNs → Admin › Integrations (or the server `.env` line named in the issue) | letter E |
| Off-site backup | Cloudflare R2 bucket (10 GB free) or Backblaze B2 | Create a bucket + an access key limited to it → server `.env` lines named in the issue | letter E |
| Uptime monitor | UptimeRobot or Better Stack (free) | Steps in `docs/DEPLOY.md` (letter E) | letter E |
| GA4, GTM, Meta Pixel | Measurement IDs | GA4 → web stream ID; GTM container ID; Meta Events Manager → Pixel ID → Admin › Settings › Analytics | letter D |
| Turnstile | Site key + secret | Cloudflare → Turnstile → add site → GitHub variable `TURNSTILE_SITE_KEY` + server `.env` `TURNSTILE_SECRET_KEY` | forms |
| Real content | Staff replace Sample packages, visas and products in Admin | docs/ADMIN_GUIDE.md | ongoing |
| Open content questions | COD cap (৳20,000 vs ৳25,000), free delivery threshold (৳3,000 vs ৳5,000), office floor (4th vs 5th), EMI banks and tenures, About mission and vision | Edit in Admin or tell me | ongoing |
| 21st.dev / Context7 keys (optional) | Nothing required | `TWENTY_FIRST_API_KEY` / `CONTEXT7_API_KEY` as Windows user variables | — |

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
| 29 Oct (night) | #249 PR #314 in CI. #250 partial lead capture built (LeadDraft, step 1 opt-in, Incomplete requests page, one reminder, purge); PR opened with full-ci | #249 #250 | #314 | API DB 5, e2e partial-capture 2 |
| 29 Oct (late) | #249 merged (#314, 62 min). #250 in CI (#315). #251 online payments built (three gateway adapters, start/confirm, refunds, checkout options, result page, integration setup guides with Copy and server IP) | #249 #250 #251 | #314 #315 | API unit 8, API DB 3, e2e payments 6 |
| 29 Oct (later) | #248 merged (#313, 10 min) and closed out. #249 curated hotels built (schema, fixtures with real photos, list and detail pages, Request booking into the hotel lead, admin editor); PR opened with full-ci | #248 #249 | #313 | shared +2, web +3, e2e hotels-curated |
| 29 Oct | #246 merged (#311, 62 min) and #247 merged (#312, 68 min), both closed out. #248 built: invoice and packing slip PDFs on a shared brand kit, CSV export and import with a preview for products, group fares and compatible models; local API-mode e2e green; PR opened | #246 #247 #248 | #311 #312 | API unit 23 new, API DB 4 new, e2e admin-imports; all unit suites green (shared 168, web 720, API 360) |
| 28 Oct (evening) | Owner's decisions D312 logged. #302 rename merged (#304, 61 min). #303 optimise merged (#306, 143 min): api 182 MB, web 321 MB, nginx 45 MB, stack 1.29 GB, rehearsal from 7af26e7. #243 reminders, mentions, round-robin and SSE alerts built and in CI (#307, full-ci; local API-mode e2e 11/11; CI found an axe aria-allowed-role on the note box, fixed). #244 started on feat/244-reports-customers-roles (reports by agent, visa cases, searches per day and funnel pushed) | #302 #303 #305 #243 #244 | #304 #306 #307 | API 316, web 717, shared 166 locally; API-mode e2e 85/86 then fixed |
| 30–31 Oct | #300 merged (#242 bookings, 68 min); #298 quote builder built (API, PDF, admin, customer page, e2e) and PR opened with full-ci; RELEASE, PRD_COVERAGE (FR-ADM Bookings and convert done) and UAT updated | #242 #298 | #300 | shared 162, web 707, API unit 136; API DB tests and API-mode e2e in CI |
| 29 Oct | Steps 3–5 of the owner's order: #284 hub merged after axe 4.14 fixes (#288); #287 sitemap index and share cards; #295 Home back under 200 KB; #285 release note and upgrade rehearsal (passed in CI from 541bd21); #237 measurement; #238 error tracking, System status, dead letters; #239 backups, drill, off-site copy, alerts, lead limit, CSP doc, staging | #284 #285 #287 #288 #289 #295 #237 #238 #239 | #286 #290 #296 #291 #292 #293 #294 | full suite green on each; rehearsal and backup drill run in the VPS smoke |
| 28 Oct | Owner's order of 28 Oct (D303): Dependabot done (#188, #283 with the axe 4.14 logo fix); #278 merged after budget and test fixes; #284 integration hub built (API, web, deploy, seed patch) | #282, #278, #284, #285 | #283, #281 | shared 157, web 691, API unit 117; API DB tests and API-mode e2e in CI (no Docker locally) |
| 27 Oct (night) | #279 merged (#241 F1 email code sign-in, 182 min, migration). #278 F2 built: My account sections (timeline, visa, wishlist, travellers sealed, addresses, offers opt-in, password, sign-ins, sign out other devices), Save on package and product pages, checkout prefill, password sign-in; API-mode e2e with a local Mailpit | #241, #278 | #279 | API account 7 · web unit 695 · e2e account-sections |
| 27 Oct | #236 merged (PR #272, 5583bf7, 379 min): all public routes ≤ 200 KB, 8 of 11 key routes at Lighthouse 90+ in CI; CI caught record pages failing in API mode without Suspense (D299) before merge; #271 follow-up, #273 manual Lighthouse dispatch-only. Letter C done | #236, #271, #273 | #272 | unit 689 · e2e public + API mode green · CI Lighthouse budgets pass |
| 26 Oct evening | #236 on chore/236-speed: every public route ≤ 200 KB first-load JS (native form controls and tabs, compiled messages, lazy dialogs and second steps); three branch bugs found and fixed (cart/checkout crash, double-tap keys, compiled messages) with a client-boundary guard; Lighthouse local run stopped for low memory | #236 | — | unit 689 · public e2e green · budget 31 routes |
| 26 Oct | #235 merged (PR #270, 107 min; bundle change, no migration). Letter B done: checkpoint sent to the owner (copy bundle, backup, deploy, set up the authenticator) | #235 | #270 | VPS smoke with real ClamAV (EICAR quarantined) |
| 26 Oct | #234 merged (PR #268, 100 min, migration: owner backs up, deploys, sets up the authenticator). #235 malware scan built: clamd client, worker pass, quarantine, Files panel states, ClamAV in compose and the deploy smoke | #234, #235 | #268 | API fileScan; e2e two-step |
| 26 Oct | #229 (PR #265), #224 (PR #266) and #219 (PR #267) merged: letter A done. #234 two-step sign-in, sign-in history, new-device email and Redis rate limits built and verified locally | #219, #224, #229, #234 | #265, #266, #267 | API twoStep, rateLimit, totp; web 675; e2e admin-two-step 4/4 |
| 26 Oct | #233 merged (PR #264, 48 min). #229 admin polish: five lists on the DataTable, themed date range, booking mode cards, plain integration words, phones typed once and countries by name, fixed lists, template words, airline logos, Add staff in the header | #233, #229 | #264, PR for #229 | see #229 |
| 26 Oct | #232 merged (PR #262, 85 min; owner: copy bundle, backup, deploy). #233: visa status emails, staff alerts by area, low-stock alert, EMI request form; mode-change reason moved to Phase E | #232, #263, #233 | #262, PR for #233 | see #233 |
| 26 Oct | #231 merged (PR #260, 54 min). #232 customer files: private storage, upload on pick, claim on save, signed staff links with audit, purge, Files panels, deploy volume and backups | #231, #232 | #260, PR for #232 | shared 146 · web 666 · API 199 · e2e visa + api-mode |
| 25 Oct | Step 0 of PROMPT 10: PRD coverage audit (142 rows, P0 file uploads gap found), CI budget (quick set, full-ci label, nightly), compiled API image, Docker Hub clean-up, live-site docs; 28 Phase D issues filed; epic #30 closed | #231, #232–#259 | PR for #231 | local image run |
| 25 Oct | R10: staff tasks 2, 8, 12 and 13 as e2e (all 14 covered), axe on every admin route, the independent review fixed (names, columns, editors in words, dated chips, sentence case, phone layout), #229 filed, the Banglish staff guide | #200, #229 | PR for #200 | web 664 · e2e API job 79 |
| 25 Oct | R9: dashboard v2, Settings as one page, invite by email with the welcome page, permission matrix, audit log in sentences, template Insert and preview, reports with ranges and Excel | #199 | #228 (951080b) | shared 144 · web 663 · API 192 · e2e API job 71 |
| 25 Oct | #225: a missing admin record shows the panel's not-found screen (Open Trash, dashboard) instead of the error page | #225 | #227 (81d4e04) | e2e admin-shell + not-found case |
| 25 Oct | R8 purpose-built editors: tour package, product (variants matrix), visa country, blog post (writing view), group fare, banner, team member and gallery album (several photos at once); Price from, number of days and initials worked out on save; staff tasks 1, 7, 9 and 11 as e2e; design-review fixes (matrix alignment, empty photo tick, empty pickers, named Add buttons) | #198, #225 | #226 (137428f) | web unit 647 · e2e API job 67 (admin-editors 6) |
| 24–25 Oct | R7 website builder: Website › Home page (sections in order, Show, arrows and drag, sheets with the live phone preview, hero sheet), Website › Menus (ten menus, link picker, Undo, fixed tab bar), Preview of unpublished changes on draft mode, Edit on site staff tools, framing for the previews; independent review (2 P1, 7 P2, 11 P3) fixed; #222 flaky intake test on main fixed | #197, #222, #224 | #223 (9b0b5cb) | shared 144 · web unit 643 · API 186 · e2e API job 61 |
| 24 Oct | R6 inbox: queue panes beside leads and orders, lead page with reply timer, customer card and timeline, phone bottom bar, service tabs, board moves through the lead page's dialog, Visa applications by stage | #196 | #221 (b25e1b2) | shared 144 · web unit 623 · API 184 · e2e API job 52 |
| 24 Oct | R4 merged (#218, ce05c1b). R5 merged (#220, 763f58d). R5 DataTable v2: one table for every content list, leads, orders, proofs, customers, feedback and users; records, bulk and move endpoints; search and sort on the queues; saved views and columns on the device; INP checked on 500 leads; perf bug #219 opened for the 100-row page | #195, #219 | #220 | shared 137 · web unit 622 · API 181 · e2e API job 42 |
| 23 Oct | R3 merged (#216, 31e798e; CodeQL fix: raw upload bodies, D214), owner checkpoint. R4 status automation: shared rules, API buttons and actions, Trash, slug redirects, the minute job, Sample undo, lead / visa / order / proof steps, list chips | #193, #194 | #216, R4 PR | shared 131 · web unit 622 · API 176 · e2e API job 32 + workflow 8 |
| 20–23 Oct | R3 media: photo, gallery and video fields with upload, library picker, crop and focal point; media library v2 (Library · Site images, usage, Replace everywhere, delete guard); uploads outside the Next proxy; SmartImage / SmartVideo focal point. Browser review at 320–1440 and an independent review (2 P1, 3 P2, 12 P3) fixed with tests | #193 | R3 PR | shared 96 · web unit 617 · API 163 · API e2e 30/30 (fresh DB) · smoke 132 · budget in it |
| 23 Oct | Security: Next.js 16.4.0 had two critical RCE advisories (a 16.4.0 build now stops on them): Next 16.4.2, sanitize-html 2.18.1, fastify 5.12.7 on their own PR ahead of R3 | #213 | #213 PR | audit critical 0 · unit all · fixture build · smoke e2e |
| 20 Oct 04:00–04:30 | R2 merged (#207, 69d57f9). The first full CodeQL run on `main` met two developer download scripts: #210 leaves them out with the reason and skips the private database upload | #192, #205, #210 | #207, #210 PR | CI green on #207 (8/8) |
| 19 Oct 21:40 – 20 Oct 04:00 | R2 form engine v2: blueprints for all 50 content keys; sectioned editor with side panel, sticky action bar, History with restore, drafts on the device, leave guard, conflict and session dialogs; API history, restore, duplicate, picker options and list order (#205); lead facts. Browser review at 320–1440: one name per section, a status with its reason on every record, growing lines, link fields full width, editor first load 364 → 303 KB; independent review fixed (4 P1, 3 P2, 3 P3) | #192, #205 | #207 | shared 91 · web unit 555 · API 155 · e2e API job 23/23 · smoke 132 · budget 6/6 |
| 20 Oct | Owner: never skip CI. #208 CodeQL runs on the private repository (SARIF read in the job, fails on findings); R2 review fixes verified locally in the CI job order first | #208 | #208 PR | CodeQL green; script on sample SARIF |
| 19 Oct 18:20–21:30 | R1 admin shell: grouped sidebar with badges, top bar (Ctrl K, + New, bell), breadcrumbs, page header, StatusChip, settings door, states, sign-in; `GET /admin/inbox` and `GET /admin/search`; role rules shared | #191 | R1 PR | shared 87 · web unit 325 · API 145 · e2e admin-shell 4/4, admin-screens 2/2 (axe at 390 and 1440, five widths), budget 6/6 |
| 19 Oct 15:30–18:15 | Owner: admin redesign first (confusing admin, manual statuses, image upload, unreadable tables, section-wise control). Epic #201 with R0–R10 (#190–#200) on Project #4 with all fields; R0 audit (108 screenshots on a production build; local dev stack: PostgreSQL :5433, API :4000, web :3100), ADMIN.md and the WAAFA Admin design system | #190 | R0 PR | docs only |
| 14 Oct | Owner: About Us noindex in Search Console, full SEO, lighter images. #183 every published page indexable (PR #186); #184 search titles, services and contact points in structured data, llms.txt, home SEO seed patch; #185 photos q65, share images 1200 px, shipped JPEGs −35% | #183, #184, #185 | #186, #187 | API 143 · web unit 319 · e2e 121 |
| 14 Oct | Owner: second contact number and more from Admin (#181, seed patch adds 01823-232242 on deploy). #180 merged (store price on request, visa ranges) | #181 | #182 | API 140 · web unit 317 · e2e 120 |
| 13 Oct 21:00–22:30 | Owner: nav "Visa" and URL /visa on the live site (#176, seed patch), Waafas World prices hidden by default with Ask for price (#178), visa price ranges (#179). Store and visa ship in one PR to save a CI cycle before go-live | #176, #178, #179 | #177 | web unit 316+ · e2e store, visa, seo |
| 13 Oct 19:30–21:00 | #171 and #174 merged (CI Lighthouse after: Home 57, Flights 74, Packages 90, Visa 90, Shop 84). Owner: nav label Visa (#172; live menu changes in Admin). Part 3 on-page SEO and brand names | #172, #173 | #174, #175 | web unit 313 · e2e 114 passed |
| 13 Oct 16:30–19:30 | #169 merged (Sample noindex). Owner: brand search and where to enter each SEO setting (answered in chat), then finish all parts. Part 2 performance: hero video LCP, on-demand search card, lead steps, validation and quote form; before/after table | #170 | #171 | web unit 304 · e2e 111 passed · Lighthouse local median of 3 |
| 13 Oct 15:00–16:30 | Site live (C8, #74 closed). Owner: SEO after go-live in three parts. Part 1: Sample records noindex,follow and out of the sitemap. Cloud session: commits go through the GitHub API so the owner stays the author | #168, #74 | #169 | web unit 301 · seo/routes/packages/system e2e 17/17 |
| 13 Oct 08:00–09:30 | Owner: hero card off the video; no code on the server (images only, private GitHub); env and the deploy steps in chat. Bundle tested on the local stack; production .env validated and packed with the bundle locally. A stray `git stash pop` applied the old A5 media stash on main: reset to HEAD, stash kept | #163, #164 | #165, #166 | CI green; bundle deploy run locally |
| 13 Oct 02:00–04:30 | Owner: airline logos (auto, admin can add), a more attractive hero, production env and the VPS runbook with commands, push everything. Logos bundled and checked by eye; hero fare card from real data; bootstrap script; web cap 1 GB | #156–#158 | #159–#161 | unit + e2e in CI, Playwright MCP 320–1920 |
| 12 Oct 22:15–13 Oct 01:00 | Owner: Log in button, Mouse, "Waafas World by Waafa International", every country flag, better hero motion and a bigger hero video, Resend and Google keys, production for 2 vCPU / 4 GB. Keys only in gitignored env files; Resend test email sent; four issues built, reviewed from the owner's account and merged | #146–#149 | #150–#153 | unit + e2e in CI, Playwright MCP at 320–1920 |
| 12 Oct 18:30–21:30 | Owner: test Google sign-in end to end. Local run on the Docker stack (Docker Hub images): admin connects Google, Accounts live, /login at 7 widths with axe, redirect to Google with PKCE, callback errors, a signed-in session (created in PostgreSQL), My account, log out, delete. Found and fixed: delete ended on the error page and the header overflowed at 1024 px (#138, PR #139), 1280 px overflow and a wrapping label (#140, PR #141), header past the grid and More missing before hydration (#142, PR #143; CI fonts caught 1024 px). Final local run 4/4 at 320–1920 px | #138, #140, #142, #144 | #139, #141, #143 | web unit 282 · fixture + API-mode e2e · local suite 4/4 |
| 12 Oct 16:00–18:30 | Owner asked whether Google login exists: it was FR-ACC (Phase 1B), not built. Built it switched off: Integrations › Sign-in (Google client), API customers + sessions + code exchange, /login, /account, phone menu Log in (#134, PR #135; review: 1 finding fixed). New Docker Hub images built from main | #134, #136 | #135 | shared 77 · API 126 · web 273 · e2e fixture + API mode · CI green |
| 12 Oct 13:30–15:30 | Owner: open issue/PR, reviews on his profile (checked: 12 review contributions counted), run the project, Docker Hub images, server size, production env. #128 approved from the owner's account and merged; #130 Docker Hub pipeline (PR #131, review: 1 finding fixed); production settings for waafasworld.com created locally (gitignored); local stack runs from the pushed images | #128, #130, #132 | #128, #131 | Docker images workflow (build, smoke, secret scan, push) · CI all green |
| 12 Oct 08:00–10:30 | Owner: close the open issues, integrations settings (already shipped in #108: verified schema, endpoints, admin tabs, reveal, Sandbox/Live, Active, markup, getIntegrationConfig with manual fallback), deploy-ready, best SEO, server optimisation, every PR reviewed from the owner's account. Reviewed and fixed #127 (2 findings), built and reviewed #129 (1 finding fixed), approved review for dependabot #128 blocked by the local permission check (owner merges it) | #115, #125, #126 | #127, #128, #129 | web unit 261 · e2e seo 5/5 on a production build · CI |
| 12 Oct 00:00–01:30 | Owner: finish #91, Phase A/B leftovers, an API manager, run and test everything. Merged #106 (performance) and #110 (media library); #108 (integrations manager), #112 (reports, customers) and #114 (lead board) green in CI; local stack rebuilt from main | #91, #107, #109, #111, #113, #116, #119 | #106, #108, #110, #112, #114, #117, #120 | CI: unit, API (PostgreSQL), API-mode e2e, admin screens, public screens, Lighthouse |
| 11 Oct 18:00–19:30 | Launch prep with Docker Desktop: local production rehearsal (all green, backup/restore tested), CSP + security headers + analytics after consent (#103), SECURITY.md, C2 matrix verified (113 rows) | #74, #102 | #101, #103 | API-mode e2e 6/6 on the local stack · security e2e |
| 11 Oct 15:00–17:30 | Owner: deploy by hand, best SEO, better design. SEO pass merged (#97: share previews on 40 pages, admin defaults, verification fields, WebSite/TravelAgency, ItemList, sitemap images), flight route landing pages (#100), deploy kit (#98: init-env.sh, check.sh, quick start) | #74, #96, #99 | #97, #98, #100 | e2e seo + routes · public screens 33 routes |
| 11 Oct 14:00–15:30 | Board review with new screenshots: parity and motion merged (#88), product photo fix (#90), public screens job (#87), Lighthouse CI (#93). A22 closed: Phase A complete. Lighthouse mobile: A11y/BP/SEO 100 everywhere, Performance 45 (home) to 87 (visa) | #22, #89 | #87, #88, #90, #93 | public screens 32×5 · Lighthouse 5 routes |
| 11 Oct 08:30–14:00 | Owner asked for VPS + nginx, external API connections, a hidden admin URL and a full board review. Shipped: VPS Docker stack with nginx and Let's Encrypt (#81), provider adapters + Integrations (#83), zod out of the first load + budget check (#84), admin at /secure-admin-control (#86), product photo bug (#89 → #90); public screens at five widths with screenshots (#87) and board parity + motion (#88: listing banners, filter chips, home hero, request cards, card spotlight/tilt, hover clips) in CI. #39 closed, rest in #91 | #22, #39, #74, #82, #85, #89, #91 | #81, #83, #84, #86, #87, #88, #90 | CI: VPS smoke, API-mode e2e, budget, public screens 32 routes × 5 widths |
| 11 Oct 01:40–06:00 | Launch admin merged (#68), A19–A21 closed with cuts to #71; Turnstile on every form (#70); Live stays locked (#73); deploy runbook (#75); admin QA job at five widths with axe and screenshots (#76, editor fitted to 320 px); signature motion (#77); independent review found 11 defects, all fixed (#79). Home first-load JS measured at 392 KB gzip incl. a 39 KB nomodule polyfill (#39 stays open) | #18–#21, #52, #66, #69, #72, #74, #78 | #68, #70, #73, #75, #76, #77, #79 | API-mode e2e 5 + admin screens 8×5 widths · web unit 238 · shared 52 |
| 11 Oct 00:00–01:40 | B2 merged (#59); B3 public snapshot, intake and notifications (#62, with bug fixes #60 VAT BIN and #61 refused checkout); B4 admin API (#63); C1 web on the API (#65); #66 concurrent refresh fix (#67); launch admin A18 with the generic content editor (PR #68) and an API-mode e2e job in CI. Local PostgreSQL stopped by the system for low memory; API tests ran in CI | #55, #56, #57, #60, #61, #64, #66, #18 | #59, #62, #63, #65, #67, #68 | API 37 passed (CI) · web unit 238 · e2e 41 (fixture) |
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

Owner's order of 28 Oct (D303, D312). One issue per PR; start the next while CI runs.
1. ✅ #302, #303, #243, #244, #245, #246, #247.
2. ✅ #248 (#313). Checkpoint to the owner given after #248.
3. ✅ #249 (#314). 🟡 #250 PR #315 in CI (full-ci, migration). 🟡 #251 online payments started. Then #251–#253 (integration cards with copyable URLs, Telegram "Find my group", plain Test connection;
   checkpoint with the accounts to open), #254 / #255 (checkpoint), #271, #256 / #257 / #258, #259 (checkpoint), release
   candidate (RELEASE.md from 7af26e7).

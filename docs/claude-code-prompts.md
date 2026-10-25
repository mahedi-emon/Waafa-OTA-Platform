# WAAFA OTA — Claude Code Prompts (v5)

v4 er bodole ei file. Repo te `docs/claude-code-prompts.md` naame rakho (purono ta replace koro, commit korbe na: PROMPT 10 er Step 0 eta commit korbe). Prompt gula English e, use korar niyom Banglish e.

## v4 theke ki bodlalo

- Site live (13 Oct theke), admin redesign (D0, R0–R10) shesh. PROMPT 1, 3, 4, 5 ar 9 er kaj shesh, tai egula ei file e nei (git history te ache).
- Notun **PROMPT 10**: Phase D puro (PRD er P1 list), speed, security, backup, tracking, Bangla, online payment ar competitor der chhariye jawar kaj. Ekhon theke main prompt eta.
- Notun **PROMPT 11** (live booking, Phase E), **PROMPT 12** (Hajj/Umrah ba Manpower, Phase F), **PROMPT 13** (proti mash er health check).
- PROMPT 2, 6, 7, 8 e live site er niyom jog hoyeche: server e haat dibe na, migration thakle aage backup, bahirer account lage emon feature tomar key na deya porjonto off.

## PROMPT 10 deyar aage (tumi nije, ~30 minute)

1. **GitHub Actions minute:** amar hisab e repo private howar por 19–25 Oct e prai 1,870 minute khoroch hoyeche. Free plan e mashe 2,000 minute. github.com/settings/billing e asol usage dekho. Shesh hoye gele CI cholbe na, merge atke jabe. Upay tinta:
   - PROMPT 10 er Step 0 CI chhoto korbe: normal PR e 15 minute er moddhe.
   - Billing e payment method diye ekta choto budget set koro.
   - Repo abar public koro (tokhon code shobai dekhte parbe, minute free).
2. **Docker Hub private koro:** API image er bhetore puro backend er source code ache, ar Docker Hub repo public. Mane je keu image namiye code porte pare. Ei order e koro, na hole deploy atke jabe:
   - Docker Hub › Account settings › Personal access tokens › notun token (Read-only).
   - Server e: `docker login -u emon6107` (password er jaygay token).
   - Docker Hub › Repositories › waafa-ota-platform › Settings › Make private.
3. **R9 ar R10 deploy:** server e `cd /opt/waafa && sh backup.sh`, tarpor `sh deploy.sh`.
4. **Dependabot alerts on:** GitHub repo › Settings › Code security › Dependabot alerts › Enable (free). "Dependabot security updates" o on koro.
5. **Phase D er account gula** (jeta age pao, oita age). Key gula Admin › Integrations e boshabe, chat e na:
   - SSLCommerz: developer.sslcommerz.com e sandbox store (free). Live merchant account pore.
   - bKash: merchant payment gateway (bKash er sathe kotha bolte hobe).
   - SMS: BulkSMSBD ba SSL Wireless account. Sender ID approve hote kayek din lage, tai aage shuru koro.
   - Courier: Steadfast merchant account theke API key.
   - Telegram: @BotFather theke bot token, ar sales group e bot add koro.
   - Error tracking: sentry.io free account (DSN).
   - Off-site backup: Cloudflare R2 bucket (10 GB free) ba Backblaze B2.
   - Uptime: UptimeRobot ba Better Stack (free), 5 minute er kaj.
   - GA4, GTM, Meta Pixel er ID; Cloudflare Turnstile key.
6. **Asol content:** staff ra Admin e Sample package, visa, product bodle real ta boshabe.

## Kon prompt kokhon

| Prompt | Kokhon |
| --- | --- |
| PROMPT 10 — Complete the platform | Ekhon, ekbar (Phase D shuru) |
| PROMPT 2 — Continue | Protiti notun conversation e (context bhore gele) |
| PROMPT 6 — Bug | Bug pele |
| PROMPT 7 — Change request | Notun kichu ba bodlate chaile |
| PROMPT 8 — Status | Kaj kotodur holo jante (code e haat dibe na) |
| PROMPT 11 — Phase E live booking | IATA, consolidator ba GDS contract ar sandbox key pele |
| PROMPT 12 — Phase F | Hajj/Umrah ba Manpower er licence pele |
| PROMPT 13 — Monthly health check | Proti mashe ekbar |

Proti merge er por: GitHub Actions e "Docker images" green hole server e `cd /opt/waafa && sh deploy.sh`. Je PR e database migration ache, Claude Code bole debe; tokhon aage `sh backup.sh`.

---

## PROMPT 10 — Complete the platform (Phase D and the best-OTA bar)

````
Complete the WAAFA platform: all of Phase D (PRD P1) plus the quality, operations and growth work that makes waafasworld.com the best OTA in Bangladesh. The admin redesign (D0, epic #201) is done and is now the standard for every admin screen.
Talk to me in short Banglish; write code, issues, PRs and docs in English. Follow CLAUDE.md exactly: Serena first, issue first, I am the only author (no co-author or AI attribution anywhere), never force-push, components only, everything admin-controlled, real media only, Hajj/Umrah and Manpower stay out until Phase F.

LIVE-SITE RULES
- The site is live at https://waafasworld.com on my VPS from Docker Hub images. Never touch the server, its .env or production data. I deploy after the "Docker images" workflow is green: `sh backup.sh` first when a PR has a database migration (say so in Banglish in the close-out), then `sh deploy.sh`.
- Migrations are additive and backward compatible (expand, migrate, contract over two releases). Seed patches never overwrite staff edits.
- A feature that needs an outside account (payments, SMS, courier, Telegram, error tracking, off-site backup) ships switched off and turns on only when my keys are saved in Admin › Integrations (or the server .env where a key must live there; tell me exactly which line). Keys never go in code, chat, logs or the repo.
- New admin screens follow docs/design/ADMIN.md: DataTable, sectioned editors with blueprints, the inbox pattern, status automation, safety nets, plain words.
- Deadline: PRD P1 by 13 Nov 2026. At every session start compare progress with the plan in TRACKER; if behind, say so first and propose cuts by impact. Never cut security, lead capture, payment safety, accessibility or compliance.

MANDATORY TOOLS (if one is unavailable, stop and tell me; never skip one silently)
Serena; Context7 before every library API; Playwright MCP on every touched route (public pages at 320, 390, 768, 1024 and 1440; admin at 390 and 1440); shadcn MCP; 21st.dev through the magic MCP for every new UI pattern (compare three, pick one, restyle with tokens); ui-ux-pro-max (design system "WAAFA" for public pages, "WAAFA Admin" for admin, pre-delivery checklist before every PR); design-taste-frontend, frontend-design, design-superpowers design-review on every finished screen, ui-color-palette. Record what each decided in the TRACKER issue block.

STEP 0 — Audit, CI budget and docs (first; one issue "chore: audit, CI budget and docs after D0")
1. Coverage: write docs/PRD_COVERAGE.md with every FR-ID in docs/PRD.md: priority, status (done, partial, missing, waiting for owner account), evidence (route, component, API, test) and the issue that finishes it. Verify on the live site with Playwright, not only in code. Gaps I already know of, to confirm: no unified /track (only /shop/track); customer sign-in is Google only (no email and password, no phone OTP); no Bangla; no two-factor sign-in; no SMS, Telegram, courier or online payment adapters live; no reviews, wishlist, Q&A, flash sales or campaign pages; no quote builder, reminders, round-robin or partial capture; no invoices, packing slips or CSV import; no conversion events (GA4, GTM and Pixel only load); the search → results morph and the card → detail transition (#52 follow-up) not built; Lighthouse CI only warns.
2. CI budget: the repo is private and used about 1,870 GitHub Actions minutes between 19 and 25 Oct (the free plan has 2,000 a month). Make a normal PR cost 15 minutes or less: PRs run guards, lint, typecheck, unit tests, build and one smoke e2e. The full e2e, API-mode e2e, Lighthouse, VPS deploy smoke and CodeQL run on main, nightly, and on PRs with a "full-ci" label; that label is required for PRs that touch apps/api/prisma, deploy/, auth, payments, checkout or lead intake. Cancel superseded runs; cache pnpm, Next.js and Playwright. Record minutes per PR in TRACKER.
3. Images: the API image ships its TypeScript source and tests, and the Docker Hub repository is public, so anyone can read the backend. Compile the API to JavaScript (tsc or esbuild), run it with node, and ship only dist, production dependencies and the Prisma files (no tests; fixtures only as far as the seed needs them). Keep the deploy smoke green. Add a Docker Hub clean-up that keeps the last 15 sha tags. Remind me to make the Docker Hub repository private and run `docker login` on the server first (DEPLOY.md gets the exact steps).
4. Docs: TRACKER header back to one line; close epic #30 (launch done); section 11 rewritten for today (VPS, Docker Hub, Resend; remove Vercel, Railway, R2 hosting and managed databases) with the accounts Phase D needs; section 14 = the next three steps only (history stays in the session log); fixed rows in the bug table marked fixed (for example #52). CLAUDE.md updated for a live site: remove the go-live deadline line; add the live-site rules and CI budget rules above; deploy and backup flow. I put v5 of docs/claude-code-prompts.md in the working tree: commit it in this PR and keep CLAUDE.md's pointer to it right.
Post a short Banglish summary with the issue order and what you need from me, then continue.

WORK ORDER (issues under epic #31 "D · P1 completion"; one issue and one PR each; this order unless the audit shows a better one, then log why)
A. Open items: #229 admin polish, #219 the 100-row page, #224 the budget e2e flake.
B. Security: TOTP two-factor sign-in for staff (authenticator app, recovery codes, required for Super Admin and Admin, optional for others), login history, a new-device email. Malware scan for customer uploads: a ClamAV container sized for the 8 GB VPS; the worker scans before a document is visible to staff; quarantine on a hit.
C. Speed is SEO: Lighthouse mobile performance 90+ (median of 3) on /, /flights, /hotels, /tour-packages, a package detail, /visa, a visa country, /shop, a product page, /blog and a post, in CI and on the live site (Lighthouse against https://waafasworld.com). First-load JS 200 KB gzip or less on every public route (today Home 217, Flights 258, Shop 215). LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less. Then switch the Lighthouse CI assertions from warn to error so speed cannot regress.
D. Measurement: GA4, GTM and Meta Pixel events, only after consent: search (module, route), lead_submit (module, reference), order_placed (value, items), payment_proof_sent, whatsapp_click, call_click, sign_up, login, add_to_cart, begin_checkout. UTM and referrer saved on every lead and order (the lead schema has UTM fields; verify end to end, add them to orders). An Admin › Reports view "Where leads come from". A short Banglish note for me on checking events in GA4 DebugView.
E. Operations: error tracking with release tags for web, API and worker (Sentry free tier or self-hosted GlitchTip; off until my DSN is set). A staff-only Status page in admin (API, worker and queue depth, last backup age, disk and memory, deployed release). Daily backups that install themselves: deploy.sh adds the cron when it is missing (BACKUP_CRON=off in .env turns it off); an off-site copy with rclone to Cloudflare R2 or Backblaze B2 (off until my keys are set); a monthly restore drill script that restores into a throwaway database and reports row counts. Disk and memory alerts by email. Uptime monitor steps for me in DEPLOY.md.
F. Track and accounts: one /track page for any query, visa application or order by reference and phone, with its status timeline; /shop/track redirects there. Customer accounts (FR-ACC) complete: email and password with email verification and password reset (through Resend), Google (already live), phone OTP once SMS is ready (J); My account with queries, visa applications, orders, wishlist, saved travellers (passport fields encrypted at rest), addresses, notification preferences and delete account; guest records attach after the phone or email is verified.
G. Sales tools for staff: quote builder (fare or package options, baggage, validity, notes) sent by email or a WhatsApp link, with a branded PDF and a public quote page where the customer can accept (acceptance asks staff to confirm the booking). Follow-up reminders with due times on the dashboard and in the bell. @mentions in notes. Round-robin auto-assignment by module that follows office hours (Saturday to Thursday) with an on/off switch per staff member. Real-time alerts with sound for new leads, proofs and orders (Server-Sent Events, polling fallback). Scheduled email reports (daily and weekly summary to chosen staff). Merge duplicate customers. Custom roles with a permission matrix. Search funnel by step.
H. Store and trust: reviews with moderation for packages and products, only from customers with a booked lead or a delivered order (no invented reviews; Review structured data only for approved real reviews); wishlist and save for later; Buy again; product questions and answers (moderated); campaign pages at /shop/campaign/[slug] with countdowns, and flash sales (price window, stock cap, automatic start and end); invoices and packing slips as PDF (VAT shown; the customer's BIN when asked); bulk CSV import with a preview and an error report for products, group fares and compatible models.
I. Travel: curated hotels (FR-HTL-02: properties with photos, amenities, room types and "from" prices; Request booking creates a lead). Partial lead capture (FR-FLT-08: after step 1 with a valid phone and consent, an abandoned form becomes an Incomplete lead in the inbox; at most one reminder message).
J. Outside accounts, built against the sandbox now and switched on when my keys are saved: SSLCommerz and bKash online payment behind PaymentProvider (server-to-server validation and IPN, idempotency keys, amounts only from the server, refunds recorded by staff, "Online payment" shown only when live, and a ৳10 live-test checklist for me); an SMS gateway adapter (BulkSMSBD or SSL Wireless: OTP, lead acknowledgement, order and visa status; delivery log; on/off per template); phone OTP sign-in; a Telegram alert to the sales group; courier booking and tracking (Steadfast first, then Pathao or RedX) with an SMS on dispatch. Contract tests for every adapter; my steps in TRACKER section 11.
K. Bangla at /bn: every public UI string in natural, reviewed Bangla (not word for word; the travel and shopping words people in Bangladesh actually use); Hind Siliguri or Noto Sans Bengali, self-hosted with size-adjust; bilingual admin content fields (English required, Bangla optional, English fallback) with a "Bangla missing" filter on lists; a language switch in the header, drawer and footer; hreflang, a Bangla sitemap and Bangla metadata; ৳ with lakh grouping; Bangla digits in dates only if the ui-ux-pro-max review says they read better (decide and log); a test that fails on any untranslated key; public budgets unchanged. The admin UI stays English.
L. Best-OTA bar: the search card → results summary bar morph and the card → detail image transition with React View Transitions (check the installed Next.js and React APIs with Context7; reduced motion = instant); admin dark mode; then re-run docs/design/COMPETITOR_BENCHMARK.md on the live site against gozayaan.com, sharetrip.net, akijair.com and obokash.com (390 and 1440; Lighthouse; first impression, clarity, trust, motion, speed) and fix every axis where Waafa is not ahead. Ideas the benchmark finds that are not in the PRD become issues labelled needs-owner with the expected impact; do not build them until I say yes.
M. Phase D QA: e2e for every new flow on phone and desktop, axe on every route, screenshots at every width, an independent subagent review of every new screen, ADMIN_GUIDE.md and DEPLOY.md updated, zero open P0 or P1 bugs; then close epic #31.

DONE MEANS
- docs/PRD_COVERAGE.md shows every P0 and P1 requirement done, or "waiting for owner account" with the adapter built, tested against the sandbox and switched off.
- Lighthouse mobile 90+ performance and 100 accessibility, best practices and SEO on every key route, in CI and on the live site; CI fails on a regression; first-load JS 200 KB or less on every public route.
- Every conversion event fires once, after consent, with the right parameters (unit and e2e tests).
- Backups run every day by themselves, a copy leaves the server once my keys are set, and the restore drill passes; errors are tracked; staff see the Status page.
- Bangla covers every public page with no English UI string left.
- A normal PR costs 15 CI minutes or less; the API image holds no source or tests.
- TRACKER, PRD_COVERAGE, Serena memories, ADMIN_GUIDE and DEPLOY are current; every PR green on CI and on Docker images.

CHECKPOINTS
After Step 0, B, C, F, G, J and K: a short Banglish summary with screenshot paths, what I must do (keys, deploy, backup) and one line "test this yourself: <what to click>"; then continue unless I stop you. Anything I ask to change becomes its own issue (PROMPT 6 or 7) and is done before the next letter.
````

---

## PROMPT 2 — Continue (every new conversation)

````
Continue the WAAFA build. Follow CLAUDE.md exactly. Talk to me in short Banglish.
1. Serena first: activate the project; read session_handoff, progress and decisions, then any memory the next issue needs.
2. Check `git var GIT_AUTHOR_IDENT` is me; check git status and the current branch; read the docs/TRACKER.md header, issue log and blockers, docs/PRD_COVERAGE.md, and the open issues.
3. Live-site rules: never touch the server or production data; migrations stay additive; in the close-out of a PR with a migration, remind me to run `sh backup.sh` before `sh deploy.sh`; features that need an outside account stay off until my keys are in Admin › Integrations; CI budget (a normal PR 15 minutes or less, the "full-ci" label for the full suite).
4. Deadline check against the plan in TRACKER (PRD P1 by 13 Nov 2026); if behind, say so first and propose cuts.
5. Resume the in-progress issue exactly where session_handoff says; otherwise take the next item in the PROMPT 10 work order.
Every issue: issue → In progress → branch → build (Serena, Context7, shadcn, 21st.dev through magic, ui-ux-pro-max, design-taste-frontend, frontend-design, design-superpowers) → verify (guards, lint, typecheck, unit tests, build, Playwright MCP at the right widths, axe, Lighthouse on touched public routes) → design review → PR → green CI → squash-merge → close → Project Done → TRACKER, PRD_COVERAGE and Serena.
I am the only author; no co-author or AI attribution anywhere; never force-push. Before the session ends: push everything and write session_handoff.
````

---

## PROMPT 6 — Bug

````
Bug: <ki hocche>
Where: <route ba admin screen, jemon /shop/checkout on 390 px>
Expected: <ki howa uchit>
Follow CLAUDE.md: Serena first; create a bug issue (P0 if the live site or customer data is affected; fix it before anything else) and add it to Project #4; fix on fix/<n>-<slug> with a regression test; verify with Playwright MCP at the affected widths; PR, green CI, squash-merge, close; update TRACKER and Serena. Never touch the server: tell me in Banglish how to deploy the fix (and to run `sh backup.sh` first if there is a migration). I am the only author; no co-author. Reply in short Banglish.
````

---

## PROMPT 7 — Change request

````
Change request: <ki add ba change korte chao>
Where: <page, section ba admin screen>
Priority: <P0 / P1 / P2>
Follow CLAUDE.md: Serena first; create a feature issue and add it to Project #4 with all fields. If it is new scope, update docs/PRD.md and docs/PRD_COVERAGE.md first; if it changes design, update DESIGN.md, MOTION.md or ADMIN.md in the same PR. Keep everything admin-controlled, use the mandatory tools (shadcn, 21st.dev through magic, ui-ux-pro-max, design-review), verify at 320/390/768/1024/1440 (admin at 390 and 1440), PR, green CI, squash-merge, close; update TRACKER and Serena; tell me about any migration (backup first) and how to deploy. I am the only author; no co-author. Reply in short Banglish.
````

---

## PROMPT 8 — Status

````
Status report only: do not change any file. Serena first, then read docs/TRACKER.md, docs/PRD_COVERAGE.md, the open issues and the latest Actions runs.
Tell me in short Banglish: the phase and percent of P1 done; what finished since the last report; what is in progress; open bugs; the latest green Docker images tag and whether a merged PR has a migration I have not backed up and deployed yet; GitHub Actions minutes used this month (estimate from job durations); blockers and exactly what I must do (keys, accounts, content); days left to 13 Nov against the plan; the next three issues.
````

---

## PROMPT 11 — Phase E: live booking (when a provider contract lands)

````
Start Phase E (live booking) per docs/PRD.md (Live mode, Golden Switch, Phase 2). Provider: <name and services: flights / hotels>. Its sandbox keys are saved in Admin › Integrations; never ask me to paste them.
Follow CLAUDE.md; Serena first; update docs/PRD.md and docs/PRD_COVERAGE.md for anything the provider changes; create the issues under epic #32 and work them with the usual workflow and mandatory tools:
- Adapter behind FlightProvider or HotelProvider: search, fare rules, price check, book (PNR), ticket, cancel, void, refund; normalised schemas in packages/shared; timeouts, retries and a circuit breaker; every call logged without personal data; contract tests against the sandbox.
- LiveBody in the ResultsBody slot: results with filters (stops, airlines, times, price, baggage), fare details and rules, price-change handling; Manual mode stays the fallback per module through the Golden Switch.
- Booking flow: traveller details (passport fields encrypted), a price re-check, online payment (Phase D) before ticketing, e-ticket PDF and email, the booking in admin (operations, refunds, reconciliation).
- The provider's certification checklist in TRACKER. Live turns on only when I switch it in Booking modes.
Prices and availability come from the provider only; never fake them. Same quality gates; Banglish checkpoints after the adapter, the results page and the booking flow.
````

---

## PROMPT 12 — Phase F: licensed modules (when the licence is issued)

````
Start Phase F: <Hajj and Umrah | Manpower and Recruitment>. The licence is issued and I give the go-ahead.
Follow CLAUDE.md; Serena first. Update docs/PRD.md first (scope, routes, admin, compliance, the licence details that must or may appear on the site) and wait for my OK on that diff. In the same PR remove the module from CLAUDE.md's "Not in this build" list and from the guards' compliance words. Then build it as its own module under epic #33 with the usual workflow and mandatory tools: admin-managed content, the ADMIN.md patterns, real media only, e2e and Banglish checkpoints. Show licence details only as I approve them.
````

---

## PROMPT 13 — Monthly health check

````
Monthly health check; no new features. Follow CLAUDE.md; Serena first; one issue "chore: monthly health check <Month YYYY>".
1. Dependencies: security updates first, then grouped minor and patch updates, with the full suite ("full-ci" label); every major update gets its own issue.
2. Security: pnpm audit, CodeQL results, security headers on the live site, staff accounts and roles (list who has access and who has not signed in for 30 days), keys older than 90 days (tell me which to rotate; I do it), unusual sign-ins.
3. Backups: run the restore drill; report the newest backup's age and size and the off-site copy.
4. Speed and SEO: Lighthouse on the live site for the key routes; broken links; sitemap; I send Search Console coverage and Core Web Vitals screenshots if you ask.
5. Data: Sample records left, unused media, Trash purge, overdue leads.
6. GitHub Actions minutes used this month and the Docker Hub tags kept.
Report in short Banglish with what I must do; fix what you can in small PRs.
````

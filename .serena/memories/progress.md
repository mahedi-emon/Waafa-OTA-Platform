# Progress (newest first; mirror of docs/TRACKER.md header + session log)
- 2026-10-25 — R10 merged (#230). PROMPT 10 (v5) started. Step 0 #231 on chore/231-audit-ci-docs → PR #260 (full-ci):
  docs/PRD_COVERAGE.md (142 rows; P0 88 done/26 partial/2 missing; P1 1/7/7/2 waiting), CI budget (quick set vs full,
  full-ci label + re-run workflow, nightly, CodeQL in ci.yml), esbuild-compiled API image (1.7 GB, no src/tests), Docker
  Hub clean-up (15 releases), CLAUDE.md/DEPLOY.md/TRACKER live-site docs, epic #30 closed. NEW P0: customer files never
  leave the browser → #232. Work order issues #232–#259 filed (D268 order). Baseline PR #230 = 60 billed minutes.
- 2026-10-25 — R9 merged (#228, 951080b; MIGRATION staff_invites → owner runs backup.sh first). R10 #200 on
  chore/200-usability-qa: staff tasks 2/8/12/13 spec (all 14 covered), every-route axe in admin-screens, independent
  review fixed (list names via headingOf, empty columns, editors in words, banner window states, group fares Ends
  soon, sentence case, phone action bar, wrapping tabs/fades, matrix container queries, table scrollLabel), #229
  filed for the larger items, docs/ADMIN_GUIDE.md + docs/admin-guide/*.png. web 664, e2e API job 79. No migration.
- 2026-10-25 — R8 merged (#226, 137428f), #225 not-found merged (#227, 81d4e04). R9 #199 on
  feat/199-dashboard-settings: dashboard v2 (Today cards, week KPIs with sparklines, server SVG line, setup checklist),
  Settings one page (SettingsFrame, /settings/[section], embedded editor, redirects), invite by email + welcome page
  (MIGRATION 20261025090000_staff_invites + seed patch staff-invite), permission matrix, audit sentences + filters,
  template Insert + preview, reports ranges + Excel (API xlsx writer). Tests web 663, API 192, e2e API job 71.
- 2026-10-25 — R7 merged (#223, 9b0b5cb). R8 #198 purpose-built editors on feat/198-purpose-built-editors: section
  order for package/product/visa/blog (writing view)/group fare/banner/team, variants matrix, bulk photos for gallery
  albums, auto Price from / days / initials, startWith, Next: section, design-review fixes. e2e admin-editors 6/6
  (tasks 1, 7, 9, 11 + axe), web unit 647, lint/tsc/guards OK. No migration. Bug #225 (missing record → error page).
- 2026-10-25 — R6 merged (#221, b25e1b2). R7 #197 website builder → PR #223 (also closes #222 flaky intake email
  test): Website › Home page (sections, arrows + drag, sheets with live preview, hero), Website › Menus (link picker,
  Undo, fixed tab bar), draft preview (draft mode + previewDrafts), staff tools (Edit this page / Edit sections),
  framing, updateTag on saves. Independent review 2 P1/7 P2/11 P3 fixed; CI round 1 found a CodeQL regex + two specs
  (fixed). Tests shared 144, web 643, API 186, API-job e2e 61. No migration. #224 budget cold-start flake opened.
- 2026-10-24 — R5 merged (#220, 763f58d). R6 #196 inbox on feat/196-inbox: queue panes beside leads and orders (InboxSplit grid), lead page with reply timer, customer card and timeline, phone bottom bar, service tabs, board moves through the lead page's dialog (dnd-kit mouse + touch, Move to…), Visa applications by stage. Tests shared 144, web 623, API 184, API-job e2e 52. No migration.
- 2026-10-24 — R4 merged (#218, ce05c1b). R5 #195 DataTable v2 on every list (content, leads, orders, proofs, customers, feedback, users; records/bulk/move endpoints; saved views on device; INP on 500 leads) → PR #220, no migration. Tests shared 137, web 622, API 181, API-job e2e 42. Bug #219 (100-row page INP).
- 2026-10-23 — R3 #193 merged (#216). R4 #194 status automation on feat/194-status-automation: shared workflow rules, API buttons/actions, Trash, slug redirects, minute job, Sample undo, lead/visa/order/proof steps, list chips; PR open. Migration 20261024040000_status_automation.
- 2026-10-23 Dhaka — Security #213: Next 16.4.0 had two critical RCE advisories (a vulnerable Next build now stops):
  Next 16.4.2, sanitize-html 2.18.1, fastify 5.12.7 + override; PR #214 merged (541bd21), CI 7/7; owner deploys after
  Docker images (no migration). R3 #193 media done on feat/193-media (merged main in, cde1864): API e2e 30/30 fresh DB,
  web unit 617, API 163; PR next (migration media_credit → owner `sh backup.sh` first). Next: R4 #194.
- 2026-10-20 04:40 Dhaka — R2 merged (PR #207, 69d57f9; Docker images green) after an independent review (4 P1 fixed)
  and CI fixes (e2e create their own data). #208 CodeQL runs on the private repo (PR #209); #210 leaves two dev download
  scripts out of it (PR #211). Next: R3 #193 media.
- 2026-10-20 01:30 Dhaka — R2 #192 form engine v2 (+ #205 list order): blueprints for all 50 keys, sectioned editor,
  side panel, action bar, History/restore, drafts, leave guard, conflict + session dialogs, API history/restore/
  duplicate/options, lead facts. Tests: shared 90, web 555, API 152, admin e2e 15/15; editors 303 KB gzip (D202).
- 2026-10-19 21:30 Dhaka — R1 #191 admin shell: grouped sidebar + badges (GET /admin/inbox), top bar (Ctrl K with
  GET /admin/search, + New, bell), breadcrumbs, page header, StatusChip, /settings door, states, sign-in; role rules in
  packages/shared/helpers/access.ts. Tests: shared 87, web 325, API 145, e2e shell 4/4 + screens 2/2, budget 6/6.
- 2026-10-19 18:20 Dhaka — Owner: admin redesign first. Epic #201 + R0–R10 (#190–#200) on Project #4; R0 #190 audit
  (108 local screenshots) + docs/design/ADMIN.md + waafa-admin design system; D183–D187.
- 2026-10-14 16:30 Dhaka — #181 second phone (PR #182), #183 index every page (PR #186); #184 search SEO +
  llms.txt and #185 lighter images (PR #187).
- 2026-10-13 22:30 Dhaka — #176 visa route /visa + seed patch (PR #177 merged); #178 store price on request and
  #179 visa price ranges (PR #180).
- 2026-10-13 21:00 Dhaka — Site live (C8, #74 closed). SEO after go-live: #168 Sample noindex (PR #169), #170 perf
  (PR #171; CI Home 57, Flights 74, Packages 90, Visa 90, Shop 84), #172 nav label Visa (PR #174), #173 on-page SEO
  + brand names (PR #175).
- 2026-10-13 09:30 Dhaka — #163 hero fare card removed (PR #165), #164 image-only server bundle deploy/server
  (PR #166). Production .env + bundle packed locally (waafa-server.tgz).
- 2026-10-13 04:30 Dhaka — #156 airline logos (PR #159), #157 hero fare card + chip flags (PR #161), #158 VPS
  bootstrap + runbook + web cap 1 GB (PR #160). Launch-ready; owner deploys 14 Oct.
- 2026-10-13 01:15 Dhaka — Owner batch: #146 Log in words + store copy (PR #150), #149 Resend + Google env keys
  (PR #151), #147 country flags (PR #152), #148 larger hero + flight path in the media sky (PR #153, with #154 e2e fix).
- 2026-10-12 21:30 Dhaka — Google sign-in tested end to end locally; bugs #138/#140/#142 fixed (PRs #139/#141/#143).
- 2026-10-12 18:30 Dhaka — #134 Google sign-in for customers (PR #135), off until keys + Accounts live.
- 2026-10-12 15:00 Dhaka — #130 Docker Hub images (PR #131: workflow builds/checks/pushes, server pulls), #128
  merged after an approving review; production env for waafasworld.com prepared locally; local run from Docker Hub.
- 2026-10-12 10:30 Dhaka — Launch-day prep: #126 nginx gzip + proxy cache (PR #127, review: 2 findings fixed), #125
  structured data for /shop, About, Gallery, Visa Guide, visa country Service + Offer (PR #129, review: 1 finding
  fixed), docs #118 reviewed. Integrations request = already shipped in #108 (verified). Dependabot #128: approve/merge
  blocked by the local permission check; owner merges it.
- 2026-10-12 01:30 Dhaka — Night batch for the owner ("finish #91, Phase A/B leftovers, API manager, run + test"):
  merged #106 (#91 perf: home JS 318→215 KB, Lighthouse home 45→64, visa 91, CLS 0) and #110 (#109 media library);
  #108 (#107 integrations manager), #112 (#111 reports + customers), #114 (#113 lead board) in CI / merging; docs #115.
  #71 stays open for the heavy editors (itinerary drag, variants grid, category tree, rich text, TOTP, bookings).
- 2026-10-11 19:30 Dhaka — Launch-ready: #103 CSP + analytics after consent, SECURITY.md, local Docker rehearsal,
  C2 matrix verified; #74 waits for the owner's VPS deploy.
- 2026-10-11 14:00 Dhaka — #81 VPS Docker + nginx, #83 provider adapters, #84, #86 hidden admin path, #87/#88 board
  parity + motion, #90; Phase A closed.
- 2026-10-11 06:00 — launch admin (#68), Turnstile (#70), Live locked (#73), runbook (#75), admin QA (#76), motion (#77).
- 2026-10-11 01:00 — Phase B launch scope merged (#58, #59, #62, #63); C1 web on the API (#65).
- 2026-10-10 — A7–A17 merged (home, search, flights, hotels, packages, visa, store, cart, services, info pages, states).
- 2026-10-09 — A0–A6 merged.

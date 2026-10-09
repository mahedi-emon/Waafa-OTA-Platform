# WAAFA — instructions for Claude Code

One mobile-first website for two brands: **Waafa Tours and Travel** (flights, hotels, tour packages, visa) and
**Waafas World** by Waafa International (store at `/shop`, Printing Solutions, International Trading), plus the admin
panel and the API. Go-live Tue 13 Oct 2026 (hard deadline before 14 Oct). Mission: ship everything in `docs/PRD.md`
as the best-designed and fastest OTA in Bangladesh, visibly better in design, motion and speed than gozayaan.com,
sharetrip.net, akijair.com and obokash.com, and 100% original.

Talk to the owner in short, simple Banglish. Write code, commits, issues, PRs and docs in English. Ask only when an
action is irreversible, needs the owner's account, keys or money, or the documents truly conflict; otherwise decide,
log the decision in `docs/TRACKER.md` (section 8) and keep going. Never ask the owner for photos, videos or
screenshots: source real, free-licence media yourself.

## Read first
1. `docs/TRACKER.md`: header (phase, current issue, progress), issue log, blockers, next steps.
2. Serena memories: `session_handoff`, `progress`, `decisions`, then the ones the issue needs (`project_overview`,
   `stack_and_conventions`, `workflow_and_git`, `design_direction`, `motion_system`, `admin_control`, `data_layer`,
   `known_issues`, `audit_findings`).
3. `docs/PRD.md`: behaviour, scope, phases, compliance. Wins on behaviour, scope and compliance.
4. `docs/design/handoff/HANDOFF.md`: route → screens, components, 21st.dev effects, build order. Wins on visuals,
   layout and labels. `docs/design/handoff/screens.csv` lists every screen.
5. `docs/design/project/*.dc.html` and `docs/design/index.html`: exact copy, states, sample data (phone boards end in
   `-m`). The prototype is a reference and the floor, never source.
6. `docs/design/DESIGN.md`, `docs/design/MOTION.md`, `docs/design/COMPETITOR_BENCHMARK.md`,
   `docs/design/web-interface-guidelines.md`, `docs/design/handoff/tokens.css` (already in `app/globals.css`).
7. `docs/claude-code-prompts.md`: the owner's prompts (PROMPT 2 continues a session; 3 to 8 for later phases).
Conflicts: log under Decisions and fix the losing document in the same PR.

## Corrections already decided (apply everywhere: docs, code, copy, fixtures)
1. Authorship: every commit, PR and issue is authored by the owner (Mahedi Hasan Emon, GitHub `mahedi-emon`). No co-author, ever.
2. Store name: "Waafas World" everywhere, never "Waafa Shop" and never "Shop" as a visible label. Route `/shop`. It sells
   any category (printer and office supplies first); no copy or layout may assume toner.
3. Bottom tab bar: Home, Packages, Waafas World (raised W disc in the centre), Visa, More. The label is always
   "Waafas World"; on a 320 px phone it may wrap to two lines, never cut.
4. Logo: one WAAFA logo per page, in the main header. In the store, "Waafas World" is text beside that logo, never a
   second mark. The tab-bar W disc is a navigation icon and stays.
5. Office hours: Saturday to Thursday, 10:00 am to 6:00 pm Asia/Dhaka, closed Friday; admin-editable; live
   "Open now / Closed" chip computed on the client.
6. Meet our team: Home section (bento on desktop, snap carousel on phones) and a grid on About Us, fully
   admin-managed; initials instead of stock faces until real photos are uploaded.
7. Media: real photos and video only; never AI-generated, painted or drawn images or loops.
8. Prices: taka with lakh grouping (৳1,46,480), VAT included.
9. Hajj and Umrah, Manpower and Recruitment: not in this build (Phase F, after the licence). No route, menu item,
   copy, seed data or image for them; the architecture stays open (categories, visa types, menus, home sections are
   admin-managed).
10. Footer credit: "Developed by Mahedi Hasan Emon" → https://www.mahedihasanemon.site/ (new tab), far right of the
    footer bottom bar, rendered from code.
11. The prototype is the floor, not the ceiling: keep its structure, copy and states, raise the polish; log each visual
    deviation in `docs/design/DESIGN.md` with the reason.

## Stack (non-negotiable)
- **Web** `apps/web`: Next.js latest stable (16.4, App Router, RSC, Cache Components), TypeScript strict, Tailwind CSS v4,
  shadcn/ui on Radix, lucide-react, Motion (`motion/react`, LazyMotion + `m.*` from `motion/react-m`), Embla,
  React Hook Form + zod, nuqs (URL state), TanStack Query (client mutations and polling only), next-intl (English now,
  Bangla in P1 at `/bn`, `localePrefix: "as-needed"`), sonner, vaul, cmdk, date-fns, libphonenumber-js, next/font,
  next/image.
- Admin-only, dynamic import, never in public bundles: @tanstack/react-table, recharts (shadcn Chart), dnd-kit,
  tiptap, react-dropzone.
- **API** `apps/api` (Phase B): Node 22/24 LTS, NestJS on Fastify, PostgreSQL 16+ through Prisma (pg adapter), Redis +
  BullMQ, pino, Cloudflare R2, Resend or SMTP with React Email, Cloudflare Turnstile.
- **Monorepo**: pnpm workspaces + Turborepo; `packages/shared` (zod schemas, types, enums, formatters for web and api),
  `packages/config` (eslint, tsconfig, prettier), `fixtures/` (typed Sample data).
- **Tests**: Vitest + Testing Library, Playwright + @axe-core/playwright, Lighthouse CI (@lhci/cli), Supertest, k6.
- **Dependencies**: everything named here, in the PRD and in HANDOFF (including the listed 21st.dev components) is
  pre-approved. Anything else only when clearly needed: pick the smallest well-maintained option, justify it in the
  PR and log it under Decisions.
- Check the installed version's docs with Context7 before using any library API (Next 16 async params, `proxy.ts`,
  `revalidateTag`/`updateTag`, Motion imports, Prisma and NestJS change often).

## Component rules (no raw HTML or CSS)
- The `.dc.html` boards and `waafa.css` are references: never copy their markup or CSS, never import them.
- Every screen is typed React components: `components/ui` (shadcn primitives via CLI or MCP, CLI file names, themed with
  our tokens), `components/fx` (21st.dev effects, restyled), `components/brand` (LogoLockup, Ribbon, GoldTriangle, brand
  colours), `components/motion` (MotionKit), `components/<feature>/` (feature components), `app/**/_components/`
  (sections used by one route). One component per file, PascalCase, typed props, no `any`, named exports (default only
  where Next.js requires it). Hooks `useX.ts`, utilities camelCase. Import from the file, not a barrel.
- Styling: Tailwind utilities + tokens in `app/globals.css` (`@theme` + shadcn variables) + `cva` variants + `cn()`.
  No other CSS files, CSS modules, CSS-in-JS, or inline styles except truly dynamic values.
- `dangerouslySetInnerHTML` only in `components/content/RichText.tsx` (server-sanitised admin rich text, allow-list)
  and `components/seo/JsonLd.tsx` (structured data).
- Images through `SmartImage` (next/image), video through `SmartVideo`, icons from lucide-react or `components/brand`.
- Server Components by default; `"use client"` only on small interactive leaves. Grids declare `grid-cols-1` at the
  phone base. Radix radios: name with `aria-labelledby`; every tab has a panel. Never ship default shadcn.
- Translations stay on the server (`NextIntlClientProvider messages={null}`); pass strings to client leaves as props
  or wrap them in a scoped provider (`pickMessages`).
- Enforced in CI: ESLint (no-explicit-any, react/no-danger with the two exceptions, @next/next/no-img-element) and
  `pnpm guards` (`scripts/guards.mjs`: one stylesheet, no prototype imports, no hex outside `app/globals.css` and
  `components/brand`, fixtures only behind the data layer, no framer-motion, compliance words, store name).

## Admin control
- Nothing a visitor sees is hard-coded except the footer developer credit and the compliance rules. Every text, image,
  video, menu, link, home section (order, visibility, content), hero, banner, offer, price, group fare, package,
  category, visa record and type, product, collection, store row, airline list, contact detail, office hours, social
  link, payment method, shipping zone, COD cap, SEO field, announcement bar, team member, page, FAQ, blog post,
  notification template and booking mode comes from the data layer and has an admin screen that edits it.
- UI chrome strings (labels, validation messages) live in next-intl messages; content lives in the data layer.
- Pages read data only through the cached accessors in `apps/web/src/lib/data/*.ts` (zod contracts from
  `packages/shared`), never `@waafa/fixtures` or repositories directly. Phase A: read-write in-memory fixture
  repositories (server-side, reset on restart, every record `sample: true`), so admin edits show on the public site in
  development. Phase C swaps the API implementation in `source.ts` with no UI change. Time-dependent UI (Open now chip,
  countdowns) renders on the client in Asia/Dhaka time.
- TRACKER section 4 "Admin-control matrix": public element → data field → admin screen → API endpoint (Phase B) →
  verified (Phase C). An issue is not done until its rows exist.

## Tools: Serena first, then the right MCP and skill
- **Serena** at the start of every session and issue: project is active (`Waafa-OTA-Platform`); read memories; use
  `get_symbols_overview`, `find_symbol`, `find_referencing_symbols` before opening whole files; edit with
  `replace_symbol_body`, `insert_*_symbol`, `replace_content`, `rename_symbol`. Keep memories short and current; never
  put secrets or personal data in them. If Serena is disconnected, say so and fix it (`docs/TOOLING.md`).
- **MCP**: context7 (docs before any library use), shadcn (search/view/add; pass `registries: ["@shadcn"]` because
  `components.json` lives in `apps/web`), magic (21st.dev search, inspiration, logos), playwright (screenshots at every
  width, console, network, traces), github (or `gh`). The project figma server is off.
- 21st.dev install: `npx shadcn@latest add "https://21st.dev/r/<author>/<component>?api_key=${API_KEY_21ST:-$TWENTY_FIRST_API_KEY}"`
  from `apps/web` (never write the key into files, logs or saved commands).
- **Skills**: ui-ux-pro-max (design system, UX and stack rules, pre-delivery checklist before every PR:
  `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "WAAFA"`), design-taste-frontend
  and frontend-design (direction, composition, anti-template), design-superpowers (design, design-review on every
  finished screen, ds-make for the design system), 21st:21st-ui, ui-color-palette (scales, contrast; never change the
  PRD §16 brand hex values). Record the skills used in the TRACKER issue block, not in commits or PRs. The PRD wins
  where a skill disagrees (Inter + Plus Jakarta Sans, lucide, light-only public site).
- **Subagents** for read-heavy or parallel work (competitor captures, Lighthouse runs, an independent review of the
  diff and screenshots before big UI PRs). The machine has little free memory: run one Next build or e2e at a time.

## Git and GitHub (owner is the only author)
- Start of every session: `git var GIT_AUTHOR_IDENT` must be `Mahedi Hasan Emon <mahedi.emon62@gmail.com>`; if not,
  stop and tell the owner. Never set or change git identity or config.
- No co-author and no AI attribution anywhere: no co-author trailer, no "generated with" line, no session link, no
  "written by AI" note in commits, PR titles or bodies, issues, comments or code. Enforced by `.claude/settings.json`
  (`attribution` empty), the husky commit-msg hook (`scripts/check-attribution.mjs` + commitlint) and the CI
  "Authorship and attribution" job. After each merge check `git log -1 --format='%an <%ae>%n%B'`.
- No repo change without an open issue: issue → Project status In progress → branch → work → PR "Closes #n" → green
  CI → squash-merge → issue closed → Project status Done → TRACKER + Serena.
- Branches `feat|fix|chore|docs/<n>-<slug>` from an up-to-date `main`. Conventional Commits that reference the issue:
  `feat(web): unified search card (#12)`. Stage only the issue's files (`git add <paths>`). Push often.
- Merge: `gh pr merge <pr> --squash --delete-branch --subject "<type(scope): title> (#<pr>)" --body "<2-4 lines>"`,
  then `git switch main && git pull`.
- Never force-push, rewrite pushed history, push to `main` directly, skip hooks (`--no-verify`) or commit secrets
  (`.claude/settings.local.json` and `.env*` stay local).
- Repo `mahedi-emon/Waafa-OTA-Platform`; Project #4 id `PVT_kwHOBsdPus4BmHeE`. Status field
  `PVTSSF_lAHOBsdPus4BmHeEzhkxvD8`: Backlog `f75ad846`, Ready (= Todo) `08afe404`, In progress `47fc9ee4`, In review
  `4cc61d42`, Done `98236657`. Priority `PVTSSF_lAHOBsdPus4BmHeEzhkxvhg`: P0 `79628723`, P1 `0a877460`, P2 `da944a9c`.
  Size `PVTSSF_lAHOBsdPus4BmHeEzhkxvhk`: XS `eff732af`, S `9592a5a3`, M `9728cbdc`, L `c53df028`, XL `7b141a16`.
  Estimate `PVTF_lAHOBsdPus4BmHeEzhkxvho` (XS 1, S 2, M 3, L 5, XL 8), Start `PVTF_lAHOBsdPus4BmHeEzhkxvhw`, Target
  `PVTF_lAHOBsdPus4BmHeEzhkxvh0`. Item id: `gh project item-list 4 --owner mahedi-emon --format json --jq
  '.items[]|select(.content.number==N)|.id'`.
- Epics: #28 A Frontend, #29 B Backend, #30 C Integration & Launch, #31 D P1, #32 E Live booking, #33 F Licensed
  modules. Labels `type:`, `area:`, `priority:`, plus `blocked`, `needs-owner`, `later`.

## Tracking
`docs/TRACKER.md` keeps one shape: header line, 0 Audit, 1 Overview, 2 Issue log (one block per issue, newest first),
3 Route ↔ screen matrix, 4 Admin-control matrix, 5 Components inventory, 6 Tooling, 7 Benchmark, 8 Decisions, 9 Bugs,
10 Cut list, 11 Blockers and owner actions, 12 Later phases, 13 Session log, 14 Next steps. Update after every issue
and at every session end.

## Quality gates and Definition of Done (every issue)
1. Serena memories read; Project status In progress; plan comment on the issue; branch from fresh `main`.
2. Before UI: open the boards for copy, states and data; apply ui-ux-pro-max, design-taste-frontend, frontend-design,
   DESIGN.md, MOTION.md and the web interface guidelines; Context7 for every API.
3. shadcn first; 21st.dev effects from the HANDOFF table; restyle with tokens; check keyboard, reduced motion, bundle.
4. Phone first (390, then 320), then 768, 1024, 1440.
5. Admin-control matrix rows filled.
6. Verify: `pnpm guards`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass. Playwright MCP on every
   touched route at 320 / 390 / 768 / 1024 / 1440: screenshots, zero console errors, no horizontal scroll, no layout
   shift, keyboard pass, axe pass. Animated interactions: trace at 4x CPU, no long task over 50 ms. Lighthouse mobile
   on touched public routes. Vitest for all logic (validation, ৳ formatting, URL state, cart maths, mode switching,
   office hours); a Playwright e2e test for every user flow (reduced motion on).
7. Review: design-superpowers design-review and the ui-ux-pro-max pre-delivery checklist on the 390 and 1440
   screenshots next to the board; big UI issues also get an independent subagent review. Fix everything first.
8. PR from the template → green CI → squash-merge with an explicit message → check the merge commit's author.
9. Close-out comment (what was built, files, tests, known limits); Status Done.
10. TRACKER issue block (with tools and skills used), overview, matrices, session log; Serena `progress`,
    `decisions`, `session_handoff`.
Any bug found becomes a bug issue, fixed with a regression test. No known bug stays undocumented.
Budgets (public pages): first-load JS ≤ 200 KB gzip; mobile LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; Lighthouse mobile
Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+, and above every competitor in the benchmark.

## Design and motion bar (details: DESIGN.md and MOTION.md)
- Within five seconds on a 390 px phone: a premium, trustworthy brand, a real destination, a clear headline and a
  search usable with one thumb. Premium, calm, confident; deep navy and electric blue; the ribbon motif; gold only for
  the triangle and premium badges; cyan only on dark; glass only on the search card. Never template-like, never
  default shadcn, never AI-looking. No emoji, lorem ipsum, fake numbers, invented reviews or filler words (elevate,
  seamless, unleash, discover). Plus Jakarta Sans display, Inter body (16 px on phones), tabular figures for prices.
- Signature moments (built once in MotionKit): hero flight-path line, search card → results bar morph, route arc with
  a gliding plane, boarding-pass success, visa checklist ticks with a progress ring, store add-to-cart arc, subtle
  magnetic primary buttons on desktop.
- Animate only transform and opacity (small SVG path drawing and desktop blur excepted); LazyMotion with `domAnimation`
  by default and `domMax` loaded only where layoutId or drag is used; nothing animates the LCP element on first paint;
  heavy effects (spotlight, tilt, parallax) desktop-only; 60 fps on a mid-range Android. Reduced motion: movement
  becomes a 150 ms fade, marquee, video and Ken Burns stop, counters show the final number, signature moments show
  their end state.

## Never
- Show trade licence numbers, owner details, ID numbers or fees anywhere (site, seed data, repository).
- Build anything for Hajj or Umrah, or manpower, recruitment or employment visas (Phase F). Visa = tourist, business,
  student, medical, transit.
- Fake live availability: Manual-mode fares are indicative and confirmed by an expert before payment.
- Invent reviews or testimonials; the feedback wall shows approved submissions only.
- Make passport or visa documents public (private bucket, signed and logged links).
- List restricted items in Waafas World; show IATA, ATAB or TOAB badges the company does not hold.
- Recolour the logo or put a second logo on a page.
- Use AI-generated, painted or drawn images or loops, or competitor assets, on the live site.
- Show online payment before it is live.

## Always
- Keep every page usable on a 320 px phone with the bottom tab bar; 44 px touch targets; WCAG 2.2 AA.
- Prices in ৳ with lakh grouping, VAT included; dates like "12 Oct 2026"; Asia/Dhaka time.
- Real photos (Unsplash, Pexels) and video (Pexels, Coverr, Mixkit) with credits in `docs/design/MEDIA_CREDITS.md`,
  or Waafa's own shots; everything replaceable from the admin media library.
- Protect form submits with Turnstile, rate limits and an idempotency key; write every admin change to the audit log.

## Not in this build (Phase F, after the licence)
- Hajj and Umrah.
- Manpower, recruitment and employment visas.

## Windows machine notes
- `gh` lives in `C:\Program Files\GitHub CLI` and may be missing from PATH: PowerShell
  `$env:PATH += ";C:\Program Files\GitHub CLI"`, Git Bash `export PATH="$PATH:/c/Program Files/GitHub CLI"`.
- Node 25.2.1 locally (22.11.0 installed via nvm4w; CI uses Node 22); pnpm 12 global. Python 3.12 for UI UX Pro Max.
  ffmpeg is not installed (use `ffmpeg-static` for media work). Keep scripts cross-platform (node scripts, no `rm -rf`).
- About 1 to 2 GB of free memory: one build or e2e run at a time, Playwright `--workers=2`, stop dev servers you start.

## Session end (always, even if interrupted)
Commit and push finished work on its branch (never leave work only on disk). Update TRACKER (issue block, session log,
next steps) and Serena (`progress`, `decisions`, `session_handoff` with exactly where to resume and the next three
steps). Comment on the in-progress issue where you stopped. If the context window is nearly full, do this first, then
ask the owner to open a new conversation with PROMPT 2.

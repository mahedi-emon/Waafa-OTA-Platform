# WAAFA — instructions for Claude Code

One mobile-first website for two brands: **Waafa Tours and Travel** (flights, hotels, tour packages, visa)
and **Waafas World** by Waafa International (online store at `/shop`, Printing Solutions, International Trading),
plus the Admin panel and the API. Go-live: 13 October 2026.
Mission: ship everything in `docs/PRD.md` and make it the best-designed and fastest OTA in Bangladesh — better design,
motion and speed than gozayaan.com, sharetrip.net, akijair.com and obokash.com — while staying 100% original.

## Read first
1. `docs/TRACKER.md` — current phase and issue, progress, decisions, known bugs, blockers, next steps.
2. `docs/PRD.md` — source of truth for behaviour, scope and phases (P0 / P1 / P2).
3. `docs/design/handoff/HANDOFF.md` — route → screens to match, components, motion, build order, rules.
4. `docs/design/DESIGN.md` (our system), `docs/design/MOTION.md` (motion tokens and effect catalogue),
   `docs/design/COMPETITOR_BENCHMARK.md` (the bar to beat), `docs/design/web-interface-guidelines.md`.
5. `docs/design/handoff/tokens.css` — tokens (already in `apps/web/src/app/globals.css`).
6. `docs/design/project/*.dc.html` — exact copy, states and sample data (phone versions end in `-m`);
   `docs/design/index.html` shows every screen offline. The prototype is a visual and copy reference, never source.
7. Serena memories: `project_overview`, `stack_and_conventions`, `workflow`, `design_direction`, `progress`, `decisions`.

## Stack (non-negotiable)
- **Web** `apps/web`: Next.js latest stable (App Router, React Server Components), TypeScript strict, Tailwind CSS v4,
  shadcn/ui (Radix), lucide-react, Motion (`motion/react` through LazyMotion, `m.*` components), Embla,
  React Hook Form + zod, TanStack Query, nuqs, next-intl (en now, bn-ready).
- **API** `apps/api`: NestJS on the Fastify adapter, PostgreSQL 16+ with Prisma, Redis + BullMQ.
- **Shared**: pnpm workspaces + Turborepo; `packages/shared` (zod schemas and types used by web and api),
  `packages/config` (tsconfig, eslint, prettier presets), `fixtures/` (typed Sample data).
- **Tests**: Vitest, Playwright + @axe-core/playwright, Lighthouse CI (@lhci/cli), k6 scripts for the API.
- **Dependencies.** Pre-approved: everything named here, in the PRD and in HANDOFF (including vaul, cmdk, sonner,
  date-fns, recharts, @tanstack/react-table, dnd-kit, tiptap, react-dropzone, @axe-core/playwright, @lhci/cli, k6).
  Anything else only if clearly needed: pick the smallest well-maintained option, justify it in the PR and log it
  under Decisions in `docs/TRACKER.md`. Use Context7 before using any library API.

## Component rules (no raw HTML/CSS)
- Rebuild every screen as typed React components. Never paste prototype HTML, never import `waafa.css`, never use
  `dangerouslySetInnerHTML` (only exception: admin rich text after server-side sanitising; JSON-LD script tags).
- Styling = Tailwind utilities + the tokens in `app/globals.css` (`@theme` + shadcn variables) + `cva` variants.
  No other CSS files, no CSS modules, no inline style objects except truly dynamic values (e.g. a progress width var).
- shadcn/ui is the base for every primitive (`components/ui`, CLI file names). 21st.dev effects go in `components/fx`.
  Feature components in `components/<feature>`; page-only sections in `app/**/_components`.
  One component per file, PascalCase file and export names, typed props, no `any`. Hooks `useX.ts`, utilities camelCase.
- Server Components by default; `"use client"` only on small interactive leaves.
- Never ship default shadcn: restyle radii, colours, shadows and type with our tokens.

## Admin control
- Nothing a visitor sees is hard-coded, except the footer developer credit and the compliance rules. Texts, images,
  videos, menus, header and footer links, home section order and visibility, banners and offers, prices, group fares,
  packages, visa data, products, contact details, office hours, social links, SEO fields, announcement bar, payment
  and shipping settings, notification templates and booking modes all come from the data layer, and each has an
  admin screen that edits it.
- Pages read data only through the repository interfaces in `apps/web/src/lib/data` (zod contracts from
  `packages/shared`). Phase A uses the fixtures implementation; Phase C swaps in the API implementation with no UI change.
- `docs/TRACKER.md` keeps the **Admin-control matrix**: public element → data field → admin screen → API endpoint
  (endpoint filled in Phase B). An issue is not done until its rows are filled.

## Work order
Phase A Frontend complete (public site + full admin UI on typed fixtures) → Phase B Backend → Phase C Integration,
full testing, launch → Phase D P1 features → Phase E P2 live booking. Work issue by issue in TRACKER order.

## Workflow (every issue)
1. Serena first: read memories; `get_symbols_overview` / `find_symbol` / `find_referencing_symbols` before opening
   whole files; edit through Serena's symbol tools where possible. If Serena is disconnected, say so and fix it
   (see `docs/TOOLING.md`) rather than silently skipping it.
2. Project Status → In progress, assign the repo owner, comment a short plan on the issue.
3. Branch `feat/<issue#>-<slug>` (`fix/<issue#>-<slug>` for bugs) from an up-to-date `main`.
4. Before UI: open the listed screens (`docs/design/project/*.dc.html`, `docs/design/index.html`) for exact copy,
   states and data. Apply the `ui-ux-pro-max`, `design-taste-frontend` and `frontend-design` skills, DESIGN.md,
   MOTION.md and web-interface-guidelines.md (the PRD wins where a skill disagrees, e.g. Inter, lucide, light-only).
5. Components: shadcn MCP first; 21st.dev components from the HANDOFF effects table via the magic MCP or
   `npx shadcn@latest add "https://21st.dev/r/<author>/<component>?api_key=$TWENTY_FIRST_API_KEY"`, restyled with
   our tokens and checked for keyboard use, reduced motion and bundle size.
6. Phone first (390, check 320), then 768, 1024 and 1440.
7. Fill the issue's rows in the Admin-control matrix and the Components inventory.
8. Run the quality gates below. 9. Commit, push, PR, CI, squash-merge (see Git). 10. Close out the issue
   (comment: what was built, files, tests, screenshots, known limits; Status = Done). 11. Update `docs/TRACKER.md`
   and the Serena `progress` / `decisions` memories.
- Any bug found → new bug issue → fix → regression test. Never leave a known bug undocumented or open at phase end.

## Quality gates (before every commit that touches code)
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass at the repo root.
- Playwright MCP on every touched route at 320 / 390 / 768 / 1440: screenshots, zero console errors, no horizontal
  scroll, no layout shift, keyboard pass, axe pass. Animated interactions: record a trace; no long task over 50 ms.
- Lighthouse mobile on touched public routes within budget.
- Vitest for all logic (validation, ৳1,46,480 formatting, URL state, cart math, mode switching). A Playwright e2e
  test for every user flow (`apps/web/e2e`).
- Budgets: first-load JS ≤ 200 KB gzipped per public page; mobile LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1;
  Lighthouse mobile Performance 90+, Accessibility 95+, SEO 95+, and higher than every competitor in the benchmark.

## Design and motion bar
- Premium, calm, confident. Real photos with one cool colour grade; the ribbon motif; the gold triangle rarely;
  glass only on the search card. Never template-like, never AI-looking, never default shadcn. No emoji, fake stats,
  invented reviews or generic copy (elevate, seamless, unleash, discover).
- Everything moves through MotionKit (`components/motion`). Animate only transform and opacity; 60 fps on a mid-range
  Android; heavy effects (spotlight, tilt, parallax) desktop-only; nothing blocks input or delays LCP;
  under `prefers-reduced-motion` movement becomes a 150 ms fade, marquees and Ken Burns stop, counters show the final number.
- Prices in taka, VAT included, ৳ with Indian grouping (৳1,46,480). Dates like "12 Oct 2026", Asia/Dhaka time.
- Build phone first; every page usable at 320 px with the bottom tab bar; 44 px touch targets; WCAG 2.2 AA.

## Never
- Show trade licence numbers, owner details, ID numbers or fees anywhere (site, seed data, repository).
- Offer Hajj or Umrah products, or manpower, recruitment or employment-visa services (visa = tourist, business,
  student, medical, transit only).
- Fake live availability: Manual-mode fares are indicative and confirmed by an expert before payment.
- Invent reviews or testimonials. Make passport/visa documents public. List restricted items in Waafas World.
- Recolour the logo, or put a second logo next to the "Waafas World" name (the WAAFA logo appears once, in the header).
- Use AI-generated, painted or drawn images on the live site: real photos only. The drawn scenes in the prototype are
  stand-ins; `docs/design/photos/get-waafa-photos.mjs` downloads the real Unsplash photos with credits.
- Add co-author or AI attribution: no "Co-Authored-By", "Generated with Claude Code" or similar in commits, PR bodies,
  issues or comments (`.claude/settings.json` sets `attribution` to empty). Never change `git config user.*`.
- Force-push, skip hooks, or commit secrets (`.claude/settings.local.json` and `.env*` stay local).

## Git and GitHub
- Repo `mahedi-emon/Waafa-OTA-Platform`, branch `main`, remote `origin`. Conventional Commits referencing the issue,
  e.g. `feat(web): unified search card (#12)`. PR body: `Closes #<n>`, summary, screenshot list, a "Tools used" line
  (Serena, Context7, shadcn, 21st.dev, skills, Playwright). Wait for CI, `gh pr merge --squash --delete-branch`, pull main.
- Labels: `type: feature|bug|chore|test|docs|design|perf`, `area: web|admin|api|shop|travel|visa|infra`,
  `priority: P0|P1|P2`. Milestones: `A · Frontend`, `B · Backend`, `C · Integration & Launch`, `D · P1 completion`,
  `E · Live booking`.
- Project #4 (owner `mahedi-emon`), project id `PVT_kwHOBsdPus4BmHeE`. Status field `PVTSSF_lAHOBsdPus4BmHeEzhkxvD8`:
  Ready `08afe404` (used for "Todo"), Backlog `f75ad846`, In progress `47fc9ee4`, In review `4cc61d42`, Done `98236657`.
  Priority `PVTSSF_lAHOBsdPus4BmHeEzhkxvhg`: P0 `79628723`, P1 `0a877460`, P2 `da944a9c`.
  Size `PVTSSF_lAHOBsdPus4BmHeEzhkxvhk`: XS `eff732af`, S `9592a5a3`, M `9728cbdc`, L `c53df028`, XL `7b141a16`.

## Tooling notes (this Windows machine)
- `gh` is installed at `C:\Program Files\GitHub CLI\gh.exe` but may be missing from PATH in a fresh shell:
  PowerShell `$env:PATH += ";C:\Program Files\GitHub CLI"`, Git Bash `export PATH="$PATH:/c/Program Files/GitHub CLI"`.
- Node via nvm4w (25.2.1 active, 22.11.0 installed; CI uses Node 22 LTS); pnpm is installed globally (corepack is not
  bundled with Node 25). Keep package.json scripts cross-platform (no `rm -rf`, no `&&` env tricks; use node scripts).
- MCP servers and skills: `docs/TOOLING.md`. UI UX Pro Max: `python .claude/skills/ui-ux-pro-max/scripts/search.py`.

## Session end (always, even if interrupted)
Commit and push everything finished; update `docs/TRACKER.md` and the Serena memories; comment on the in-progress
issue exactly where you stopped.

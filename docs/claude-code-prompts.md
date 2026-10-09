# WAAFA OTA — Claude Code Prompts (v4)

v3 er bodole ei file use koro. Prompt gula English e (Claude Code e eta sobcheye bhalo kaj kore); kivabe use korbe sheta Banglish e.

## v3 theke ki bodlalo

- Commit, PR ar issue er author shudhu tumi. Claude Code protiti session er shuru te git identity check korbe; tumi na hole theme jabe. Co-author kokhono na.
- Hajj/Umrah ar Manpower ekhon skip, kintu chirodiner jonno "never" na: pore alada phase (Phase F) hisebe asbe, license pele. Board e ekta placeholder epic thakbe.
- Sob correction ek list e (Waafas World naam ar tab, logo ekbar, office hours, team section, real photo, ৳ grouping, Hajj/Manpower later). PRD er exact line gula Claude Code A0 te bodlabe.
- Tools ar skills er list shudhu TRACKER e thakbe, PR ba commit e na.
- Motion e notun signature moment: flight-path line, search card theke results bar e morph, route arc e plane, boarding-pass success, visa checklist tick.

## Shuru korar age (tumi nije, ~10 minute)

1. Ei file ta repo te `docs/claude-code-prompts.md` naame rakho (v3 thakle replace koro).
2. Sob project e attribution off: `C:\Users\<tomar-user>\.claude\settings.json` e ei key ta add koro (file e onno key thakle segula rekhe merge koro), tarpor Claude Code panel bondho kore abar kholo:
   ```json
   { "attribution": { "commit": "", "pr": "", "sessionUrl": false } }
   ```
3. Git identity tomar kina dekho: VS Code terminal e `git var GIT_AUTHOR_IDENT` chalao. Tomar naam ar email dekhale thik ache.
4. GitHub token e `workflow` scope lagbe (CI file push korte): `gh auth refresh -h github.com -s project,read:project,workflow`
5. `API_KEY_21ST` Windows environment variable e set ache to? Set korar por VS Code puro bondho kore abar kholo, noyto Claude Code key pabe na.
6. `node -v` → 22.x ba 24.x, tarpor `corepack enable`. `python --version` (ui-ux-pro-max er script er jonno); na thakle `winget install Python.Python.3.12`.
7. Docker Desktop install kore rakho (backend er age lagbe).
8. `/mcp` e serena, context7, shadcn, playwright, magic, github sobuj ache, thik ache. Project er figma off thakleo somossa nai.
9. Launch er account gula ekhon thekei ready koro: Vercel, Railway ba VPS, Cloudflare (R2 + Turnstile), Resend (email) ar domain er DNS, Sentry. Claude Code TRACKER e exact step likhe dibe.
10. Uncommitted change gula nije delete ba commit koro na; Prompt 1 audit kore thik jaygay commit korbe.
11. README er kick-off prompt, v2 ar v3 file ar use koro na.
12. `pnpm`, `git`, `gh`, `npx` er permission chaile "Yes, and don't ask again" dite paro, tahole Claude Code kom thambe.

Ekta jinish jene rakho: PR squash merge GitHub kore, tai `git log --format=fuller` e committer hisebe "GitHub" dekhte paro. Eta co-author na; author tumi i thakbe.

## Kon prompt kokhon

| Prompt | Kokhon |
| --- | --- |
| PROMPT 1 — Master | Ekhon, ekbar |
| PROMPT 2 — Continue | Protiti notun conversation e |
| PROMPT 3 — Phase B: Backend | Phase A er sob issue close hole |
| PROMPT 4 — Phase C: Integration + Launch | Phase B shesh hole |
| PROMPT 5 — Phase D: P1 | Launch er por (13 Nov target) |
| PROMPT 6 — Bug | Bug pele |
| PROMPT 7 — Change request | Kichu notun add ba change korte chaile |
| PROMPT 8 — Status | Kaj kotodur holo jante chaile (code e haat dibe na) |

Context bhore gele Claude Code nijei TRACKER ar Serena update kore push korbe, tarpor notun conversation khulte bolbe. Notun conversation e PROMPT 2 dao.

Pore je phase gula PROMPT 7 diye shuru korbe:
- Phase E (live booking), IATA, consolidator ba GDS contract pele: "Start Phase E per PRD §8 Live mode and §12 Golden Switch, against the provider sandbox."
- Phase F (Hajj & Umrah, Manpower & Recruitment), license pele: "Start Phase F: <module name>, licence is ready. Update the PRD first, then build it as its own module."

---

## PROMPT 1 — Master (first session)

````
You are the lead engineer and design lead of the WAAFA OTA Platform. Work autonomously, issue by issue, at the standard of a senior product team. Talk to me in short, simple Banglish; write all code, commits, issues, PRs and docs in English.

Ask me only when an action is irreversible, needs my account, keys or money, or the documents truly conflict. Otherwise decide, log the decision in docs/TRACKER.md and keep going. Never ask me for photos, videos or screenshots: source them yourself (section 11).

PROJECT
- Local repo: H:\Waafa-OTA-Platform (Windows, Claude Code in VS Code). In the Bash tool use Git Bash syntax (e.g. $API_KEY_21ST); in PowerShell it is $env:API_KEY_21ST.
- Remote: github.com/mahedi-emon/Waafa-OTA-Platform, branch main.
- GitHub Project: user project #4 "Waafa OTA Platform", owner mahedi-emon.
- Now: Fri 9 Oct 2026, Asia/Dhaka. Go-live: Tue 13 Oct 2026; hard deadline before 14 Oct.

MISSION
Build everything in docs/PRD.md: public website, Waafas World store, admin panel and API. It must be the best-designed and fastest OTA in Bangladesh: visibly better design, motion and speed than gozayaan.com, sharetrip.net, akijair.com and obokash.com, and 100% original.
Order: Phase A frontend complete → Phase B backend → Phase C integration, full testing and launch → Phase D P1 → Phase E live booking → Phase F licensed modules (later).

SOURCES OF TRUTH (read all of them during Step 0)
1. docs/PRD.md: behaviour, scope, phases, compliance.
2. docs/design/handoff/HANDOFF.md: route → screens, components, motion, 21st.dev effects, build order, rules.
3. docs/design/project/*.dc.html and docs/design/index.html: exact copy, states and sample data (phone boards end in -m). docs/design/handoff/screens.csv lists every screen.
4. docs/design/handoff/tokens.css: design tokens.
5. docs/design/COMPETITOR_BENCHMARK.md, docs/design/design-md-format.md and docs/design/web-interface-guidelines.md (where present).
6. CLAUDE.md (you rewrite it in A0).
Conflict rule: the PRD wins on behaviour, scope and compliance; HANDOFF wins on visuals, layout and labels. Log each conflict under Decisions and fix the losing document in the same PR.

CORRECTIONS ALREADY DECIDED (apply them everywhere: PRD, HANDOFF, CLAUDE.md, code, copy and fixtures; the document edits go in the A0 PR)
1. Authorship: every commit, PR and issue is authored by me only (Mahedi Hasan Emon, GitHub mahedi-emon). No co-author, ever (section 5).
2. Store name: "Waafas World" everywhere, never "Waafa Shop" and never "Shop" as a visible label. Route /shop. It sells any product category (printer and office supplies first), so no copy or layout may assume toner.
3. Bottom tab bar: Home, Packages, Waafas World (raised W disc in the centre), Visa, More. The label is always "Waafas World"; on a 320 px phone it may wrap to two lines, never cut.
4. Logo: one WAAFA logo per page, in the main header. In the store, "Waafas World" is text beside that logo, never a second mark. The tab-bar W disc is a navigation icon and stays.
5. Office hours: Saturday to Thursday, 10:00 am to 6:00 pm Asia/Dhaka, closed Friday; admin-editable; a live "Open now / Closed" chip.
6. Meet our team: a Home section (bento on desktop, snap carousel on phones) and a grid on About Us, fully admin-managed; initials instead of stock faces until real photos are uploaded.
7. Media: real photos and video only; never AI-generated, painted or drawn images.
8. Prices: taka with lakh grouping (৳1,46,480), VAT included.
9. Hajj and Umrah, and Manpower and Recruitment: skipped in this build and planned as Phase F once the licences exist. Build no route, menu item, copy, seed data or image for them now, but keep the architecture open: package categories, visa types, menus and home sections are admin-managed, so these modules can be added later without a redesign.
10. Footer credit: "Developed by Mahedi Hasan Emon" → https://www.mahedihasanemon.site/ (new tab), far right of the footer bottom bar, rendered from code.
11. The prototype is the floor, not the ceiling: keep its structure, copy and states, then raise the polish (section 10). Log each visual deviation in docs/design/DESIGN.md with the reason.
Exact PRD edits for the A0 PR:
- §6 Mobile navigation, tab bar bullet → "Bottom tab bar, always visible, five tabs: Home, Packages, Waafas World (a raised W disc in the centre), Visa, More. The tab label is always "Waafas World", on two lines if a narrow phone needs it, and opens /shop. More opens the sheet above plus Gallery, Feedback and Login."
- §6 Mobile navigation, store bullet → "Inside /shop the header keeps the WAAFA logo with "Waafas World" as text beside it, a product search field and a cart icon with a count; the bottom bar stays, with Waafas World active."
- §10 "Name and place" → "The nav label is "Waafas World", matching the waafasworld.com domain; the route stays /shop and the mobile tab also reads "Waafas World". The store header keeps the WAAFA logo with "Waafas World" as text beside it (no second mark), a product search field and the cart."
- §16 Logo usage → "Inside the store, "Waafas World" is set as text in the heading font beside the main WAAFA logo; there is no second mark and no separate store logo. The raised W disc in the mobile tab bar is a navigation icon."
- FR-GLB-07 → "BDT shown as ৳ with lakh grouping (৳1,46,480)."
- §2 compliance rules 2 and 3, and §5 → state that these modules are not in this build and are planned as Phase F after the licence.

## 1. Stack (non-negotiable)
Frontend, apps/web: Next.js latest stable (App Router, React Server Components), TypeScript strict, Tailwind CSS v4, shadcn/ui on Radix, lucide-react, Motion ("motion/react") through LazyMotion, Embla Carousel, React Hook Form + zod, nuqs (URL state), TanStack Query (client mutations and polling only), next-intl (English now; Bangla in P1 at /bn with localePrefix "as-needed"), sonner, vaul, cmdk, date-fns, libphonenumber-js, next/font, next/image.
Admin-only libraries, loaded with dynamic import and never in public bundles: @tanstack/react-table, recharts (shadcn Chart), dnd-kit, tiptap, react-dropzone.
Backend, apps/api (Phase B): Node.js 22 or 24 LTS, NestJS on the Fastify adapter, PostgreSQL 16+ through Prisma (current version, pg driver adapter), Redis + BullMQ, pino, Cloudflare R2, Resend or SMTP with React Email, Cloudflare Turnstile.
Monorepo: pnpm workspaces + Turborepo; packages/shared (zod schemas, types, enums and formatters used by web and api); packages/config (eslint, tsconfig, prettier).
Tests: Vitest + Testing Library, Playwright + @axe-core/playwright, Lighthouse CI (@lhci/cli), Supertest, k6.
Before using any library API, check the installed version with Context7. Next.js, React, Tailwind v4, shadcn, Motion, Prisma, NestJS and next-intl have all changed recently (for example async params, proxy.ts versus middleware.ts, the revalidateTag signature, Motion imports from "motion/react" and "motion/react-m").
Pre-approved dependencies: everything named in this prompt, the PRD and HANDOFF, including the listed 21st.dev components. Anything else only when clearly needed: pick the smallest well-maintained option, justify it in the PR and log it under Decisions. This replaces "Ask before adding a dependency" in CLAUDE.md, README and HANDOFF.

## 2. Components only: no raw HTML or CSS
- The .dc.html boards and waafa.css are references. Never copy their markup or CSS, never import waafa.css, never render prototype HTML.
- Every screen is built from typed React components:
  - components/ui: shadcn/ui primitives, added with the shadcn CLI or MCP, then themed with our tokens;
  - components/fx: 21st.dev effects, restyled with our tokens;
  - components/brand: LogoLockup, WMark, Wordmark, Ribbon, GoldTriangle (SVG components);
  - components/<feature>/: feature components;
  - app/**/_components/: sections used by one route only.
  One component per file, PascalCase, typed props, no `any`, named exports (default exports only where Next.js requires them).
- Styling: Tailwind utilities + tokens in app/globals.css (@theme and shadcn CSS variables) + cva variants + cn(). No other CSS files, no CSS modules, no CSS-in-JS, no inline style except truly dynamic values.
- No dangerouslySetInnerHTML except inside one RichText component that renders admin rich text sanitised on the server with an allow-list.
- Images through next/image (SmartImage wrapper), video through SmartVideo, icons from lucide-react or components/brand.
- Enforced in CI: ESLint (no-explicit-any, react/no-danger with the RichText exception, @next/next/no-img-element) plus scripts/guards.mjs, which fails if any .css file other than app/globals.css exists, if waafa.css or a .dc.html file is imported, or if a hex colour appears outside app/globals.css and components/brand.

## 3. Everything is controlled from the admin panel
Nothing a visitor sees is hard-coded except the footer developer credit and the compliance rules.
Every text, image, video, menu, link, home section (order, visibility, content), hero (image or video, mobile version, headline, rotating destinations), banner, offer, price, group fare, package, package category, visa record, visa type, product, category, collection, store row, airline list, contact detail, office hours, social link, payment method, shipping zone, COD cap, SEO field, announcement bar, team member, page, FAQ, blog post, notification template and booking mode comes from the data layer and has an admin screen that edits it.
- UI chrome strings (button labels, validation messages) live in next-intl messages; content lives in the data layer.
- Phase A: repositories with in-memory, read-write fixture implementations (server-side, reset on restart), so admin edits show on the public site during development and can be e2e-tested before the API exists. Every fixture record is marked Sample.
- TRACKER "Admin-control matrix": one row per public element: element → data field → admin screen → API endpoint (Phase B) → verified (Phase C). An issue is not done until its rows exist.

## 4. Tools: Serena first, then the right MCP and skill for each job
Serena, always first:
- At the start of every session and every issue: activate the project (H:\Waafa-OTA-Platform), check that onboarding is done, list_memories, then read the ones that matter.
- Read and edit code through Serena's symbol tools first: get_symbols_overview, find_symbol, find_referencing_symbols, replace_symbol_body, insert_before_symbol, insert_after_symbol, rename_symbol, search_for_pattern. Open whole files only when you must.
- Memories live in .serena/memories and are committed. Keep them short, dense and current: project_overview, stack_and_conventions, workflow_and_git, design_direction, motion_system, admin_control, data_layer, progress, decisions, known_issues, session_handoff. After every issue update progress, decisions and session_handoff; update the others when they change. Never put secrets or personal data in memories.
MCP servers (.mcp.json): serena; context7 for the docs of every library before use; shadcn to search, view and add registry components; magic (21st.dev) for component search, inspiration, refinement and logos; playwright for pages, screenshots at every width, console, network and traces; github for issues, PRs and projects (the gh CLI is equally fine). The project figma server is off; use the claude.ai Figma connector only if the handoff lacks a detail.
Skills: use every installed skill that fits, and record the ones you used in the TRACKER issue block (not in commits or PRs):
- ui-ux-pro-max: the WAAFA design system (A1), its UX and stack guidelines on every screen, and its pre-delivery checklist before every PR.
- design-taste-frontend and frontend-design: aesthetic direction, composition, typography, anti-template rules.
- design-superpowers (design, creative, design-review, ds-make, ds-manage, ds-consumer, ds-producer and the rest): the design system in code (A3) and a design-review pass on every finished screen.
- 21st:21st-ui: choosing and adapting 21st.dev components.
- ui-color-palette (build-color-system, scale-palette, generate-semantic and the rest): tint scales, semantic tokens and contrast checks. Never change the brand hex values in PRD §16.
- Every other installed skill: list all of them (about 61), one line each, in the TRACKER Tooling table with what each is for, and use them where they fit.
Subagents: run read-heavy or parallel work in subagents (one competitor site each, Lighthouse runs, an independent review of the diff and screenshots before each PR) so the main context stays small.

## 5. Git and GitHub: issue first, always; I am the only author
- Authorship: every commit is authored by me through the existing git identity (Mahedi Hasan Emon). At the start of every session, check it with `git var GIT_AUTHOR_IDENT`; if it is not me, stop and tell me. Never set or change the identity yourself. Issues and PRs are opened as mahedi-emon through the gh login.
- No co-author, ever, and no AI attribution: no "Co-authored-by" trailer, no "Generated with …" line, no session link and no "written by AI" note in commits, PR titles or bodies, issues, comments or code. (Tool files such as CLAUDE.md, .serena/ and docs/claude-code-prompts.md are fine.) Enforced three ways (Step 3): attribution off in .claude/settings.json, a husky commit-msg hook, and a CI check on every PR's commit messages and body. After the first commit and after every merge, check `git log -1 --format='%an <%ae>%n%B'`: the author is me and there is no trailer.
- No repo change without an open issue. Every change follows: issue → Project status In Progress → branch → work → PR "Closes #<n>" → CI green → squash-merge → issue closed → Project status Done → TRACKER + Serena.
- Branches: feat/<n>-<slug>, fix/<n>-<slug>, chore/<n>-<slug>, docs/<n>-<slug>. Conventional Commits that reference the issue, e.g. `feat(web): unified search card (#12)`. Stage only the files of the current issue (`git add <paths>`, never a blind `git add -A`). Push the branch often.
- Merge with an explicit message: `gh pr merge <pr> --squash --delete-branch --subject "<type(scope): title> (#<pr>)" --body "<2-4 line summary>"`, then `git switch main && git pull`.
- Never force-push, never rewrite pushed history, never push to main directly (one exception in Step 3), never change git config, never skip hooks with --no-verify.

## 6. Tracking: docs/TRACKER.md, one file, the same shape every time
Update it after every issue and at every session end. Use exactly this skeleton; every issue gets the same block, newest first.

```markdown
# WAAFA — Build Tracker
Updated: <dd Mon HH:mm> Asia/Dhaka · Phase: <A · Frontend> · Current: <#n · Ax title> · Progress: <done>/<total> issues (<%>) · Launch: 13 Oct 2026, <n> days left · Status: <On track | Behind by n issues>

## 0. Audit (first session)
## 1. Overview
| Phase | Milestone | Issues | Done | In progress | Blocked | Progress |
## 2. Issue log
### #<n> · <Ax> <title> — <⬜ Todo | 🟡 In progress | ✅ Done | ⛔ Blocked>
| Field | Value |
| --- | --- |
| Opened → closed | <dd Mon HH:mm> → <dd Mon HH:mm> |
| Branch · PR · merge | <branch> · #<pr> · <sha> |
| Built | <2-4 plain lines> |
| Files and components | <paths> |
| Screens matched | <board names> |
| Admin control | <matrix row ids> |
| Tests | unit <n> · e2e <n> · axe <pass/fail> · Lighthouse mobile <P>/<A>/<BP>/<SEO> |
| Widths checked | 320 · 390 · 768 · 1024 · 1440 |
| Tools and skills | <Serena, Context7, shadcn, magic, skills used, Playwright> |
| Decisions | <D-ids> |
| Bugs and follow-ups | <#ids or none> |
## 3. Route ↔ screen matrix
| Route | Screens | Issue | 320 | 390 | 768 | 1024 | 1440 | Tests | Lighthouse mobile |
## 4. Admin-control matrix
| # | Public element | Data field | Admin screen | API endpoint | Verified |
## 5. Components inventory
| Component | Path | Source (shadcn · 21st.dev id · custom) | Used on |
## 6. Tooling
| Tool or skill | Kind | Status | Last tested | Used for |
## 7. Benchmark
| Page | GoZayaan | ShareTrip | Akij Air | Obokash | Waafa | Notes |
## 8. Decisions
| ID | Date | Decision | Why | Issue |
## 9. Bugs and known issues
| Issue | Severity | Where | Status |
## 10. Cut list
## 11. Blockers and owner actions
| Item | What I need from the owner | Exact steps | Needed by |
## 12. Later phases (E live booking · F licensed modules)
| Item | Waiting for | Notes |
## 13. Session log (newest first)
| Date and time | Summary | Issues | PRs | Tests |
## 14. Next steps
```

## 7. First session: Step 0 to Step 3, then Phase A
STEP 0 — Audit what already exists (read-only)
The repo already holds work from an earlier session (for example apps/, .turbo, .github, docs/design/COMPETITOR_BENCHMARK.md and about 59 uncommitted changes). Before changing anything:
- Serena: activate, check onboarding, read all memories.
- `git var GIT_AUTHOR_IDENT` (must be me), `git status`, `git log --oneline -20`, `git remote -v`, `git ls-remote origin` (does origin/main exist?).
- `gh issue list --state all --limit 200`, `gh project view 4 --owner mahedi-emon`, `gh project item-list 4 --owner mahedi-emon --limit 200`, existing labels and milestones.
- Inventory apps/, packages/, root configs, .github/ and docs/; read COMPETITOR_BENCHMARK.md and any notes left behind.
- Secrets: inspect .mcp.json, .env* and .claude/*. Any literal key or token must become an environment reference (for example "${API_KEY_21ST}") before anything is committed. Never print a secret.
- Attribution: check every commit already on origin for a co-author trailer, AI attribution or an author other than me. Do not rewrite history; list any you find, because fixing them needs a force-push that only I can approve.
- Owner actions: list every account, key or ID needed for launch (Vercel, Railway or a VPS, managed PostgreSQL and Redis, Cloudflare R2 and Turnstile, Resend and its DNS records, Sentry, domain DNS, GA4, GTM, Meta Pixel) with exact steps, plus the open questions in PRD §17.
- Save the findings in a Serena memory, audit_findings (committed with A0): what exists, what is usable, what breaks this prompt's rules, and which backlog issue each item belongs to. Keep good work, fix or replace what breaks the rules, never delete work without recording why. The findings go into TRACKER.md in A0.

STEP 1 — Tool check (read-only; results go into the Tooling table in A0)
- serena: list_memories · context7: resolve Next.js and fetch the App Router docs for the installed version · shadcn: search the registry for "sidebar" · magic: search "flight search card" · playwright: open https://example.com and take a screenshot at 390 px · github: read the Project #4 fields.
- Skills: list every installed skill. Load ui-ux-pro-max, design-taste-frontend, frontend-design and design-superpowers:design-review and confirm each works. Test UI UX Pro Max without writing files:
  `python .claude/skills/ui-ux-pro-max/scripts/search.py "premium travel agency OTA booking and e-commerce, Bangladesh, mobile-first" --design-system -p "WAAFA"`
  (use python3 or py if python is not found; if Python is missing, install Python 3 with winget and note it).
- Anything missing or failing: fix or install it project-scoped, note it, continue. Never skip a tool silently.

STEP 2 — GitHub planning (no repo files yet)
- Labels, created if missing: type: feature, bug, chore, test, docs, design, perf, security · area: web, admin, api, shop, travel, visa, content, infra · priority: P0, P1, P2 · flags: blocked, needs-owner, later.
- Milestones: "A · Frontend" (due 11 Oct), "B · Backend" (12 Oct), "C · Integration & Launch" (13 Oct), "D · P1 completion" (13 Nov), "E · Live booking" (no date), "F · Licensed modules" (no date).
- Repo merge settings: squash only, delete branch on merge, squash title = PR title, squash body = PR body:
  `gh api -X PATCH repos/mahedi-emon/Waafa-OTA-Platform -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false -F delete_branch_on_merge=true -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY`
- Epics: "[Epic] A · Frontend", "[Epic] B · Backend", "[Epic] C · Integration & Launch", "[Epic] D · P1 completion", "[Epic] E · Live booking", and "[Epic] F · Licensed modules: Hajj & Umrah, Manpower & Recruitment" (labels later + needs-owner, Status Backlog, body: "Skipped in this build; starts only after the licence, on my word"). Child issues for Phase A now (A0–A22, section 8); child issues for later phases are created when their prompts start.
- Link each child as a sub-issue of its epic:
  `gh api graphql -H "GraphQL-Features: sub_issues" -f query='mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c}){issue{number}}}' -f p=<epic node id> -f c=<child node id>`
  (node ids: `gh issue view <n> --json id`). If that fails, put a task list of child links in the epic body.
- Reuse issues an earlier session created when they match; close true duplicates with a comment that points to the kept issue.
- Issue body template: Goal · Screens to match (HANDOFF route table) · Scope in / out · Acceptance checklist (design, motion, admin control, 320/390/768/1024/1440, accessibility, performance, tests) · Dependencies.
- Project #4: add every issue (`gh project item-add 4 --owner mahedi-emon --url <issue url>`); get the project id (`gh project view 4 --owner mahedi-emon --format json --jq .id`) and the field and option ids (`gh project field-list 4 --owner mahedi-emon --format json`); then set Status (Todo for Phase A, Backlog for later epics), Priority, Size, Estimate (XS 1, S 2, M 3, L 5, XL 8), Start date and Target date (milestone date) with `gh project item-edit`. Assign every issue to mahedi-emon.

STEP 3 — A0 Project setup (the first issue you work)
- docs/TRACKER.md with the skeleton, the Audit section (from audit_findings), the Tooling table (from Step 1), the owner actions and the later-phases table.
- .claude/settings.json (committed; merge if present):
```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "attribution": { "commit": "", "pr": "", "sessionUrl": false },
  "permissions": {
    "deny": [
      "Bash(git push --force*)",
      "Bash(git push -f*)",
      "Bash(git push * --force*)",
      "Bash(git push * -f*)",
      "Bash(git config *)",
      "Bash(git commit --no-verify*)",
      "Bash(git commit -n *)",
      "Bash(git reset --hard*)",
      "Bash(gh repo delete*)"
    ]
  }
}
```
- .gitattributes (`* text=auto eol=lf`, binaries marked binary), .editorconfig, Prettier endOfLine "lf".
- .gitignore: node_modules, .next, .turbo, dist, coverage, playwright-report, test-results, .playwright-mcp, .lighthouseci, .env and .env.* (keep .env.example), .serena/cache, .serena/project.local.yml, .claude/settings.local.json, docs/design/benchmark/_captures.
- Husky + lint-staged + commitlint (conventional). The commit-msg hook also rejects any message matching `co-authored-by|generated with|claude-session|noreply@anthropic` (case-insensitive).
- .github:
  - ci.yml on PRs and main: pnpm install with cache, guards, lint, typecheck, unit tests, build, Playwright smoke + axe at 390 and 1440, and an attribution check that fails if any PR commit message or the PR body matches the same pattern. It must pass before any app exists (skip steps that have nothing to run yet). Lighthouse CI is added once A7 exists. Cache the pnpm store, the Next.js build cache and Playwright browsers; use path filters so docs-only PRs stay fast.
  - dependabot.yml, CodeQL, a PR template (Summary, Closes #, screens and widths, tests, admin-control rows, checklist) and issue forms (feature, bug, change).
  - Review what an earlier session put in .github and keep what fits.
- CLAUDE.md rewritten so a fresh session can work from it alone: Read first · Corrections already decided · Stack · Component rules · Admin control · Tools (Serena first, MCPs, skills) · Git workflow, authorship (owner only) and the no-co-author rule · Tracking · Quality gates and Definition of Done · Design and motion bar (short, pointing to DESIGN.md and MOTION.md) · "Never" and "Always" lists merged from HANDOFF · a "Not in this build (Phase F, after the licence)" list: Hajj and Umrah; manpower, recruitment and employment visas · no "ask before adding a dependency".
- README.md: replace the starter kick-off with real setup (requirements, install, dev, test, e2e, build) and links to the PRD, HANDOFF, TRACKER and docs/claude-code-prompts.md.
- HANDOFF.md: one line saying its kick-off prompt is superseded by CLAUDE.md. PRD: apply the exact edits listed under Corrections already decided.
- Commit and push:
  - If origin has no main yet: one bootstrap commit straight to main with the starter files (CLAUDE.md, README.md, docs/, .serena/project.yml and memories, .mcp.json without secrets) and A0's files: `chore: import PRD, design handoff and project rules (#<A0>)`. A PR needs a base branch, so this is the only direct push to main, ever. Close A0 with a comment.
  - Otherwise: branch chore/<A0>-project-setup → PR → green CI → squash-merge.
  - Work an earlier session left in apps/ or packages/ stays uncommitted until its own issue (usually A2), where it is reviewed against these rules first.
- Branch protection on main if the plan allows: require a PR and green checks, block force pushes and deletion, no required reviews (solo developer). If GitHub refuses (private repo on a free plan), record it and rely on the deny rules, the hook and the CI check.
- If the Vercel CLI is logged in, link apps/web and turn on preview deployments per PR; if not, add it to the owner actions and continue.
Then work Phase A from A1, issue by issue, until the session ends.

## 8. Phase A backlog (one issue each, in this order)
- A0 Project setup (Step 3).
- A1 Design direction and competitor benchmark (docs). One subagent per site with Playwright at 390 and 1440 px: home hero, search widget and pickers, results or query flow, cards, menus, footer, loading states, and every animation and micro-interaction (trigger, duration, easing, smoothness, what it adds). On obokash.com skip all Hajj and Umrah content. Captures stay local in docs/design/benchmark/_captures (gitignored). Lighthouse mobile on each home page and one inner page (`npx lighthouse <url> --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=<file>`). Study patterns only; never copy layout, copy, images, icons or code. Outputs:
  - COMPETITOR_BENCHMARK.md (complete the existing file): per area what they do, where it is weak, how Waafa does it better, and the scores to beat;
  - DESIGN.md in the docs/design/design-md-format.md format: PRD §16, tokens, the ui-ux-pro-max design system persisted with `--design-system --persist -p "WAAFA"` plus `--page` for home, flights, shop and admin, the taste rules, and every deviation from the prototype;
  - MOTION.md: tokens for durations, easings and springs; the catalogue per component (section 10); phone versus desktop; reduced motion; performance rules; and a "beat list": for every competitor effect recorded, the Waafa effect that replaces it and why it is better.
- A2 Foundation: monorepo, apps/web, packages/shared, packages/config; Tailwind v4 + tokens in app/globals.css; shadcn init; next/font; next-intl; Vitest; Playwright + axe; ESLint, Prettier and guards. If apps/ already holds a scaffold, audit it against these rules and fix it rather than start over.
- A3 Design system in code + /styleguide (dev only, 404 in production): themed shadcn primitives with cva variants; LogoLockup, Ribbon, GoldTriangle; MotionKit (PageTransition, Reveal, Stagger, CountUp, Marquee, Parallax, PressScale, DrawCheck, DrawPath, Magnetic, Sheet); SmartImage; SmartVideo; skeleton, empty and error states. Every component in every state at 320-1440, with Playwright visual snapshots (motion off).
- A4 Data layer and content model: repository interfaces per domain (leads, search, travel, visa, shop, content, settings, admin) typed with zod schemas from packages/shared, the same contracts the API will implement; read-write in-memory fixture implementations; all admin-controlled content (settings, menus, home sections, hero, banners, footer, SEO, pages, team, media).
- A5 Media pipeline (section 11).
- A6 Layout shell: header (transparent over the hero → solid after 24 px), Waafas World mega panel, More panel, mobile top bar, bottom TabBar, full-screen drawer, More sheet, dynamic footer with the developer credit, announcement bar, floating WhatsApp, brand loader, breadcrumbs, skip link, shared metadata and JSON-LD helpers.
- A7 Home: all 13 PRD sections, order and visibility from data; video hero; Meet our team as a bento on desktop and a snap carousel on phones.
- A8 Unified search card and pickers: tabs, airports with the pinned list, full-screen pickers on phones, popovers on desktop, validation, URL state (nuqs), recent searches, async search logging.
- A9 Results shell + Flights Manual mode (2-step form with Cloudflare's Turnstile test keys in development, success with reference number, error, edit) + group fares page and rail.
- A10 Hotels Manual mode.
- A11 Tour packages (list, filters, detail with gallery lightbox, itinerary timeline, sticky booking card, query, success) + Plan My Trip.
- A12 Visa (list, country page, multi-step apply with upload UI, success and error) + Visa Guide.
- A13 Waafas World catalogue: store home, mega menu, search suggestions, category, brand and collection listings with attribute filters, product page with variants, Find by model, search.
- A14 Cart (mini-cart drawer, coupon), checkout (COD cap, offline payment with proof), order success, track order.
- A15 Printing Solutions + International Trading.
- A16 Gallery, Feedback, About (team grid, journey), Contact, FAQs, Blog and post, Refund, Privacy, Terms, Baggage, EMI, Offline Payment.
- A17 System states: 404, 500, offline, maintenance, loading patterns; the ResultsBody slot with a LiveBody placeholder (full Live bodies are Phase E).
- A18 Admin core: shell (shadcn Sidebar, command palette Ctrl+K, breadcrumbs), sign-in (a development stub session that cannot run in production, with a test that proves it), dashboard, leads (list, detail, timeline, convert to booking), search activity, bookings.
- A19 Admin catalogue: group fares; packages and package categories (itinerary day builder, price table, departures); visa (countries, visa types, checklist builder, fees, pipeline, document viewer); shop (products with variants, attribute sets, category tree, brands, collections, compatibility CSV import, stock, orders, shipping zones, coupons).
- A20 Admin content: pages, blog, FAQs, banners and offers, home sections and hero media, destinations, airlines list, gallery, feedback moderation, team, announcement bar, baggage table, EMI banks, header and footer menu builder, media library, per-page SEO.
- A21 Admin operations: customers, marketing, reports, users and roles, settings (general and contact, office hours, footer, Booking Modes with Live locked, offline payment, COD limit, shipping, notification templates, lead form options, maintenance mode).
- A22 Frontend QA and polish: every route at 320/390/768/1024/1440; motion polish against MOTION.md; the beat check against COMPETITOR_BENCHMARK; accessibility; budgets; fix everything found. Phase A closes only with every issue closed and zero open P0 or P1 bugs.

## 9. How to work every issue (Definition of Done)
1. Serena first: read session_handoff, progress and the memories the issue touches.
2. Project Status → In Progress; assign to mahedi-emon; comment a short plan on the issue.
3. Branch from an up-to-date main.
4. Before UI: open the listed boards in docs/design/project and docs/design/index.html for copy, states and data; apply ui-ux-pro-max, design-taste-frontend, frontend-design, DESIGN.md, MOTION.md and the web interface guidelines; check every API with Context7.
5. Components: shadcn first; 21st.dev effects from the HANDOFF table through the magic MCP or `npx shadcn@latest add "https://21st.dev/r/<author>/<component>?api_key=$API_KEY_21ST"` (never write the key into files, logs or saved commands); then restyle with tokens and check keyboard use, reduced motion and bundle size.
6. Phone first (390, then 320), then 768, 1024 and 1440.
7. Fill the issue's rows in the Admin-control matrix.
8. Verify before the PR:
   - pnpm guards, lint, typecheck, test and build pass.
   - Playwright MCP on every touched route at 320, 390, 768, 1024 and 1440: screenshots, zero console errors, no horizontal scroll, no layout shift, keyboard pass, axe pass.
   - Animated interactions: a Playwright trace at 4x CPU throttling with no long task over 50 ms.
   - Lighthouse mobile on touched public routes, within budget.
   - Vitest for all logic (validation, ৳ formatting, URL state, cart maths, mode switching, office hours); a Playwright e2e test for every user flow (reduced motion on, for stable runs).
9. Review: design-superpowers:design-review and the ui-ux-pro-max pre-delivery checklist on the 390 and 1440 screenshots next to the prototype board. For big UI issues a subagent also reviews the diff and screenshots independently. Fix everything before the PR.
10. PR from the template ("Closes #<n>", summary, screenshot list, tests, matrix rows). Wait for green CI, squash-merge with the explicit message, delete the branch, pull main, and check the merge commit's author and message (section 5).
11. Close-out comment on the issue (what was built, files, tests, known limits); confirm it is closed and its Status is Done.
12. TRACKER: issue block (including tools and skills used), overview, route and component tables, session log. Serena: progress, decisions, session_handoff.
Any bug you find becomes a bug issue, fixed with a regression test. No known bug stays undocumented.

## 10. Design and motion bar: beat all four competitors
Goal: within five seconds on a 390 px phone, a visitor sees a premium, trustworthy brand, a real destination, a clear headline and a search they can use with one thumb.
Look: premium, calm, confident; deep navy and electric blue; the ribbon motif; gold only for the triangle and premium badges; cyan only on dark; glass only on the search card. Never template-like, never "default shadcn", never AI-looking.
Craft:
- Typography: Plus Jakarta Sans for display (tight tracking at large sizes), Inter for UI and body (16 px body on phones), tabular numbers for prices, dates and times, one type scale everywhere.
- Layout: 4/8 px spacing, token radii, navy-tinted layered shadows, generous whitespace, bento compositions where they mean something (Why Waafa, team, store home), never a page of identical cards.
- States: every interactive element has hover, focus-visible, pressed, disabled and loading states; skeletons match the final layout; empty and error states are designed and offer a next action.
- Content: real lengths and Bangladeshi context (৳ with lakh grouping, +880, divisions and districts, WhatsApp). No lorem ipsum, emoji, fake numbers, invented reviews or filler words (elevate, seamless, unleash, discover).
Signature moments (no competitor has these; each one built once in MotionKit and reused):
- Flight path: on the home hero, a thin flight-path line draws itself once from the headline towards the search card.
- Search → results continuity: on submit, the search card morphs into the results summary bar (shared layoutId), so the trip the visitor typed travels with them.
- Route arc: the flight query page shows the route (for example DAC → DXB) as an arc that draws itself, with a small plane gliding along it.
- Boarding-pass success: every success state is a boarding-pass style card that slides out of a slot with the reference number, a self-drawing check and light confetti.
- Visa checklist: each requirement ticks with a drawn check as its document is added, while a progress ring fills.
- Store: variant swatches morph, product images crossfade on variant change, and Add to cart flies along an arc into the cart with a badge pop.
- Magnetic primary buttons on desktop (subtle, 6 px at most).
Motion catalogue (specified in MOTION.md, built through MotionKit):
- Hero: SmartVideo (the poster image is the LCP element; the video fades in after load; skipped on Save-Data, 2G/3G and reduced motion; a lighter mobile file), soft blur-in or word-by-word headline, rotating destination chip, slow ribbon parallax.
- Search card: border beam (desktop), spring tab pill (layoutId), 180° From/To swap, vaul bottom sheets with drag on phones, animated date-range fill, traveller stepper with a number roll, one shimmer on the Search button when idle.
- Navigation: page transition in template.tsx (fade + 8 px rise), header solidifies on scroll, TabBar layoutId pill and a pressed raised W disc, mega-menu stagger, shared image from card to detail (React View Transitions if the installed Next.js supports them, otherwise Motion layoutId).
- Lists and cards: reveal once with 40-60 ms stagger; lift and gentle image zoom on desktop hover; hover-to-play video previews on package cards (desktop); press scale on touch; spotlight and tilt on desktop only; layout animation when filters change.
- Feedback: skeleton → crossfade at the same height, sonner toasts, one small error shake.
- Numbers and logos: CountUp on view (owner-provided numbers only), airline marquee (pauses on hover and under reduced motion; labelled "Airlines we book", never "partners"), deal countdowns.
- Storytelling: the About journey timeline and the package itinerary draw as you scroll; an animated route map on About; lighter versions on phones.
Motion engineering:
- LazyMotion with `m` components from "motion/react-m"; load domAnimation by default, and domMax (needed for layoutId and drag) asynchronously, only where used.
- Animate transform and opacity only; path drawing on small SVGs and blur on desktop are the only exceptions. Nothing animates the LCP element on first paint. Off-screen loops pause.
- useReducedMotion: movement becomes a 150 ms fade; marquee, video and Ken Burns stop; counters show the final number; signature moments show their end state.
- 60 fps on a mid-range Android: verify with Playwright traces at 4x CPU throttling.
Beat check for every key page: compare local screenshots with the best competitor page and score 1-5 on first impression, clarity, trust, motion polish and speed. Waafa must score higher on every axis, or the issue stays open.

## 11. Media: real only, sourced by you
- Photos: run docs/design/photos/get-waafa-photos.mjs; optimise to AVIF/WebP at the sizes used; serve from apps/web/public/media (R2 later); credits in docs/design/MEDIA_CREDITS.md.
- Video: replace the stand-in scenery loops with free-licence real footage you find yourself (Pexels, Coverr or Mixkit). Transcode with ffmpeg (ffmpeg-static if ffmpeg is not installed) to 1280×720 H.264 MP4 + VP9 WebM of 1 MB or less, a 720 px-wide mobile version and an AVIF/WebP poster; record the credits.
- Never AI-generated, painted or drawn images; never competitor assets; no Hajj or Umrah imagery in this build. All media can be replaced from the admin media library.

## 12. Performance budgets (public pages)
- First-load JS 200 KB gzip or less per public route; admin libraries never in public chunks.
- Mobile LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less; Lighthouse mobile Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+, and above every competitor score in the benchmark.
- Server Components by default; static rendering with cache tags for admin-managed content; sized images, priority only on the LCP image; two self-hosted font families with size-adjust (no font shift).
- Time-based UI (office-hours chip, countdowns) renders on the client in Asia/Dhaka time, to avoid hydration mismatches and stale caches.

## 13. Compliance (in code, fixtures, copy and seed data)
No trade licence data anywhere. Hajj and Umrah, and Manpower and Recruitment (including employment visas): not in this build, planned as Phase F after the licence; no route, menu item, copy, seed data or image for them now. Fares labelled indicative; no fake live availability. No invented reviews or testimonials. Passport and visa documents never public. No restricted items in Waafas World. No IATA, ATAB or TOAB badges unless the company holds them. Prices in taka, VAT included, ৳ with lakh grouping (1,46,480). Online payment shown only when it is live.

## 14. Deadline guard
At the start of every session, compare progress with the HANDOFF build order and the milestones. If behind, say so in your first reply and in the TRACKER header, and propose cuts from the PRD §17 cut list (gallery video, blog extras and part-code search first). Never cut security, lead capture, the admin leads module, compliance or accessibility. After A1 and after A7, post a short summary with screenshot paths and keep going; I will interrupt if I want changes.

## 15. Session end (always, even if interrupted)
Commit and push all finished work on its branch; never leave work only on disk. Update TRACKER (issue block, session log, next steps) and Serena (progress, decisions, and session_handoff with exactly where to resume and the next three steps). Comment on the in-progress issue where you stopped. If the context window is nearly full, do all of this first, then tell me to open a new conversation with PROMPT 2.

Start now: Step 0, Step 1, Step 2, Step 3 (A0), then A1 onward.
````

---

## PROMPT 2 — Continue (every new conversation)

````
Continue the WAAFA build. Follow CLAUDE.md exactly (corrections already decided, stack, component rules, admin control, tools, git workflow and authorship, tracking, quality gates, design and motion bar). Talk to me in short Banglish.
1. Serena first: activate the project; read session_handoff, progress and decisions, then any memory the next issue needs.
2. Check `git var GIT_AUTHOR_IDENT` is me; check git status and the current branch; read the docs/TRACKER.md header, issue log and blockers; check Project #4 (`gh project item-list 4 --owner mahedi-emon`).
3. Deadline check against the build order and milestones; if behind, say so first and propose cuts.
4. Resume the in-progress issue exactly where session_handoff says; otherwise take the next Todo issue in order.
Every issue: issue → In Progress → branch → build (Serena symbol tools, Context7, shadcn, magic/21st.dev, ui-ux-pro-max, design-taste-frontend, frontend-design, design-superpowers) → verify (guards, lint, typecheck, unit tests, build, Playwright MCP at 320/390/768/1024/1440, axe, traces, Lighthouse) → design review → PR → green CI → squash-merge → close → Project Done → TRACKER block + Serena memories.
Components only, everything admin-controlled, real media only, I am the only author, no co-author or AI attribution anywhere, never force-push. Hajj/Umrah and Manpower stay out until Phase F. Before the session ends: push everything and write session_handoff.
````

---

## PROMPT 3 — Phase B: Backend

````
Phase A is closed. Start Phase B (backend) following CLAUDE.md and docs/PRD.md §12-15. Serena first, then docs/TRACKER.md. Talk to me in short Banglish.

Create the Phase B issues under "[Epic] B · Backend" (milestone "B · Backend"), add them to Project #4 with all fields, and work them in order with the usual workflow:
- B1 API foundation: apps/api with NestJS on Fastify; zod-validated env config; @fastify/compress (brotli + gzip), @fastify/helmet, @fastify/etag, CORS for the web origins only; pino with request ids; RFC 7807 errors; OpenAPI (protected outside development); /health and /ready; graceful shutdown; a separate worker entry for BullMQ jobs; docker-compose with PostgreSQL 16, Redis 7 and Mailpit; `pnpm dev` runs web, api and worker.
- B2 Database: Prisma schema for every PRD §15 entity; money as integer paisa plus a currency code; timestamptz; indexes on every filter, sort and foreign key; pg_trgm GIN indexes for autocomplete and search; JSONB where the PRD says so; migrations; a seed with Sample data that matches the A4 fixtures (never licence data).
- B3 Staff auth and RBAC: argon2id; 15-minute access and rotating 7-day refresh tokens in httpOnly, Secure, SameSite cookies; CSRF on cookie writes; roles and guards per PRD §4; login lockout; an audit log with before and after values on every write.
- B4 Settings and public config: settings API; GET /api/v1/config/public with a 60 s Redis cache; the Golden Switch with Live locked; a signed (HMAC) revalidation call to a Next.js route handler that revalidates the right cache tags (check the installed Next.js API with Context7).
- B5 Leads for every module (FLT, HTL, PKG, CTR, VSA, PRN, TRD, CNT): reference numbers, Idempotency-Key, Redis rate limits, server-side Turnstile verification, duplicate guard, async search logs, emails to customer and staff through the queue.
- B6 Travel and content: packages and package categories; group fares with an auto-expiry job; visa (private R2 uploads with magic-byte checks, 10-minute signed links, retention job, download audit); CMS content, gallery, feedback moderation, team, menus, home sections, hero media, SEO fields; media library (sharp resizing in the worker).
- B7 Shop: category tree, attribute sets, products and variants, brands, collections, compatibility with CSV import, server-side cart and price calculation, orders (COD cap, offline payment proof), stock per variant inside transactions, shipping zones, coupons, tracking.
- B8 Notifications: BullMQ queues with retries, backoff and a dead-letter list; React Email templates editable in admin; a delivery log.
- B9 Admin APIs for every admin screen; dashboard KPIs from pre-aggregated tables refreshed by jobs; reports; CSV and Excel export. Every Admin-control matrix row gets its endpoint.
- B10 Provider adapters: FlightProvider, HotelProvider and PaymentProvider interfaces; working Manual providers; stubs with contract tests for Sabre, Amadeus, Travelport, two consolidators, SSLCommerz, bKash and Nagad; normalised schemas from packages/shared.
- B11 Performance and load: k6 scenarios in tools/load (browse, search + lead submit, shop checkout, admin lists).

Fast-server rules (required everywhere):
- No slow work in the request path: email, SMS, search logs, image processing, exports and provider calls go to BullMQ in the worker process.
- Public GET responses carry ETag and Cache-Control (s-maxage with stale-while-revalidate); the Next.js server caches them with tags, so most public traffic never reaches the API.
- Redis cache-aside for config, menus, home sections and catalogue lists, invalidated on admin writes together with the Next.js revalidation call.
- Prisma: one client, the pg driver adapter, a pool sized to the host, a statement timeout, select only the fields needed, no N+1 (batch or include), cursor pagination, transactions for orders and stock. Find hot queries with EXPLAIN ANALYZE and pg_stat_statements; keep them under 20 ms.
- Validate with zod at the edge and reject unknown fields; never trust prices or totals from the browser.
- One process per CPU core in production (replicas or cluster), keep-alive aligned with the proxy, idle memory under 300 MB, graceful shutdown.
- Targets at 50 RPS sustained: public reads p95 300 ms or less, writes p95 800 ms or less, zero errors. Results go into TRACKER.

Every endpoint: shared zod schemas from packages/shared, unit tests and Supertest e2e, OpenAPI docs, Admin-control matrix updated. Phase B closes only with zero open P0 or P1 bugs.
````

---

## PROMPT 4 — Phase C: Integration + Launch

````
Phase B is closed. Start Phase C (integration, full testing, launch) following CLAUDE.md. Serena first, then docs/TRACKER.md. Talk to me in short Banglish.
Create the Phase C issues under "[Epic] C · Integration & Launch", add them to Project #4 with all fields, and work them in order:
- C1 Switch the web data layer from fixtures to the API (fixtures stay for tests), with cache tags and the signed revalidation; admin edits visible on the site within seconds; real admin auth replaces the development stub.
- C2 Admin-control audit: walk every matrix row; change it in admin, confirm it changes on the site, mark it Verified.
- C3 Full Playwright e2e suite for every P0 flow on phone and desktop, with axe and visual checks; every bug becomes an issue fixed with a regression test.
- C4 Security pass per PRD NFR-SEC: nonce-based CSP and headers, rate limits, uploads, secrets, `pnpm audit`, Dependabot, CodeQL, an OWASP Top 10 checklist.
- C5 SEO and analytics: metadata from admin fields, JSON-LD, split sitemap and robots, dynamic OG images, GA4, GTM and Meta Pixel after consent, Search Console.
- C6 Performance: Lighthouse CI on key pages; every budget met and above every competitor score.
- C7 Deploy: web on Vercel; API and worker as Docker images on Railway or a VPS; managed PostgreSQL and Redis; R2 buckets; Resend with SPF, DKIM and DMARC; real Turnstile keys; Sentry with release tags; an uptime monitor; daily backups with a tested restore; staging first, then production; migrations in the pipeline. Owner actions listed with exact steps.
- C8 Launch: content entry with the owner (packages, visa countries, group fares, products, policies, team), the final launch checklist and rollback plan in TRACKER, go live, then 48 hours of monitoring and fixes.
No open P0 or P1 bug at launch.
````

---

## PROMPT 5 — Phase D: P1 completion (after launch)

````
Launch is done. Start Phase D (PRD P1, target 13 Nov 2026) following CLAUDE.md. Serena first, then docs/TRACKER.md. Talk to me in short Banglish.
Create the issues under "[Epic] D · P1 completion", add them to Project #4 with all fields, and work them in order:
customer accounts (phone OTP, email and password, Google; guest records attach after phone verification) · /track page · Bangla (next-intl bn at /bn, Bengali font, every UI string and admin content field) · SSLCommerz and bKash online payment behind PaymentProvider · SMS gateway adapter · real-time admin alerts and a Telegram alert · TOTP 2FA (mandatory for Super Admin and Admin) · quote builder, lead kanban, reminders, round-robin assignment · partial lead capture · reviews with moderation, wishlist · EMI calculator · courier API (Steadfast, Pathao or RedX) · store campaigns and flash sales · bulk product CSV import, invoices and packing slips · admin dark mode.
Same quality gates, everything admin-controlled, no open P0 or P1 bug at phase end.
````

---

## PROMPT 6 — Bug

````
Bug: <ki hocche>
Where: <route ba screen, jemon /shop/checkout on 390 px>
Expected: <ki howa uchit>
Follow CLAUDE.md: Serena first; create a bug issue (P0 if it affects production) and add it to Project #4; fix on fix/<n>-<slug>; add a regression test; verify with Playwright MCP at the affected widths; PR, green CI, squash-merge, close the issue; update TRACKER and the Serena memories. I am the only author; no co-author. Reply in short Banglish.
````

---

## PROMPT 7 — Change request

````
Change request: <ki add ba change korte chao>
Where: <page, section ba admin screen>
Priority: <P0 / P1>
Follow CLAUDE.md: Serena first; create a feature issue and add it to Project #4 with all fields. If it changes scope, behaviour or design, update docs/PRD.md, HANDOFF.md, DESIGN.md or MOTION.md in the same PR. Keep everything admin-controlled, meet the design and motion bar, verify at 320/390/768/1024/1440, PR, green CI, squash-merge, close; update TRACKER and Serena. I am the only author; no co-author. Reply in short Banglish.
````

---

## PROMPT 8 — Status

````
Status report only: do not change any file. Serena first, then read docs/TRACKER.md and Project #4.
Tell me in short Banglish: phase and percent done; what finished since the last session; what is in progress; open bugs; blockers and exactly what I must do; days left against the plan; the next three issues.
````

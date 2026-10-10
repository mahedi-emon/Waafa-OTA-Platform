# Session handoff (update at every session end)
Updated 2026-10-11 01:00 Dhaka.
Done this session: #51 review fixes (PR #53); Phase B API: #54 B1 foundation (PR #58), #55 B2 staff auth (PR #59),
#56 B3 public intake + notifications (PR #62, also fixed bugs #60 VAT BIN regex and #61 refused checkout key),
#57 B4 admin API (PR #63). C1 #64 web-on-API PR #65 OPEN (CI running) on `feat/64-web-api-source`.
Next three steps: 1) merge PR #65 when CI is green → Project Done; 2) admin UI at /[locale]/admin (A18–A21 issues
#18–#21): BFF sign-in (server actions keep API tokens in httpOnly cookies, D129), shell (sidebar, Ctrl+K), dashboard,
leads list + detail, orders, feedback/proofs queues, users, and ONE generic schema-driven editor for every
CONTENT_MODEL key (JSON Schema from z.toJSONSchema on the server, form on the client, save via PUT
/api/v1/admin/content/:key/:id or /settings/:key) — bespoke editors (package day builder, product card, tiptap,
media uploads, customers, reports, bookings) go to the cut list; 3) Turnstile browser widget issue (secret set without
widget refuses every form), then deploy prep (Dockerfile API on Railway, web on Vercel) — blocked on owner accounts.
Owner must act now (deploy 13 Oct): Vercel login, Railway (API + Postgres + Redis), domain DNS, Resend, Turnstile keys;
reconnect MCP servers (playwright, context7, shadcn, magic) with /mcp. Local PostgreSQL (H:/waafa-local/pgdata, port
5433) was stopped by the system for low memory on 11 Oct; restart only with the owner's OK (pg_ctl in background);
API DB tests run in CI (Postgres 16 service).
Gotchas: NEVER taskkill node.exe (kill by port PID only; a day-old stale grep ate 900 MB once — check Get-Process).
The Bash tool collapses `\\` to `\` inside heredocs and node -e: put regex/backslash edits through the Edit/Write
tools. Literal BOM characters can sneak into files written with "\uFEFF": use String.fromCharCode(0xfeff).
Nest POST defaults to 201 (add @HttpCode(200) for lookups). `gh pr merge --delete-branch` needs a clean tree:
`git stash -u` first, pop on the next branch. Git Bash path args: MSYS_NO_PATHCONV=1.

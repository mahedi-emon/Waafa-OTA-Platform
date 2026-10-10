# Session handoff (update at every session end)
Updated 2026-10-10 19:45 Dhaka.
Done: #14 (PR #47), #15 (PR #48); #16 A16 information pages built on `feat/16-content-pages` (15 routes, feedback and
payment-proof intake, page blocks, sitemap rewrite); gates green locally (unit 207+48+82, e2e 77). Next: PR "Closes #16"
→ CI → squash-merge → Project Done → #17 A17 In progress.
Reviews run 10 Oct (subagents): link/SEO audit and board-fidelity review DONE (findings listed in TRACKER §14 item 2 →
open a review-fix issue); compliance audit and code-correctness review were cut by the account rate limit → redo them
(grep or subagent after the limit resets).
Next three steps: 1) merge #16; 2) A17 system states (catch-all [locale]/[...rest] for branded 404, error.tsx,
global-error.tsx, offline, maintenance via getPublicConfig().maintenance); 3) review-fix issue, then lean Phase B
(API + Postgres for leads/orders/feedback/proofs/content, staff auth, email) and admin on one list+form pattern.
Owner must act now (deploy 13 Oct): Vercel login, Railway (API + Postgres + Redis), domain DNS, Resend, Turnstile; reconnect
MCP servers (playwright, context7, shadcn, magic) with /mcp.
Gotchas: NEVER taskkill node.exe (kill by port PID only). Bash `node -e`/sed strip backslashes and heredocs break on
quotes: write files with the Write tool. Git Bash turns "/path" args into Windows paths: set MSYS_NO_PATHCONV=1 and use
C:/ paths for scripts. Screenshot script: scratchpad shots.cjs (needs `next start --port 3100`). Radix chip radios in e2e:
click the label. Param pages await params in Suspense (D85); static pages use Canonical (D90); Phase A in-memory state
lives on globalThis (D105); React Compiler lint forbids reassigning render locals and manual memo with derived deps.

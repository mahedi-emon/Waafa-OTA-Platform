# Session handoff (update at every session end)
Updated 2026-10-11 05:45 Dhaka.
Merged today: #59 B2 auth, #62 B3 intake (+bugs #60 #61), #63 B4 admin API, #65 C1 web on the API, #67 refresh grace
(#66), #68 launch admin A18 (A19–A21 closed with cuts to #71), #70 Turnstile (#69), #73 Live stays locked (#72),
#75 deploy runbook (docs/DEPLOY.md, #74 open: needs owner accounts), #76 admin QA job (screens 320–1440 + axe),
#77 signature motion (#52). OPEN: PR #79 = fixes from the independent review (#78: seed marker, Redis fail-fast,
trustProxy one hop + atomic login count, order cancel race, proof reject, snapshot generation, priceCart missing
line, page clamp, revalidate products-only). CI job "API mode e2e" runs API+Postgres+web end to end (green).
Next three steps: 1) merge #79 when green; 2) owner accounts → deploy per docs/DEPLOY.md (#74), staging checks;
3) polish: #39 perf (home JS), #22 QA (768/1024 public screenshots), search→results morph (cut, D140 to log).
Local Postgres (5433) is stopped (system low memory); restart only with the owner's OK. MCP playwright/context7/
shadcn/magic disconnected. Gotchas: Bash tool collapses `\\` in heredocs/node -e (use Edit tool for regex/backslash);
fieldsets need min-w-0; `gh pr merge --delete-branch` wants a clean tree; regenerate route types with
`npx next typegen` after switching branches (stale .next/types breaks tsc).

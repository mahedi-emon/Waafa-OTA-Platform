# Session handoff (update at every session end)
Updated 2026-10-10 16:15 Dhaka.
Done this session: #13 merged earlier (PR #46); #14 A14 cart, checkout, order success, track built on `feat/14-cart-checkout`:
all gates green locally (unit web 188 + shared 48 + fixtures 79, e2e 64, axe, build). Next: PR "Closes #14" -> CI ->
squash-merge -> close -> Project Done -> #15 In progress (Printing Solutions + International Trading, PRN/TRD leads).
Open bug #39 (P1): perf budget. Owner decision pending: launch scope for 13 Oct (behind ~6 issues; TRACKER section 10).
Next three steps: 1) merge #14; 2) A15 Printing/Trading pages; 3) A16 content pages, A17 system states, then admin A18-A21.
A14 leftovers (cut to A22): mini-cart drawer + fly-to-cart arc, save for later, often-bought-together, cart corporate
quote, Lighthouse + 320/768/1024 screenshots for cart/checkout/track.
Gotchas: NEVER `taskkill //IM node.exe` (kills the MCP servers: playwright, context7, shadcn, magic); kill servers by
port PID only. Bash `node -e` strips backslashes in regexes (use Write tool scripts or Edit). Param pages await params
inside Suspense (D85); static pages use components/seo/Canonical (D90); route handlers and pages are separate module
graphs, so Phase A in-memory state lives on globalThis (D105); ICU templates to client via t("key", { x: "{x}" });
RHF use useWatch; `new Date()` only in client hooks or accessors that are not cached.

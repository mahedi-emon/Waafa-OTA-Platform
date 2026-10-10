# Session handoff (update at every session end)
Updated 2026-10-10 08:40 Dhaka.
Done this session: #34 A1b (PR #38), #8 A8 search card (PR #40), #7 A7 Home (PR #41). In progress: #9 A9 on
`feat/9-flights` — results shell, Flights Manual request, /api/leads (idempotency, rate limit, Turnstile-ready),
boarding-pass success, /flights/group-fares; all gates green locally (unit 144, e2e 43, axe). Next: PR "Closes #9" →
CI → squash-merge → close → Project Done (item PVTI_lAHOBsdPus4BmHeEzg_hv10).
Open bug #39 (P1): perf budget (Home 71–74, /flights 65; JS ~350 KB, fonts 78 KB, HTML 69 KB on simulated Slow 4G).
Next three steps: 1) merge #9; 2) A10 hotels Manual (reuse results shell, LeadSuccess, FormField/PhoneField,
/api/leads; add hotelLeadForm like flightLeadForm); 3) A11 packages + Plan My Trip, then A12 visa.
Owner decision pending: launch scope for 13 Oct (behind ~6 issues; TRACKER section 10 item 5).
Gotchas: shell scripts with regex via node -e lose backslashes (use Serena replace_content or files in scratchpad);
PowerShell paths with [locale] need -LiteralPath; `new Date()` in server components fails prerender (use client
hooks like useDhakaToday); RHF: use useWatch not watch() (React Compiler lint).

# Session handoff (update at every session end)
Updated 2026-10-10 13:35 Dhaka.
Done this session: #34 (PR #38), #8 (PR #40), #7 (PR #41), #9 (PR #42), #10 (PR #43), #11 (PR #44).
#12 A12 visa on `feat/12-visa`: /visa-services, /visa-services/[country] (+ /apply), /visa-guide (+ /[slug]); all gates
green locally (unit 166, e2e 54, axe, Lighthouse 70–85). Next: PR "Closes #12" → CI → squash-merge → close → Project
Done (item PVTI_lAHOBsdPus4BmHeEzg_hwCQ), then #13 In progress.
Open bug #39 (P1): perf budget (Lighthouse 68–85; JS ~440 KB on package detail).
Next three steps: 1) merge #12; 2) A13 Waafas World store /shop (any category; no toner-only copy); 3) A14–A16 cart,
checkout (no online payment, COD cap), track order; then A17 static pages incl. branded 404.
Owner decision pending: launch scope for 13 Oct (behind ~6 issues; TRACKER section 10 item 5).
Gotchas: param pages must await params inside Suspense (D85); fully static pages must not use alternates.canonical
(use components/seo/Canonical, D90); shell regex via node -e loses backslashes (write scripts to scratchpad);
PowerShell [locale] paths need -LiteralPath; `new Date()` in server components fails prerender; RHF use useWatch;
ICU templates to client: t("key", { x: "{x}" }); kill stale servers on 3000/3100 before build or e2e.

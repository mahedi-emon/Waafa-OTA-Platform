# Session handoff (update at every session end)
Updated 2026-10-10 15:35 Dhaka.
Done this session: #34, #8, #7, #9, #10, #11 (PR #44), #12 (PR #45). #13 A13 store on `feat/13-store`: all gates green
locally (unit 297, e2e 60, axe, Lighthouse 67–77); next: PR "Closes #13" → CI → squash-merge → close → Project Done
(item PVTI_lAHOBsdPus4BmHeEzg_hwHE), then #14 In progress.
Open bug #39 (P1): perf budget (Lighthouse 61–85 across routes).
Next three steps: 1) merge #13; 2) A14 cart page (/shop/cart reads components/shop/useCart), mini-cart drawer with
fly-to-cart, coupon (findCoupon), delivery by zone (getShippingSettings), one-page checkout with COD cap and offline
payment proof, ORD success, /shop/track; 3) A15 Printing/Trading pages (PRN/TRD leads), then A16, A17.
Owner decision pending: launch scope for 13 Oct (behind ~6 issues; TRACKER section 10 item 5).
Gotchas: param pages await params inside Suspense (D85); fully static pages use components/seo/Canonical, not
alternates.canonical (D90); Bash heredocs with apostrophes or nested quotes break, so write files with the Write tool
or scratchpad .cjs scripts; kill stale servers on 3000/3100 before build or e2e; ICU templates to client via
t("key", { x: "{x}" }); RHF use useWatch; `new Date()` only in client hooks or "use cache" accessors.

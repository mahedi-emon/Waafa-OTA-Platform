# Session handoff (update at every session end)
Updated 2026-10-11 15:45 Dhaka.
Phase A ✅ (epic #28 closed), Phase B ✅ (epic #29 closed). All PRs merged; main = docs #94.
Today: VPS Docker + nginx (#81), provider adapters + Admin › Settings › Integrations (#83), zod out of first load
(#84, #39 closed → #91), admin at /secure-admin-control (#86), product photo fix (#90), CI public screens 32 routes x
5 widths (#87), board parity + motion (#88), Lighthouse CI on 5 routes (#93): A11y/BP/SEO 100, Perf 45 home .. 87 visa.
Open: #74 deploy (owner: VPS SSH sudo+docker, DNS A records apex+www, Resend or SMTP, ACME email, Super Admin email,
optional Turnstile; then clone to /opt/waafa, fill deploy/.env incl. PROVIDER_SECRET_KEY, sh deploy/deploy.sh, launch
checks in docs/DEPLOY.md). #91 perf (home TBT 1.4 s in CI, 200 KB), #71 admin editors (Phase D).
Next three steps: 1) deploy with the owner's access (#74); 2) Lighthouse on the live domain + replace Sample content;
3) #91 (split search pickers and form steps, lazy cart drawer).
Gotchas: Bash collapses `\\`; python glob treats [locale] as a class; python writes CRLF unless newline="";
`gh run list --workflow CI` for artifacts; Local Postgres stopped (low memory) — restart only with the owner's OK.

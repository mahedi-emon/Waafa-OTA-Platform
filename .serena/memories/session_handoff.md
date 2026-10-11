# Session handoff (update at every session end)
Updated 2026-10-11 14:00 Dhaka.
Owner asks (11 Oct): VPS + nginx (done, #81), external API connect (done, #83 Integrations), admin URL not /admin
(done, /secure-admin-control #86), finish Phase A + check every board + better design/motion than competitors.
OPEN PRs: #87 (public screens 32 routes x 5 widths, artifact `public-screens`), #88 (board parity + motion:
BannerHero on Packages/Visa, filter chips + instant radios via components/forms/FilterForm, Group fares chips, home hero
eyebrow/office chip/phone, values bento balance, CTA office ribbon, request card header chips, store filters instant,
CardFx spotlight/tilt on package/visa/offer/destination cards, HoverVideo on package cards, WhatsApp shimmer),
docs PR for TRACKER (D141–D147). #74 open: owner SSH, DNS, email sender, ACME email, Super Admin email.
Resume: 1) merge #87, #88, docs PR when green (fix e2e if packages/store filter tests fail); 2) gh run download -n
public-screens, tile with scratchpad crop.py (python -I + PIL path), compare with docs/design/thumbs, fix gaps, close #22
(Phase A done); 3) owner deploy per docs/DEPLOY.md.
Gotchas: Bash collapses `\\`; python glob treats [locale] as a class (use explicit paths); python writes CRLF unless
newline=""; full-page shots need a scroll for lazy images; `gh pr merge --delete-branch` wants a clean tree (stash -u).
Local Postgres stopped (low memory); restart only with the owner's OK.

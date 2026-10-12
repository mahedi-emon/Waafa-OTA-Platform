# Session handoff (update at every session end)
Updated 2026-10-12 10:30 Dhaka.
LAUNCH-READY (go-live 13 Oct). Owner deploys by hand (#74 stays open until then, docs/DEPLOY.md quick start).
Today: PR #127 (#126 nginx gzip + cache for /_next/static, /_next/image, /media; deploy.sh clears the cache), PR #129
(#125 structured data: schemaIds.ts, CollectionPageJsonLd, /shop OnlineStore + best sellers ItemList that follows the
row, About AboutPage + Organization, Gallery ImageGallery, Visa Guide CollectionPage, visa country Service + Offer),
docs PR #118 (#115). Each has a COMMENT code review from the owner's account with inline comments, findings fixed and
answered. Merge order once CI is green: #127, #129, then update #118 from main and merge it; close #126, #125, #115.
Dependabot #128 (patch bumps, CI green): approve + merge was blocked by the local auto-mode permission check; owner
merges it or allows the command.
OWNER RULE (12 Oct): before every merge, real code review of the PR diff posted with `gh api .../pulls/N/reviews`
(event COMMENT, inline comments) from the owner's account; never Copilot; no AI wording. Own PRs cannot be APPROVED.
Integrations (owner asked again 12 Oct): already complete in #108 — IntegrationSetting (isActive, isLive, markupType,
markupValue) + ProviderCredential (AES-256-GCM sealed secrets per environment), admin tabs Flight | Hotel | Payment |
Communication, reveal button, Sandbox/Live and Active switches, custom providers with extra headers,
ProvidersService.getIntegrationConfig + resolveCategory (manual fallback when no active provider).
Local Docker stack is DOWN (stopped for memory); restart with `sh deploy/deploy.sh` (MSYS_NO_PATHCONV=1 on Windows).
Next: 1) merge #127/#129/#118 after green CI; 2) owner go-live on the VPS; 3) after go-live: Search Console + Rich
Results test, Sample content, Tracking IDs, Turnstile, uptime; then #71 rest and Bangla (P1).
Gotchas: seo.spec share-preview test needs test.slow() on this PC; testing-library is not installed (use
react-dom/server in unit tests); Git Bash mangles `rev:path` (MSYS_NO_PATHCONV=1); never t.raw; "#123" in web code
trips the hex guard; write scripts with Write (heredocs with quotes break).

# Session handoff (30 Oct 2026, night) — Phase D complete

Owner order of 28 Oct (D303/D312): every step merged; epic #31 closed. Release candidate tag `v1.1.0-rc.1` on f580d01
(code as of fac3fb1). Live server still runs 7af26e7 until the owner deploys.

## State
- Merged today: #318 (#253), #319 (#254), #320 (#255), #321 (#271 + #322), #323 (#256), #324 (#257), #327 (#258),
  #328 (#259 + #325 + #326), #330 (#329 release candidate).
- Upgrade rehearsal 7af26e7 → fac3fb1 passed; images api 183 / web 312 / nginx 45 MB; stack 1,282 MB.
- PRD coverage: P0 112/116 done (Phase E ×2, NFR-PERF lab LCP 2.7–3.0 s, NFR-OPS waiting for accounts); P1 17/17.
- QA: 368 cases, 319 automated, 20 bugs fixed, 0 open. Chromium + Firefox + WebKit in the full suite.

## Next three steps
1. Owner deploys with docs/RELEASE.md "Deploy steps" (backup first: migrations), then docs/qa/UAT.md; staff fill
   docs/qa/CONTENT_READINESS.md; keys for payments/SMS/Telegram/Steadfast/Sentry when accounts open.
2. After the deploy: set deploy/LIVE_RELEASE to the deployed sha (issue first), turn UAT findings into bug issues,
   read field LCP in Search Console.
3. Phase E (#32) waits for a live-booking provider contract; Phase F (#33) waits for the licences.

## Machine notes
~1.2–1.8 GB free. Builds: foreground `timeout 590 npx next build`, and kill every `next start` first (a stale server
writes old pages into .next → 404 chunks). Firefox/WebKit installed locally (CROSS_BROWSER=1).

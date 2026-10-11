# Session handoff (update at every session end)
Updated 2026-10-12 00:40 Dhaka.
LAUNCH-READY. Owner deploys by hand (#74, docs/DEPLOY.md quick start). Night batch (owner: "finish #91, A/B
leftovers, API manager, run + test") merged to main: #106 (#91 perf: home JS 318→215 KB, Lighthouse home 45→64,
visa 91, CLS 0), #110 (#109 media library: uploads → sharp WebP on `mediadata` volume, /uploads via nginx→API),
#108 (#107 integrations manager: IntegrationSetting Active/Live/markup, SMS+email, custom providers, audited reveal,
getIntegrationConfig/resolveCategory manual fallback, email via active provider), #112 (#111 reports + CSV + customers),
#114 (#113 lead board). Open: #117 (#116 rich text tiptap editor, CI), docs PR #115 (TRACKER + memories).
Local Docker stack at http://localhost rebuilt from main before #108/#112/#114 (rebuild again: sh deploy/deploy.sh
with deploy/.env); API-mode e2e passed against it (5 + media); backup.sh archives photos (on Windows run with
MSYS_NO_PATHCONV=1).
Next: 1) merge #117 and #115 when green, close #116/#115; 2) rebuild local stack from final main and smoke test
(API sign-in limit 5/15 min per address through nginx: restart api between e2e batches); 3) owner go-live.
#71 stays open for: itinerary drag builder, product variants grid, category tree drag, TOTP, bookings, media picker.
Gotchas: never t.raw; getByLabel substring (use exact); e2e sign-ins use x-forwarded-for per test; "#123" in web code
trips the hex guard; Bash heredocs with quotes break (use Write for scripts); stale tsbuildinfo hides message keys.

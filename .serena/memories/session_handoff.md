# Session handoff (update at every session end)
Updated 2026-10-12 01:45 Dhaka.
LAUNCH-READY. Owner deploys by hand (#74, docs/DEPLOY.md quick start). Night batch merged to main: #106 (#91 perf:
home JS 318→215 KB, Lighthouse home 45→64, visa 91, CLS 0), #110 (#109 media library), #108 (#107 integrations
manager), #112 (#111 reports + CSV + customers), #114 (#113 lead board), #117 (#116 rich text editor). #120 (#119
cold-start transaction bug: 15 s transaction timeout, bounded warm-up, reports at request time) and docs #118 (#115)
merge after review + green CI.
OWNER RULE (12 Oct): before every merge, do a real code review of the PR diff and post it with
`gh api .../pulls/N/reviews` (event COMMENT, inline comments) from the owner's account; never Copilot; no AI wording.
Fix findings, reply on the thread, then merge. Own PRs cannot be APPROVED (GitHub rule).
Local Docker stack at http://localhost runs final main (before #120); rehearsal 2: API-mode e2e 8/8 through nginx,
admin walk-through clean, backups include photos (Windows: MSYS_NO_PATHCONV=1).
Next: 1) merge #120 and #118, close #119/#115; 2) rebuild local stack (sh deploy/deploy.sh) and confirm the first lead
after an API restart succeeds; 3) owner go-live. #71 still open: itinerary drag builder, variants grid, category tree
drag, TOTP, bookings, media picker in the content editor.
Gotchas: never t.raw; getByLabel substring (use exact); e2e sign-ins use x-forwarded-for per test (nginx overwrites
it, so local runs need an API restart every 5 sign-ins); "#123" in web code trips the hex guard; write scripts with
Write (heredocs with quotes break).

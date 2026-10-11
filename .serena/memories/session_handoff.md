# Session handoff (update at every session end)
Updated 2026-10-11 20:30 Dhaka.
LAUNCH-READY. Phase A ✅, B ✅, C: everything code-side done; #74 open until the owner runs the VPS deploy by hand
(docs/DEPLOY.md quick start: init-env.sh → fill email sender + first admin → check.sh → deploy.sh).
Today (evening): local production rehearsal on Docker Desktop (deploy/.env local, gitignored; stack still running at
http://localhost, Mailpit at :8025, admin owner@example.com / password in deploy/.env): routes 200, /admin 404, API-mode
e2e 6/6, email via worker, backup+restore identical. #103 CSP + headers + analytics after consent (Settings › Tracking),
docs/SECURITY.md (OWASP map, audit: no runtime-exploitable finding, D152). #104 TRACKER: C2 audit 112 rows verified.
Verify CI job timeout 45 min (public screens 33 routes, 3 workers).
Next: 1) owner go-live on the VPS; 2) after go-live: password change, replace Sample content, Search Console + analytics
IDs in Settings › Tracking, Turnstile keys, uptime monitor; 3) #91 perf, #71 admin editors, Bangla P1.
To stop the local stack: docker compose -f deploy/compose.yml down (add -v to wipe data); docker rm -f waafa-mailpit.
Gotchas: "#102"-style issue refs in code comments trip the hex guard (write "issue 102"); stale tsbuildinfo hides new
message keys; commitlint header ≤ 100 chars; Bash collapses `\\`.

# Session handoff (31 Oct 2026) — v1.1.0-rc.2 LIVE

Owner order of 28 Oct (D303/D312) done; epic #31 closed. #332 lighter/faster server merged (#334, 90 CI min), tag
`v1.1.0-rc.2` on 31428d7. Repository is now PUBLIC (owner, 31 Oct). Owner deployed 31428d7 on 31 Oct; checked from
outside: all key routes 200, /admin 404, Brotli (Home 60 KB vs 93 KB gzip), HTTP/2 + HTTP/3, AVIF, /bn live.

## State
- #335 (branch chore/335-live-release): deploy/LIVE_RELEASE = 31428d7, RELEASE.md live row + empty "Next release",
  TRACKER #332 Done / #335 block / next steps. PR with full-ci (deploy/ path). After merge: close-out, Done, minutes.
- Server bundle copy no longer needs a token (public repo): raw.githubusercontent.com/<repo>/<tag>/deploy/server/<f>.
- QA: 388 cases, 338 automated, 21 bugs fixed, 0 open.

## Next three steps
1. Owner: two-step sign-in, System status green, UAT.md (U-42 PageSpeed, U-43 br/h3), CONTENT_READINESS.md, keys in
   Admin › Integrations when accounts open.
2. UAT findings → bug issues; field LCP from Search Console (lab 2.7–3.0 s).
3. Phase E (#32) waits for a provider contract; Phase F (#33) for licences.

## Machine notes
~1.2–1.8 GB free. Builds: foreground `timeout 590 npx next build`; kill every `next start` first. Docker works locally
(nginx image tests: busybox httpd as fake upstream on a user network).

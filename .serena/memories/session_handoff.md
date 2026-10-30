# Session handoff (30 Oct 2026, evening)

Owner order of 28 Oct (D303/D312): no deploys until the release candidate; live = 7af26e7. Deadline 13 Nov.
Owner (30 Oct): "sob complete koro use serena" + "no CI should fail": verify locally (build in FOREGROUND with
`timeout 590`, kill every `next start` first — a stale server corrupts .next and gives 404 chunks), Chromium + Firefox +
WebKit before pushing.

## Merged today
#253 (#318), #254 (#319), #255 (#320), #271 + #322 (#321), #256 (#323), #257 (#324, 307 min; D330, no root :has();
Lighthouse runner warms photos + median of 5; TBT error 300 ms, target 200).

## Open
- **#258 PR #327** (quick CI): benchmark docs + lighthouse-run `--desktop`. Merge when green, close-out, Done.
- **feat/259-phase-d-qa** (no PR yet, needs full-ci): Firefox/WebKit projects (CROSS_BROWSER=1, 60 s timeout) + CI
  step; bugs #325 (ContactStep uncontrolled, adopts typed text on mount; e2e early-typing) and #326 (SmartVideo joins
  after load near viewport, HoverVideo sources on first hover; home.spec clip check); e2e errors.ts ignores WebKit's
  aborted `_rsc` prefetch wording; whenHydrated in search/early-typing; smoke skip-link skipped on WebKit (Safari Tab);
  docs: ADMIN_GUIDE §15, UAT U-39–42, CONTENT_READINESS.md, SUMMARY 368/319/49, PRD_COVERAGE (P0 112 done, P1 17 done),
  RELEASE rows, TRACKER #259 block + bugs. Locally green: Chromium 217, Firefox 97, WebKit 96+1 skip, unit 746.

## Next three steps
1. Merge #327 → merge main into 259 (take ours) → PR "Closes #259, #325, #326" with full-ci → merge → close epic #31.
2. Checkpoint to the owner (Banglish).
3. Release candidate: tag v1.1.0-rc.1 on main; RELEASE.md final; read the tag's VPS smoke (upgrade rehearsal from
   deploy/LIVE_RELEASE, memory/disk from measure-stack) and Docker images run; Banglish deploy steps; checkpoint.

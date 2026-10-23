# Session handoff (update at every session end)
Updated 2026-10-23 19:00 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo PRIVATE: Actions minutes limited, keep path filters, no needless reruns, but
NEVER cancel or skip CI (owner, 20 Oct): every push's CI runs to green; verify locally first. Pushing a branch without
a PR runs nothing; CI has cancel-in-progress, so wait for a PR run to finish before pushing again.
DONE TODAY: R3 #193 merged (#216 squash 31e798e; CodeQL fix rawBody + accepted comment D214), Docker images green,
owner checkpoint posted (migration 20261020050000_media_credit → backup.sh before deploy.sh).
NOW: R4 #194 on branch feat/194-status-automation (pushed 7faea4b API+shared, 0cde7a1 web; later commits local).
Project #194 In progress, plan comment posted. Built: shared workflow rules + tests (shared 131), API actions/Trash/
redirects/scheduler (API 176 tests), web editor buttons + ScheduleDialog, LeadActions, VisaProgressPanel, OrderSteps,
ProofDecision, Trash page + nav, list chips (recordChips), staff chips, public redirects (followMovedRecord), messages,
e2e/admin-workflow.spec.ts (added to CI API job), TRACKER R4 block (placeholders {TESTS} {WIDTHS} {REVIEW}
{SESSION_TESTS} to fill), D215–D226, AC-135..143, ADMIN.md §8.7.
NEXT STEPS (R4): 1) local API-mode build (scratchpad build-r4.log) + API on waafa_ci (SCHEDULER_INTERVAL_MS=3000)
then run e2e in CI order: api-mode, admin-shell, admin-screens, admin-editor, admin-media, admin-workflow
(--workers=1); fix failures. 2) Playwright MCP screenshots 390/768/1024/1440 of editor (scheduled), lead Next step,
visa panel, order steps, proofs, Trash, lists with chips → test-results/admin-audit/r4/; design review; fill TRACKER
placeholders; commit; open PR "Closes #194" with migration note; owner COMMENT review with inline comments (D159);
CI green; squash-merge; close-out (migration 20261024040000_status_automation → backup.sh); Project Done. 3) R5 #195.
LOCAL DEV STACK (this Windows machine, ~0.7–1 GB free RAM; the owner's Docker stack also runs, don't touch it):
- Docker Desktop must be running. PostgreSQL container `waafa-dev-pg` (mine; port 5433, waafa/waafa). DBs: waafa_dev,
  waafa_test (API tests: API_TEST_DATABASE_URL=postgresql://waafa:waafa@localhost:5433/waafa_test; migrate it after a
  new migration), waafa_ci (recreate: docker exec waafa-dev-pg psql -U waafa -d postgres -c "DROP DATABASE IF EXISTS
  waafa_ci WITH (FORCE);" -c "CREATE DATABASE waafa_ci;", then migrate + seed), waafa_r4diff (scratch for migrate diff).
- Env: scratchpad dev-env.sh. API: `pnpm --filter @waafa/api start` on 4000. Leftover node servers on 4000/3100 from
  older sessions block new ones: find with Get-NetTCPConnection and stop only node.exe processes that are mine.
- Web typecheck needs NODE_OPTIONS=--max-old-space-size=3584 (`npx next typegen` first).
Gotchas: write node edit scripts with the Write tool (bash heredocs with backticks/quotes break); Python writes CRLF on
Windows unless newline='\n'; after switching branches run `pnpm --filter @waafa/api generate`; gh needs
PATH += /c/Program Files/GitHub CLI; react-hooks/purity flags Date.now() in render (read time once in useState).

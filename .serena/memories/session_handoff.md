# Session handoff (update at every session end)
Updated 2026-10-25 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo PRIVATE: Actions minutes limited, keep path filters, no needless reruns, but
NEVER cancel or skip CI: every push's CI runs to green; verify locally first. CI has cancel-in-progress, so wait for a
PR run to finish before pushing again.
DONE: R4–R7 merged (R7 #223 squash 9b0b5cb, CI 8/8, no migration; #197 and #222 closed, Done). #224 budget flake in
Backlog. R7 deployable (Docker images green).
NOW: R8 #198 purpose-built editors on branch feat/198-purpose-built-editors. Built: section order for package /
product / visa / blog (writing layout) / group fare / banner / team; VariantsMatrixField + lib/admin/variantMatrix.ts;
auto rules lowestPrice, itineraryDays, initialsFromName; bulkPhotos (BulkPhotoDrop) for gallery items; startWith
(team visible); "Next: section"; new repeater card opens; tab title "New …"; Optional chip sr-only fix; empty-group
Add button names its group; section tick treats photo without src as empty; matrix labels align; embedded reference
"" = nothing chosen (no more "Not found:"). e2e admin-editors.spec.ts: tasks 1/7/9/11 (task 11 uses MALAYSIA: Thailand
is counted by admin-inbox) + axe 768/1440 over 6 editors. Local: web unit 647, lint, tsc, guards OK; API e2e list OK.
Docs: ADMIN.md §7.2, TRACKER #198 block (placeholders TESTS/WIDTHS/REVIEW/TOOLS lines to fill), D251–D253.
Bug found: #225 missing admin record shows the error page (adminGet throws on 404; add (panel)/not-found.tsx) → fix
after R8 as its own PR.
NEXT STEPS: 1) R8: fill TRACKER placeholders, commit, PR (Closes #198), owner COMMENT review, CI, merge, close-out (no
migration), Project Done, OWNER CHECKPOINT in Banglish (screens .playwright-mcp/r8/).
2) #225 fix. 3) R9 #199, R10 #200 (+ ADMIN_GUIDE.md), then Phase D.
GOTCHA (R6): an sr-only span inside an overflow-x-auto row whose children are not positioned widens the whole page.
DATATABLE NOTES: e2e opens a record with `page.getByRole("table").getByRole("link").first()`.
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL container `waafa-dev-pg` (port 5433, waafa/waafa). DBs waafa_dev, waafa_test, waafa_ci (reset: DROP
  SCHEMA public CASCADE; CREATE SCHEMA public; then prisma migrate deploy + tsx prisma/seed.ts with
  DATABASE_URL=.../waafa_ci). e2e that edit seed records are not idempotent: reset waafa_ci before a rerun.
- Env: scratchpad dev-env.sh. API `npx tsx src/main.ts` on 4000 with DATABASE_URL=.../waafa_ci; web `next build`
  then `RATE_LIMIT_FACTOR=50 next start -p 3100`. Stop only my own processes on 3100/4000.
- Web typecheck needs NODE_OPTIONS=--max-old-space-size=3584.
- React error #441 in prod console = a Server Component threw (message hidden).
Gotchas: `pnpm guards` flags "#205"-like text as hex; gh needs PATH += /c/Program Files/GitHub CLI; gh labels use
"type: bug", "area: admin", "priority: P2" (with a space).

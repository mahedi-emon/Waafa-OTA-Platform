# Session handoff (update at every session end)
Updated 2026-10-24 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo PRIVATE: Actions minutes limited, keep path filters, no needless reruns, but
NEVER cancel or skip CI: every push's CI runs to green; verify locally first. CI has cancel-in-progress, so wait for a
PR run to finish before pushing again.
DONE: R4 #194 merged (#218, ce05c1b; migration 20261024040000_status_automation → owner runs backup.sh before deploy).
DONE: R5 #195 merged (#220 squash 763f58d, CI 8/8, no migration), issue closed, Project Done, close-out posted.
DONE: R6 #196 merged (#221 squash b25e1b2, CI 8/8, no migration), closed, Project Done, close-out posted, owner
checkpoint posted in chat (screenshots scratchpad/r6/).
NOW: R7 #197 website builder + #222 (flaky intake email test on main) on branch feat/197-website-builder, pushed;
PR next. Built: Website › Home page, Website › Menus, LinkPicker (wordFilter), draft preview (previewDrafts,
/secure-admin-control/preview, /api/preview/exit, proxy ends stale preview), staff tools (components/staff/*,
api/staff-tools), framing (public 'self', admin none + frame-src self), updateTag on saves (D249), #222 idle() (D250).
Independent review 2 P1/7 P2/11 P3 all fixed. Local: web unit 643, API 186, e2e API job 61 (website 9/9), budget OK.
Screens: .playwright-mcp/r7/ (gitignored). design-superpowers skill NOT installed this session (told owner).
NEXT STEPS: 1) R7: PR (Closes #197, #222), owner COMMENT review, CI, merge, close-out (no migration), TRACKER D0 row
8 done 73%, issues Done.
2) R8 #198 purpose-built editors, then OWNER CHECKPOINT. 3) R9 #199, R10 #200 (+ ADMIN_GUIDE.md).
GOTCHA (R6): an sr-only span inside an overflow-x-auto row whose children are not positioned widens the whole page
(absolute containing block outside the scroller): StatusChip and module tab links are now `relative`.
DATATABLE NOTES: components/admin/table/* (AdminDataTable server wrapper with scoped messages; DataRow with
actions (sheet) and quick (phone card)); pages pass only allowed pageSize/sort (pageSizeOf, sortOf in listQuery);
name links to editor (e2e: `page.getByRole("table").getByRole("link").first()`; at 390 the card button opens the sheet,
then "Open"). Checkbox indicator forceMount (D229).
LOCAL DEV STACK (~1 GB free RAM; owner's Docker stack also runs, don't touch it):
- PostgreSQL container `waafa-dev-pg` (port 5433, waafa/waafa). DBs waafa_dev, waafa_test (API tests:
  API_TEST_DATABASE_URL=postgresql://waafa:waafa@localhost:5433/waafa_test), waafa_ci (reset: DROP SCHEMA public
  CASCADE; CREATE SCHEMA public; then prisma migrate deploy + tsx prisma/seed.ts with DATABASE_URL=.../waafa_ci).
- Env: scratchpad dev-env.sh (session-specific scratchpad; recreate from CI env values if missing). API `npx tsx
  src/main.ts` on 4000; web `next build` then `next start -p 3100`. Stop only my own next/tsx processes on 3100/4000.
- Web typecheck needs NODE_OPTIONS=--max-old-space-size=3584 (`npx next typegen` first).
- Playwright sign-in is rate-limited per x-forwarded-for: probes should use a random IP.
Gotchas: write edit scripts with the Write tool (bash heredocs/node -e with backticks break); `pnpm guards` flags
"#205"-like text as hex; Python writes CRLF unless newline='\n'; gh needs PATH += /c/Program Files/GitHub CLI.

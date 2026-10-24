# Session handoff (update at every session end)
Updated 2026-10-24 Dhaka.
STATE: site LIVE on https://waafasworld.com (owner deploys `sh deploy.sh` after the Docker images workflow is green;
never touch the VPS or its .env). Repo PRIVATE: Actions minutes limited, keep path filters, no needless reruns, but
NEVER cancel or skip CI: every push's CI runs to green; verify locally first. CI has cancel-in-progress, so wait for a
PR run to finish before pushing again.
DONE: R4 #194 merged (#218, ce05c1b; migration 20261024040000_status_automation → owner runs backup.sh before deploy).
DONE: R5 #195 merged (#220 squash 763f58d, CI 8/8, no migration), issue closed, Project Done, close-out posted.
NOW: R6 #196 inbox on branch feat/196-inbox, committed and pushed; PR opening (title "feat(admin): inbox with queue
panes, lead board moves and visa applications (R6)"). No migration. Local: shared 144, web 623, API 184, API-job e2e 52/52
on a fresh DB; independent review's 10 findings fixed (D242); InboxSplit is one grid + own separator (D241, shadcn
resizable removed). TRACKER R6 block filled (still 🟡 until merge), D232–D242, ADMIN.md §5.5.1.
NEXT STEPS: 1) PR → owner COMMENT review with inline comments (D159) → CI green (no reruns) → squash-merge
`gh pr merge <n> --squash --delete-branch --subject "feat(admin): inbox … (R6) (#<n>)"` → check merge author →
close-out on #196 → Project Done → TRACKER R6 ✅ + session log PR number (in R7's branch). 2) OWNER CHECKPOINT
(Banglish summary + screenshot paths scratchpad/r6/*.png + "test this yourself"). 3) R7 #197 website builder.
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

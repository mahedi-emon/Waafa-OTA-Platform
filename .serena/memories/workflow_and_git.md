# Workflow and git (full text: CLAUDE.md "Git and GitHub" + "Quality gates and Definition of Done")
Session start: `git var GIT_AUTHOR_IDENT` = Mahedi Hasan Emon <mahedi.emon62@gmail.com> (else stop and tell owner);
read session_handoff, progress, decisions; TRACKER header; `gh project item-list 4 --owner mahedi-emon`; deadline check.
Per issue:
1. Project Status → In progress (47fc9ee4); assign mahedi-emon; comment a short plan on the issue.
2. Branch feat|fix|chore|docs/<n>-<slug> from fresh main. Stage only the issue's files (never blind add -A).
3. Boards first (docs/design/project/*.dc.html); skills ui-ux-pro-max, taste, frontend-design; Context7 per API.
4. shadcn first (pass registries ["@shadcn"]); 21st.dev via magic MCP or
   `npx shadcn@latest add "https://21st.dev/r/<a>/<c>?api_key=${API_KEY_21ST:-$TWENTY_FIRST_API_KEY}"` from apps/web.
5. Phone first 390 → 320 → 768 → 1024 → 1440. Fill TRACKER section 4 rows.
6. Gates: pnpm guards, lint, typecheck, test, build; Playwright MCP 320/390/768/1024/1440 (console, overflow, CLS,
   keyboard, axe); traces 4x CPU for animations; Lighthouse mobile on touched public routes; Vitest logic; e2e per flow.
7. Review: design-superpowers:design-review + ui-ux-pro-max checklist on 390/1440 screenshots; subagent review for big UI.
8. Commit `feat(web): … (#n)` (hooks: attribution + commitlint + prettier + guards). Push, PR from template
   ("Closes #n"; never write co-author/"generated with" words in PR text). Wait for CI.
9. `gh pr merge <pr> --squash --delete-branch --subject "<type(scope): title> (#<pr>)" --body "<2-4 lines>"`;
   `git switch main && git pull`; check `git log -1 --format='%an <%ae>%n%B'`.
10. Close-out comment; Status Done (98236657); TRACKER issue block + session log; memories progress/decisions/
    session_handoff.
Never: force-push, rewrite pushed history, push to main, change git config, --no-verify, commit secrets.
Bugs → bug issue (form) → fix → regression test.

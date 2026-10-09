# Workflow per issue (full text in CLAUDE.md)
1. Read memories; Serena symbol tools before whole-file reads; edit via Serena where possible.
2. Project #4 Status -> In progress (47fc9ee4), assign mahedi-emon, comment a plan on the issue.
3. Branch feat/<n>-<slug> (fix/<n>-<slug> for bugs) from fresh main.
4. Open the issue's screens in docs/design/project/*.dc.html for copy/states/data; apply ui-ux-pro-max, taste,
   frontend-design, DESIGN.md, MOTION.md, web-interface-guidelines.md. Context7 before any library API.
5. shadcn MCP first; 21st.dev via magic MCP / shadcn add URL with $TWENTY_FIRST_API_KEY; restyle + a11y review.
6. Phone first 390 (check 320), then 768, 1024, 1440.
7. Fill Admin-control matrix + Components inventory rows in docs/TRACKER.md.
8. Gates: pnpm lint/typecheck/test/build; Playwright MCP at 320/390/768/1440 (console, overflow, CLS, keyboard, axe);
   traces for animations; Lighthouse mobile on touched public routes; Vitest for logic; e2e per flow.
9. Conventional commit `feat(web): ... (#n)`, push, PR with Closes #n + summary + screenshots + Tools used line,
   wait for CI, `gh pr merge --squash --delete-branch`, pull main. NEVER add Co-Authored-By/AI attribution.
10. Issue close-out comment; Status Done (98236657). 11. Update TRACKER + `mem:progress` + `mem:decisions`.
Bugs: new bug issue -> fix -> regression test. Session end: push, update TRACKER/memories, comment where stopped.

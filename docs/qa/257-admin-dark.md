# QA plan · #257 Admin dark mode

PROMPT 10 letter L. Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| AD-01 | Happy | Account menu → Theme → Dark | The whole admin turns dark at once, including dialogs, menus and toasts (portals) | e2e `admin-dark.spec.ts` |
| AD-02 | Happy | Reload, sign out and in, another admin page | The choice is remembered (cookie, a year) and the frame renders dark with no light flash | e2e (cookie, attribute on every route) |
| AD-03 | Happy | Theme → Match this device | Dark when the device is dark, light otherwise | CSS `prefers-color-scheme` + manual |
| AD-04 | Accessibility | Every admin route in the dark theme | axe clean (WCAG 2.2 AA), every text colour ≥ 4.5:1 on every dark surface | e2e over `adminRoutes.ts` + palette contrast script |
| AD-05 | Regression | Light theme (default) | Unchanged; axe clean at every width | e2e `admin-screens.spec.ts` |
| AD-06 | Regression | The sidebar | Midnight in both themes, its text and badges unchanged | e2e screenshot + manual |
| AD-07 | Compliance | The public site after choosing Dark in the admin | Stays light (no attribute outside the admin frame) | e2e |
| AD-08 | Edge | A bad cookie value | Light | unit `adminTheme.test.ts` |
| AD-09 | Edge | Sign-in page and the frame's loading skeleton | Light (no session yet); the frame switches when it streams in | manual (known limit) |

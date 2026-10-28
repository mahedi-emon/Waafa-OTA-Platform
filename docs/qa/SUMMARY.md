# QA summary (running total)

Every step of Phase D writes its test plan in `docs/qa/<step>.md` before building (owner rule, 26 Oct). Each
checkpoint updates this table.

| Step | Plan | Cases | Automated | Manual (reason) | Passed | Bugs found | Bugs fixed | Open |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C · speed (#236) | [C-speed.md](C-speed.md) | 23 | 21 | 2 (live site after deploy; slow-network feel) | 21 of 21 automated (C-01 performance 90 met on 8 of 11 routes; rest in #271) | 5 | 5 | 0 |
| F · accounts and /track (#241, #278, #240) | [F-accounts.md](F-accounts.md) | 41 | 39 | 2 (real inbox on staging; exploratory) | F1: 22 of 24 cases automated and passing locally (API); e2e runs in CI API mode | 0 | 0 | 0 |
| Integration hub (#284) | [284-integration-hub.md](284-integration-hub.md) | 22 | 18 | 4 (IH-09 runtime Turnstile on the real stack, IH-17 help words, IH-19 widths, IH-20 double submit: UAT and #259) | shared, API unit and web unit passing locally; API database tests and API-mode e2e in CI | 0 | 0 | 0 |
| Measurement (#237) | [237-measurement.md](237-measurement.md) | 14 | 11 | 3 (GA4 DebugView, roles by hand, Reports at 390 by hand: UAT) | unit (web 6, API 2) and the API-mode campaign e2e passing in CI | 1 (axe scrollable region on the sources table) | 1 | 0 |
| Errors and status (#238) | [238-status-errors.md](238-status-errors.md) | 14 | 8 | 6 (real Sentry or GlitchTip, worker stopped, retry or discard on the real stack: UAT) | unit 3, admin-screens sweep in CI | 2 (test worker crash from the DSN read, axe on the failed-emails table) | 2 | 0 |
| Backups and security (#239) | [239-backups-security.md](239-backups-security.md) | 12 | 7 | 5 (BACKUP_CRON=off, a broken dump, wrong off-site key, alert email, staging: UAT) | API limit test, SigV4 and alert unit tests, VPS smoke (cron, backup, drill) in CI | 1 (flaky order test: variant had 3 in stock, #289) | 1 | 0 |
| Rename (#302) | [302-rename.md](302-rename.md) | 16 | 15 | 1 (U-14 share card in WhatsApp) | unit and API DB passing locally; e2e in CI | 0 | 0 | 0 |
| Reminders and alerts (#243) | [243-reminders-alerts.md](243-reminders-alerts.md) | 21 | 18 | 3 (chime by ear, three browsers in #259, exploratory) | API DB 5 + unit 13 passing locally; e2e admin-alerts in CI API mode | 0 | 0 | 0 |
| Reports, customers, roles (#244) | [244-reports-customers-roles.md](244-reports-customers-roles.md) | 21 | 19 | 2 (real summary email in an inbox, exploratory) | unit 2 + API DB 6 (+1 auth) passing locally | 1 (media upload race #308, found by #307's CI) | 1 | 0 |

Totals: 184 cases · 156 automated · 28 manual · 12 bugs found and fixed (5 in C, the flaky hero test #276, axe 4.14 names #288, Home budget #295, 4 in steps 4 and 5) · 0 open (performance target follow-up #271).

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
| Reviews and Q&A (#245) | [245-reviews-qa.md](245-reviews-qa.md) | 17 | 15 | 2 (Rich Results test on the live site, exploratory) | API DB 4 + shared 2 + e2e admin-reviews 1 (locally, API mode) + budget 194 KB | 0 | 0 | 0 |
| Save for later, Buy again (#246) | [246-save-for-later.md](246-save-for-later.md) | 10 | 9 | 1 (exploratory) | unit 3 + e2e cart-saved 2 (390, 1440) + budget cart 191 KB, account 182 KB | 2 (axe label mismatch on the new buttons; 84 px overflow at 390 px) | 2 | 0 |
| Campaigns and flash sales (#247) | [247-campaigns-flash-sales.md](247-campaigns-flash-sales.md) | 11 | 10 | 1 (exploratory) | shared 2 + API DB 2 + e2e campaign 3 + budget 184 KB | 1 (heading order on the campaign page) | 1 | 0 |
| Invoices, packing slips, CSV import (#248) | [248-invoices-csv-import.md](248-invoices-csv-import.md) | 15 | 14 | 1 (print on paper) | API unit 23 (CSV 10, documents 13) + API DB 4 + e2e admin-imports 2 | 2 (placeholder strings reached the dialog as ICU objects; zod's own words in the preview) | 2 | 0 |
| Curated hotels (#249) | [249-curated-hotels.md](249-curated-hotels.md) | 11 | 10 | 1 (photo quality review) | shared 2 + web lead builder 2 + lead facts 1 + sitemap + e2e hotels-curated 3 + budget + public screens | 0 | 0 | 0 |
| Partial lead capture (#250) | [250-partial-lead-capture.md](250-partial-lead-capture.md) | 11 | 11 | 0 | API DB 5 + e2e partial-capture 2 + budget | 0 | 0 | 0 |
| Online payments (#251) | [251-online-payments.md](251-online-payments.md) | 13 | 12 | 1 (৳10 live test, U-35) | API unit gateways 8 + API DB payments 3 + e2e payments 7 + admin guide 1 | 2 (result page blocked prerender, caught by the local build; the XSS check matched Next's own inline scripts) | 2 | 0 |
| SMS and Telegram (#252) | [252-sms-telegram.md](252-sms-telegram.md) | 20 | 19 | 1 (submit timing with both on, U-36) | API unit SMS 13 + Telegram 13 + notifications 3 + service check + API DB messaging 6 + e2e admin guide 1 | 0 | 0 | 0 |

Totals: 292 cases · 256 automated · 36 manual · 14 bugs found and fixed (5 in C, the flaky hero test #276, axe 4.14 names #288, Home budget #295, 4 in steps 4 and 5, 2 in #251) · 0 open (performance target follow-up #271).

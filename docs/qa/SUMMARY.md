# QA summary (running total)

Every step of Phase D writes its test plan in `docs/qa/<step>.md` before building (owner rule, 26 Oct). Each
checkpoint updates this table.

| Step | Plan | Cases | Automated | Manual (reason) | Passed | Bugs found | Bugs fixed | Open |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C · speed (#236) | [C-speed.md](C-speed.md) | 23 | 21 | 2 (live site after deploy; slow-network feel) | 21 of 21 automated (C-01 performance 90 met on 8 of 11 routes; rest in #271) | 5 | 5 | 0 |

Totals: 23 cases · 21 automated · 2 manual · 5 bugs found and fixed · 0 open (performance target follow-up #271).

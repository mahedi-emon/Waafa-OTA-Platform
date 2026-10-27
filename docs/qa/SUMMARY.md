# QA summary (running total)

Every step of Phase D writes its test plan in `docs/qa/<step>.md` before building (owner rule, 26 Oct). Each
checkpoint updates this table.

| Step | Plan | Cases | Automated | Manual (reason) | Passed | Bugs found | Bugs fixed | Open |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C · speed (#236) | [C-speed.md](C-speed.md) | 23 | 21 | 2 (live site after deploy; slow-network feel) | 21 of 21 automated (C-01 performance 90 met on 8 of 11 routes; rest in #271) | 5 | 5 | 0 |
| F · accounts and /track (#241, #278, #240) | [F-accounts.md](F-accounts.md) | 41 | 39 | 2 (real inbox on staging; exploratory) | F1: 22 of 24 cases automated and passing locally (API); e2e runs in CI API mode | 0 | 0 | 0 |

Totals: 64 cases · 60 automated · 4 manual · 6 bugs found and fixed (5 in C, the flaky hero test #276) · 0 open (performance target follow-up #271).

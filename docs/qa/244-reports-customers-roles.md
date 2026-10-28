# QA plan · #244 reports, scheduled summaries, customers and custom roles

PRD FR-ADM Reports, Search activity, Customers, Users (P0 partials) and FR-ADM later P1. Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| RC-01 | Happy | Reports by agent | One row per assignee plus Unassigned: leads, booked, won rate, median first reply | unit `reportBreakdowns` + API DB `reports` |
| RC-02 | Happy | Searches per day and the funnel | Daily search bars; searches → requests → answered → quoted → booked with the share of the step before | unit + API DB |
| RC-03 | Happy | Visa cases | By stage and by country with approved and refused counts; only for people who see visa leads | API DB (visa officer yes, shop manager no) |
| RC-04 | Roles | Report scope | A visa officer's report counts visa leads only; orders only for store and accounts | API DB |
| RC-05 | Happy | Daily summary email | At 09:00 Dhaka the people chosen for "Daily summary" get yesterday's numbers, once | API DB (tick twice) + email in MemoryMailer |
| RC-06 | Happy | Weekly summary | Saturday 09:00 Dhaka, the last seven days, once a week | API DB with a fixed clock |
| RC-07 | Edge | Nobody chosen, minute job restarts, two API processes | No email; the marker keeps it to one send per day and week | API DB |
| RC-08 | Happy | Customer note and tags | A note with the writer and time; tags saved, shown on the list, filterable | API DB + e2e |
| RC-09 | Negative | Empty note, a tag over 30 characters, more than 12 tags, unknown phone | 422 / 404 | API DB |
| RC-10 | Security | Note text with HTML | Shown as text (React escapes), never as markup | e2e |
| RC-11 | Happy | Export | CSV of every customer the person may see, with tags and totals; formulas neutralised | API DB (`=1+1` becomes `'=1+1`) |
| RC-12 | Happy | Merge | Merging a second number into a customer moves its requests, orders, notes and tags under the first; the second number opens the first; audited | API DB + e2e |
| RC-13 | Edge | Merge into itself, into a merged number, chains | 409 with a plain reason; never a loop | API DB |
| RC-14 | Safety | Unmerge | Brings the second number back on its own; audited | API DB |
| RC-15 | Roles | Merge | Admin and Super Admin only; others 403 | API DB |
| RC-16 | Happy | Custom role | Super Admin makes "Senior sales" from Travel sales + Visa officer; a person with it can open flights and visa leads at the next sign-in | API DB (token roles) |
| RC-17 | Security | Custom role cannot reach Super Admin | Super Admin is never a grant; a custom role cannot be given by anyone but Super Admin | API DB |
| RC-18 | Data integrity | Delete a role in use | Refused while people have it (409, names how many) | API DB |
| RC-19 | Happy | Permission matrix | Shows built-in and custom roles as columns with what each can do | e2e axe |
| RC-20 | Accessibility | New screens at 390 and 1440 | axe clean, no horizontal scroll | e2e |
| RC-21 | Performance | Reports on 5,000 leads | Under 1.5 s | API DB timing note |

Exploratory (20 minutes, 390 px): as Super Admin make a custom role and give it; as Admin merge two customers and add a
tag and a note; open Reports on a phone.

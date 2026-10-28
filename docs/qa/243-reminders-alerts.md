# QA plan · #243 reminders, @mentions, round-robin and real-time alerts

PRD FR-ADM-LEAD (P1) and FR-NTF real time. Written before the build; each case names how it is checked.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| RA-01 | Happy | Add a reminder on a lead (note, date and time in Dhaka time) | Listed on the lead and on the dashboard under "Today" or "Coming up" | API DB `reminders.test.ts`; e2e `admin-reminders.spec.ts` |
| RA-02 | Happy | A reminder falls due | The minute job turns it into an alert once: bell count, alert in the bell, real-time event | API DB (tick twice, one alert) |
| RA-03 | Happy | Done and snooze | Done leaves the lists; snooze moves the due time and alerts again when due | API DB |
| RA-04 | Negative | Due time in the past, empty note, note over 500 characters, a lead the person cannot open | 400 / 404 with a plain reason | API DB |
| RA-05 | Roles / IDOR | Another person's reminder id in done/snooze/delete | 404; nobody sees another person's reminders | API DB |
| RA-06 | Happy | @Full Name in a lead note | That person gets one alert linking to the lead; the writer is never alerted about themselves | API DB `mentions` cases |
| RA-07 | Edge | Two mentions of the same person, an inactive person, a name inside an email address, a person who cannot open the lead's service | One alert; none for inactive; none for "x@Ayesha"; none for a person without access | unit `findMentions` + API DB |
| RA-08 | Happy | Round-robin on during office hours | New leads go in turn to active staff with "Takes new leads" on who can open the service; timeline says "Assigned to … (in turn)"; that person gets an alert | API DB `roundRobin.test.ts` |
| RA-09 | Edge | Outside office hours (Friday, before 10 am, after 6 pm Dhaka) | Lead stays unassigned; at opening the minute job hands it out in turn | API DB with a fixed clock |
| RA-10 | Edge | Nobody has the switch on for a service; a lead assigned by hand and then unassigned | Stays unassigned; a lead that was ever assigned is never auto-assigned again | API DB |
| RA-11 | Data integrity | Two leads at the same moment | Different people (advisory lock), lastLeadAt moves | API DB |
| RA-12 | Happy | Real-time stream | GET /admin/events streams `ready`, then lead/order/proof/alert events the person may see; heartbeat every 25 s | API DB (inject + stream read) |
| RA-13 | Roles | Stream filtering | A visa officer gets visa leads only, never flights; accounts get proofs; a personal alert goes only to its person | unit `canSeeEvent` |
| RA-14 | Security | Stream without a session, with a customer token | 401 | API DB |
| RA-15 | Fallback | Stream fails (proxy, offline) | Polling every 30 s continues; reconnect with back-off; no error toasts | unit `liveEvents` store + e2e with the stream blocked |
| RA-16 | Sound | New lead while the admin is open | Chime plays once when sound is on (per device, off by default until the first click on the switch); never on reduced-data or when the tab is hidden | unit (chime gate) + manual UAT |
| RA-17 | Accessibility | Bell alerts, reminders card, mention picker | Live region announces new alerts politely; picker is a listbox with keyboard; axe clean | e2e axe at 390 and 1440 |
| RA-18 | Widths | 320–1440 | Bell sheet, reminders card and note box fit with no horizontal scroll | e2e scroll width |
| RA-19 | Performance | 50 open streams | One Redis subscription per API process, not per stream; memory flat | unit (bus fan-out) |
| RA-20 | Users | Users › Takes new leads switch | Super Admin turns it on per person; audited | API DB `users` case |
| RA-21 | Browsers | Chromium, Firefox, WebKit | EventSource works through the web proxy (no buffering, no compression) | e2e on three projects in #259 |

Exploratory (20 minutes, 390 px): as Travel sales with the switch on, a visitor sends a flights request; as the same
person write a note mentioning the Visa officer; set a reminder for two minutes ahead and wait.

# QA plan: #238 error tracking, System status page, dead-letter list

Owner's order of 28 Oct, step 5. Error tracking is set up from Admin › Integrations (Sentry or GlitchTip DSN, #284).

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E-01 | Off | Privacy | No error tracking card On | Cause an API error | Nothing is sent anywhere | P0 | `errorReporter.unit.test.ts` |
| E-02 | API errors | Happy | Sentry card On with a DSN | An unexpected API error (500) | One Sentry event with release (image tag), server name api, the route, the stack frames; the visitor sees the plain 500 problem | P0 | unit (envelope) + UAT |
| E-03 | Worker | Happy | Card On | An email fails every try; a malware scan pass fails | One event each (not one per retry), server name worker | P1 | unit (reporter) + manual |
| E-04 | Web server | Happy | Card On | A page throws while rendering | One event, server name web, the path without query | P1 | manual (UAT) |
| E-05 | Flood | Edge | Card On | 40 errors in a minute | 30 sent, the rest dropped until the next minute | P1 | `errorReporter.unit.test.ts` |
| E-06 | Runtime | Data | API running | Turn the card On, wait a minute, cause an error; turn it Off | Reported only while On; no restart | P1 | manual |
| E-07 | Status | Happy | Admin | Open Settings › System status | Release, running since, database and Redis with ms, worker "last seen", queue counts, memory and disk | P0 | API-mode e2e (admin-screens covers the page) |
| E-08 | Worker down | Edge | Stop the worker | Open the page | Worker "Stopped" in red after two minutes | P1 | manual |
| E-09 | Dead letters | Happy | An email failed every try | Retry | Back in the queue; audit "queue.retry" | P0 | API (CI) + manual |
| E-10 | Dead letters | Happy | Same | Discard (confirm) | Gone from the list; audit "queue.discard"; Sent messages still lists it | P1 | API + manual |
| E-11 | Roles | Security | Sales, Content editor | GET /admin/status | 403; the page shows not allowed | P0 | API |
| E-12 | Input | Security | Admin | POST failed/<bad id>/retry, an unknown action | 422; a job that is not failed answers 404 | P1 | API |
| E-13 | Web intake | Security | — | POST /public/errors without the intake key | 401; bodies over the limits refused | P0 | API |
| E-14 | A11y | Accessibility | Admin | Status page at 390 and 1440 | Names on Retry and Discard, chips with words, table scrolls in its card, axe clean | P1 | admin e2e |

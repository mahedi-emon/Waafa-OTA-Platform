# QA plan · #250 partial lead capture

FR-FLT-08 (PROMPT 10 letter I). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| PC-01 | Happy | Step 1 with the box ticked ("If I don't finish, a travel expert may call me") | Name, number (international form), email, service and page are kept; the visitor moves to step 2 at once | e2e (request body) + API DB |
| PC-02 | Consent | Box not ticked (the default) | Nothing is kept | e2e |
| PC-03 | Data integrity | Step 1 twice, or step 1 then the full request | One draft per phone and service; the full request completes it, so no Incomplete request beside the lead; a phone that already sent this service's request in 24 hours keeps no draft | API DB |
| PC-04 | Happy | 30 minutes after step 1 | The draft shows in Admin › Leads › Incomplete requests with call, WhatsApp, the page they were on | API DB + review |
| PC-05 | Roles | Another service's staff | Can't see or act on it (404) | API DB |
| PC-06 | Happy | Contacted / Set aside | Moves to Handled with who did it; audited | API DB |
| PC-07 | Email | Reminder | One email only, only when the visitor gave an address, only within 2 days, links back to the page they were on | API DB |
| PC-08 | Privacy | Retention | Drafts are deleted after 30 days | API DB |
| PC-09 | Security | Open redirect / injection | The page must be a path on this site ("//evil", full URLs refused); consent must be true; bad phone refused; cross-site POST refused; 5 a minute per address and 10 an hour per phone | API DB + e2e |
| PC-10 | Accessibility | Step 1 checkbox | Labelled, described, 44 px target, axe clean | e2e |
| PC-11 | Performance | First load on lead pages | Still ≤ 200 KB (native checkbox, the keep call loads the contact helpers on demand) | budget e2e |

# QA plan: #284 integration hub (Admin › Integrations)

Owner's order of 28 Oct: Admin › Integrations is the one place to connect every outside service. Each service is a
card: what it does on our site, where to get the keys, the fields, Test connection, Sandbox or Live, On or Off, a
status chip (Off, Not tested, Connected, Failing with the last error and time) and who changed it and when. Secrets
are sealed with PROVIDER_SECRET_KEY, shown as the last four characters only and never sent to the browser. Changes
reach the API, worker and site within a minute without a redeploy.

Roles: Super Admin (only role that opens Integrations), Admin, Sales, Content editor, visitor.

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IH-01 | Cards | Happy | Super Admin | Open Integrations, every tab | Every service in the order has a card: email (Resend, SMTP), Google, Turnstile, GA4, GTM, Meta Pixel, Search Console, Bing, Sentry, GlitchTip, R2, B2, SSLCommerz, bKash, Nagad, BulkSMSBD, SSL Wireless, Twilio, Telegram, Steadfast, Pathao, RedX, flight and hotel providers; each with what it does, a keys link (new tab) and its fields | P0 | shared `providers.test.ts` (catalog) + admin e2e `integrations.spec.ts` |
| IH-02 | Save | Happy | Super Admin | Save GA4 ID `G-ABC1234567`, turn On | Chip "Not tested" then "Connected" after Test; "Changed by <name>, <date>" | P0 | API `providers.test.ts` + admin e2e |
| IH-03 | Validation | Negative | Super Admin | Save GA4 `UA-123`, GTM `ABC`, Pixel `12ab`, Bing `xyz` | Refused per field with a plain message; nothing saved | P0 | shared unit |
| IH-04 | Live only | Edge | Super Admin | Open a measurement card | No Sandbox or Live switch (one set of values); saving stores the Live set and On uses it | P1 | shared unit + API |
| IH-05 | Secrets | Security | Turnstile secret saved | Read `/admin/providers` JSON, page HTML and the audit log | Secret never present; only `last4`; audit shows `secretsChanged: ["secretKey"]` | P0 | API |
| IH-06 | Reveal | Security | Secret saved | POST the old reveal endpoint | 404 (removed); no route returns a secret | P0 | API |
| IH-07 | Roles | Security | Admin, Sales, Content editor | GET/POST `/admin/providers…` | 403; the Integrations page shows the not-allowed screen | P0 | API |
| IH-08 | Public config | Security | Turnstile, GA4 on; Telegram on | GET `/public/integrations/status` with the intake key | Holds the Turnstile site key, GA4 ID and flags only; never a secret, bot token or DSN auth token; without the intake key 401 | P0 | API |
| IH-09 | Runtime | Data | Site built without Turnstile keys | Save Turnstile keys in Admin, On | Within a minute forms show the Turnstile widget and the API refuses a missing token; no rebuild | P0 | API + web unit (`turnstileSiteKey`) + UAT |
| IH-10 | Turnstile | Negative | Turnstile On | Submit a lead without a token or with a bad token | Refused with the plain "Check you are not a robot" message; Turnstile Off → passes | P0 | API `integrationChecks.test.ts` + web unit |
| IH-11 | Failing | Edge | Telegram token wrong | Test connection | Chip "Failing", the error text and the time; feature stays hidden | P0 | API |
| IH-12 | Health gate | Data | SSLCommerz On, last test failing | Public config | `onlinePayment` false until a passing test | P0 | API |
| IH-13 | Fallback | Regression | No email or Google record, `.env` has keys | Send an email, sign in with Google | Still works from `.env`; once a record is saved, the record wins | P0 | API (existing mailer and Google tests) |
| IH-14 | Import | Data | Live data has GA4/GTM/Pixel in Settings › Tracking and verification tokens in Site settings; Turnstile in the API `.env` | Deploy (seed patch) | Values appear on the matching cards, On and Live; staff edits are never overwritten; tracking fields leave Settings | P0 | API seed patch test |
| IH-15 | Audit | Data | Any save, On/Off, test, remove | Audit log | One entry each with who, when, before and after (no secret values) | P0 | API |
| IH-16 | Off | Edge | GA4 On then Off | Load the site after consent | No GA4 script within a minute | P1 | web unit |
| IH-17 | Help | Content | Super Admin | Read each card | Plain words; ADMIN_GUIDE has a Banglish note per card | P1 | manual (UAT) |
| IH-18 | Keyboard and a11y | Accessibility | Super Admin | Tab through tabs, switches, fields, Test, Save at 390 and 1440 | Visible focus, names on every control, chips with text not colour only, 44 px targets, axe clean | P0 | admin e2e + axe |
| IH-19 | Widths | Layout | Super Admin | 320, 390, 768, 1024, 1440 | No horizontal scroll; cards stack on phones | P1 | admin e2e |
| IH-20 | Double submit | Edge | Super Admin | Double-click Save | One save, one audit entry | P1 | admin e2e |
| IH-21 | Encryption key | Edge | PROVIDER_SECRET_KEY missing | Save a secret | Refused with the plain "set PROVIDER_SECRET_KEY" message; warning banner | P1 | API (existing) |
| IH-22 | Custom providers | Regression | Super Admin | Add a custom flight provider | Works as before; new service kinds cannot be added as custom | P1 | shared unit |

# QA plan: #298 Quote builder (PRD §6 leads P1, FR-ADM-LEAD)

Owner's order of 28 Oct, step 6 (split from #242). Bookings are #242.

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QT-01 | Write | Happy | Open lead | Write a quote: two options (title, details, baggage, ৳ price), valid until a day, a note; Save | QTN-yymmdd-nnnn, Draft, options o1 and o2; audit "quote.create" | P0 | API `quotes.test.ts`, e2e `admin-workflow.spec.ts` |
| QT-02 | Write | Negative | Open lead | No option; six options; price 0; title "x"; last day yesterday | Refused per field with a plain message | P1 | shared `quotes.test.ts`, API |
| QT-03 | Send | Happy | Draft with an email on the lead | Send by email | Email from the "quote-customer" template with the link; lead Quoted; timeline "Quote logged (৳lowest): QTN… sent by email" | P0 | API + e2e |
| QT-04 | Send | Edge | Lead without email | Send by email; then Send on WhatsApp | 422 "send the link on WhatsApp"; WhatsApp opens wa.me with the link and records it | P0 | API |
| QT-05 | Link | Security | Sent quote | Open the link; change one character of the signature; open a draft's link; call without the intake key | Options shown (first name only, no phone or email); 404; 404; 401 | P0 | API, unit `quotes.unit.test.ts` |
| QT-06 | Accept | Happy | Sent quote | Pick option 2, Accept (Turnstile when on) | "You accepted …"; quote Accepted; other open quotes of the lead withdrawn; timeline and audit (actor Customer); staff alert email | P0 | API + e2e |
| QT-07 | Accept | Edge | Accepted quote | Accept the same option again; then another option | Same answer; 409 "already accepted another option" | P0 | API |
| QT-08 | Accept | Negative | Quote past its last day; withdrawn quote | Open; Accept | Page says expired / replaced with WhatsApp; Accept 410 / 409 | P0 | API |
| QT-09 | Accept | Security | Public route | Cross-site post; bad token; failed Turnstile; 6 tries in a minute | 403; 422; 400; 429 | P0 | web `route.test.ts` (403, 422, 400) |
| QT-10 | PDF | Happy | Any quote | Open the PDF from Admin and from the customer link | A4, WAAFA logo, ribbon, options with ৳ lakh prices and "VAT included", valid until, the indicative-fare line, contact; accepted option marked | P0 | unit (renders), API (served to both) |
| QT-11 | Convert | Happy | Accepted quote | Convert to booking from the lead | The amount starts at the accepted price; booking created (#242) | P0 | e2e |
| QT-12 | Roles | Security | Visa officer | Open or write a quote on a flights lead | 404 | P0 | API |
| QT-13 | Withdraw | Happy | Sent quote | Withdraw (confirm) | Withdrawn; its link says it was replaced; timeline entry | P1 | API |
| QT-14 | A11y and widths | Accessibility | Customer page | 390 and 1440 px | Native radios in a named group, 44 px targets, no page scroll, axe clean | P0 | e2e (axe, scroll width, screenshots) |

Known limits: a name typed in Bangla prints in Hind Siliguri; Bangla inside option titles or notes prints as boxes in
the PDF (the page shows it correctly), so staff write options in English. Quotes live in the API only; on the Sample fixtures a quote link is not found.

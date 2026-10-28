# QA plan: #242 Bookings (FR-ADM Bookings, FR-ADM-LEAD convert)

Owner's order of 28 Oct, step 6. The quote builder is #298.

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BK-01 | Convert | Happy | Lead in progress | Convert to booking with ৳1,46,480 | One booking BKG-yymmdd-nnnn, Confirmed, Unpaid, amount ৳1,46,480, travel date from the request; the lead links to it | P0 | API `bookings.test.ts`, e2e `admin-workflow.spec.ts` |
| BK-02 | Amount | Data | Booked lead | Correct the booked amount on the lead | The booking's amount follows; payment status recalculated | P0 | API |
| BK-03 | Record | Happy | Booking | Save PNR ab12cd, two ticket numbers (one repeated), ৳30,000 paid, Ticketed | PNR AB12CD, duplicates dropped, Part paid, due ৳50,000; audit entry | P0 | API + e2e |
| BK-04 | Payments | Edge | Booking ৳80,000 | Paid ৳90,000; then ৳80,000; then Refunded | 422 "Paid can't be more than the amount"; Paid; Refunded | P0 | API |
| BK-05 | Validation | Negative | Booking | PNR "x"; ticket with spaces | Refused per field with a plain message | P1 | API |
| BK-06 | Search | Happy | Bookings | Search by PNR, ticket number, lead reference, name, phone; filter by status and payment | Matching rows only | P1 | API + e2e |
| BK-07 | Roles | Security | Visa officer, Travel sales, Accounts | Open a flights booking | Visa officer 404 (and an empty list); Travel sales and Accounts see it | P0 | API |
| BK-08 | Documents | Happy | Booking | Add a PDF e-ticket | Listed under Documents after the scan; opens through a ten-minute signed link; audit "file.attach" | P0 | manual (UAT; uploads in CI are covered by the customer files tests) |
| BK-09 | Documents | Security | Visa officer | Ask for a flights booking's document link | 404 | P0 | API (files access by booking) |
| BK-10 | Documents | Negative | Booking | Upload a .exe or a 7 MB PDF | Refused: type, size (nginx 6 MB, route 5 MB) | P1 | route unit (type, size) + manual |
| BK-11 | Back-fill | Data | Live leads already Booked | Deploy (seed patch) | Each gets one booking (amount from the lead, Confirmed, Unpaid); running again adds none | P0 | API seed patch test |
| BK-12 | Reopen | Edge | Booked lead reopened and converted again | Convert with a new amount | The same booking, amount updated, Cancelled back to Confirmed | P1 | API (fromLead) |
| BK-13 | A11y and widths | Accessibility | Admin | Bookings list and a booking at 320–1440 | Named form and table region, 44 px chips and buttons, no page scroll, axe clean | P0 | admin-screens sweep (list) |

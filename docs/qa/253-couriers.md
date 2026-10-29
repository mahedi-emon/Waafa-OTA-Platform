# QA plan · #253 courier booking and tracking (Steadfast first)

FR-SHOP-14 (PROMPT 10 letter J). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| CR-01 | Compliance | Steadfast card off or no keys | The order page shows no "Book with Steadfast"; booking is refused ("turn it on in Admin › Integrations") | API DB |
| CR-02 | Happy | Card on; a confirmed cash-on-delivery order; Book with Steadfast | One parcel with invoice = order reference, local phone 01…, the address in one line, cash to collect = total; the order moves to Shipped with courier Steadfast and the tracking code; the customer gets the "on its way" SMS (when SMS is on) | API DB + unit |
| CR-03 | Data integrity | An order paid online or by verified transfer | Cash to collect 0 | unit (cod rule) + API DB |
| CR-04 | Negative | Wrong keys, a duplicate invoice, a non-Bangladeshi phone | One plain sentence; the order stays as it was; nothing is booked twice | API DB + unit |
| CR-05 | Roles | Accounts or Sales tries to book; non-Super-Admin reads the webhook token | 403 | API DB |
| CR-06 | Happy | Status changes (hold, in review, delivered) | One history line per new status ("Steadfast: On hold at the courier"); delivered marks the order Delivered (cash collected) | API DB (minute job) |
| CR-07 | Security | Webhook with a wrong or missing token | 401; nothing changes | API DB + e2e |
| CR-08 | Happy | Webhook with the right token | The order follows at once; unknown invoices are acknowledged so the courier stops retrying | API DB |
| CR-09 | Negative | Webhook body that is not JSON, too large, or an unknown courier | 400, capped body, 404 | e2e |
| CR-10 | Resilience | Steadfast down during the 30-minute check | Logged; the next pass tries again; nothing else stops | unit + API DB |
| CR-11 | Admin control | Webhook URL and Auth token on the card | Shown with Copy buttons; the token is derived on the server, never stored in the browser | e2e (API mode) |
| CR-12 | Accessibility | Book with Steadfast inside the Mark shipped dialog | Named button, keyboard reachable, error announced (role=alert), axe clean | e2e (API mode, admin screens) |
| CR-13 | Responsive | Order page and dialog at 320 and 1440 | No horizontal scroll; the booking box wraps | admin screenshots |
| CR-14 | Performance | Submit and order page time | Booking is one request; the 30-minute check is capped at 200 parcels | review |

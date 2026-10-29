# QA plan · #251 SSLCommerz, bKash and Nagad

FR-SHOP-07 online pay (PROMPT 10 letter J). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| OP-01 | Compliance | No keys, sandbox mode, or gateway off | Checkout shows no online option; an online order is refused ("Online payment isn't available"); public status lists no gateway | API DB + e2e (fixture checkout) |
| OP-02 | Happy | Gateway on, Live mode, Live keys | Checkout offers "Pay online · SSLCommerz/bKash/Nagad"; the order is placed, then the customer goes to the gateway page | API DB |
| OP-03 | Security | Start for someone else's order | 404 unless the phone matches the order | API DB |
| OP-04 | Security | Forged success (posted status VALID, any amount) | Ignored: only the gateway's own validation/execute/verify answer counts | API DB + unit |
| OP-05 | Data integrity | Paid amount ≠ order total | Not marked paid; a note on the order's history for staff | API DB |
| OP-06 | Data integrity | IPN and success both arrive, or a callback repeats | Paid once: one "Paid online" history entry; status placed → confirmed | API DB |
| OP-07 | Happy | Cancel / fail | The customer lands on /shop/payment with the outcome; the order stays unpaid and can be paid again | API DB + e2e |
| OP-08 | Contract | SSLCommerz v4 session + validation API; bKash tokenized grant/create/execute/status; Nagad initialize/complete/verify with RSA sealing | Requests carry the server's amount in BDT and the order's session id; answers parsed as documented | unit (stub gateways) |
| OP-09 | Admin | Test connection | One plain sentence saying what is wrong (wrong store password, refused bKash keys, unreadable Nagad keys) or that it works | unit |
| OP-10 | Admin | Refund recorded by Admin or Accounts | Written on the order with amount, reference, who; never past the total; audited | API DB |
| OP-11 | Admin | Integration cards | Every card shows Banglish steps; payment cards list IPN, success, fail, cancel, callback URLs with Copy, and the server IP | review + API-mode admin e2e |
| OP-12 | Accessibility | Payment result page, copy buttons | Heading, outcome words, focusable buttons naming what they copy; axe clean | e2e |
| OP-13 | Manual | ৳10 live test (owner) | See UAT U-35: pay ৳10 with each live gateway, then record a refund | UAT |

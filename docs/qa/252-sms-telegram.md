# QA plan · #252 SMS status messages and Telegram alerts

FR-NTF SMS (status messages only, D300) and FR-NTF Telegram (PROMPT 10 letter J). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| SM-01 | Compliance | No SMS card on, or no keys | Nothing is sent and nothing is logged as failed; email keeps working | API DB |
| SM-02 | Happy | BulkSMSBD on with keys; a request is sent | One SMS "request received" to the customer's phone (880… form), logged as sent in the notification log | API DB (fake gateway) |
| SM-03 | Happy | Order placed, then confirmed, shipped (with tracking), delivered | One SMS per step from the SMS templates; shipped names the courier and tracking number | API DB |
| SM-04 | Happy | Visa case moves a stage | One SMS with the new stage | API DB |
| SM-05 | Compliance | Sign-in code (customer or staff) | Never by SMS: no SMS template exists for any sign-in key, and the sender refuses them | unit |
| SM-06 | Admin control | An SMS template switched off in Admin › Notifications | That message is not sent; others are | API DB |
| SM-07 | Negative | Gateway answers an error code (wrong key, sender ID not approved, no balance, IP not whitelisted) | The log shows one plain sentence; the queue retries; Test connection shows the same sentence | unit (contract per gateway) |
| SM-08 | Contract | BulkSMSBD, SSL Wireless, Twilio request shapes | Right URL, method, fields and phone form for each; success read from each gateway's own answer | unit |
| SM-09 | Happy | Send a test SMS from the card to my phone | "Sent" or the plain reason; staff-only (admin) | API DB + e2e |
| TG-01 | Happy | Telegram on; a request, an order and a payment proof arrive | One message each in the sales group with the reference, a short summary and the admin link; no phone, email or passport data | API DB (fake Telegram) |
| TG-02 | Happy | Find my group after adding the bot and writing in the group | The group's name and chat ID are listed; one tap fills Group chat ID | unit + API DB + e2e |
| TG-03 | Negative | Find my group with a wrong token, a bot with a webhook, or no group message yet | One plain sentence each (token not known; webhook set; add the bot and write a message, then try again) | unit |
| TG-04 | Negative | Test connection: bot not in the group, chat ID wrong, bot removed | One plain sentence each; a passing test posts "WAAFA test" in the group | unit |
| TG-05 | Resilience | Telegram down or slow | The request or order is saved and answered at once; the alert failure is logged, never thrown into the submit | API DB |
| SEC-01 | Security | Find my group and test SMS as a non-admin role | 403 | API DB |
| SEC-02 | Security | Secrets in answers and logs | The bot token and SMS keys never appear in API answers, logs or the notification log | API DB |
| SEC-03 | Security | Template text with HTML or Markdown | Telegram messages are sent as plain text (no parse mode), so nothing is interpreted | unit |
| A11Y-01 | Accessibility | Find my group and test SMS controls | Buttons named, results announced (role=status), 44 px targets on phones, axe clean | e2e (API mode) |
| RWD-01 | Responsive | Integrations cards at 320 and 1440 | No horizontal scroll; Copy rows wrap | e2e screenshots |
| PERF-01 | Performance | Submit time with SMS and Telegram on | Unchanged: both are fire and forget (queue or background) | API DB timing |

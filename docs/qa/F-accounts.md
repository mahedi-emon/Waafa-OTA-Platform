# QA plan: letter F, customer accounts and /track

Owner's order of 27 Oct (D300). Sign-in is an email one-time code (6 digits through Resend, valid 10 minutes, single
use, at most 5 tries) or Google; no phone OTP or SMS for sign-in. Every flow still works as a guest. Parts: F1 sign-in,
sign-up, attach, admin Customers and security (#241); F2 My account sections and the optional password (#278); F3 one
/track page (#240).

Roles: guest, customer (email code), customer (Google), customer disabled by staff, staff (Super Admin, Admin, Sales,
Content editor); admin and customer sessions never mix.

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Sign-in | Happy | Account exists for the email | /login, type the email, request a code, type the code from the email | Signed in, My account shows the name; header shows the account; session cookie httpOnly, Secure, SameSite=Lax | P0 | `e2e/account.spec.ts` (API mode, mail capture) + API `customerAuth.test.ts` |
| F-02 | Sign-up | Happy | No account for the email | Request a code, type it, then name and phone | Account created with the email verified, phone stored as a contact field (not verified), signed in | P0 | e2e + API |
| F-03 | Code | Negative | Code requested | Type a wrong code 5 times | Each wrong try says the code is wrong; the 5th locks the code; a new code is needed | P0 | API |
| F-04 | Code | Edge | Code requested | Wait 10 minutes (clock moved in the test) | The code is refused as expired | P0 | API |
| F-05 | Code | Negative | Code used once | Use the same code again | Refused (single use) | P0 | API |
| F-06 | Code | Edge | Two codes requested | Type the first code | Only the newest code works | P1 | API |
| F-07 | Enumeration | Security | — | Request a code for an unknown and a known email | Same response, same message, same timing class; no hint whether an account exists | P0 | API |
| F-08 | Rate limits | Security | — | 6 code requests for one email in an hour; 20 from one address | Refused with 429 and the plain "try again later" message; the email is not sent | P0 | API |
| F-09 | Turnstile | Security | Turnstile keys set | Request a code without or with a bad token | Refused; with keys off (development) the request passes | P0 | API |
| F-10 | Email | Notification | Code requested | Read the email | One email, to that address, subject and body from the editable template `customer-sign-in-code`, the 6-digit code and "10 minutes"; nothing else | P0 | API (mail capture) + manual on staging (template edit shows) |
| F-11 | Template | Admin | Content editor | Edit the code email in Admin › Forms and notifications, request a code | The new wording arrives; `{{code}}` must stay (editor refuses to save without it) | P1 | API + admin e2e |
| F-12 | Google | Regression | Google on | Sign in with Google | Works as before; the account shows sign-in method Google | P0 | `googleOAuth.unit.test.ts`, API |
| F-13 | Attach | Data | Guest lead and order with email a@x before sign-up | Sign up with a@x | Both show in My account; staff see the customer on the lead and order | P0 | API + e2e |
| F-14 | Attach | Data | Guest lead with phone only (no email) | Sign up with that phone as contact | The lead attaches by phone (no email on the record) | P1 | API |
| F-15 | Attach | Security | Lead with email b@x | Sign up as a@x with b@x's phone | The b@x lead is NOT attached (it has an email) | P0 | API |
| F-16 | Attach | Admin | Sales | Attach a lead to a customer by hand | Shows in their account; audit log written | P1 | API + admin e2e |
| F-17 | Sessions | Security | Customer and staff signed in in one browser | Use both | Admin cookie never opens My account and the customer cookie never opens admin; signing out of one keeps the other | P0 | API + e2e |
| F-18 | Admin Customers | Admin | Admin | Customers page | Verified, sign-in method, last sign-in shown; Disable account blocks sign-in and ends sessions; Sign out everywhere ends sessions | P0 | admin e2e + API |
| F-19 | Disabled | Roles | Account disabled | Request a code, sign in with Google | Same neutral response; no session; guest flows still work | P0 | API |
| F-20 | Header | UI | Signed out / in | Header at 390 and 1440, phone drawer, More sheet | Log in, or the name with My account and Sign out, in all three | P1 | e2e |
| F-21 | XSS | Security | — | Name `<img src=x onerror=alert(1)>` at sign-up | Shown as text in header, account and admin | P0 | e2e + API |
| F-22 | Open redirect | Security | — | /login?next=https://evil.example | Lands on My account, never off-site | P0 | unit (`safeNext`) |
| F-23 | Session expiry | Security | Session older than 30 days | Open My account | Back to /login with a plain message | P1 | API |
| F-24 | Delete | Data | Signed in | Delete account | Account and sessions gone; requests and orders stay with the business, no longer linked | P0 | API + e2e |
| F-25 | My account | Happy | Records exist | Requests with status timeline, visa applications, orders | Each list matches admin; statuses in words; dates in Dhaka time | P0 | e2e (F2) |
| F-26 | Wishlist | Happy | Signed in | Save a package and a product, open My account | Both listed, remove works; guests are asked to sign in | P1 | e2e (F2) |
| F-27 | Travellers | Security | Signed in | Save a traveller with passport number | Stored encrypted at rest (no plain number in the database), shown masked except to the owner | P0 | API (F2) |
| F-28 | Addresses | Happy | Signed in | Add, edit, remove an address; checkout | Default address prefills checkout | P1 | e2e (F2) |
| F-29 | Preferences | Happy | Signed in | Turn off offers emails | Saved; marketing emails skip them; service emails still go | P1 | API (F2) |
| F-30 | Sign-in history | Happy | Signed in | My account › Security | Last sign-ins with device and time, Sign out other devices | P1 | e2e (F2) |
| F-31 | Password | Happy | Signed in | Set a password, sign out, sign in with it; reset by email code | Works; wrong password counts against the same tries | P1 | API + e2e (F2) |
| F-32 | /track | Happy | A lead, a visa application and an order | /track with reference and phone | Each shows its own status timeline and no personal data beyond it | P0 | e2e (F3) |
| F-33 | /track | Negative | — | Wrong phone for a real reference; unknown reference | Same "not found" answer for both (no enumeration) | P0 | API + e2e (F3) |
| F-34 | /track | Regression | Old links | /shop/track?order=…&phone=… | 308 to /track with the same values | P0 | e2e (F3) |
| F-35 | /track | Security | — | 11 lookups from one address in 10 minutes | Refused with the plain "try again later" | P0 | API (F3) |
| F-36 | Accessibility | Keyboard | Code screen | Keyboard only: email, code (one box, numeric, autocomplete one-time-code), errors | Focus order right, errors announced, 44 px targets, axe passes | P0 | e2e + axe |
| F-37 | Responsive | UI | — | /login, /account, /track at 320, 390, 768, 1024, 1440 | No horizontal scroll, no cut text | P1 | e2e (public screens) |
| F-38 | Time zone | Edge | Code requested 23:59 Dhaka | Use it at 00:05 | Works (expiry is 10 minutes, not a day) | P2 | API (clock) |
| F-39 | Slow network | Edge | Slow 4G | Request a code, double-tap Send | One email, one code (idempotent request) | P1 | API + e2e |
| F-40 | Bangla text | Edge | — | Name in Bangla at sign-up | Stored and shown as typed | P2 | API |
| F-41 | Exploratory | Manual | Staging data | 20 minutes as a customer and as staff on a 390 px phone | Findings become bug issues | P1 | Manual (judgement) |

Manual only: F-10 on staging (real inbox), F-41 (exploratory).

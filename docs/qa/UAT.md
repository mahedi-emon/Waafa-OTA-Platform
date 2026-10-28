# Hands-on checks for the owner (after the release)

Owner's order of 28 Oct (D303): nothing is deployed during development. After the one release, walk through these on
a phone (390 px) and a laptop. Each line says where to go, what to do and what you should see. Every issue adds its
lines here; automated tests already cover the same flows, these are the checks only a person on the real site can do.

| # | Area (issue) | Where | Do | You should see | Done |
| --- | --- | --- | --- | --- | --- |
| U-01 | Two-step sign-in (#234) | /secure-admin-control/sign-in | Sign in as Super Admin | Set up the authenticator app, save the recovery codes; next sign-in asks for the 6-digit code | ☐ |
| U-02 | Integrations (#284) | Admin › Settings › Integrations | Open each tab | Every service has a card with "Where to get the keys"; Turnstile and the measurement cards show On if they were set before | ☐ |
| U-03 | Turnstile (#284) | Integrations › Sign-in and security › Cloudflare Turnstile | Save your real site key and secret, Active on, Test connection | Chip turns Connected; within a minute a request form shows the Cloudflare check on first focus | ☐ |
| U-04 | Measurement (#284) | Integrations › Measurement | Save the GA4 ID, Active on; open the site in a private window and accept cookies | GA4 › Reports › Realtime shows you within a minute | ☐ |
| U-05 | Secrets (#284) | Any card with a saved secret | Look at the field | Only "Saved, ends in ••••" is shown; there is no way to show the whole secret | ☐ |
| U-06 | Accounts live (#241) | Admin › Settings › Site | Turn Accounts live on | Header shows Log in; /login sends a 6-digit code to your email | ☐ |
| U-07 | My account (#278) | /account on the phone | Save a package (heart), add a traveller and an address, turn offer emails on | Wishlist shows the package; passport shows only the last 4 digits; checkout fills the default address | ☐ |
| U-08 | Password (#278) | /account › Settings | Set a password, sign out, use "Sign in with a password instead" | Signed in; "Sign out other devices" signs out your laptop | ☐ |
| U-09 | Customer files (#232, #235) | Visa apply, upload a PDF | Submit, then open the application in Admin | The file shows Clean after a minute; the link opens only for staff | ☐ |

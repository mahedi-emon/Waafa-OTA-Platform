# WAAFA — release note (one release, cumulative)

Owner's order of 28 Oct (D303): nothing is deployed during development; everything merged to `main` goes live in
one release at the end. Every PR that changes what the deploy does adds its lines here. Steps for the server are in
[DEPLOY.md](DEPLOY.md); this page says what is new since the release that is live now.

## From → to

| | Release | Commit | How we know |
| --- | --- | --- | --- |
| Live on the server | the image tag the server runs (`IMAGE_TAG` in `/opt/waafa/.env`, `latest` at its last pull) | **owner to confirm**; assumed `541bd21` (23 Oct, Next.js security fix) or later | On 28 Oct `https://waafasworld.com/track` answered 404, so the live release is older than #280 (`ea5e7f9`, 27 Oct). The upgrade rehearsal (#285) starts from `deploy/LIVE_RELEASE` |
| This release | the release candidate tag (step 14) | `main` at tagging time | — |

To confirm on the server (read only): `docker compose -f /opt/waafa/compose.yml images` shows the tag in use;
tell Claude the 7-character tag at the next checkpoint and `deploy/LIVE_RELEASE` changes to it.

## Database migrations, in order (all additive)

Prisma applies only the ones the live database does not have yet, in this order, inside `sh deploy.sh`.
**Take a backup first** (`sh backup.sh`).

| Migration | From | What it adds |
| --- | --- | --- |
| `20261020050000_media_credit` | R3 #193 | credit fields on media assets |
| `20261024040000_status_automation` | R4 #194 | workflow status, scheduling, Trash and slug redirect tables |
| `20261025090000_staff_invites` | R9 #199 | staff invite hash and expiry |
| `20261026010000_customer_files` | #232 | private customer files with malware scan status |
| `20261026120000_staff_two_step` | #234 | staff two-step sign-in, recovery codes, trusted devices, sign-in history |
| `20261027090000_customer_sign_in` | #241 | customer email code sign-in, customer on leads and orders |
| `20261027150000_customer_account_sections` | #278 | wishlist, saved travellers (sealed passport), addresses, optional password |
| `20261029010000_order_source` | #237 | where a buyer came from (UTM, referrer, landing page) on each order |
| `20261030010000_bookings` | #242 | a booking record per converted lead (PNR, tickets, amount, payments, documents) |
| `20261031010000_quotes` | #298 | quotes on leads (options, last valid day, the accepted option) |

One-time data patches (`_seedPatches`, never over staff edits) run after the migrations: workflow, invite, low-stock,
new-device, code-locked and customer sign-in email templates; #284 adds `2026-10-28-integration-cards`; #239 adds
`2026-10-29-system-alert-template` (disk and memory alerts); #242 adds `2026-10-30-bookings-for-booked-leads` (one
Confirmed, Unpaid booking for every lead already Booked, amount from the lead); #298 adds `2026-10-31-quote-templates`
(the quote email to the customer and the "quote accepted" staff alert); #302 adds `2026-10-28-store-name` (every
stored text that still equals an old "Waafas World" default becomes "Waafa’s World": store name, menus, footer column,
COD note, pages, team, timeline, email templates; anything staff wrote stays as it is).

## New or changed containers

| Container | Memory limit | Since | Note |
| --- | --- | --- | --- |
| `clamav` (new) | 1.6 GB | #235 | malware scan of customer files; first start downloads signatures (a few minutes); new volume `clamdata` |
| `api`, `worker` | 640 MB, 384 MB | — | unchanged limits; customer files in the new private volume `privatedata` (#232) |

The VPS needs about 1.6 GB more free memory than before for ClamAV.

## Server bundle (`deploy/server`) changes

Copy the changed files from `deploy/server` to `/opt/waafa` before deploying (DEPLOY.md, "When deploy/server
changes"): `compose.yml` (clamav, private files volume, Turnstile lines moved to the API, #284), `deploy.sh` (it now installs the backup cron, #239) and `backup.sh` (restore drill, off-site copy, #239).
The nginx settings live inside the `nginx` image (the 6 MB booking document upload, #242, comes with it): nothing to
copy for them.

## Settings that moved or are new

| What | Where now | Owner action after deploy |
| --- | --- | --- |
| Daily backup and monthly restore drill | installed in cron by deploy.sh (#239) | none; `BACKUP_CRON=off` in .env only to opt out |
| Off-site backup copy | Admin › Integrations › Errors and backups (R2 or B2) | create a bucket and a key, save the card, Test |
| Error tracking | Admin › Integrations › Errors and backups (Sentry or GlitchTip DSN) | optional |
| Who gets disk and memory alerts | Settings › Forms and messages › staff alerts, area "Server running low" | choose people (else STAFF_ALERT_EMAIL) |
| System status, failed emails | Settings › System status (#238) | look after the deploy: everything green |
| Turnstile site key and secret | Admin › Integrations › Sign-in and security (#284) | none if they were in `.env` (moved once); then empty both `.env` lines |
| GA4, GTM, Meta Pixel IDs, Search Console and Bing codes | Admin › Integrations › Measurement (#284) | check the cards are On |
| Customer accounts | Settings › Site › Accounts live (#241) | turn on when ready |
| Staff two-step sign-in | required for Super Admin and Admin (#234) | each of them sets up an authenticator app at first sign-in |

## Keys to enter in Admin › Integrations (all off until saved)

Resend or SMTP (email), Google sign-in, Turnstile, GA4, GTM, Meta Pixel, Search Console, Bing, Sentry or GlitchTip,
Cloudflare R2 or Backblaze B2, SSLCommerz, bKash, Nagad, BulkSMSBD or SSL Wireless or Twilio, Telegram, Steadfast,
Pathao, RedX. Each card links to where its keys come from.

## Deploy steps (the release day)

```sh
cd /opt/waafa
sh backup.sh                 # database and media backup first
# copy the changed deploy/server files (see above)
sh check.sh                  # settings check
sh deploy.sh                 # pulls the images, runs migrations and seed patches, restarts
```

Then: sign in to Admin, set up two-step, open Integrations and check each card's chip; walk through
[qa/UAT.md](qa/UAT.md).

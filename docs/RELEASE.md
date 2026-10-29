# WAAFA — release note (one release, cumulative)

Owner's order of 28 Oct (D303): nothing is deployed during development; everything merged to `main` goes live in
one release at the end. Every PR that changes what the deploy does adds its lines here. Steps for the server are in
[DEPLOY.md](DEPLOY.md); this page says what is new since the release that is live now.

## From → to

| | Release | Commit | How we know |
| --- | --- | --- | --- |
| Live on the server | `7af26e7` (Docker images run #30, PR #187, 14 Oct) with the 13 Oct `deploy/server` bundle | api and worker `sha256:b52c4bb564fa37ee3b778b1dee49835823b89aed5eea30d84159c3745c61a8e1`, web `sha256:023a177a453ff445457cca56b5f6f5cbe5cf378d5521518c7aa5376da49d3e6a` (tags `api-7af26e7`, `web-7af26e7`) | Owner, 28 Oct (D312); `deploy/LIVE_RELEASE` = `7af26e7`, so the upgrade rehearsal starts there, and Docker Hub never deletes it |
| This release | the release candidate tag (step 15) | `main` at tagging time | — |

## Database migrations, in order (all additive)

Every migration since `7af26e7` (D0 admin redesign included). Since #303 the API image applies them with its own
runner (`node dist/migrate.js`, the same `_prisma_migrations` table and lock as Prisma), only the ones the live database
does not have yet, in this order, when the API starts inside `sh deploy.sh`. **Take a backup first** (`sh backup.sh`).

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
| `20261101010000_reminders_alerts` | #243 | reminders, personal bell alerts, and the round-robin switch per staff member |
| `20261102010000_customers_roles` | #244 | customer tags, notes and merges; custom roles |
| `20261103010000_reviews_questions` | #245 | reviews from real customers and product questions |
| `20261104010000_lead_drafts` | #250 | Incomplete requests (step 1 kept with the visitor's OK) |

One-time data patches (`_seedPatches`, never over staff edits) run after the migrations. Live already has
`2026-10-13-visa-route`, `2026-10-14-second-phone` and `2026-10-14-home-seo`; everything below runs at the release: workflow, invite, low-stock,
new-device, code-locked and customer sign-in email templates; #284 adds `2026-10-28-integration-cards`; #239 adds
`2026-10-29-system-alert-template` (disk and memory alerts); #242 adds `2026-10-30-bookings-for-booked-leads` (one
Confirmed, Unpaid booking for every lead already Booked, amount from the lead); #298 adds `2026-10-31-quote-templates`
(the quote email to the customer and the "quote accepted" staff alert); #302 adds `2026-10-28-store-name` (every
stored text that still equals an old "Waafas World" default becomes "Waafa’s World": store name, menus, footer column,
COD note, pages, team, timeline, email templates; anything staff wrote stays as it is); #244 adds `2026-11-02-summary-template` (the daily and weekly summary email); #250 adds `2026-11-04-incomplete-template`; #252 adds `2026-11-05-sms-templates` (four status SMS templates; nothing is sent until an SMS card is on).

## Image sizes (issue 303)

Measured with `docker images` (the number the server shows); the VPS smoke and the Docker images workflow fail a
release that grows past the budget (`scripts/measure-stack.sh`).

| Image | Live (`7af26e7`) | Before #303 (`8694513`) | This release | Budget |
| --- | --- | --- | --- | --- |
| api (also the worker) | 2.07 GB | 1.82 GB | 182 MB | 400 MB |
| web | 571 MB | 599 MB | 321 MB | 500 MB |
| nginx | 74 MB | 74 MB | 45 MB | 100 MB |

API: Alpine with only the node binary, one compiled bundle (Nest, Prisma client and query compiler included), five
packages that must stay on disk (sharp, argon2, pdfkit, bullmq, ioredis), no package manager, no Prisma CLI, no
TypeScript. Web: Alpine with only the node binary and the traced standalone server; about 110 MB of it is the
prerendered pages (62 MB of them prefetch segments), which keep every page instant, so the owner's 250 MB target is not
met (D313). Memory in the VPS smoke with ClamAV loaded: api 101 MB, worker 69, web 105, postgres 52, redis 4, nginx 6,
certbot 2, clamav 952: the whole stack 1.29 GB.

## New or changed containers

| Container | Memory limit | Since | Note |
| --- | --- | --- | --- |
| `clamav` (new) | 1.6 GB | #235 | malware scan of customer files; first start downloads signatures (a few minutes); new volume `clamdata` |
| `api`, `worker` | 512 MB, 384 MB | #303 | API limit down from 640 MB; customer files in the private volume `privatedata` (#232); the API reads `./backups` read only for the Status page |
| all | logs rotate at 10 MB × 3 | #303 | no log file grows without end |
| `clamav` | 1.6 GB | #303 | `CLAMD_CONF_ConcurrentDatabaseReload: "no"`: one signature set in memory; the daily reload pauses scans about a minute |

The VPS needs about 1.2 GB more memory than before for ClamAV; the whole stack stays under 3 GB at rest (measured in
the VPS smoke, budget 3 GB).

## Server bundle (`deploy/server`) changes

Since `7af26e7` three files changed; copy them to `/opt/waafa` **before** `sh deploy.sh` (after the backup):

| File | Why |
| --- | --- |
| `compose.yml` | ClamAV (#235), private files volume (#232), Turnstile lines moved to the API (#284), log rotation, the backups folder read by the Status page, API limit 512 MB, ClamAV reload setting (#303) |
| `deploy.sh` | installs the backup cron (#239); removes unused images older than a week after a deploy (#303) |
| `backup.sh` | restore drill and off-site copy (#239); keeps `BACKUP_KEEP_DAYS` days (default 7, was 14) (#303) |

The repository is private, so the copy needs a GitHub token with read access to its contents (fine-grained, this
repository only, "Contents: Read-only"; it can expire after a day). On the server:

```sh
cd /opt/waafa
TAG=<release tag>          # e.g. v1.1.0, from the release page
TOKEN=<read-only token>
for f in compose.yml deploy.sh backup.sh; do
  cp "$f" "$f.before-$TAG" 2>/dev/null || true
  curl -fsSL -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.raw"     -o "$f" "https://api.github.com/repos/mahedi-emon/Waafa-OTA-Platform/contents/deploy/server/$f?ref=$TAG"
done
unset TOKEN
```

The nginx settings live inside the `nginx` image (the 6 MB booking document upload, #242, comes with it): nothing to
copy for them. Optional new `.env` lines: `BACKUP_CRON=off` (no cron), `BACKUP_KEEP_DAYS=7`, `STAGING=1` (staging only).

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
| Daily and weekly summary emails | Settings › Forms and messages › staff alerts, areas "Daily summary" and "Weekly summary" (#244) | add the people who should get them |
| Custom roles | Admin › Users › Custom roles (#244) | optional |
| Round-robin for new leads | Admin › Users › a person › Takes new leads in turn (#243) | turn it on for the staff who should get new requests in turn (off for everyone after the deploy) |
| Online payment (SSLCommerz, bKash, Nagad) | Admin › Integrations › Payments (#251) | save Sandbox keys and test first; checkout offers a gateway only when it is On, in Live mode, with Live keys; then do the ৳10 test (UAT U-35). No migration |
| Status SMS and Telegram alerts | Admin › Integrations › SMS and Alerts (#252); SMS texts in Settings › Forms and messages | SMS: save the keys, Test, Send a test SMS, turn On. Telegram: create the bot, add it to the group, write a message, Find my group, Save, Test, turn On (UAT U-36). No migration |

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

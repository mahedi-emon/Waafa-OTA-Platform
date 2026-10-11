# WAAFA deploy runbook (launch 13 Oct 2026)

Two services and four managed pieces. Do the steps in order: the web build reads the API, so the API goes first.

| Piece | Where | Notes |
| --- | --- | --- |
| API + job worker | Railway, from `apps/api/Dockerfile` | One image: the API runs migrations and the idempotent seed, then starts; the worker overrides the start command |
| PostgreSQL 16 | Railway PostgreSQL | Daily backups on |
| Redis 7 | Railway Redis | Email queue (BullMQ) |
| Web | Vercel, project root `apps/web` | Next.js 16 |
| Email | Resend with the domain verified | Customer and staff emails |
| Turnstile | Cloudflare | Site key on the web, secret on the web |
| Domain | DNS for waafasworld.com (to confirm) | `www` and the apex to Vercel, `api.` to Railway |

## 0. Secrets (generate once, keep in a password manager)

Run three times and keep each output for one variable: `JWT_SECRET`, `REVALIDATE_SECRET`, `INTAKE_KEY`.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Never put them in chat, the repository or a screenshot. Each environment gets its own values.

## 1. Owner accounts (needs the owner)

1. Railway: create a project, add PostgreSQL and Redis. Invite the developer or share a project token.
2. Vercel: create a team or use the personal account; import `mahedi-emon/Waafa-OTA-Platform`.
3. Resend: add the domain, add the SPF, DKIM and DMARC records it shows at the DNS host, wait for "Verified".
4. Cloudflare Turnstile: add a site for the domain (managed widget), copy the site key and the secret.
5. DNS: access to the domain's DNS (or add the records from steps 3 and 6 yourself).
6. A Super Admin email and a strong password (12+ characters) for the first sign-in; change it after launch.

## 2. API on Railway

New service → Deploy from GitHub → this repository → Settings:

- Builder: Dockerfile, path `apps/api/Dockerfile` (build context: repository root)
- Healthcheck path: `/ready`
- Public domain: `api.<domain>` (custom domain) or the Railway domain for the first test

Variables (Railway → service → Variables):

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | from step 0 |
| `REVALIDATE_SECRET` | from step 0 (the web uses the same value) |
| `INTAKE_KEY` | from step 0 (the web uses the same value as `WAAFA_INTAKE_KEY`) |
| `WEB_ORIGINS` | `https://<domain>,https://www.<domain>` |
| `WEB_REVALIDATE_URL` | `https://<domain>/api/revalidate` (add after step 4) |
| `RESEND_API_KEY` | from Resend |
| `MAIL_FROM` | `Waafa <no-reply@<domain>>` |
| `STAFF_ALERT_EMAIL` | the inbox that receives new leads and orders |
| `SEED_ADMIN_EMAIL` | the first Super Admin's email |
| `SEED_ADMIN_PASSWORD` | the first Super Admin's password (12+ characters; remove the variable after the first deploy) |

Deploy. Check `https://<api>/ready` answers `{"status":"ready","database":"up"}`. The first start loads the Sample
content and creates the Super Admin; later deploys never overwrite admin edits.

Worker: in the same project, New service → same repository and Dockerfile → Settings → Start command
`pnpm --filter @waafa/api worker`, same variables (Railway: "Shared variables" or copy). It sends the queued emails.

## 3. Web on Vercel

Project settings:

- Root directory: `apps/web` (Vercel installs the whole pnpm workspace)
- Framework: Next.js; Node 22
- Build command: `cd ../.. && pnpm turbo run build --filter=@waafa/web`

Environment variables (Production):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://<domain>` |
| `WAAFA_API_URL` | `https://api.<domain>` (no trailing slash) |
| `WAAFA_INTAKE_KEY` | the API's `INTAKE_KEY` |
| `REVALIDATE_SECRET` | the API's `REVALIDATE_SECRET` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Turnstile secret (set both or neither) |

Deploy. The build prerenders pages from the API snapshot, so the API must be up.

## 4. Connect the two

1. On Railway set `WEB_REVALIDATE_URL=https://<domain>/api/revalidate` and redeploy the API.
2. Domain: add `<domain>` and `www.<domain>` in Vercel → Domains, add the records it shows; add `api.<domain>` in
   Railway → Networking → Custom domain and its CNAME.

## 5. Launch checks (in this order)

1. `https://<domain>` loads; `https://<domain>/robots.txt` and `/sitemap.xml` show the real domain.
2. Admin: `https://<domain>/secure-admin-control` (`/admin` is a 404 on purpose) → sign in with the seed Super Admin → My account → change the password.
3. Users and roles: add each staff member with their role.
4. Send a flight request from the site → it appears in Admin › Leads within seconds → the staff alert email arrives
   → the customer email arrives (if an email was given).
5. Place a cash-on-delivery order → Admin › Orders → confirm → the order email arrives.
6. Admin › Content › FAQs: change an answer → reload `/faqs` → the new answer shows.
7. Feedback form → Admin › Feedback → approve → the wall shows it.
8. Turnstile: the forms submit normally (the widget appears only if Cloudflare asks).
9. Replace every Sample record (contact numbers, office hours, payment accounts, packages, products, prices) in Admin
   › Content before announcing the site; Admin › Content › Maintenance mode can hold the public site meanwhile.

## 6. Rollback

- Web: Vercel → Deployments → the previous deployment → Promote to production.
- API: Railway → Deployments → the previous deployment → Redeploy. Migrations only add tables and columns, so the
  previous API keeps working on the newer database.
- Content: every admin save is in Admin › Audit log with its before and after values.

## Local development

See the README: the site runs on the Sample fixtures without any variables; set `WAAFA_API_URL` and
`WAAFA_INTAKE_KEY` (and `REVALIDATE_SECRET`) in `apps/web/.env.local` to run it on a local API.

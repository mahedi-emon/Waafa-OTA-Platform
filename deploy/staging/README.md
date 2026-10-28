# Staging (optional, issue 239)

A second copy of the site for trying a release before it goes live. Nothing here runs unless the owner sets it up;
the live server never needs it.

## What it is

- The same image-only bundle as the live server (`deploy/server`), on its **own small VPS** (2 vCPU, 4 GB is enough
  without ClamAV), so it has its own database, Redis, photos and customer files. Nothing is shared with the live site.
- Its own address, for example `staging.waafasworld.com`.
- **Kept out of search and away from the public** with Cloudflare Access (free for up to 50 people): only the emails
  you allow can open it, so search engines never see it. The images are the same as live, so the pages themselves
  would say "index"; Access is what keeps them private.
- **Test keys only**: in its Admin › Integrations every card uses its Sandbox (test) account — SSLCommerz sandbox,
  bKash sandbox, Cloudflare's always-pass Turnstile test keys, a separate GA4 property or none. Never the live keys.

## Set it up (about 30 minutes)

1. Create the VPS and point `staging.waafasworld.com` at it (Cloudflare DNS, proxied).
2. On the VPS, as on the live one: `sh setup-server.sh`, copy the `deploy/server` files to `/opt/waafa-staging`.
3. Copy `env.example` from this folder to `/opt/waafa-staging/.env` and fill it in (new secrets: never reuse the
   live `.env`).
4. `cd /opt/waafa-staging && sh deploy.sh` (it seeds Sample content and the first Super Admin).
5. Cloudflare › Zero Trust › Access › Applications › Add › Self-hosted: `staging.waafasworld.com`, policy "Emails" with
   the people who may test.
6. To try a release: set `IMAGE_TAG=<7-character sha>` in `.env` and `sh deploy.sh`.

Backups are off by default here (`BACKUP_CRON=off`); staging data is test data.

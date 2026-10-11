# WAAFA deploy runbook (launch 13 Oct 2026)

Everything runs on one VPS (2 vCPU, 4 GB RAM, Docker) with Docker Compose: `deploy/compose.yml`.

| Service | Image | Public | Memory cap |
| --- | --- | --- | --- |
| `nginx` | `deploy/nginx` (nginx 1.27): reverse proxy, HTTPS, www → apex, rate limit on form posts | 80 and 443 | 96 MB |
| `certbot` | `certbot/certbot`: gets and renews the Let's Encrypt certificate | no | 128 MB |
| `web` | `apps/web/Dockerfile` (Next.js standalone) | through nginx only | 768 MB |
| `api` | `apps/api/Dockerfile` (runs migrations and the idempotent seed, then starts) | no (127.0.0.1:4000 for the web build) | 640 MB |
| `worker` | same image as the API, command `tsx src/worker.ts` | no | 384 MB |
| `postgres` | `postgres:16`, volume `pgdata` | no | 640 MB |
| `redis` | `redis:7`, append-only, `noeviction` (BullMQ) | no | 160 MB |

Outside the server: an email sender (Resend, or any SMTP server), Cloudflare Turnstile (optional at launch) and the
domain's DNS.

## Quick start (manual deploy, about 30 minutes)

Run these on the VPS as a user with `sudo`. Replace `waafasworld.com` and the email with your own.

```bash
# 1. Once per server: swap, firewall, Docker (details in step 1 below)
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker "$USER"   # log out and in once

# 2. The code
sudo mkdir -p /opt/waafa && sudo chown "$USER" /opt/waafa
git clone https://github.com/mahedi-emon/Waafa-OTA-Platform.git /opt/waafa && cd /opt/waafa

# 3. Settings: creates deploy/.env with new random secrets, then add the email sender and the first admin
sh deploy/init-env.sh waafasworld.com you@example.com
nano deploy/.env        # RESEND_API_KEY or SMTP_URL, STAFF_ALERT_EMAIL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD

# 4. Check everything (Docker, memory, ports, settings, DNS), then deploy
sh deploy/check.sh
sh deploy/deploy.sh

# 5. Daily backups
(crontab -l 2>/dev/null; echo "15 3 * * * cd /opt/waafa && sh deploy/backup.sh >> deploy/backups/backup.log 2>&1") | crontab -
```

Then open `https://waafasworld.com/secure-admin-control`, sign in with the first Super Admin, change the password,
remove `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `deploy/.env`, and follow the launch checks in step 5.
Every later release: `cd /opt/waafa && git pull && sh deploy/deploy.sh`.

## 0. Owner checklist

1. VPS: SSH access for the developer (a user with `sudo` and in the `docker` group), Ubuntu 22.04/24.04 or Debian 12.
2. Domain: A records for the apex and `www` pointing at the VPS IP (and AAAA if the VPS has IPv6), plus an email
   for Let's Encrypt certificate notices (`ACME_EMAIL`).
3. Email: a Resend account with the domain verified (SPF, DKIM, DMARC records at the DNS host), or SMTP details.
4. Turnstile (optional): a Cloudflare Turnstile site for the domain (managed widget): site key and secret.
5. The first Super Admin's email and a strong password (12+ characters); change it after the first sign-in.

## 1. Prepare the server (once)

```bash
# Swap: the web build needs about 2 GB on top of the running stack.
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Firewall: SSH, HTTP, HTTPS only.
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable

# Docker Engine with the Compose plugin (skip if `docker compose version` already works).
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker "$USER"   # then log out and in

# The code.
sudo mkdir -p /opt/waafa && sudo chown "$USER" /opt/waafa
git clone https://github.com/mahedi-emon/Waafa-OTA-Platform.git /opt/waafa
```

Docker publishes ports past `ufw`; the compose file only publishes 80/443 (nginx) and `127.0.0.1:4000` (local only),
so nothing else is reachable from outside.

## 2. Settings

```bash
cd /opt/waafa
sh deploy/init-env.sh <domain> <email for Let's Encrypt>   # or: cp deploy/.env.example deploy/.env
nano deploy/.env
sh deploy/check.sh
```

Fill in every value (the comments in the file explain each one). Secrets: generate each with
`openssl rand -base64 48 | tr -d '/+=' | cut -c1-48`, a different value for `POSTGRES_PASSWORD`, `JWT_SECRET`,
`REVALIDATE_SECRET`, `INTAKE_KEY` and `PROVIDER_SECRET_KEY` (encrypts the flight, hotel and payment API secrets saved in
Admin › Integrations; keep it fixed once secrets are saved). Keep a copy in a password manager; never put them in chat, the repository or a
screenshot.

## 3. Deploy

```bash
cd /opt/waafa && git pull && sh deploy/deploy.sh
```

The script builds the API image, starts PostgreSQL, Redis and the API (migrations and seed run on start), waits until
`/ready` answers, builds the web against the API (the build prerenders pages from the content snapshot), then starts
the worker, the web, nginx and certbot; with `ACME_EMAIL` set it then gets the Let's Encrypt certificate
and switches nginx to HTTPS (DNS must already point at the server). The first run takes 10 to 15 minutes; later runs reuse the dependency layers.

Check: `docker compose -f deploy/compose.yml ps` shows every service running (`api` healthy), and
`curl -s http://127.0.0.1:4000/ready` answers `{"status":"ready","database":"up"}`. `https://<domain>` answers with a valid certificate; certbot renews it when due and nginx reloads every 6 hours.

Every later release is the same command. Admin edits live in PostgreSQL, so a redeploy never overwrites them.

## 4. Backups

```bash
crontab -e
# add:
15 3 * * * cd /opt/waafa && sh deploy/backup.sh >> deploy/backups/backup.log 2>&1
```

Daily dump at 03:15 server time, the last 14 kept in `deploy/backups/`. Copy them off the server weekly (or use the
VPS provider's snapshot backups as well). Restore:
`gunzip -c deploy/backups/<file>.sql.gz | docker compose -f deploy/compose.yml exec -T postgres psql -U waafa waafa`.

## 5. Launch checks (in this order)

1. `https://<domain>` loads over HTTPS; `/robots.txt` and `/sitemap.xml` show the real domain.
2. Admin: `https://<domain>/secure-admin-control` (`/admin` is a 404 on purpose) → sign in with the seed Super Admin
   → My account → change the password. Then remove `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `deploy/.env`.
3. Users and roles: add each staff member with their role.
4. Send a flight request from the site → it appears in Admin › Leads within seconds → the staff alert email arrives
   → the customer email arrives (if an email was given). Admin › Notifications shows each email's status.
5. Place a cash-on-delivery order → Admin › Orders → confirm → the order email arrives.
6. Admin › Content › FAQs: change an answer → reload `/faqs` → the new answer shows.
7. Feedback form → Admin › Feedback → approve → the wall shows it.
8. Turnstile (if set): the forms submit normally (the widget appears only if Cloudflare asks).
9. Replace every Sample record (contact numbers, office hours, payment accounts, packages, products, prices) in Admin
   › Content before announcing the site; Admin › Content › Maintenance mode can hold the public site meanwhile.

## 6. Operations

| Task | Command (from `/opt/waafa`) |
| --- | --- |
| Status | `docker compose -f deploy/compose.yml ps` |
| Logs | `docker compose -f deploy/compose.yml logs -f --tail 100 api` (or `web`, `worker`, `nginx`, `certbot`) |
| Memory | `docker stats --no-stream` |
| Restart one service | `docker compose -f deploy/compose.yml restart web` |
| Database shell | `docker compose -f deploy/compose.yml exec postgres psql -U waafa waafa` |

## 7. Rollback

```bash
cd /opt/waafa && git log --oneline -5        # pick the last good commit
git checkout <commit> && sh deploy/deploy.sh  # back on main later: git checkout main && git pull
```

Migrations only add tables and columns, so the previous API keeps working on the newer database. Content: every admin
save is in Admin › Audit log with its before and after values.

## Local development

See the README: the site runs on the Sample fixtures without any variables; set `WAAFA_API_URL` and
`WAAFA_INTAKE_KEY` (and `REVALIDATE_SECRET`) in `apps/web/.env.local` to run it on a local API. The root
`docker-compose.yml` starts PostgreSQL, Redis and Mailpit for local API work only.

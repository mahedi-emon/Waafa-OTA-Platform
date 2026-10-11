# WAAFA deploy runbook (launch 13 Oct 2026)

Everything runs on one VPS (2 vCPU, 4 GB RAM, Docker) with Docker Compose: `deploy/compose.yml`.

| Service | Image | Public | Memory cap |
| --- | --- | --- | --- |
| `caddy` | `caddy:2` | 80 and 443, automatic HTTPS | 160 MB |
| `web` | `apps/web/Dockerfile` (Next.js standalone) | through Caddy only | 768 MB |
| `api` | `apps/api/Dockerfile` (runs migrations and the idempotent seed, then starts) | no (127.0.0.1:4000 for the web build) | 640 MB |
| `worker` | same image as the API, command `tsx src/worker.ts` | no | 384 MB |
| `postgres` | `postgres:16`, volume `pgdata` | no | 640 MB |
| `redis` | `redis:7`, append-only, `noeviction` (BullMQ) | no | 160 MB |

Outside the server: an email sender (Resend, or any SMTP server), Cloudflare Turnstile (optional at launch) and the
domain's DNS.

## 0. Owner checklist

1. VPS: SSH access for the developer (a user with `sudo` and in the `docker` group), Ubuntu 22.04/24.04 or Debian 12.
2. Domain: A records for the apex and `www` pointing at the VPS IP (and AAAA if the VPS has IPv6).
3. Email: a Resend account with the domain verified (SPF, DKIM, DMARC records at the DNS host), or SMTP details.
4. Turnstile (optional): a Cloudflare Turnstile site for the domain (managed widget): site key and secret.
5. The first Super Admin's email and a strong password (12+ characters); change it after the first sign-in.

## 1. Prepare the server (once)

```bash
# Swap: the web build needs about 2 GB on top of the running stack.
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Firewall: SSH, HTTP, HTTPS only.
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp && sudo ufw enable

# Docker Engine with the Compose plugin (skip if `docker compose version` already works).
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker "$USER"   # then log out and in

# The code.
sudo mkdir -p /opt/waafa && sudo chown "$USER" /opt/waafa
git clone https://github.com/mahedi-emon/Waafa-OTA-Platform.git /opt/waafa
```

Docker publishes ports past `ufw`; the compose file only publishes 80/443 (Caddy) and `127.0.0.1:4000` (local only),
so nothing else is reachable from outside.

## 2. Settings

```bash
cd /opt/waafa
cp deploy/.env.example deploy/.env && chmod 600 deploy/.env && nano deploy/.env
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
the worker, the web and Caddy. The first run takes 10 to 15 minutes; later runs reuse the dependency layers.

Check: `docker compose -f deploy/compose.yml ps` shows every service running (`api` healthy), and
`curl -s http://127.0.0.1:4000/ready` answers `{"status":"ready","database":"up"}`. Caddy fetches the HTTPS
certificates on the first visit once DNS points at the server.

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
2. Admin: `https://<domain>/admin` → sign in with the seed Super Admin → My account → change the password. Then remove
   `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `deploy/.env`.
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
| Logs | `docker compose -f deploy/compose.yml logs -f --tail 100 api` (or `web`, `worker`, `caddy`) |
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

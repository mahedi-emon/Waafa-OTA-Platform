# WAAFA deploy runbook (live since 13 Oct 2026)

Everything runs on one VPS (2 vCPU, 4 GB RAM, Docker) with Docker Compose: `deploy/compose.yml`.

| Service | Image | Public | Memory cap |
| --- | --- | --- | --- |
| `nginx` | `deploy/nginx` (nginx 1.27): reverse proxy, HTTPS, www → apex, rate limit on form posts | 80 and 443 | 96 MB |
| `certbot` | `certbot/certbot`: gets and renews the Let's Encrypt certificate | no | 128 MB |
| `web` | `apps/web/Dockerfile` (Next.js standalone) | through nginx only | 1 GB |
| `api` | `apps/api/Dockerfile` (compiled JavaScript only; runs migrations and the idempotent seed, then starts; volumes `mediadata` and `privatedata`) | no (127.0.0.1:4000 for the web build) | 640 MB |
| `worker` | same image as the API, command `node dist/worker.js` | no | 384 MB |
| `postgres` | `postgres:16`, volume `pgdata` | no | 640 MB |
| `redis` | `redis:7`, append-only, `noeviction` (BullMQ) | no | 160 MB |

### Server to buy

| | Minimum (launch) | Recommended (room to grow) |
| --- | --- | --- |
| CPU | 2 vCPU, x86_64 (Intel or AMD) | 4 vCPU, x86_64 |
| Memory | 4 GB (+ 4 GB swap file) | 8 GB |
| Disk | 60 GB NVMe SSD | 100 GB NVMe SSD |
| Traffic | 2 TB a month | 4 TB a month |
| System | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| Region | Singapore (or Mumbai): the shortest round trip to Dhaka | same |

The containers are capped at about 2.8 GB together (table above), PostgreSQL included. The images are built on GitHub
for x86_64 only: an ARM server (Ampere, Graviton, Hetzner CAX) would need `--build`. Turn on the provider's weekly
snapshot backups as a second copy.

Outside the server: an email sender (Resend, or any SMTP server), Cloudflare Turnstile (optional at launch) and the
domain's DNS.

## Quick start: image-only deploy (no source code on the server, about 30 minutes)

The server never gets the source code (the GitHub repository can stay private). GitHub Actions builds the api, web
and nginx images on every push to `main` and pushes them to Docker Hub (`emon6107/waafa-ota-platform`); the server
only pulls them. Everything the server needs is the folder `deploy/server` (issue 164):

| File | What it does |
| --- | --- |
| `compose.yml` | The stack from images only: PostgreSQL, Redis, API, worker, web, nginx (HTTPS), certbot |
| `deploy.sh` | Pulls the images, starts everything in order, refreshes the web caches, gets the Let's Encrypt certificate |
| `setup-server.sh` | Once on a fresh Ubuntu: updates, Asia/Dhaka, 4 GB swap, firewall 22/80/443, Docker with log rotation |
| `backup.sh` | Daily database and photo backup, 14 kept |
| `revalidate.mjs` | Used by deploy.sh to refresh the site's caches |
| `.env` | The production settings (only on the owner's PC and the server; gitignored, never in git or chat) |

nginx is part of the stack (the `nginx` image: reverse proxy, HTTPS, www → apex redirect, gzip, caching, security
headers, rate limits on form posts). Nothing to install or configure by hand; `setup-server.sh` stops a host nginx or
Apache so ports 80 and 443 are free.

**0. DNS first:** A records `waafasworld.com` → `SERVER_IP` and `www.waafasworld.com` → `SERVER_IP` (remove old A
and AAAA records for both).

**1. On your PC (PowerShell, in the project folder):** pack the bundle with its `.env` and copy it up.

```powershell
cd H:\Waafa-OTA-Platform
tar -czf waafa-server.tgz -C deploy/server .
scp waafa-server.tgz root@SERVER_IP:/root/
```

**2. On the server:**

```bash
ssh root@SERVER_IP
mkdir -p /opt/waafa && tar -xzf /root/waafa-server.tgz -C /opt/waafa && rm /root/waafa-server.tgz
sh /opt/waafa/setup-server.sh root          # once: updates, swap, firewall, Docker (use your sudo user instead of root if you have one)
cd /opt/waafa
# Only if the Docker Hub repository is private: docker login -u emon6107   (password = a Docker Hub access token, read-only)
sh deploy.sh                                # pull, start, refresh, HTTPS
(crontab -l 2>/dev/null; echo "15 3 * * * cd /opt/waafa && sh backup.sh >> backups/backup.log 2>&1") | crontab -
```

**Every later release** (after a merge to `main` and a green "Docker images" run): `cd /opt/waafa && sh deploy.sh`.
Roll back: `IMAGE_TAG=<7-character sha> sh deploy.sh`. When `deploy/server` itself changes (rare), copy the bundle
again (step 1; the server's `.env` stays unless you overwrite it).

**Everyday commands (in /opt/waafa):**

```bash
docker compose ps                                   # every service and its health
docker compose logs -f --tail=100 api web nginx     # live logs
docker compose restart web                          # restart one service
free -h && docker stats --no-stream                 # memory
sh backup.sh                                        # a backup now
```

Then open `https://waafasworld.com/secure-admin-control`, sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`,
change the password, delete both lines from `/opt/waafa/.env`, and follow the launch checks in step 5.

### Private repositories

- GitHub: the repository is private. Actions minutes are counted against the monthly allowance (about 2,000 on the
  free plan); CLAUDE.md "CI budget" keeps a normal pull request at 15 minutes or less. The server needs no GitHub
  access.
- **Docker Hub: make the repository private, in this order** (otherwise the next deploy cannot pull). Since issue 231
  the API image holds compiled JavaScript only, but the images are still the business's code and settings shape:
  1. Docker Hub → Account settings → Personal access tokens → Generate new token, access **Read-only**, name
     `waafa-server`. Copy it (it is shown once).
  2. On the server: `docker login -u emon6107` and paste the token as the password. Check: `cd /opt/waafa && sh deploy.sh`
     still pulls.
  3. Docker Hub → Repositories → `waafa-ota-platform` → Settings → Visibility → **Make private**.
  4. Run `sh deploy.sh` once more to confirm the pull works with the repository private.
- **The GitHub secret `DOCKERHUB_TOKEN`** (used by the "Docker images" workflow) needs **Read, Write and Delete**
  access: the workflow keeps the newest 15 releases on Docker Hub and deletes older `api-`, `web-` and `nginx-<sha>`
  tags (`scripts/dockerhub-cleanup.mjs`). With a read-write token the clean-up only warns. Rolling back works to any of
  the 15 kept releases: `IMAGE_TAG=<7-character sha> sh deploy.sh`.

### Bundle changes by release

| Release | What changed in `deploy/server` | What to do |
| --- | --- | --- |
| Issue 232 (Oct 2026) | `compose.yml`: a `privatedata` volume for customer files (visa documents, payment slips) and `PRIVATE_FILES_DIR`; `backup.sh` also keeps `waafa-<time>.private.tar.gz` (readable by the server owner only) | **Copy the bundle before this deploy** (step 1), then `sh backup.sh` (migration) and `sh deploy.sh`. With the old bundle the site works, but file uploads pause and the forms send only file names |
| Issue 231 (Oct 2026) | `compose.yml`: the worker runs `node dist/worker.js` (the image no longer has TypeScript or tsx) | Copy the bundle again (step 1) when convenient. Until then the old `tsx src/worker.ts` command still works through a stand-in inside the image, kept for one more release |

### Deploy from a clone (the earlier way)

A server with the repository cloned to /opt/waafa still works: `sh deploy/check.sh` and `sh deploy/deploy.sh` with
`deploy/.env`, every release `git pull && sh deploy/deploy.sh`.

## 0. Owner checklist

1. VPS: SSH access for the developer (a user with `sudo` and in the `docker` group), Ubuntu 22.04/24.04 or Debian 12.
2. Domain: A records for the apex and `www` pointing at the VPS IP (and AAAA if the VPS has IPv6), plus an email
   for Let's Encrypt certificate notices (`ACME_EMAIL`).
3. Email: a Resend account with the domain verified (SPF, DKIM, DMARC records at the DNS host), or SMTP details.
4. Turnstile (optional): a Cloudflare Turnstile site for the domain (managed widget): site key and secret.
5. The first Super Admin's email and a strong password (12+ characters); change it after the first sign-in.

## 1. Prepare the server (once)

```bash
# Swap: a safety margin for the running stack (and about 2 GB more if the web is ever built here with --build).
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

Email (#107, #149): Resend sends the mail; the domain `waafasworld.com` is verified there (SPF, DKIM). The API needs `RESEND_API_KEY` or `SMTP_URL` in `deploy/.env` to start. Once an email
provider (Resend or SMTP) is saved and turned on in Admin › Settings › Integrations › SMS and email, the API and the
worker send through it (checked every minute) and the `.env` mailer becomes the fallback. Flight, hotel, payment and SMS
providers are managed in the same screen; turning a flight or hotel API on never switches booking to Live.

## 3. Deploy

```bash
cd /opt/waafa && git pull && sh deploy/deploy.sh
```

Images come from Docker Hub (issue 130): every push to `main` runs the GitHub Actions workflow **Docker images**
(`.github/workflows/docker.yml`). It builds the API, web and nginx images, starts them in the runner behind nginx,
checks the main routes, checks that no secret is inside any image, then pushes `emon6107/waafa-ota-platform:api-<sha>`,
`:web-<sha>`, `:nginx-<sha>` and the `-latest` tags. With `IMAGE_REPO` set in `deploy/.env` (the default from
`init-env.sh`), the script on the server:

1. pulls the three images (`IMAGE_TAG`, default `latest`) and checks the web image was built for this `SITE_URL` and
   for the same Turnstile site key as the server's secret;
2. starts PostgreSQL, Redis and the API (migrations and the idempotent seed run on start) and waits until `/ready`
   answers;
3. starts the worker, the web, nginx and certbot, and clears the nginx cache;
4. once the web is healthy, sends a signed revalidation (`deploy/server/revalidate.mjs` inside the API container), so the
   pages prerendered at build time render again from this server's database;
5. with `ACME_EMAIL` set, gets the Let's Encrypt certificate and switches nginx to HTTPS (DNS must already point at the
   server).

A deploy takes 2 to 4 minutes (the first pull about 1 GB). `sh deploy/deploy.sh --build` (or an empty `IMAGE_REPO`)
builds the images on the server instead, as before: it needs about 2 GB more memory and 10 to 15 minutes.

GitHub settings the workflow uses: secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (set); repository variables
`SITE_URL` (default `https://waafasworld.com`) and `TURNSTILE_SITE_KEY` (empty until Turnstile is set up). The site
address and the Turnstile site key are built into the web pages, so after changing either variable run the workflow
again (Actions › Docker images › Run workflow) before deploying. The images are public and hold no secret: every
secret reaches the containers from `deploy/.env` at start.

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

Uploaded photos (Admin › Media library, #109) live on the `mediadata` volume and are archived by the same script as
`waafa-<stamp>.media.tar.gz` (last 14 kept). Restore:
`docker compose -f deploy/compose.yml exec -T api tar -xzf - -C /data/media < deploy/backups/<file>.media.tar.gz`.
nginx serves them at `/uploads/` straight from the API with a one-year cache; admin uploads up to 12 MB are allowed on
`/secure-admin-control/media/upload` only (every other request keeps the 2 MB limit).

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

## 5b. Google sign-in (issues 134 and 149)

Customers sign in with Google to see their requests and orders. Settings › Accounts live is on by default (issue
146), so the header shows Log in; until Google keys are set, /login says sign-in opens soon.

1. Google Cloud console → Google Auth Platform → Branding: app name WAAFA, support email, home page
   `https://waafasworld.com`, authorised domain `waafasworld.com`. Data access: scopes `openid`, `email`,
   `profile` only. Audience: **Publish app** (while it says Testing, only the listed test users can sign in).
2. Clients → the web client: authorised JavaScript origins `https://waafasworld.com` (and `http://localhost` for the
   local stack); authorised redirect URIs `https://waafasworld.com/api/auth/google/callback` (and
   `http://localhost/api/auth/google/callback`). Admin › Settings › Integrations › Sign-in shows the exact address.
3. Keys, either way:
   - Server: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `deploy/.env`, then `sh deploy/deploy.sh`. Used while
     Admin has no Google record.
   - Admin › Settings › Integrations › Sign-in → Google sign-in → Connect: paste both, Save, Test connection, switch
     Active on. A saved record always wins over the server keys; switching it off turns Google off.
4. Admin › Content › Site settings → Accounts live hides or shows Log in for everyone.

Signed-in customers keep their session until it expires (30 days) or they log out. Deleting an account never deletes
the customer's requests or orders.

## 6. Operations

| Task | Command (from `/opt/waafa`) |
| --- | --- |
| Status | `docker compose -f deploy/compose.yml ps` |
| Logs | `docker compose -f deploy/compose.yml logs -f --tail 100 api` (or `web`, `worker`, `nginx`, `certbot`) |
| Memory | `docker stats --no-stream` |
| Restart one service | `docker compose -f deploy/compose.yml restart web` |
| Database shell | `docker compose -f deploy/compose.yml exec postgres psql -U waafa waafa` |
| Clear the nginx cache (`deploy.sh` does this on every deploy; by hand only if a file changed outside a deploy; it refills on demand) | `docker compose -f deploy/compose.yml exec nginx sh -c 'rm -rf /var/cache/nginx/waafa/*'` |

## 7. Rollback

Images are tagged with the commit's 7-character sha (Docker Hub › Tags, or `git log --oneline -5`):

```bash
cd /opt/waafa
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=<sha>/' deploy/.env && sh deploy/deploy.sh   # back to the newest: IMAGE_TAG=latest
```

Built on the server instead: `git checkout <commit> && sh deploy/deploy.sh --build` (back on main later:
`git checkout main && git pull`).

Migrations only add tables and columns, so the previous API keeps working on the newer database. Content: every admin
save is in Admin › Audit log with its before and after values.

## Local development

See the README: the site runs on the Sample fixtures without any variables; set `WAAFA_API_URL` and
`WAAFA_INTAKE_KEY` (and `REVALIDATE_SECRET`) in `apps/web/.env.local` to run it on a local API. The root
`docker-compose.yml` starts PostgreSQL, Redis and Mailpit for local API work only.

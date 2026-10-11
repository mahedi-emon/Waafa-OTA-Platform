#!/bin/sh
# Preflight for the WAAFA VPS (docs/DEPLOY.md): run from the repository root before `sh deploy/deploy.sh`.
#   sh deploy/check.sh
# Checks Docker and Compose, memory and swap, free ports, the settings in deploy/.env and that the domain points at
# this server. Prints OK / FIX lines and exits non-zero when something must be fixed first. Never prints secrets.
set -u

fail=0
ok() { echo "OK   $1"; }
fix() {
  echo "FIX  $1"
  fail=1
}
setting() { sed -n "s/^$1=//p" deploy/.env 2>/dev/null | tr -d '\r' | head -n 1; }

# Docker and Compose
if docker version > /dev/null 2>&1; then ok "Docker is running"; else fix "Docker is not installed or not running (curl -fsSL https://get.docker.com | sudo sh)"; fi
if docker compose version > /dev/null 2>&1; then ok "Docker Compose plugin present"; else fix "Docker Compose plugin missing (install docker-compose-plugin)"; fi
if docker ps > /dev/null 2>&1; then ok "This user can run Docker"; else fix "Add this user to the docker group: sudo usermod -aG docker \$USER, then log out and in"; fi

# Memory: the web build needs about 2 GB on top of the running stack.
mem=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
swap=$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
if [ "$((mem + swap))" -ge 5500 ]; then ok "Memory ${mem} MB + swap ${swap} MB"; else fix "Memory ${mem} MB + swap ${swap} MB: add a 4 GB swap file (docs/DEPLOY.md step 1)"; fi

# Disk: images and the database need room.
free_gb=$(df -Pk . | awk 'NR==2 {print int($4/1048576)}')
if [ "${free_gb:-0}" -ge 10 ]; then ok "Free disk ${free_gb} GB"; else fix "Only ${free_gb} GB free disk; keep at least 10 GB"; fi

# Ports 80 and 443 must be free for nginx (or already ours).
for port in 80 443; do
  if command -v ss > /dev/null 2>&1 && ss -ltn "sport = :$port" 2>/dev/null | grep -q LISTEN; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q waafa-nginx; then ok "Port $port served by waafa nginx"; else fix "Port $port is used by another program (stop it, e.g. sudo systemctl stop apache2 nginx)"; fi
  else
    ok "Port $port free"
  fi
done

# Settings
if [ ! -f deploy/.env ]; then
  fix "deploy/.env missing: run sh deploy/init-env.sh <domain> <email>"
else
  for name in SITE_URL SITE_DOMAIN ACME_EMAIL POSTGRES_PASSWORD JWT_SECRET REVALIDATE_SECRET INTAKE_KEY PROVIDER_SECRET_KEY MAIL_FROM STAFF_ALERT_EMAIL; do
    if [ -n "$(setting "$name")" ]; then ok "$name set"; else fix "$name is empty in deploy/.env"; fi
  done
  if [ -n "$(setting RESEND_API_KEY)" ] || [ -n "$(setting SMTP_URL)" ]; then ok "Email sender set"; else fix "Set RESEND_API_KEY or SMTP_URL in deploy/.env"; fi
  site_key=$(setting TURNSTILE_SITE_KEY)
  site_secret=$(setting TURNSTILE_SECRET_KEY)
  if { [ -n "$site_key" ] && [ -z "$site_secret" ]; } || { [ -z "$site_key" ] && [ -n "$site_secret" ]; }; then
    fix "Turnstile: set both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY, or neither"
  else
    ok "Turnstile keys consistent"
  fi
  if ! docker volume ls --format '{{.Name}}' 2>/dev/null | grep -q waafa_pgdata; then
    if [ -n "$(setting SEED_ADMIN_EMAIL)" ] && [ "$(setting SEED_ADMIN_PASSWORD | wc -c)" -gt 12 ]; then ok "First Super Admin set (12+ characters)"; else fix "First start: set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of 12+ characters"; fi
  fi

  # DNS: the domain and www must point at this server.
  domain=$(setting SITE_DOMAIN)
  here=$(curl -fsS -4 --max-time 5 https://api.ipify.org 2>/dev/null || true)
  for name in "$domain" "www.$domain"; do
    there=$(getent ahostsv4 "$name" 2>/dev/null | awk 'NR==1 {print $1}')
    if [ -z "$there" ]; then
      fix "$name does not resolve yet (add an A record to ${here:-this server's IP})"
    elif [ -n "$here" ] && [ "$there" != "$here" ]; then
      fix "$name points at $there, this server is $here"
    else
      ok "$name points at this server"
    fi
  done
fi

if [ "$fail" -eq 0 ]; then
  echo "All checks passed: run sh deploy/deploy.sh"
else
  echo "Fix the lines marked FIX, then run this check again."
fi
exit "$fail"

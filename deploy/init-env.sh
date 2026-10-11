#!/bin/sh
# Creates deploy/.env from deploy/.env.example with fresh random secrets (docs/DEPLOY.md step 2). Run once on the
# server from the repository root:
#   sh deploy/init-env.sh waafasworld.com you@example.com
# Arguments: the domain and the email for Let's Encrypt notices. Afterwards open deploy/.env and fill in the email
# sender, staff inbox and the first Super Admin. It never overwrites an existing deploy/.env and never prints secrets.
set -eu

if [ -f deploy/.env ]; then
  echo "deploy/.env already exists; nothing changed." >&2
  exit 1
fi
if [ $# -lt 2 ]; then
  echo "Usage: sh deploy/init-env.sh <domain> <email for Let's Encrypt>" >&2
  exit 1
fi
DOMAIN=$1
EMAIL=$2

# 48 letters and digits from the kernel's random source.
secret() { tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 48; }

umask 077
sed \
  -e "s|^SITE_URL=.*|SITE_URL=https://$DOMAIN|" \
  -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=$DOMAIN|" \
  -e "s|^ACME_EMAIL=.*|ACME_EMAIL=$EMAIL|" \
  -e "s|^MAIL_FROM=.*|MAIL_FROM=Waafa <no-reply@$DOMAIN>|" \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(secret)|" \
  -e "s|^JWT_SECRET=.*|JWT_SECRET=$(secret)|" \
  -e "s|^REVALIDATE_SECRET=.*|REVALIDATE_SECRET=$(secret)|" \
  -e "s|^INTAKE_KEY=.*|INTAKE_KEY=$(secret)|" \
  -e "s|^PROVIDER_SECRET_KEY=.*|PROVIDER_SECRET_KEY=$(secret)|" \
  deploy/.env.example > deploy/.env
chmod 600 deploy/.env

echo "deploy/.env created (readable by you only) with new secrets for $DOMAIN."
echo "Now fill in: RESEND_API_KEY or SMTP_URL, STAFF_ALERT_EMAIL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD"
echo "(optional: TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY), then run: sh deploy/check.sh"

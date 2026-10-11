#!/bin/sh
# Picks the site config before the nginx image renders its templates: HTTPS once the certificate exists, HTTP before.
set -eu
if [ -f "/etc/letsencrypt/live/${SITE_DOMAIN}/fullchain.pem" ]; then
  mode=https
else
  mode=http
fi
cp "/etc/nginx/waafa/site-${mode}.conf.template" /etc/nginx/templates/default.conf.template
echo "waafa: serving ${SITE_DOMAIN} over ${mode}"

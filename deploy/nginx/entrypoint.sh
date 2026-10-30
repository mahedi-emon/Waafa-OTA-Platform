#!/bin/sh
# Starts the site's nginx (issue 332): HTTPS once the Let's Encrypt certificate exists, HTTP before. Only SITE_DOMAIN is
# filled into the template; nginx's own $variables stay as they are.
set -eu
case "${SITE_DOMAIN:-}" in
  "" | *[!A-Za-z0-9.-]*)
    echo "waafa: SITE_DOMAIN must be a host name such as example.com (got '${SITE_DOMAIN:-}')" >&2
    exit 1
    ;;
esac
if [ -f "/etc/letsencrypt/live/${SITE_DOMAIN}/fullchain.pem" ]; then
  mode=https
else
  mode=http
fi
sed "s/\${SITE_DOMAIN}/${SITE_DOMAIN}/g" "/etc/nginx/waafa/site-${mode}.conf.template" > /etc/nginx/http.d/site.conf
# The cache volume may hold files from the earlier image, whose nginx user had another id.
mkdir -p /var/cache/nginx/waafa
chown -R nginx:nginx /var/cache/nginx
echo "waafa: serving ${SITE_DOMAIN} over ${mode}"
# Reloads every 6 hours so a certificate renewed by the certbot service is picked up without downtime.
(while :; do sleep 21600; nginx -s reload; done) &
exec nginx -g 'daemon off;'

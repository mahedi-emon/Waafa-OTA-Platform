# WAAFA reverse proxy (deploy/compose.yml): nginx in front of the web, HTTPS from Let's Encrypt (certbot service).
# Until a certificate exists the HTTP-only site is served (ACME challenge + the site); after it, HTTPS with redirects.
FROM nginx:1.27-alpine
COPY site-http.conf.template site-https.conf.template /etc/nginx/waafa/
COPY 15-waafa-site.sh 40-waafa-reload.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/15-waafa-site.sh /docker-entrypoint.d/40-waafa-reload.sh \
  && rm -f /etc/nginx/conf.d/default.conf \
  && mkdir -p /etc/nginx/templates /var/www/certbot
# Only SITE_DOMAIN is substituted into the templates; nginx's own $variables stay as they are.
ENV NGINX_ENVSUBST_FILTER=^SITE_DOMAIN$

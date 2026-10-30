# WAAFA reverse proxy (deploy/compose.yml): nginx in front of the web, HTTPS from Let's Encrypt (certbot service).
# Until a certificate exists the HTTP-only site is served (ACME challenge + the site); after it, HTTPS with redirects.
# Alpine's nginx with the Brotli module (issue 332): text goes out as Brotli where the browser accepts it, gzip
# otherwise, and the image is about 10 MB of OS instead of the official image's 93 MB.
FROM alpine:3.22
# The commit this image was built from (issue 303).
ARG REVISION=unknown
LABEL org.opencontainers.image.revision="$REVISION"
RUN apk add --no-cache nginx nginx-mod-http-brotli \
  && rm -f /etc/nginx/http.d/default.conf \
  && mkdir -p /etc/nginx/waafa /var/www/certbot /var/cache/nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY site-http.conf.template site-https.conf.template /etc/nginx/waafa/
COPY entrypoint.sh /usr/local/bin/waafa-nginx
RUN chmod +x /usr/local/bin/waafa-nginx
EXPOSE 80 443 443/udp
# Graceful stop: workers finish the requests in flight.
STOPSIGNAL SIGQUIT
ENTRYPOINT ["/usr/local/bin/waafa-nginx"]

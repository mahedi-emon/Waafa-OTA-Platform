#!/bin/sh
# Reloads nginx every 6 hours so a certificate renewed by the certbot service is picked up without downtime.
(while :; do sleep 21600; nginx -s reload; done) &

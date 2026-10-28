# WAAFA web image (C3, deploy/compose.yml). Build from the repository root:
#   docker build -f apps/web/Dockerfile --network host \
#     --build-arg WAAFA_API_URL=http://127.0.0.1:4000 --build-arg WAAFA_INTAKE_KEY=... \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://example.com -t waafa-web .
# The build prerenders pages from the API snapshot, so the API must answer at WAAFA_API_URL during the build
# (deploy/deploy.sh starts it first). The runtime image holds only the standalone server, no build arguments.
# Alpine on both stages (issue 303): the runtime is Alpine with just the node binary, so the image is the traced server,
# its static files and public media on about 10 MB of OS; the musl builds of sharp and SWC come from the lockfile.
FROM node:22-alpine3.22 AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 HUSKY=0 NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# The root prepare script; it skips the git hooks when HUSKY=0.
COPY .husky/install.mjs .husky/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY fixtures/package.json fixtures/
RUN pnpm install --frozen-lockfile --filter "@waafa/web..."

COPY packages/shared packages/shared
COPY packages/config packages/config
COPY fixtures fixtures
COPY apps/web apps/web

ARG NEXT_PUBLIC_SITE_URL
ARG WAAFA_API_URL
ARG WAAFA_INTAKE_KEY
ENV NODE_ENV=production NEXT_OUTPUT=standalone REQUIRE_SITE_URL=1 \
  NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
  NODE_OPTIONS=--max-old-space-size=2048
RUN WAAFA_API_URL=$WAAFA_API_URL WAAFA_INTAKE_KEY=$WAAFA_INTAKE_KEY pnpm --filter @waafa/web build

# Runtime: the traced standalone server plus the static files and public media it serves. Same Alpine release as
# the build stage, so the node binary and sharp find the same musl and libstdc++.
FROM alpine:3.22 AS app
RUN apk add --no-cache libstdc++ libgcc \
  && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node
COPY --from=build /usr/local/bin/node /usr/local/bin/node
# The address is public and baked into the pages; deploy.sh reads it to refuse an image built for another domain
# (issue 130). Turnstile keys come from Admin › Integrations at run time (issue 284).
ARG NEXT_PUBLIC_SITE_URL
ARG RELEASE=development
ARG REVISION=unknown
LABEL org.waafa.site-url="$NEXT_PUBLIC_SITE_URL" org.opencontainers.image.revision="$REVISION" \
  org.opencontainers.image.version="$RELEASE"
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]

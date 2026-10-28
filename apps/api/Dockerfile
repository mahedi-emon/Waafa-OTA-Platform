# WAAFA API image (B1, C3, issues 231 and 303). Build from the repository root:
#   docker build -f apps/api/Dockerfile -t waafa-api .
# The same image runs the API (default command) and the job worker (command: node dist/worker.js).
# Two stages: the first installs everything, compiles the API, its npm dependencies and the Prisma client into
# dist/ (scripts/build.mjs) and copies the few packages that must stay on disk (scripts/collect-runtime.mjs). The
# second is Alpine with only the node binary, dist/, those packages, the migrations and the PDF fonts: no
# TypeScript, no tests, no package manager, no Prisma CLI (dist/migrate.js applies migrations, D313).

FROM node:22-alpine3.22 AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 HUSKY=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
# Manifests first so dependency layers cache between builds.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# The root prepare script; it skips the git hooks when HUSKY=0.
COPY .husky/install.mjs .husky/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY fixtures/package.json fixtures/
RUN pnpm install --frozen-lockfile --filter "@waafa/api..."
COPY packages/shared packages/shared
COPY packages/config packages/config
COPY fixtures fixtures
COPY apps/api apps/api
RUN pnpm --filter @waafa/api generate \
  && node apps/api/scripts/build.mjs \
  && node apps/api/scripts/collect-runtime.mjs /runtime

# Same Alpine release as the build stage, so the node binary and the musl builds of sharp and argon2 find the same
# musl and libstdc++. The web image starts the same way.
FROM alpine:3.22 AS app
RUN apk add --no-cache libstdc++ libgcc
COPY --from=build /usr/local/bin/node /usr/local/bin/node
# The media (#109) and private (#232) volumes take these folders' owner on first mount, so the API can write uploads.
RUN addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node \
  && mkdir -p /data/media /data/private && chown node:node /data/media /data/private \
  && chmod 700 /data/private
WORKDIR /app/apps/api
COPY --from=build /runtime/node_modules node_modules
COPY --from=build /app/apps/api/dist dist
COPY apps/api/prisma/migrations prisma/migrations
# Fonts and the logo for the quote PDF (issue 298).
COPY apps/api/assets assets
COPY --chmod=755 apps/api/scripts/tsx-compat.sh node_modules/.bin/tsx

# The release (image tag) on the Status page and in error reports (issue 238); the commit as a standard label.
ARG RELEASE=development
ARG REVISION=unknown
LABEL org.opencontainers.image.revision="$REVISION" org.opencontainers.image.version="$RELEASE"
ENV NODE_ENV=production PORT=4000 MEDIA_DIR=/data/media PRIVATE_FILES_DIR=/data/private WAAFA_RELEASE=$RELEASE \
  WAAFA_REVISION=$REVISION
EXPOSE 4000
USER node
# Migrations and the idempotent seed run before the API starts (NFR-OPS: migrations in the deploy pipeline).
CMD ["sh", "-c", "node dist/migrate.js && node dist/seed.js && exec node dist/main.js"]

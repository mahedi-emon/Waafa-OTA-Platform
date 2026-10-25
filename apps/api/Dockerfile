# WAAFA API image (B1, C3, issue 231). Build from the repository root:
#   docker build -f apps/api/Dockerfile -t waafa-api .
# The same image runs the API (default command) and the job worker (command: node dist/worker.js).
# Two stages: the first installs everything and compiles the API to JavaScript (scripts/build.mjs); the second holds
# only dist/, the production dependencies and the Prisma schema and migrations, so the published image carries no
# TypeScript source, no tests and no fixtures beyond what the compiled seed bundles.

FROM node:22-slim AS base
# COREPACK_HOME outside root's home so the non-root user runs the same pnpm without downloading it again.
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 HUSKY=0 COREPACK_HOME=/corepack COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Manifests first so dependency layers cache between builds.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# The root prepare script; it skips the git hooks when HUSKY=0.
COPY .husky/install.mjs .husky/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY fixtures/package.json fixtures/

FROM base AS build
RUN pnpm install --frozen-lockfile --filter "@waafa/api..."
COPY packages/shared packages/shared
COPY packages/config packages/config
COPY fixtures fixtures
COPY apps/api apps/api
RUN pnpm --filter @waafa/api generate && node apps/api/scripts/build.mjs

FROM base AS app
# Production dependencies of the API only (the workspace packages are bundled into dist/).
RUN pnpm install --frozen-lockfile --prod --filter "@waafa/api" && chmod -R a+rX /corepack
WORKDIR /app/apps/api
COPY --from=build /app/apps/api/dist dist
COPY apps/api/prisma/schema.prisma prisma/schema.prisma
COPY apps/api/prisma/migrations prisma/migrations
COPY apps/api/prisma.config.ts ./
COPY --chmod=755 apps/api/scripts/tsx-compat.sh node_modules/.bin/tsx

ENV NODE_ENV=production PORT=4000 MEDIA_DIR=/data/media PRIVATE_FILES_DIR=/data/private
# The media (#109) and private (#232) volumes take these folders' owner on first mount, so the API can write uploads.
RUN mkdir -p /data/media /data/private && chown node:node /data/media /data/private && chmod 700 /data/private
EXPOSE 4000
USER node
# Migrations and the idempotent seed run before the API starts (NFR-OPS: migrations in the deploy pipeline). The
# binaries run directly: `pnpm run` would first re-check node_modules, which the non-root user cannot write.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/seed.js && exec node dist/main.js"]

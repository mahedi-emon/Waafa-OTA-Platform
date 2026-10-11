# WAAFA API image (B1, C3). Build from the repository root:
#   docker build -f apps/api/Dockerfile -t waafa-api .
# The same image runs the API (default command) and the job worker (command: node_modules/.bin/tsx src/worker.ts).
FROM node:22-slim AS app
# COREPACK_HOME outside root's home so the non-root user runs the same pnpm without downloading it again.
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 HUSKY=0 COREPACK_HOME=/corepack COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install with the lockfile first so dependency layers cache between deploys.
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
RUN pnpm --filter @waafa/api generate && chmod -R a+rX /corepack

ENV NODE_ENV=production PORT=4000
# The media volume (#109) takes this folder's owner on first mount, so the API can write uploads.
RUN mkdir -p /data/media && chown node:node /data/media
EXPOSE 4000
USER node
WORKDIR /app/apps/api
# Migrations and the idempotent seed run before the API starts (NFR-OPS: migrations in the deploy pipeline). The
# binaries run directly: `pnpm run` would first re-check node_modules, which the non-root user cannot write.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node_modules/.bin/tsx prisma/seed.ts && exec node_modules/.bin/tsx src/main.ts"]

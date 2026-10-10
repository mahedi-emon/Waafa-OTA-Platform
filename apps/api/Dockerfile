# WAAFA API image (B1). Build from the repository root:
#   docker build -f apps/api/Dockerfile -t waafa-api .
# The same image runs the API (default command) and the job worker (command: pnpm --filter @waafa/api worker).
FROM node:22-slim AS app
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install with the lockfile first so dependency layers cache between deploys.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY fixtures/package.json fixtures/
RUN pnpm install --frozen-lockfile --filter "@waafa/api..."

COPY packages/shared packages/shared
COPY packages/config packages/config
COPY fixtures fixtures
COPY apps/api apps/api
RUN pnpm --filter @waafa/api generate

ENV NODE_ENV=production PORT=4000
EXPOSE 4000
USER node
# Migrations and the idempotent seed run before the API starts (NFR-OPS: migrations in the deploy pipeline).
CMD ["sh", "-c", "pnpm --filter @waafa/api migrate && pnpm --filter @waafa/api seed && pnpm --filter @waafa/api start"]

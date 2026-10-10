# WAAFA OTA Platform

One mobile-first website for two brands: **Waafa Tours and Travel** (flights, hotels, tour packages, visa) and
**Waafas World** by Waafa International (online store at `/shop`, Printing Solutions, International Trading),
plus the admin panel and the API. Go-live: 13 October 2026. Progress: [`docs/TRACKER.md`](docs/TRACKER.md).

## Requirements

- Node 22 LTS (CI) or newer (20.9 minimum); pnpm 12 (`packageManager` is pinned in `package.json`).
- Git hooks install automatically on `pnpm install` (husky): Conventional Commits, Prettier on staged files,
  repository guards, and an authorship check (no co-author or AI attribution).
- Optional: Python 3.12 for the UI UX Pro Max design scripts; Docker for the API (Phase B).

## Setup

```bash
pnpm install
pnpm --filter @waafa/web exec playwright install chromium   # browser for e2e
pnpm dev                                                     # http://localhost:3000
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server for the web app |
| `pnpm build` | Production build of every package (Turborepo) |
| `pnpm guards` | Repository rules: one stylesheet, no prototype imports, tokens only, compliance words, store name |
| `pnpm lint` · `pnpm typecheck` | ESLint and TypeScript |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright + axe tests against the production build |
| `pnpm format` · `pnpm format:check` | Prettier with Tailwind class sorting |

## API (apps/api)

NestJS on Fastify, PostgreSQL through Prisma 7, Redis + BullMQ. Copy `apps/api/.env.example` to `apps/api/.env`.

```bash
docker compose up -d                       # PostgreSQL 16, Redis 7, Mailpit (http://localhost:8025)
pnpm --filter @waafa/api migrate:dev       # apply migrations
pnpm --filter @waafa/api seed              # Sample content + first Super Admin (SEED_ADMIN_EMAIL / _PASSWORD)
pnpm --filter @waafa/api dev               # http://localhost:4000/health
pnpm --filter @waafa/api test              # Vitest against API_TEST_DATABASE_URL
```

**API without Docker** (machines short on memory): start a private PostgreSQL cluster with the installed binaries
and point `DATABASE_URL` at it; Redis is optional in development (jobs then run in-process).

```bash
initdb -D ../waafa-local/pgdata -U waafa --auth=trust -E UTF8
pg_ctl -D ../waafa-local/pgdata -o "-p 5433" -l ../waafa-local/pg.log start
createdb -h localhost -p 5433 -U waafa waafa && createdb -h localhost -p 5433 -U waafa waafa_test
# DATABASE_URL=postgresql://waafa@localhost:5433/waafa
```

The production image is `apps/api/Dockerfile` (built from the repository root); it runs migrations and the
idempotent seed, then starts the API. The same image runs the job worker with `pnpm --filter @waafa/api worker`.
Outside production the OpenAPI document is at `http://localhost:4000/api/v1/openapi.json`. The public endpoints
(`/api/v1/public/*`) answer only the web server, which sends the `x-intake-key` header.

**Web on the API** (Phase C): copy `apps/web/.env.example` to `apps/web/.env.local` and set `WAAFA_API_URL`
(for example http://localhost:4000), `WAAFA_INTAKE_KEY` (the API's INTAKE_KEY) and `REVALIDATE_SECRET` (the API's,
with the API's WEB_REVALIDATE_URL pointing at http://localhost:3000/api/revalidate). Without them the site runs on the
Sample fixtures.

## What is where

| Path | What |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Working rules for every session: corrections, stack, components, admin control, git, quality gates |
| `apps/web` | Next.js app: public site, Waafas World, admin |
| `apps/api` | NestJS API on Fastify (Phase B) |
| `packages/shared` | zod contracts, types and formatters shared by web and API |
| `packages/config` | TypeScript, ESLint and Prettier presets |
| `fixtures/` | Typed Sample data (every record `sample: true`) |
| `scripts/` | `guards.mjs` (repository rules), `check-attribution.mjs` (authorship) |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements: behaviour, scope, phases, compliance |
| [`docs/design/handoff/HANDOFF.md`](docs/design/handoff/HANDOFF.md) | Route → screens, components, motion, build order |
| [`docs/TRACKER.md`](docs/TRACKER.md) | Phase and issue status, matrices, decisions, owner actions, session log |
| [`docs/claude-code-prompts.md`](docs/claude-code-prompts.md) | The prompts that drive each build phase |
| `docs/design/` | `DESIGN.md`, `MOTION.md`, `COMPETITOR_BENCHMARK.md`, the prototype (`index.html`, `project/`), assets |
| [`docs/TOOLING.md`](docs/TOOLING.md) | MCP servers, skills and machine notes |

## See the design

- Open `docs/design/index.html` in a browser: every screen, offline. Phone screens open in a phone frame.
- Screen sources with exact copy, states and sample data: `docs/design/project/*.dc.html` (phone versions end in `-m`).
- The prototype's drawn scenes are stand-ins; the site uses real photos and video (credits in
  `docs/design/MEDIA_CREDITS.md`).

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

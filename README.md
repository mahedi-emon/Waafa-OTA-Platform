# WAAFA OTA Platform

One mobile-first website for two brands: **Waafa Tours and Travel** (flights, hotels, tour packages, visa) and
**Waafas World** by Waafa International (online store at `/shop`, Printing Solutions, International Trading),
plus the admin panel and the API. Go-live: 13 October 2026. Progress: `docs/TRACKER.md`.

## Quick start

Requirements: Node 22 LTS (20.9 or newer), pnpm 12 (`packageManager` is pinned in `package.json`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `pnpm build` | Production build of every package (Turborepo) |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | ESLint, TypeScript, Vitest |
| `pnpm e2e` | Playwright + axe smoke tests against the production build |
| `pnpm format` · `pnpm format:check` | Prettier with Tailwind class sorting |

## What is where

| Path | What |
| --- | --- |
| `CLAUDE.md` | Rules for every session (workflow, component rules, admin control, quality gates) |
| `apps/web` | Next.js app: public site, Waafas World, admin |
| `apps/api` | NestJS API on Fastify (Phase B) |
| `packages/shared` | zod contracts, types and formatters shared by web and API |
| `packages/config` | TypeScript, ESLint and Prettier presets |
| `fixtures/` | Typed Sample data (every record `sample: true`) |
| `docs/PRD.md` | Product requirements (source of truth) |
| `docs/TRACKER.md` | Phase and issue status, matrices, decisions, session log |
| `docs/design/` | `DESIGN.md`, `MOTION.md`, `COMPETITOR_BENCHMARK.md`, the prototype (`index.html`, `project/`), handoff and assets |
| `docs/TOOLING.md` | MCP servers, skills and machine notes |

## See the design
- Open `docs/design/index.html` in a browser: every screen, offline. Phone screens open in a phone frame.
- Screen sources with exact copy, states and sample data: `docs/design/project/*.dc.html` (phone versions end in `-m`).
- Real photos: `node docs/design/photos/get-waafa-photos.mjs` (credits in `docs/design/photos/CREDITS.txt`).

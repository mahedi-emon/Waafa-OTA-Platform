# WAAFA platform — overview
One mobile-first website for two brands: Waafa Tours and Travel (flights, hotels, tour packages, visa) and
Waafas World by Waafa International (store at /shop, Printing Solutions, International Trading), plus Admin and API.
Go-live 13 Oct 2026 (hard deadline before 14 Oct). Goal: beat gozayaan, sharetrip, akijair, obokash on design, motion, speed.

Sources of truth: docs/PRD.md (scope P0/P1/P2), docs/design/handoff/HANDOFF.md (route -> screens),
docs/design/handoff/tokens.css, docs/design/project/*.dc.html (`-m` = phone), docs/TRACKER.md (status), CLAUDE.md (rules).

## Structure (target, PRD §15)
- apps/web — Next.js 16.4 App Router (src/, alias @/* -> src/*), public site + /shop + /admin
- apps/api — NestJS (Fastify) + Prisma/PostgreSQL + Redis/BullMQ (Phase B)
- packages/shared — zod schemas + types shared by web and api; packages/config — tsconfig/eslint/prettier presets
- fixtures/ — typed Sample data (every record `sample: true`), used by web in Phase A and the API seed in Phase B
- docs/ — PRD, design prototype, handoff, TRACKER, DESIGN.md, MOTION.md, COMPETITOR_BENCHMARK.md, TOOLING.md

## Phases
A Frontend on fixtures (issues #1–#22) → B Backend → C Integration & launch → D P1 → E P2 live booking.
GitHub Project #4 tracks issues (Status: Ready = todo). See `mem:workflow`, `mem:progress`, `mem:decisions`.

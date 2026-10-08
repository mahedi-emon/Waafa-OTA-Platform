# WAAFA — instructions for Claude Code

One mobile-first website for two brands: **Waafa Tours and Travel** (flights, hotels, tour packages, visa)
and **Waafas World** by Waafa International (online store at `/shop`, Printing Solutions, International Trading),
plus the Admin panel. Go-live: 13 October 2026.

## Read first
1. `docs/PRD.md` — source of truth for behaviour, scope and phases (P0 / P1 / P2).
2. `docs/design/handoff/HANDOFF.md` — route → screens to match, components, motion, build order, rules.
3. `docs/design/handoff/tokens.css` — Tailwind v4 `@theme` tokens + shadcn/ui variables (copy into `app/globals.css`).
4. `docs/design/index.html` — open in a browser: every screen of the prototype, working offline.
   Screen sources with exact copy, states and sample data: `docs/design/project/*.dc.html` (phone versions end in `-m`).

## Stack
Next.js App Router · TypeScript strict · Tailwind CSS v4 · shadcn/ui (Radix) · lucide-react · Motion (LazyMotion) ·
Embla · React Hook Form + zod · TanStack Query · nuqs · next-intl. API: NestJS (Fastify) · PostgreSQL + Prisma · Redis + BullMQ.
Ask before adding a dependency the PRD does not list.

## How to work
- Build phone first (390 px, check 320 px), then 768 and 1440. Match the listed screens; use real components, never screenshots.
- shadcn/ui components go in `components/ui`; 21st.dev effects (table in HANDOFF.md) go in `components/fx`,
  installed with the owner's 21st.dev key and reviewed for keyboard use, reduced motion and bundle size.
- Sample data lives in `/fixtures` and is marked Sample. Live-mode (P2) screens run on fixtures only.
- Animate only transform and opacity; under `prefers-reduced-motion` movement becomes a 150 ms fade.
- Always use the Serena MCP tools for code navigation and edits (`get_symbols_overview`, `find_symbol`,
  `find_referencing_symbols`, symbol-level replace/insert) before falling back to plain file reads and grep.
  If Serena is disconnected, say so and fix it (see `docs/TOOLING.md`) rather than silently skipping it.
- For UI work, load the `ui-ux-pro-max` skill (`.claude/skills/ui-ux-pro-max`).

## Never
- Show trade licence numbers, owner details, ID numbers or fees anywhere (site, seed data, repository).

- Fake live availability: Manual-mode fares are indicative and confirmed by an expert before payment.
- Invent reviews or testimonials. Make passport/visa documents public. List restricted items in Waafas World.
- Recolour the logo, or put a second logo next to the "Waafas World" name (the WAAFA logo appears once, in the header).
- Use AI-generated, painted or drawn images on the live site: real photos only. The drawn scenes in the prototype are stand-ins;
  `docs/design/photos/get-waafa-photos.mjs` downloads the real Unsplash photos with credits.

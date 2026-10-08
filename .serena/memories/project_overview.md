# WAAFA platform — overview
One mobile-first website for two brands: Waafa Tours and Travel (flights, hotels, tour packages, visa) and
Waafas World by Waafa International (store at /shop, Printing Solutions, International Trading), plus Admin. Go-live 13 Oct 2026.

Source of truth: docs/PRD.md (scope P0/P1/P2), docs/design/handoff/HANDOFF.md (route -> screens, build order),
docs/design/handoff/tokens.css (Tailwind v4 @theme tokens), docs/design/project/*.dc.html (screens, `-m` = phone).
Rules: CLAUDE.md (never show licence numbers/owner details/fees; no Hajj/Umrah/manpower; no fake availability,
no invented reviews; real photos only; logo not recoloured).

## Structure
- apps/web — Next.js 16 App Router app (TypeScript strict, Tailwind v4, src/ dir, alias @/* -> src/*). Scaffolded 2026-10-09.
  - src/app — routes; layout.tsx wraps children in MotionProvider
  - src/components/motion — LazyMotion(domAnimation, strict) + MotionConfig(reducedMotion="user"); reduced-motion helpers
  - planned: src/components/ui (shadcn), src/components/fx (21st.dev effects), /fixtures (Sample data)
- docs/ — PRD, design prototype, handoff, web-interface-guidelines.md, design-md-format.md, TOOLING.md
- API planned: NestJS (Fastify) + PostgreSQL/Prisma + Redis/BullMQ (not created yet)

## Stack
Next.js, React 19, Tailwind v4, shadcn/ui (Radix), lucide-react, motion (import from "motion/react"; use `m.*` not `motion.*`),
Embla, React Hook Form + zod, TanStack Query, nuqs, next-intl. Ask before adding deps the PRD doesn't list.

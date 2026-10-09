# @waafa/web

The public site, Waafas World (`/shop`) and the admin (`/admin`) in one Next.js App Router app.
Rules live in the repo-root `CLAUDE.md`; design in `docs/design/DESIGN.md` and `docs/design/MOTION.md`.

## Commands (run from the repo root)

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm build` | Production build (Cache Components + Partial Prefetching) |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | ESLint, `next typegen` + `tsc`, Vitest |
| `pnpm e2e` | Builds, then runs Playwright + axe against `next start` on port 3100 |

## Layout

| Path | What |
| --- | --- |
| `src/app/[locale]/layout.tsx` | The only root layout: fonts, `<html lang>`, providers, skip link |
| `src/app/[locale]/(site)/` | Public pages; `src/app/[locale]/admin/` holds the admin (English URLs have no prefix) |
| `src/app/globals.css` | Tailwind v4 tokens and the shadcn theme: the only stylesheet |
| `src/i18n/` | next-intl routing (`en` now, `bn` ready), request config, locale-aware `Link` |
| `src/proxy.ts` | Locale resolution for page requests (Next.js 16 proxy) |
| `messages/en.json` | Every UI string |
| `src/components/ui` · `fx` · `motion` · `<feature>` | shadcn primitives · 21st.dev effects · MotionKit · feature components |
| `src/lib/` | Utilities (`cn`), data repositories (from issue #4) |
| `e2e/` | Playwright specs |

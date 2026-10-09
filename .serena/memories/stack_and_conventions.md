# Stack and conventions
- Web: Next.js latest stable (16.4 now, cacheComponents on), React 19, TypeScript strict, Tailwind v4 (tokens in
  src/app/globals.css), shadcn/ui (Radix) in src/components/ui, lucide-react, Motion via LazyMotion strict
  (import from "motion/react", use `m.div` never `motion.div`), Embla, RHF + zod, TanStack Query, nuqs, next-intl.
- API: NestJS on Fastify, PostgreSQL 16+ Prisma, Redis + BullMQ. Monorepo: pnpm workspaces + Turborepo.
- Pre-approved deps: PRD/HANDOFF list + vaul, cmdk, sonner, date-fns, recharts, @tanstack/react-table, dnd-kit,
  tiptap, react-dropzone, @axe-core/playwright, @lhci/cli, k6. Others: justify in PR + TRACKER Decisions.
- Components: one per file, PascalCase file + export, typed props, no `any`. shadcn files keep CLI names.
  21st.dev effects in components/fx; feature components in components/<feature>; page-only in app/**/_components.
- Styling: Tailwind utilities + tokens + cva only. No other CSS files/modules, no inline styles except dynamic values,
  never paste prototype HTML or import waafa.css, no dangerouslySetInnerHTML (except sanitised admin rich text, JSON-LD).
- Server Components by default; "use client" only on small interactive leaves.
- Data only through repository interfaces (apps/web/src/lib/data) typed by packages/shared; fixtures now, API later.
- Animate only transform/opacity; reduced motion -> 150 ms fade. Money ৳ with Indian grouping (৳1,46,480).
- Windows: gh at "C:\Program Files\GitHub CLI" (add to PATH per command); scripts cross-platform; Git Bash or PowerShell.
- Commands (repo root): pnpm install | pnpm dev | pnpm lint | pnpm typecheck | pnpm test | pnpm build | pnpm e2e.

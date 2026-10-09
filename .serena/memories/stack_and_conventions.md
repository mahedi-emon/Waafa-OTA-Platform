# Stack and conventions
- Monorepo: pnpm 12 workspaces + Turborepo 2.11. Packages: apps/web (@waafa/web), packages/shared (@waafa/shared),
  packages/config (@waafa/config: tsconfig/base|library|nextjs.json, eslint/base|next, prettier), fixtures (@waafa/fixtures).
  Internal packages ship TS source (exports -> src/*.ts); web lists them in next.config transpilePackages.
- Web: Next 16.4 (cacheComponents + partialPrefetching), React 19.3, TS 6.0.3 strict (+noUncheckedIndexedAccess), ESLint 9,
  Tailwind 4.3 via @tailwindcss/postcss, shadcn radix-nova (Lucide, cn package, tw-animate-css, shadcn/tailwind.css),
  motion 14 (motion/react, LazyMotion strict -> m.*), next-intl 4.14 (next/root-params), Vitest 5, Playwright 1.64 + axe.
- App layout: ONE root layout src/app/[locale]/layout.tsx (fonts, html lang, providers, skip link); public pages in
  src/app/[locale]/(site)/; admin in src/app/[locale]/admin/ (URL /admin); src/proxy.ts (next-intl) keeps English unprefixed.
  Messages: apps/web/messages/en.json (typed via src/i18n/next-intl.d.ts). Use Link/useRouter from @/i18n/navigation.
- globals.css is the only stylesheet: Tailwind default palette removed (--color-*: initial) -> only WAAFA colours;
  utilities site-container, type-display|h1|h2|h3|lead|label|caption; --primary electric-600; light-only (.dark never set).
- Components: one per file, PascalCase files/exports, typed props, no any. shadcn files keep CLI names in components/ui.
  21st.dev -> components/fx; MotionKit -> components/motion; feature -> components/<feature>; page-only -> app/**/_components.
- Server Components by default; "use client" only on small leaves. Data only via repositories in src/lib/data (A4).
- Shared formatters: formatTaka (৳1,46,480), formatGrouped, formatDate ("12 Oct 2026"), formatDayMonth, formatTime (24h, Dhaka).
- Tests: Vitest *.test.ts next to code; e2e in apps/web/e2e (runs next start on :3100 after build).
- Windows: gh at "C:\Program Files\GitHub CLI"; Dhaka time via PowerShell TimeZoneInfo 'Bangladesh Standard Time'.

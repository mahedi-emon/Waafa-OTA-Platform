# When a task is done (quality gates, see CLAUDE.md)
1. Repo root: pnpm lint, pnpm typecheck, pnpm test, pnpm build all pass.
2. Playwright MCP on touched routes at 320/390/768/1440: screenshots, zero console errors, no horizontal scroll,
   no layout shift, keyboard pass, axe pass; reduced-motion check; trace for animations (no long task > 50 ms).
3. Lighthouse mobile on touched public routes: Perf 90+, A11y 95+, SEO 95+, first-load JS <= 200 KB gz.
4. Vitest for logic; Playwright e2e for every user flow.
5. Re-read the CLAUDE.md Never list against new copy, data and images (no licence data, Hajj/Umrah, fake reviews...).
6. TRACKER rows (route matrix, Admin-control matrix, components inventory, session log) + Serena memories updated.

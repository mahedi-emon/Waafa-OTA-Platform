# Suggested commands (run from apps/web unless noted)
- npm install            install deps
- npm run dev            dev server (http://localhost:3000)
- npm run build          production build (also generates Next route types like LayoutProps)
- npm run lint           eslint
- npx tsc --noEmit       typecheck (run after `next build` or `next typegen` so LayoutProps etc. exist)
- npx shadcn@latest add <component>   add shadcn/ui component into src/components/ui
- Repo root: `npx playwright install --with-deps chromium` once per fresh (cloud) session for the Playwright MCP.
- Repo root: `uvx --from git+https://github.com/oraios/serena serena project index .` to refresh Serena's symbol cache.
System is Windows (Git Bash + PowerShell available): use git, ls, grep, find in Git Bash; cloud sessions are Linux.

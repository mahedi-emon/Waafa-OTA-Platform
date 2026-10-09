# Suggested commands (repo root, pnpm workspace from issue #2 on)
- pnpm install | pnpm dev (web at http://localhost:3000) | pnpm build | pnpm lint | pnpm typecheck | pnpm test | pnpm e2e
- pnpm --filter @waafa/web exec shadcn add <component>   (shadcn/ui into apps/web/src/components/ui)
- pnpm --filter @waafa/web exec next typegen   (route types: LayoutProps, PageProps, next/root-params)
- npx shadcn@latest add "https://21st.dev/r/<author>/<component>?api_key=$TWENTY_FIRST_API_KEY" (from apps/web, into components/fx)
- python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system | --domain ux|style|... | --stack nextjs
- gh (Windows): PowerShell `$env:PATH += ";C:\Program Files\GitHub CLI"`; Git Bash `export PATH="$PATH:/c/Program Files/GitHub CLI"`
- Project status: gh project item-edit --id <item> --project-id PVT_kwHOBsdPus4BmHeE --field-id PVTSSF_lAHOBsdPus4BmHeEzhkxvD8 --single-select-option-id <47fc9ee4 in progress | 98236657 done>
  (item id: gh project item-list 4 --owner mahedi-emon --format json --jq '.items[]|select(.content.number==N)|.id')
- Playwright browsers: pnpm --filter web exec playwright install chromium
- Serena index refresh: uvx --from git+https://github.com/oraios/serena serena project index .

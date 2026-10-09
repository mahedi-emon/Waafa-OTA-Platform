# AI tooling for this repo

Everything is project-scoped and committed so a fresh (cloud) Claude Code session gets the same setup.
Secrets are never committed: they come from environment variables (see the table at the end).
Set up on 2026-10-09.

## Files
| File | Purpose |
| --- | --- |
| `.mcp.json` | Project MCP servers (context7, shadcn, playwright, serena, magic, figma, github) |
| `.claude/settings.json` | `enableAllProjectMcpServers: true` (approves the `.mcp.json` servers) and `attribution` with empty `commit`/`pr` and `sessionUrl: false` (no AI attribution in commits or PRs); `permissions.deny` blocks force pushes, `git config`, `--no-verify`, `reset --hard` and `gh repo delete` |
| `.husky/`, `commitlint.config.mjs`, `lint-staged.config.mjs` | Git hooks installed by `pnpm install`: commit-msg runs `scripts/check-attribution.mjs` (no co-author or AI attribution) and commitlint (Conventional Commits); pre-commit runs Prettier on staged files and `scripts/guards.mjs` |
| `scripts/guards.mjs` | Repository rules (`pnpm guards`, CI job Guards): one stylesheet, no prototype imports, no hex outside tokens/brand, fixtures behind the data layer, no framer-motion, Phase F words, store name |
| `.github/workflows/codeql.yml`, `.github/dependabot.yml` | CodeQL (security-extended) on PRs touching code and weekly; grouped weekly dependency updates (majors by hand) |
| `.github/workflows/ci.yml` | CI: install, lint, typecheck, unit tests, build, Playwright smoke; Lighthouse CI once `apps/web/lighthouserc.json` exists |
| `docs/TRACKER.md` | Status of every phase and issue, tooling table, matrices, decisions, session log |
| `.claude/skills/` | Project skills (frontend-design, design-taste-frontend; UI UX Pro Max — see below) |
| `skills-lock.json` | Written by the `skills` CLI; `npx skills experimental_install` restores the skills from it |
| `.serena/project.yml` | Serena project config (language: typescript). `.serena/cache/` and `project.local.yml` are gitignored |
| `.serena/memories/` | Serena onboarding memories (overview, commands, conventions, done-checklist) |
| `.claude/settings.local.json` | **Gitignored.** Local-only env, e.g. `TWENTY_FIRST_API_KEY` |

## Per-session setup (cloud sessions start fresh)
```bash
npx playwright install --with-deps chromium     # browser for the Playwright MCP
pnpm install                                     # workspace deps (repo root)
pnpm --filter @waafa/web exec playwright install chromium   # browser for `pnpm e2e`
curl -LsSf https://astral.sh/uv/install.sh | sh  # only if `uvx` is missing (needed by Serena)
```
Then set the env vars below in the cloud environment settings.

## MCP servers (`.mcp.json`)
Smoke test for all: `claude mcp list` at the repo root. Servers added or changed in `.mcp.json` only load in the **next** session.

| Server | Config | Env | One-line smoke test (ask Claude) | Status 2026-10-09 |
| --- | --- | --- | --- | --- |
| context7 | `npx -y @upstash/context7-mcp@latest` | `CONTEXT7_API_KEY` (optional, higher rate limits) | "use context7: resolve the library id for next.js" | Connected (first start can time out while npx downloads; retry) |
| shadcn | `npx -y shadcn@latest mcp` | — | "use shadcn MCP to list components in the @shadcn registry" | Connected |
| playwright | `npx -y @playwright/mcp@latest --headless` | — | "use playwright to open https://example.com and give the page title" | Connected |
| serena | `uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context claude-code --project .` | — | "use serena get_symbols_overview on apps/web/src/components/motion/reduced-motion.ts" | Connected (project entry only) |
| magic (21st.dev) | `npx -y @21st-dev/magic@latest` | `TWENTY_FIRST_API_KEY` → passed as `API_KEY` (CLI installs accept `${API_KEY_21ST:-$TWENTY_FIRST_API_KEY}`) | "/ui use 21st magic to suggest a pricing card component" (don't install it) | Connected |
| figma | remote HTTP `https://mcp.figma.com/mcp` | — (OAuth) | "use figma MCP whoami" | Needs authentication: run `/mcp` → figma → Authenticate once |
| github | remote HTTP `https://api.githubcopilot.com/mcp/`, header `Authorization: Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}` | `GITHUB_PERSONAL_ACCESS_TOKEN` (fine-grained PAT, this repo) | "use github MCP to list open issues in mahedi-emon/Waafa-OTA-Platform" | Connected (PAT in local `.claude/settings.local.json`; cloud: set as env secret) |

Every `${VAR}` uses `${VAR:-}` so a missing variable doesn't break parsing of the whole file; that server just fails auth.

### Deviations from the original instructions (what changed and why)
- **Serena context:** `--context ide-assistant` no longer exists. `serena context list` shows `claude-code`, which Serena's README recommends for Claude Code, so that is used.
  `uv` was missing: installed with `pip install --user uv` (uv 0.11.14). On this Windows machine `uvx` lives in
  `%APPDATA%\Python\Python312\Scripts`, which is not on PATH — add it, or the user-scope serena entry (already installed, `--project-from-cwd`) is used instead.
  Onboarding: Serena `onboarding` tool run, 4 memories written. Indexing: `uvx --from git+https://github.com/oraios/serena serena project index .`.
  `project.yml`: TypeScript language server, ignores `docs/design/vendor` and `docs/design/thumbs`. Current Serena (from git) migrated
  the file to the new `language_servers:` key. The older user-installed `serena.exe` (1.3.1.dev0) can't read that (`KeyError: 'languages'`),
  Fixed on this machine: the user-scope entry was removed (`claude mcp remove serena -s user`) so only the project entry runs, and
  `%APPDATA%\Python\Python312\Scripts` (where `uvx` lives) was added to the user PATH. `claude mcp get serena` → Connected. Takes effect in new sessions.
  **2026-10-09 re-fix (`CONNECTION_CLOSED`):** the pip-installed `uvx` was gone, so the server couldn't start. Reinstalled uv with the
  official installer (`irm https://astral.sh/uv/install.ps1 | iex` → uv 0.12.24 in `%USERPROFILE%\.local\bin`, added to user PATH) and
  pre-cached Serena. A local-scope entry with the absolute `uvx.exe` path was tried as a stale-PATH fallback, but Claude Code then
  warns "Conflicting scopes" — it was removed (`claude mcp remove serena -s local`). Keep **only the project entry**; if `uvx` isn't
  found, fix PATH (or open a new terminal) rather than adding a second `serena` entry in another scope.
- **shadcn:** `npx shadcn@latest mcp init --client claude` was run in `apps/web`. It writes `apps/web/.mcp.json` and adds `shadcn` as a devDependency.
  Claude Code reads `.mcp.json` from the repo root, so the entry was moved there (`-y` added) and the nested file deleted.
  `shadcn init` (components.json) is not run yet — that's part of the foundation build.
- **21st.dev:** the key is not committed. The env-var name `21st_sk_…` isn't valid (it was the key itself), so the variable is
  `TWENTY_FIRST_API_KEY`. Locally it's in `.claude/settings.local.json` (gitignored) under `env`; in cloud sessions set it as an environment secret.
- **Figma / GitHub:** official remote servers (Figma's Dev Mode remote MCP; GitHub's hosted MCP) instead of local binaries — nothing to install, works in cloud.
- **Windows:** `claude mcp list` connected the `npx` servers on Windows without a `cmd /c` wrapper. If one fails locally, add a local-scope override with `claude mcp add -s local <name> -- cmd /c npx …`.

## Skills (`.claude/skills/`)
| Skill | How installed |
| --- | --- |
| `frontend-design` (Anthropic) | `npx skills add anthropics/skills --skill frontend-design -a claude-code --copy -y` |
| `design-taste-frontend` (taste-skill) | `npx skills add Leonxlnx/taste-skill --skill design-taste-frontend -a claude-code --copy -y`. The repo holds 13 skills; only the default "taste" skill was installed. The others are style-specific (brutalist, minimalist…) or image-generation skills, which clash with the real-photos-only rule. Add more with `--skill <name>`. |
| `ui-ux-pro-max` | `npm i -g uipro-cli` (v2.2.3), then `uipro init --ai claude` at the repo root. Its search scripts need Python 3: `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain style`. `__pycache__/` is gitignored. |

`--copy` writes real files (not symlinks) into `.claude/skills/`, so they are committed and work in the cloud.

## Design references (`docs/design/`)
- `web-interface-guidelines.md` — Vercel Web Interface Guidelines: `README.md` + `AGENTS.md` from github.com/vercel-labs/web-interface-guidelines (MIT), same content as vercel.com/design/guidelines.
- `design-md-format.md` — DESIGN.md format notes from github.com/VoltAgent/awesome-design-md. Format only; no brand files copied. Our `DESIGN.md` is not written yet.

## Monorepo (`#2`, 2026-10-09)
- pnpm workspaces + Turborepo: `apps/web` (`@waafa/web`), `packages/shared`, `packages/config`, `fixtures` (`@waafa/fixtures`).
  The npm lockfile from `create-next-app` was replaced by `pnpm-lock.yaml`.
- pnpm 12 refuses unapproved build scripts: `pnpm-workspace.yaml` → `allowBuilds` denies `@parcel/watcher`, `@swc/core`
  (both pulled in by next-intl) and `unrs-resolver` (eslint-config-next); all three ship prebuilt binaries.
- Versions: Next 16.4.0, React 19.3.0, TypeScript 6.0.3 (typescript-eslint 8.71 supports `<6.1`, so not TS 7), ESLint 9,
  Tailwind 4.3.3 through `@tailwindcss/postcss` (as the bundled Next docs show), Vitest 5, Playwright 1.64, next-intl 4.14.9.
- shadcn: `shadcn init --base radix --preset nova --pointer` → `components.json` (style `radix-nova`, Lucide), `src/lib/utils.ts`
  re-exports `cn` from shadcn's `cn` package (clsx + tailwind-merge replacement), `tw-animate-css`, `shadcn/tailwind.css`.
- next-intl: single root layout `src/app/[locale]/layout.tsx`, locale read with `next/root-params` (no `setRequestLocale`),
  `src/proxy.ts` keeps English URLs unprefixed. Admin lives at `src/app/[locale]/admin` (URL `/admin`).

## Animation (`apps/web`)
- `motion` v14 only (import from `"motion/react"`); the duplicate `framer-motion` package was removed in #2.
- `src/components/motion/MotionProvider.tsx` — `LazyMotion features={domAnimation} strict` + `MotionConfig reducedMotion="user"`;
  wired into the root layout. Because of `strict`, use `m.div`, not `motion.div`.
- `src/components/motion/reducedMotion.ts` — `REDUCED_FADE` (150 ms), `usePrefersReducedMotion`, `useRiseVariants`, `useSafeTransition`.

## Local machine notes (2026-10-09)
- `gh` 2.102.0 is installed at `C:\Program Files\GitHub CLI\gh.exe` but not on PATH in every shell. PowerShell:
  `$env:PATH += ";C:\Program Files\GitHub CLI"`; Git Bash: `export PATH="$PATH:/c/Program Files/GitHub CLI"`. Logged in as
  `mahedi-emon` with scopes `gist, project, read:org, repo, workflow` (enough for Project #4).
- Node comes from nvm4w: 25.2.1 active, 22.11.0 installed. CI uses Node 22. Node 25 ships without corepack, so pnpm 12.10.1 is
  installed globally and pinned in the root `packageManager` field.
- Stopping a background `next dev` / `next start` shell does not stop its `node.exe` children on Windows, and Playwright's
  `reuseExistingServer` then talks to a stale server (500s on new build assets). Before `pnpm e2e`, free ports 3000/3100:
  PowerShell `Get-NetTCPConnection -LocalPort 3100 -State Listen | % { Stop-Process -Id $_.OwningProcess }`.
- The machine often has only ~1–2 GB RAM free: run build and e2e one at a time (`playwright test --workers=2`).
- Font subsetting (the ৳ glyph) used fontTools + brotli in a throwaway venv in the session scratchpad, not the global Python.
- Git Bash has no IANA zone data: get Dhaka time with PowerShell
  `[TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow,'Bangladesh Standard Time')`.

## Environment variables
| Variable | Needed by | Required? |
| --- | --- | --- |
| `TWENTY_FIRST_API_KEY` | magic (21st.dev) | Yes for magic |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | github MCP | Yes for github |
| `CONTEXT7_API_KEY` | context7 | Optional |
| — (OAuth via `/mcp`) | figma | Sign in once per machine/session |

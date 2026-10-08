# AI tooling for this repo

Everything is project-scoped and committed so a fresh (cloud) Claude Code session gets the same setup.
Secrets are never committed: they come from environment variables (see the table at the end).
Set up on 2026-10-09.

## Files
| File | Purpose |
| --- | --- |
| `.mcp.json` | Project MCP servers (context7, shadcn, playwright, serena, magic, figma, github) |
| `.claude/settings.json` | `{"enableAllProjectMcpServers": true}` — approves the `.mcp.json` servers |
| `.claude/skills/` | Project skills (frontend-design, design-taste-frontend; UI UX Pro Max — see below) |
| `skills-lock.json` | Written by the `skills` CLI; `npx skills experimental_install` restores the skills from it |
| `.serena/project.yml` | Serena project config (language: typescript). `.serena/cache/` and `project.local.yml` are gitignored |
| `.serena/memories/` | Serena onboarding memories (overview, commands, conventions, done-checklist) |
| `.claude/settings.local.json` | **Gitignored.** Local-only env, e.g. `TWENTY_FIRST_API_KEY` |

## Per-session setup (cloud sessions start fresh)
```bash
npx playwright install --with-deps chromium     # browser for the Playwright MCP
cd apps/web && npm install                       # app deps
pip install uv  # only if `uvx` is missing (needed by Serena)
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
| magic (21st.dev) | `npx -y @21st-dev/magic@latest` | `TWENTY_FIRST_API_KEY` → passed as `API_KEY` | "/ui use 21st magic to suggest a pricing card component" (don't install it) | Connected |
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

## Animation (`apps/web`)
- No app existed, so `apps/web` was scaffolded with `create-next-app@latest` (Next 16.4, React 19.3, TS, Tailwind v4, App Router, `src/`, `@/*`, Turbopack), following the README plan of `apps/web`.
- `npm i motion framer-motion` (both v14). Use `motion` and import from `"motion/react"`; `framer-motion` is installed as asked but code shouldn't import it (same library, separate package, would duplicate the bundle).
- `src/components/motion/motion-provider.tsx` — `LazyMotion features={domAnimation} strict` + `MotionConfig reducedMotion="user"`; wired into `src/app/layout.tsx`. Because of `strict`, use `m.div`, not `motion.div`.
- `src/components/motion/reduced-motion.ts` — `REDUCED_FADE` (150 ms), `usePrefersReducedMotion`, `useRiseVariants`, `useSafeTransition`.
- Verified: `next build`, `tsc --noEmit` and `eslint` pass.

## Environment variables
| Variable | Needed by | Required? |
| --- | --- | --- |
| `TWENTY_FIRST_API_KEY` | magic (21st.dev) | Yes for magic |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | github MCP | Yes for github |
| `CONTEXT7_API_KEY` | context7 | Optional |
| — (OAuth via `/mcp`) | figma | Sign in once per machine/session |

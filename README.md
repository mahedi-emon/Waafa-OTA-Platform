# WAAFA website — starter

This folder is the start of the code repository. It holds the PRD, the full design prototype and the handoff
for Claude Code. No app code yet: Claude Code builds it from here.

## Start (VS Code + Claude Code)
1. Unzip this folder and open it in VS Code (File → Open Folder).
2. Optional: `git init` and make a first commit.
3. Open the terminal in VS Code and run `claude`.
4. Paste the kick-off prompt below.

```
Read CLAUDE.md, docs/PRD.md and docs/design/handoff/HANDOFF.md.
Set up the monorepo with apps/web (Next.js App Router, TypeScript strict,
Tailwind v4, shadcn/ui). Copy docs/design/handoff/tokens.css into
app/globals.css. Build the layout shell first (Header, Footer, TabBar,
MotionKit) and Home, matching the Home and Home-m screens in
docs/design/project/. Phone first (390 px), then 768 and 1440.
Keep sample data in /fixtures, marked Sample.
```

Then go route by route with the table in `docs/design/handoff/HANDOFF.md` (build order: foundation → search and
Manual mode → packages, visa, content → Waafas World and Admin → launch).

## See the design
- Open `docs/design/index.html` in Chrome: every screen, offline. Phone screens open in a phone frame.
- Real photos: in `docs/design/photos/` run `node get-waafa-photos.mjs` (Node 18 or newer, internet). The prototype then shows them.
- Figma: tokens, styles and core components are in the Figma file; screen images are in the Waafa-Screens zips.

## What is where
| Path | What |
| --- | --- |
| `CLAUDE.md` | Rules and context Claude Code reads every session |
| `docs/PRD.md` | Product requirements (source of truth) |
| `docs/design/index.html` | Prototype navigator (295 screens) |
| `docs/design/project/` | Screen sources (`.dc.html`), `waafa.css` with every style |
| `docs/design/handoff/` | `HANDOFF.md`, `tokens.css`, `screens.csv` |
| `docs/design/assets/` | Logo, product photos, flags, video loops (MP4 + WebM) and posters |
| `docs/design/photos/` | Real photo download script and credits |

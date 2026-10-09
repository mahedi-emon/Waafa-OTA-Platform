# Audit findings (v4 PROMPT 1, Step 0, 9 Oct 16:30 Dhaka) — full table in docs/TRACKER.md section 0
- Identity OK: Mahedi Hasan Emon <mahedi.emon62@gmail.com>. origin/main: 13 commits, all by the owner (7 GitHub squash
  merges use the noreply address, committer "GitHub"); no co-author/AI trailers. Nothing to rewrite.
- main had A1–A4 merged (PRs #23–#26). Issues #1–#22 = A1–A22 reused; v4 added A0 #27, epics #28–#33 (A..F), A1b #34.
- Earlier-session A5 WIP (31 Unsplash photos, 3 Better Day shots, VideoSchema, MediaSlot, creditUrl) committed on
  feat/5-media as "chore(web): media pipeline work in progress (#5)"; identical copy in stash@{0} (leave it).
  Its videos (passport, headphones, power-bank, routes-from-dhaka) are DRAWN prototype motion graphics and
  toner-cf280a is a pan over a still: none may ship (D37). Replace with real Pexels/Coverr/Mixkit footage in A5.
- Fixed in A0: CLAUDE.md v3 → v4; HANDOFF broken fence + "ask before dependency" + motion-graphics line; PRD tab label
  "Shop" + W-mark store header + FR-GLB-07 + Phase F wording; FAQ mentioning recruitment; hex in styleguide swatches and
  themeColor (→ components/brand/brandColors.ts); no guards/hooks/commitlint/attribution CI/CodeQL/dependabot/templates;
  repo allowed merge+rebase (now squash-only, delete branch on merge); no branch protection.
- Secrets: .mcp.json env refs only; .claude/settings.local.json (gitignored) holds TWENTY_FIRST_API_KEY + GitHub PAT.
  API_KEY_21ST not set on this machine (D40). No .env files.
- A1 docs gaps vs v4 (→ #34): no signature moments/beat list in MOTION.md, ui-ux-pro-max system not persisted,
  no inner-page Lighthouse.
- Machine: Node 25.2.1, pnpm 12.10.1, Python 3.12, Docker; ffmpeg + Vercel CLI missing; ~1–2 GB free RAM.
- Local leftovers: merged branches feat/1-3 (harmless). git clean/restore of WIP was blocked by the permission
  classifier: commit WIP to its branch instead of deleting.

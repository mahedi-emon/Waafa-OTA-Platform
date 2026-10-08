# DESIGN.md format — reference notes

Notes on the format only, taken from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
(MIT, fetched 2026-10-09) and the [Google Stitch DESIGN.md spec](https://stitch.withgoogle.com/docs/design-md/specification/) it follows.
The brand files in that repo are format examples only. **Never copy another brand's colours, type, layout or copy into WAAFA's DESIGN.md.**
WAAFA's own DESIGN.md is not written yet; its values must come from `docs/design/handoff/tokens.css`, `HANDOFF.md` and the prototype.

## What it is
A plain Markdown design-system file at the project root that agents read to keep generated UI consistent.
`AGENTS.md`/`CLAUDE.md` say how to build the project; `DESIGN.md` says how it should look and feel.
"Installing" one = putting the file at the repo root and telling the agent to follow it. No tooling needed.

## File shape
1. **YAML front matter** (between `---` lines) with machine-readable tokens:
   ```yaml
   ---
   version: alpha
   name: <system name>
   description: <one paragraph: mood, signature colour, type, radius character>
   colors:            # semantic-name: "#hex"   (primary, primary-active, ink, body, muted, hairline, canvas, surface-*, on-primary, semantic…)
   typography:        # token: { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }  (display-*, title-*, body-*, caption, button-*)
   rounded:           # none, xs, sm, md, lg, xl, full
   spacing:           # xxs … section
   components:        # name: { backgroundColor, textColor, typography, rounded, padding, height } — values may reference tokens:
                      #   "{colors.primary}", "{typography.button-md}", "{rounded.sm}"; states as separate keys (button-primary-active, -disabled)
   ---
   ```
2. **Prose sections** (Markdown headings), in this order:

| # | Section | What it captures |
|---|---------|------------------|
| 1 | Overview / Visual Theme & Atmosphere | Mood, density, design philosophy |
| 2 | Colors (palette & roles) | Semantic name + hex + functional role; grouped Brand/Accent, Surface, Borders, Text, Semantic, Scrim |
| 3 | Typography | Font families, full hierarchy table, principles, fallbacks |
| 4 | Layout | Spacing scale, grid & container, whitespace philosophy |
| 5 | Elevation / Depth | Shadow system, surface hierarchy |
| 6 | Components | Buttons, inputs, nav, cards, etc. with states (hover, active, focus, disabled) |
| 7 | Do's and Don'ts | Guardrails and anti-patterns |
| 8 | Responsive Behavior | Breakpoints, touch targets, collapsing strategy |
| 9 | Agent Prompt Guide | Quick colour reference and ready-to-use prompts |
| – | Known Gaps | What the file does not cover yet |

Optional companions in that repo: `preview.html` / `preview-dark.html` — swatch, type-scale, button and card catalogue.

## For WAAFA (when we write it)
- Token values = `tokens.css` (single source); DESIGN.md mirrors them, it does not invent new ones.
- Do's and Don'ts must include the CLAUDE.md "Never" rules (logo, real photos only, no fake availability, no fees/licence numbers).
- Responsive: phone first 390 / 320, then 768 and 1440; touch targets ≥ 44 px (see `web-interface-guidelines.md`).
- Motion: transform + opacity only; 150 ms fade under reduced motion.

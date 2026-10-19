# List and table overrides (WAAFA Admin)

> Overrides `../MASTER.md` for every admin list. Full spec: `docs/design/ADMIN.md` §5.3 and §10. Generator output
> (19 Oct): Data View, high density, 12-column grid; UX rules "bulk actions = checkbox column + action bar" and
> "tables become cards or scroll on phones".

## Layout
- Header (title, one line, primary action) → toolbar (search, filter chips, saved views, columns, export) → table →
  bulk bar on selection → pagination with totals.
- First column: 40 px thumbnail + human name + one secondary line; then the status chip; then key facts; row menu last.
- Desktop rows 44 px (56 px with a thumbnail); header Inter 13 px sentence case, mist-700; cells 14.5 px.
- Below 768 px: rows become cards (thumbnail, name, chip, two facts, chevron), ≥ 64 px tall.

## Rules
- Server pagination (25/50/100) with totals; filters and sort in the URL (nuqs); saved views per user.
- Row click opens a right side sheet with a summary and actions; the name link opens the editor.
- Skeleton rows while loading; designed empty state per list with the next step.
- Keyboard: ↑/↓ focus, Enter open, Space select, Esc close; `aria-sort` on sortable headers.

# Dashboard overrides (WAAFA Admin)

> Overrides `../MASTER.md` for `/secure-admin-control` (Home). Full spec: `docs/design/ADMIN.md` §5.2. Generator
> output (19 Oct): Data View, 12-column grid, high density, "animate 1–2 key elements", hover tooltips, row highlight;
> its App Store sections and gold star ratings do not apply.

## Layout
- 12-column grid, full width up to 1440 px. Order: Today queue → KPI cards → charts → recent activity + setup checklist.
- Today queue: one card per waiting job with a count, one line and a link to the filtered list; zero = a calm tick.
- KPI cards: 4–5 (executive-dashboard rule), each with a 14-day SVG sparkline and the change in words.
- Charts: leads by module (horizontal bars), leads by day (line); five chart tokens; a data table alternative for each.

## Rules
- Charts load on demand (Recharts through shadcn Chart, dynamic import); KPI numbers render on the server.
- Count-up only when motion is allowed; reduced motion shows the final number.
- Every card is a link or holds one: the dashboard is a set of doors to work, never a dead end.

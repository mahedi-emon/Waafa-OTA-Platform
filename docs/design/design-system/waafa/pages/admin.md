# Admin overrides (WAAFA)

> Overrides `../MASTER.md` for `/admin/*`. Source: PRD §13, HANDOFF (Admin* boards). Generator suggestion
> (marketing-page rules) does not apply: the admin is a dense working tool.

## Layout
- shadcn Sidebar (midnight-950) with grouped sections (Sales, Travel, Waafas World, Content, Settings), top bar with
  breadcrumbs and Ctrl+K command palette; content max width 1440 px.
- Data tables (TanStack Table): sticky header, row selection with a bulk bar, column visibility, CSV export,
  pagination; filters in the URL. Charts (shadcn Chart / Recharts) with a table alternative.
- Density: 14 px body, 36–40 px rows on desktop; phones get a card list per row and a bottom navigation sheet.

## Rules
- Admin-only libraries load with dynamic import and never reach public bundles.
- Every change writes the audit log (before and after); destructive actions use an AlertDialog with the record name.
- Booking modes show Live locked with the reason until Phase E.
- Light theme at launch (dark mode is P1); never indexed (`noindex`).

## Summary

<!-- 2-4 plain lines: what changed and why. -->

Closes #

## Screens and widths

<!-- Boards matched (docs/design/project/*.dc.html) and the widths checked. -->

| Route | Boards | 320 | 390 | 768 | 1024 | 1440 |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Tests

- Unit (Vitest):
- E2E (Playwright, reduced motion on):
- axe:
- Lighthouse mobile (P / A / BP / SEO):
- Traces at 4x CPU (longest task):

## Admin-control rows

<!-- Rows added to docs/TRACKER.md section 4: public element -> data field -> admin screen. -->

## Checklist

- [ ] `pnpm guards`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass
- [ ] Components only (no prototype HTML or extra CSS); tokens and cva variants; shadcn restyled
- [ ] Everything a visitor sees comes from the data layer (except the developer credit and compliance rules)
- [ ] Real photos and video only; prices in ৳ with lakh grouping, VAT included
- [ ] Compliance: no licence data, nothing for Phase F modules, no invented reviews, fares labelled indicative
- [ ] Reduced motion: movement becomes a 150 ms fade, loops stop
- [ ] TRACKER issue block and Serena memories updated

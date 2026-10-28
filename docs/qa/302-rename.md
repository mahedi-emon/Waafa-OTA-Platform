# QA plan · #302 store renamed to Waafa’s World

Owner's decision of 28 Oct (D311). Written before the change; each case names how it is checked.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| RN-01 | Happy | Phone tab bar at 320 and 390 px | Middle tab reads "Waafa’s World" (may wrap to two lines), nothing cut, link to /shop | e2e `layout.spec.ts` (label fits test) + screenshots |
| RN-02 | Happy | Store bar on /shop | "Waafa’s World" as text beside the one WAAFA logo; h1 is the new name | e2e `store.spec.ts` |
| RN-03 | Happy | Desktop header panel and footer column | "Waafa’s World" trigger opens the mega panel; footer column title is the new name | e2e `layout.spec.ts` |
| RN-04 | Happy | Admin sidebar group | Group "Waafa’s World" folds and opens | e2e `admin-shell.spec.ts` |
| RN-05 | Happy | Titles, descriptions, Open Graph, llms.txt | Store meta title and Home description name "Waafa’s World"; llms.txt lists it | e2e `seo.spec.ts` (llms.txt) |
| RN-06 | SEO | Structured data on /shop, /about-us, Home, a product | name "Waafa's World" (plain apostrophe), alternateName "Waafas World"; seller name plain | e2e `seo.spec.ts`; unit `schemaNames.test.ts` |
| RN-07 | Data integrity | Seed patch on a live copy holding the old defaults | storeName, tab bar label, templates and pages that still equal the old default are renamed | API DB `seedPatches.test.ts` |
| RN-08 | Data integrity | Staff wording | A store name or label staff changed (even one containing the old name) is never touched | API DB + unit `renameStore` |
| RN-09 | Data integrity | Old-defaults list matches today's fixtures | Every old text maps to a text the fixtures ship now, and none of the old ones remains | unit `seedPatches.unit.test.ts` |
| RN-10 | Edge | Patch runs once | Second deploy skips it (marker) | API DB (marker pattern shared by every patch) |
| RN-11 | Guard | "Waafas World" or "Waafa's World" (plain) in visible source | `pnpm guards` fails with the reason; schemaNames.ts allowed | guards run with a planted file (done by hand once, removed) |
| RN-12 | Guard | Fixtures store name | Guards fail if `siteSettings.storeName` is not the new name | guards |
| RN-13 | Emails | Order email subject | "Your Waafa’s World order WS-…" | fixtures + patch (template subject in the old-defaults list) |
| RN-14 | Unchanged | Route and domain | /shop and waafasworld.com unchanged; "Shop" and "Waafa Shop" never a label | e2e + guards |
| RN-15 | Accessibility | Tab label and store bar | Accessible names contain the visible words (axe label-content-name-mismatch) | e2e axe sweeps |
| RN-16 | Widths | 320, 390, 768, 1024, 1440 | No horizontal scroll, no clipped label | e2e `layout.spec.ts` + Playwright MCP screenshots |

Security, roles, rate limits and uploads: not affected (copy and data only). Performance: no new client code; the
public first-load budget is checked by the existing budget e2e.

# QA plan: letter C, speed (#236)

Goal (NFR-PERF, CLAUDE.md budgets): Lighthouse mobile performance 90+ (median of 3) on the key public routes in CI
and on https://waafasworld.com; first-load JS 200 KB gzip or less on every public route; LCP 2.5 s or less, INP 200 ms
or less, CLS 0.1 or less; accessibility, best practices and SEO 95+; the Lighthouse CI assertions fail the build.

Key routes: `/`, `/flights`, `/hotels`, `/tour-packages`, a package, `/visa`, a visa country, `/shop`, a product,
`/blog`, a post.

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | Lighthouse | Happy | Production build, fixture data | LHCI, 3 runs per key route, mobile | Performance median 90+ on all 11 routes | P0 | `lighthouserc.json` (error) in CI |
| C-02 | Lighthouse | Happy | Same | Same | Accessibility, best practices, SEO 95+ each | P0 | `lighthouserc.json` (error) |
| C-03 | Core Web Vitals | Happy | Same | Same | LCP 2.5 s or less, CLS 0.1 or less, TBT 200 ms or less (lab stand-in for INP) | P0 | `lighthouserc.json` (error) |
| C-04 | JS budget | Happy | Production build | Load every public route at 390 px | First-load JS (scripts the HTML references, gzip) 200 KB or less | P0 | `e2e/budget.spec.ts` |
| C-05 | JS budget | Edge | Same | Route with the largest client island (flights, contact, shop) | Still 200 KB or less; on-tap code not counted | P0 | `e2e/budget.spec.ts` |
| C-06 | LCP | Happy | Home at 390 px | Load | LCP element is the hero photo, `fetchpriority=high`, not lazy, preloaded | P1 | `e2e/performance.spec.ts` |
| C-07 | LCP | Edge | Package and product pages | Load | LCP image eager and high priority; others lazy | P1 | `e2e/performance.spec.ts` |
| C-08 | CLS | Edge | Slow network (Slow 4G), fonts late | Load home, flights, shop | No layout shift over 0.1 (fonts with size-adjust, image boxes sized) | P1 | `e2e/performance.spec.ts` |
| C-09 | INP | Happy | Home at 390 px, 4x CPU | Switch search tabs, open the menu, open a picker | Each interaction under 200 ms | P1 | `e2e/performance.spec.ts` |
| C-10 | Below the fold | Edge | Long home page | Scroll to the bottom with the keyboard | Every section renders, links keep 44 px targets, no blank area | P1 | `e2e/home.spec.ts` + axe |
| C-11 | Reduced motion | Accessibility | prefers-reduced-motion | Load home and scroll | No movement, final states shown, no lost content | P1 | `e2e/smoke.spec.ts` |
| C-12 | Regression | Visual | All widths | 320, 390, 768, 1024, 1440 screenshots of touched routes | Same layout as before (no missing sections, no horizontal scroll) | P0 | `e2e/public-screens.spec.ts` |
| C-13 | Regression | Console | All touched routes | Load | Zero console errors | P0 | `e2e/public-screens.spec.ts` |
| C-14 | SEO | Data | Home and lists | View source | Content still server-rendered (headings, links, JSON-LD present in HTML) | P0 | `e2e/seo.spec.ts` |
| C-15 | Browsers | Responsive | Firefox and WebKit | Load home, flights, shop at 390 | Renders, no errors | P2 | `e2e/smoke.spec.ts` (cross-browser projects) |
| C-16 | Live | Release | After the owner deploys | Lighthouse mobile on the 11 routes against https://waafasworld.com, read-only | Scores recorded in TRACKER section 7; 90+ | P1 | Manual (live site, read-only, after deploy) |
| C-17 | Slow network | Edge | Slow 4G throttling | Load home | Text and search usable before images finish; no blocking spinner | P2 | Manual (Playwright MCP trace) |
| C-18 | Admin | Regression | Admin uses the same stylesheet | Admin dashboard and a list at 390 and 1440 | Unchanged look, INP under 200 ms | P1 | `e2e/admin-datatable.spec.ts`, admin screens |

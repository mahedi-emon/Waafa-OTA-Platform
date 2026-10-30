# QA plan · #256 Search → results and card → detail morphs

MOTION.md "Search → results" and "Shared image card → detail" (PROMPT 10 letter L). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| MO-01 | Happy | Home search (flights) submitted on a 390 phone | The card glides into the results summary bar (`trip-summary` pair); results load as before | e2e `morph.spec.ts` (names recorded at `startViewTransition`) |
| MO-02 | Happy | Results still streaming | The pair forms with the loading preview's summary skeleton, then the real bar fills it | e2e + manual |
| MO-03 | Happy | Package card on /tour-packages or Home → package page | The card photo grows into the gallery's first photo (`package-<slug>`) | e2e |
| MO-04 | Happy | Product card on a store grid → product page | The card photo grows into the main photo (`product-<slug>`) | e2e |
| MO-05 | Edge | A record appears twice on a page (rails, related, recently viewed) | Not named there: only the main grids opt in, so a name is never duplicated | code review + e2e console clean |
| MO-06 | Edge | Browser without View Transitions (older Firefox) | Normal navigation with the page enter; no errors | e2e on Firefox in the full suite |
| MO-07 | Accessibility | Reduced motion | The morph is instant (0 s), the page swaps at once | CSS + e2e with reduced motion |
| MO-08 | Regression | Thumbnail change on the product page, Edit on the summary bar | No morph (`default="none"`), no double fade | manual |
| MO-09 | Performance | Navigation at 4x CPU | No long task over 50 ms from the transition; LCP unaffected on first load (morph only on client navigation) | Chrome trace + Lighthouse |

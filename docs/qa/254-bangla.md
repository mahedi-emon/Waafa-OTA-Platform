# QA plan · #254 Bangla at /bn

FR-GLB-07 and NFR-L10N (PROMPT 10 letter K). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| BN-01 | Happy | Every public route at /bn (16 routes) at 320 and 1440 | 200, `lang="bn"`, Bangla words in the page, no horizontal scroll, axe clean, no console errors | e2e `bangla.spec.ts` |
| BN-02 | Data integrity | Every public English key | Has Bangla; a new English key without Bangla fails the unit test | unit `messages.test.ts` |
| BN-03 | Data integrity | Placeholders, plural keywords, rich-text tags | Identical to English in every string | unit |
| BN-04 | Compliance | Bangla copy | Latin digits and ৳ lakh grouping; no dashes; nothing about Hajj, Umrah or manpower; brand names in Latin letters | unit |
| BN-05 | Happy | Language switch in the header (768 px and up), the phone menu and the footer | Goes to the same page in the other language; named in its own script; keyboard reachable | e2e |
| BN-06 | SEO | hreflang and canonical | Both versions list each other with English as x-default; a Bangla page is canonical at /bn; Open Graph locale bn_BD; structured data inLanguage bn-BD | e2e + unit |
| BN-07 | SEO | Sitemap | A Bangla part lists every page at /bn; every URL carries xhtml:link alternates | e2e + unit |
| BN-08 | Performance | Budgets on English pages | Unchanged: the Bengali font is never preloaded and loads only for Bangla glyphs (unicode-range) | e2e budget |
| BN-09 | Performance | Image and build size | English is prerendered; Bangla renders on first visit and is cached (D326) | build log, measure-stack |
| BN-10 | Admin | The admin at /bn | Stays English (Admin namespace from English) | unit (request merge) + manual |
| BN-11 | Accessibility | Bangla text rendering | Noto Sans Bengali, readable line height, no clipped conjuncts at 320 | e2e screenshots + manual |
| BN-12 | Content | Bangla copy reviewed by a native speaker | Natural wording, no literal translations | manual (owner's staff, UAT U-38) |

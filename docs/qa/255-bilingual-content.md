# QA plan · #255 bilingual content fields

FR-GLB-07 content (PROMPT 10 letter K). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| BC-01 | Happy | A FAQ with Bangla question and answer | /bn/faqs shows the Bangla; /faqs shows English | e2e `bilingual.spec.ts` |
| BC-02 | Fallback | A record with no Bangla, or one field empty | /bn shows the English for what is missing, never a blank | e2e + unit `withBangla` |
| BC-03 | Data integrity | English stays required | Saving with Bangla only fails on the English field; Bangla is optional | unit (schemas) |
| BC-04 | Data integrity | Only visitor text is offered | Links, slugs, ids, enums, prices, dates and image addresses are never translatable | unit `translatablePaths` |
| BC-05 | Security | A crafted Bangla path ("../x", "__proto__") | Refused by the schema (dotted field paths only); unknown paths are ignored by the site | unit |
| BC-06 | Admin | Editor "Bangla" section | Every visitor text field with its English beside it; "N of M written"; empty clears | e2e (API mode) + manual |
| BC-07 | Admin | "Bangla missing" filter on lists of bilingual collections | Lists only records still missing Bangla; other lists do not show the filter | API DB + manual |
| BC-08 | Admin | The admin UI | Stays English | manual |
| BC-09 | Performance | English pages | Unchanged: the overlay runs only on /bn and copies the record | unit + budget |
| BC-10 | Caching | Cached accessors on /bn and / | Separate cache entries per language (root param in the cache key) | e2e (both pages right after each other) |

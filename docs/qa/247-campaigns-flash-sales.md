# QA plan · #247 campaign pages and flash sales

FR-SHOP-13 (campaign pages, flash sales). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| FS-01 | Happy | A flash sale (deal with a start, an end and a stock cap) inside its window | The variant sells at the flash price on cards, the product page and the cart; the order is priced so by the API | unit `dealIsLive` + API DB order |
| FS-02 | Edge | Before the start, after the end | Normal price everywhere; the API never charges the flash price | unit + API DB |
| FS-03 | Data integrity | Cap of 3: orders take 2, then a cart asks for 2 more | The second order is priced at the normal price ("changed" with the new quote), never past the cap | API DB |
| FS-04 | Data integrity | Two orders at the same moment | Products are locked per order (existing), so the cap can't be passed | API DB (serial lock) |
| FS-05 | Edge | A cancelled order | Its units go back to the cap | API DB |
| FS-06 | Happy | Campaign page /shop/campaign/<slug> | Banner, words, countdown to the end, its products with their (deal) prices | e2e 390 and 1440 |
| FS-07 | Edge | Campaign not started or ended | Not started: 404; ended: "This campaign has ended" with the products at normal prices, noindex | e2e |
| FS-08 | Admin | Campaigns and the deal start and cap fields in Admin | Editable with the usual editor; a campaign links from the store | e2e admin-editors sweep (axe) |
| FS-09 | SEO | Campaign pages | In the sitemap while live; title and description within limits | seo e2e |
| FS-10 | Accessibility | Countdown | Text says the end date; the ticking numbers are aria-hidden; reduced motion shows no ticking | e2e |
| FS-11 | Performance | Campaign page JS | ≤ 200 KB | budget e2e |

# QA plan · #246 Save for later and Buy again

FR-SHOP-13 (save for later, Buy again); the wishlist itself shipped in #278. Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| SL-01 | Happy | Save a cart line for later | It leaves the cart (totals follow) and shows under "Saved for later" with its quantity | unit + e2e (390 and 1440) |
| SL-02 | Happy | Move back to cart | Back in the cart, priced again by the catalogue; gone from the saved list | unit + e2e |
| SL-03 | Edge | The cart becomes empty | The empty-cart message and the saved list both show | e2e |
| SL-04 | Edge | Two tabs | Both follow (storage event) | unit (store) |
| SL-05 | Edge | Storage blocked (private window) | Lists live for the page only, nothing breaks | unit |
| SL-06 | Happy | Buy again on a delivered or shipped order | Its items go into the cart at today's price and stock, then the cart opens | unit `buyAgainLines` + API DB account view items |
| SL-07 | Edge | An item no longer sold, out of stock or with a hidden price | Left out; no button when nothing is left | unit |
| SL-08 | Security | Buy again never reuses an old price | Lines carry today's price; checkout prices again on the server | unit |
| SL-09 | Accessibility | Buttons name their item ("Save … for later", "Move … to your cart") | axe clean, 44 px targets on phones | e2e |
| SL-10 | Performance | Cart page JS | Within the 200 KB budget | budget e2e |

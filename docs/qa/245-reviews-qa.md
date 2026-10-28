# QA plan · #245 reviews, product Q&A and feedback photos

PRD FR-PKG-08 (reviews), FR-SHOP-13 (reviews, Q&A), the feedback wall rule (approved submissions only) and the owner's
order of 28 Oct (approved feedback photos). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| RV-01 | Happy | A customer with a booked package request reviews that package | Saved as waiting; shows on the package page only after approval, with stars, first name and initial | API DB + e2e |
| RV-02 | Happy | A customer with a delivered order reviews a product in it | Same as RV-01 on the product page | API DB |
| RV-03 | Security | No account, an account without a booking or delivery, an order not yet delivered, another customer's booking | 401 / 403 with a plain reason; nothing stored (no invented reviews possible) | API DB |
| RV-04 | Edge | A second review of the same item by the same customer | 409 "You reviewed this already" | API DB |
| RV-05 | Negative | Rating 0 or 6, empty text, text over 2,000 characters | 422 | API DB |
| RV-06 | Security | Review text with HTML or a script | Shown as text on the page and in Admin | e2e |
| RV-07 | Roles | Moderation | Content editor and managers approve, reject or reply; others 403; audited | API DB |
| RV-08 | SEO | Structured data | AggregateRating and Review only when the item has approved reviews, matching the visible numbers; none otherwise | e2e seo |
| RV-09 | Happy | Ask a question on a product (any visitor) | Waiting; shown with the staff answer once answered; never before | API DB + e2e |
| RV-10 | Security | Question spam | Turnstile when on, 5 a minute per address, 500 characters | API DB |
| RV-11 | Happy | Feedback with a photo is approved | The photo is copied into the public library as WebP and shows on the wall; the private original stays private | API DB |
| RV-12 | Security | Pending or rejected feedback photo | Never public (no URL in the snapshot) | API DB |
| RV-13 | Edge | Approved photo that failed the malware scan or is not an image | Approval goes through without the photo; staff see why | API DB |
| RV-14 | Data integrity | Approve, then reject | Review leaves the page and the average; the page refreshes | API DB |
| RV-15 | Admin | Queues | Reviews and questions waiting show as counts in the sidebar and the bell | API DB inbox |
| RV-16 | Accessibility | Stars, review form, Q&A | Rating is a radio group with words ("4 out of 5"); axe clean at 390 and 1440 | e2e |
| RV-17 | Performance | Product and package pages | Still at or under 200 KB first-load JS; reviews come from the cached snapshot (pages stay static) | budget e2e |

Exploratory (20 minutes, 390 px): as a customer who booked a package, write a review; as staff approve it and reply;
ask a question on a product and answer it.

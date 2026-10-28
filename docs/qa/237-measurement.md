# QA plan: #237 measurement (events after consent, UTM on leads and orders, Where leads come from)

Owner's order of 28 Oct, step 4. The sitemap split and generated share images moved to #287.

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-01 | Consent | Privacy | GA4 on, visitor has not chosen | Search, send a lead | No analytics script loads, no event is sent (the bridge is not on the page) | P0 | design: EventBridge renders only inside the consented scripts; UAT U-04 |
| M-02 | Events | Happy | Consent given | Search, send a lead, add to cart, open checkout, place an order, send a payment proof, sign up, sign in | One GA4 event each (search, lead_submit, add_to_cart, begin_checkout, order_placed, payment_proof_sent, sign_up, login), the same on the dataLayer and the Pixel (standard names where Meta has one) | P0 | `sendConversion.test.ts`; UAT (GA4 DebugView) |
| M-03 | Events | Edge | Consent given | Success screen renders twice for one lead | lead_submit counted once per reference | P1 | `sendConversion.test.ts` (onceKey) |
| M-04 | Clicks | Happy | Consent given | Tap the call button and the WhatsApp button | call_click and whatsapp_click | P1 | `sendConversion.test.ts` (linkConversion) |
| M-05 | Amounts | Edge | Consent given | Place a ৳1,46,480 order | order_placed value 146480, currency BDT | P1 | `sendConversion.test.ts` |
| M-06 | UTM | Happy | — | Open /contact?utm_source=newsletter&utm_medium=email&utm_campaign=x, send a message | The lead's source holds the UTM tags and landing page; Reports shows "Newsletter (email)" with campaign x | P0 | e2e `api-mode.spec.ts` |
| M-07 | Referrer | Happy | — | Arrive from google.com, send a lead | Source Google | P1 | `attribution.test.ts`, `leadSources.unit.test.ts` |
| M-08 | Internal moves | Edge | Arrived from Google | Browse three pages, then send a lead | Still Google (our own pages never replace the source) | P1 | `attribution.test.ts` |
| M-09 | New campaign | Edge | Arrived from Google earlier | Come back through a UTM link | The campaign replaces Google | P1 | `attribution.test.ts` |
| M-10 | Orders | Data | — | Arrive with UTM, place a COD order | Order.source stored (migration 20261029010000_order_source); Reports counts the order and revenue on that source | P0 | `attribution.test.ts` (withSource), `leadSources.unit.test.ts`, API intake (CI) |
| M-11 | Tampering | Security | — | Edit the waafa_src cookie by hand | Ignored: the lead is saved without a source, never refused; the cookie is httpOnly | P0 | `attribution.test.ts` |
| M-12 | Roles | Security | Content editor, Sales | Open Reports | Sales sees sources for its modules without orders; staff without orders get no Orders or Revenue columns | P1 | API report (role filters already tested); manual |
| M-13 | Speed | Performance | — | Public pages | No new script before consent; first-load JS unchanged (proxy does the UTM work) | P0 | `budget.spec.ts` |
| M-14 | Bangla, widths | Layout | — | Reports at 390 px | Sources table scrolls sideways inside its card; no page scroll | P2 | manual |

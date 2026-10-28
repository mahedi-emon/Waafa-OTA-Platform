# QA plan · #248 invoices, packing slips and CSV import

PROMPT 10 letter H, FR-CAT-05 (compatible models by CSV), PRD §17 Shop P1 (bulk product CSV, invoices and packing
slips). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| IC-01 | Happy | Invoice PDF for an order | A4, the WAAFA logo, "Invoice" and the order reference, billed to the buyer, the lines with quantity, unit price and total, subtotal, discount, delivery, total in ৳ with lakh grouping, "VAT included" | unit (model) + API DB (PDF) |
| IC-02 | Happy | Order with a VAT invoice request | The company name and the customer's BIN under "Bill to"; nothing about our own licence or ID numbers | unit |
| IC-03 | Edge | VAT rate set in Admin › Payment settings | "Includes VAT at 15%: ৳…" with the amount worked back from the total; empty rate: "All prices include VAT" without an amount | unit |
| IC-04 | Happy | Packing slip PDF | Ship-to address and phone, lines with SKU and quantity, a tick box per line, no prices; cash on delivery orders show the cash to collect; office pick-up says so | unit + API DB |
| IC-05 | Security | Who may print | Invoice: Admin, Waafa’s World manager, Accounts; packing slip: Admin and Waafa’s World manager; anyone else 403; signed out 401; unknown order 404 | API DB |
| IC-06 | Happy | Admin order page | "Invoice (PDF)" and "Packing slip (PDF)" open the PDFs through the admin proxy | API e2e (admin) |
| IC-07 | Happy | CSV export for products, group fares, compatible models | A UTF-8 CSV with a byte order mark and fixed columns; formulas neutralised | API DB |
| IC-08 | Data integrity | Import the export unchanged | Preview says every row is unchanged; importing changes nothing (no History entries) | API DB round trip |
| IC-09 | Happy | Edit prices and stock in the CSV, preview, import | Preview lists the rows to update with the changed columns; import saves them through the normal save (History, audit, cache); export again gives the edited file | API DB round trip |
| IC-10 | Validation | Bad rows (missing column, a word for a number, unknown product or variant, price under 0, MRP under price, a model with no name, a fare with a bad date) | The preview names the line, the column and the problem in plain words; import refuses the whole file while any row has a problem (nothing half-saved) | unit + API DB |
| IC-11 | Happy | New group fares and compatible models in the CSV | Rows with a new id are created; rows missing from the file are left alone (import never deletes) | API DB |
| IC-12 | Edge | New product rows | Refused with "Add new products in the editor first: they need photos" (products need real photos); new variants likewise | unit |
| IC-13 | Edge | Excel quirks | A byte order mark, CRLF or LF, quoted commas and line breaks, an apostrophe before a neutralised formula, columns in another order, empty trailing lines | unit `parseCsv` |
| IC-14 | Security | Size and access | Over 2 MB or 2,000 rows refused; only staff who may edit the list may import or export; every import is in the audit log | API DB |
| IC-15 | Accessibility | Import dialog | Labelled file input, the preview table with headers, errors as text, focus returns to the button; axe clean | API e2e (admin) |

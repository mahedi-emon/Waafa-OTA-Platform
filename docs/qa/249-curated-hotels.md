# QA plan · #249 curated hotels with Request booking

FR-HTL-02 (PROMPT 10 letter I). Written before the build.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| CH-01 | Happy | /hotels with published curated hotels | "Hotels our team recommends" with a card per hotel in admin order: cover, stars, area, name, summary, "From ৳ per night" | e2e 390 and 1440 |
| CH-02 | Happy | A hotel's page /hotels/<slug> | Gallery, stars, area, summary, check-in and check-out, About, What the hotel offers with icons, Rooms with beds, sleeps, size, features, from price per night; the indicative note; WhatsApp | e2e 390 and 1440 + axe + scroll width |
| CH-03 | Happy | Request on a room | /hotels opens with "You are asking about <hotel> · <room>"; the stay step starts at "<hotel>, <city>"; the request is sent with hotelId, hotelName and roomType; the lead summary names the room | unit (lead builder, summary) + e2e |
| CH-04 | Edge | The customer types another place after choosing a hotel | The request goes as a normal hotel request (no hotel fields) | unit |
| CH-05 | Edge | Unknown or unpublished hotel | The not-found page; the request page ignores an unknown hotel in the address | e2e + unit |
| CH-06 | Data integrity | Schema | At least one room type, different room ids, 1 to 5 stars, known amenities only | shared unit |
| CH-07 | Admin | Admin › Curated hotels | Sectioned editor (Hotel, Photos, What it offers, Room types and prices, SEO), publish workflow, View on site; in the sidebar and the New menu | e2e admin-editors sweep (axe) |
| CH-08 | SEO | Hotel pages | In the sitemap when indexable, Hotel JSON-LD (name, stars, address, photos, price range), canonical | unit sitemap + seo review |
| CH-09 | Compliance | Prices and photos | Prices in ৳ with lakh grouping, VAT included, labelled indicative; real photos only (Unsplash, credited) | review + MEDIA_CREDITS |
| CH-10 | Performance | Hotel page JS | ≤ 200 KB first load | budget e2e |
| CH-11 | Accessibility | Stars and amenities | Stars read as "4-star hotel"; amenity icons hidden from screen readers; 44 px targets | e2e axe |

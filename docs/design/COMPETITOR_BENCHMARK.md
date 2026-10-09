# Competitor benchmark

Issue #1 (A1). Measured on **9 Oct 2026** against the four Bangladeshi OTAs named in the brief:
[gozayaan.com](https://gozayaan.com/), [sharetrip.net](https://sharetrip.net/) (plus `/shop`), [akijair.com](https://akijair.com/)
and [obokash.com](https://www.obokash.com/).

**Method.** Playwright (Chromium) at 390 × 844 and 1440 × 900, live: home hero, search widget and pickers, a live
DAC → CXB flight search on GoZayaan (results and loading state), cards, menus, motion and micro-interactions.
Lighthouse 13.5.0, mobile preset (simulated Slow 4G, 4× CPU slowdown), three runs per home page, medians reported.
This pass adds what the designer's Stage A research (`project/Main.dc.html`) could not do: the 390 px views and a live search.

**Rules we kept.** Patterns only. No layout, copy, image, icon or code was copied; no competitor asset was downloaded
into the repository (study screenshots stayed in the gitignored `.playwright-mcp/` folder). A visitor must never
mistake a Waafa page for one of theirs (PRD §16, Originality).

## 1. Scores: the bar to beat

Lighthouse mobile, median of three runs.

| Site | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Speed Index | Transfer | Script | Requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Obokash | 35 | 88 | 54 | 92 | 4.0 s | 12.5 s | 1,298 ms | 0 | 6.8 s | 2.5 MB | 1.7 MB | 133 |
| Akij Air | 27 | 79 | 69 | 92 | 7.4 s | 25.4 s | 2,342 ms | 0 | 14.2 s | 7.6 MB | 3.2 MB | 134 |
| GoZayaan | 26 | 76 | 50 | 92 | 10.9 s | 24.4 s | 2,878 ms | 0.057 | 10.9 s | 4.0 MB | 3.0 MB | 159 |
| ShareTrip | 1 | 72 | 73 | 100 | 9.0 s | 29.2 s | 3,306 ms | 0.93 | 33.0 s | 15.3 MB | 3.4 MB | 188 |
| **Best of four** | **35** | **88** | **73** | **100** | **4.0 s** | **12.5 s** | **1,298 ms** | **0** | **6.8 s** | **2.5 MB** | **1.7 MB** | **133** |
| **Waafa target** | **≥ 90** | **≥ 95** | **≥ 95** | **100** | **≤ 1.8 s** | **≤ 2.5 s** | **≤ 200 ms** | **≤ 0.1** | **≤ 3.4 s** | **≤ 1 MB** | **≤ 200 KB gz first load** | **≤ 50** |

SEO cannot beat ShareTrip's 100, so the target is to match it. Every other column must beat the best competitor.
Re-measure Waafa on the same settings (A22) and fill the TRACKER benchmark table.

Raw observations that drive the scores:
- **Weight.** Every home page ships 1.7 to 3.4 MB of script and 130 to 190 requests. ShareTrip moves 15 MB on first load.
- **Layout shift.** ShareTrip's CLS of 0.93 comes from late-loading carousels and banners pushing content down.
- **Zoom.** GoZayaan (`user-scalable=0`) and ShareTrip (`user-scalable=no`) block pinch-zoom, an accessibility failure
  (WCAG 1.4.4). Akij Air and Obokash allow it.
- **Semantics.** GoZayaan's home has no `h1` or `h2` and its `<title>` is just "GoZayaan". Obokash's `h1` is an SEO phrase
  ("Best Hajj Umrah Agency - Visa & Travel Agent in Bangladesh") followed by a 120-word paragraph.

## 2. Area by area

Each area: what they do, where it is weak, and how Waafa does it better in its own way.

### 2.1 First screen (390 px)
| | What they do | Where it is weak |
| --- | --- | --- |
| GoZayaan | App-download banner, header, then the search card straight over a sea photo; no headline. Cookie bar on top of the card. | App banner and cookie bar cover about a quarter of the first screen; no heading tells a first-time visitor what the site is. |
| ShareTrip | "Welcome to ShareTrip!" over a dark photo band, then a search card with four visible tabs and a scroll arrow for more. | Generic welcome line; the card needs a sideways scroll to find products; fare-type radios (including Umrah) add noise. |
| Akij Air | A frosted card "Where to Next?" with an animated airport-code board (DAC → DXB), then the search card under it. | Two cards compete in one screen; the search button falls below the fold on a 390 × 844 phone once the cookie bar shows. |
| Obokash | A 120-word SEO paragraph, then WhatsApp and Appointment buttons; no search on the first screen. | The first screen sells to search engines, not people; nothing to tap except two buttons. |

**Waafa.** One promise, one card, one action. A short headline in the hero (word reveal, one rotating destination
chip), the glass search card fully inside the first screen with the Search button in the thumb zone, and nothing
stacked on top of it: no app banner, and the analytics notice is one slim line above the bottom tab bar that never covers the card.
The hero media is our own muted loop with a real-photo poster as the LCP image.

### 2.2 Search widget and pickers
| | What they do | Where it is weak |
| --- | --- | --- |
| GoZayaan | Tabs Flight · Hotel · Tour · Visa with icons; radio trip types; From/To with swap; full-screen airport list on phones; a **fare calendar** sheet with a price under every day ("Fare is indicative") and a sticky Done bar. | Airport list is flat (no recent picks, no sections); no visible validation; date sheet is long scrolling months. |
| ShareTrip | Ten product tabs; segmented trip type; IATA code set large beside the city; phone picker opens full screen with the route as its title ("Dhaka - Cox's Bazar · Round Trip"), "7 Suggestions", Clear. | Tabs overflow on desktop and phone; three fare-type radios under the button. |
| Akij Air | Raised pill tabs, segmented trip type, "Add Return" in the return slot, "Add preferred Airline" link, trending routes strip with "from ৳". | Return as a separate decision is good, but trending fares carry no date or source. |
| Obokash | Tour, Visa, Hotel, Flight pills; tour asks only destination and nationality. | No dates or travellers, so staff must ask again. |

**Waafa.** Four tabs only (Flight, Hotel, Tour, Visa) with the ribbon pill sliding on a spring. City, IATA code and
airport on one line, Bangladeshi airports pinned, then popular routes, then **recent searches as chips**. On phones every
field opens a spring bottom sheet with the Search button pinned inside it. Our date picker shows the range filling as
you pick, and, instead of invented daily fares, marks only dates that have a real admin-entered group fare with the small
gold triangle and "Group fare from ৳…, indicative". Validation is visible and announced (From ≠ To, return after departure,
nine travellers max) and every parameter lives in the URL.

### 2.3 Results and query flow
GoZayaan (live DAC → CXB): URL holds the whole search (`/flight/list?adult=1…&trips=DAC,CXB,2026-10-14`); a skeleton
for the filter rail and four result cards plus "Hang tight! We're finding the best flight options for you." and a
progress bar; then a bank-offer strip, a ±3-day date strip, Cheapest and Fastest tabs with their values, a filter rail
(airlines with logos, stops, price range) and cards with a time-line between airports and "Starting from BDT".
Weak: the offer strip pushes results below the fold; the date strip shows no prices; no help is offered if nothing fits.

**Waafa (Manual mode now).** Same calm shell, but honest about what happens: a sticky summary bar you can edit in place,
the "Get the best fare from our experts" card with a two-step form (contact first, trip details prefilled from the
search), matching group fares beside it, and a help card (call, WhatsApp, live office hours) that never scrolls away.
Success is immediate: a drawn check, the reference number (FLT-261008-0042) and a WhatsApp button prefilled with it.
**Live mode later** keeps the shell and adopts the best of the pattern (sort tabs that show their winning value, filter
counts, a date strip) inside the same `ResultsBody` slot.

### 2.4 Cards
| | Pattern | Weak point |
| --- | --- | --- |
| GoZayaan | Deal cards with a bank-logo panel, coupon code chip and a yellow "Learn More". | Every card looks like an ad; bank logos dominate. |
| ShareTrip | Photo cards with star rating and review count; destination coverflow with tilted cards; airline grid of 20 logos. | Ratings without context; filler paragraphs under every centred heading; dot pagination everywhere. |
| Akij Air | Package bento with a collage of four photos per country and "Starting from ৳"; airline marquee on a dark band. | Collages crop badly at 390 px; the same eyebrow + two-tone headline on every section reads as a template. |
| Obokash | Perspective-tilted country cards with the logo burned into each photo. | Watermarked images look like ads; text-heavy blocks between rows. |
| ShareTrip Shop | 2-column grid, seller name, price with struck MRP, green tag with an unlabelled taka amount, brand carousel. | No Add to cart on cards, unlabelled saving tag, seller names on a single-vendor store. |

**Waafa.** Cards carry information, not decoration: package cards show nights per city and "from ৳ per person, twin
sharing"; fare cards use a boarding-pass anatomy (large IATA codes, dashed path, ticket-stub notch, tabular figures,
"Indicative" label, seats left only when staff entered them); product cards show price, struck MRP and a labelled
"Save ৳…", stock state, and **Add to cart turning into a stepper** right on the card. One radius and one shadow scale;
the gold triangle is the only premium marker. Desktop hover lifts the card and gently zooms the photo; phones get a press
scale instead of hover effects.

### 2.5 Navigation and menus
- **GoZayaan** desktop hides the nav behind a hamburger until the search card scrolls away, then shows an icon nav in a
  solid white header. The menu is a full-width panel grouped as Travel, Extras, Rewards with a sign-in promo card.
- **ShareTrip** shows eight items plus dropdowns (Visa, Transport, Others), currency and Login; retail sits inside the
  travel nav.
- **Akij Air** keeps a short nav (Flight, Visa, Hotel, Holiday, More), a headset help button and Sign In.
- **Obokash** adds a utility bar with two email addresses and six social icons above an eight-item nav.

**Waafa.** Seven items exactly as the PRD lists, the hotline/WhatsApp chip and a calm "Need help?" panel with live office
hours. The header is transparent over the hero and becomes solid with a blur after 24 px. The **Waafas World mega panel**
opens with a short stagger (categories plus three doors: Shop all, Printing Solutions, International Trading), and the More
panel uses two columns of icon, title and one line. On phones: a top bar with call and WhatsApp, a full-screen drawer, and a
five-tab bottom bar whose pill slides between tabs, with the raised Waafas World disc in the middle.

### 2.6 Loading states, motion and micro-interactions
| | Observed |
| --- | --- |
| GoZayaan | Spinner and fade animations only; results skeleton + progress bar; header swaps from transparent to solid on scroll. |
| ShareTrip | No CSS animations on the home page; carousels with dot pagination. |
| Akij Air | The split-flap airport board in the hero, an airline marquee, a scroll-to-top button with a progress ring; cookie sheet. |
| Obokash | No animations; static carousels. |

**Waafa.** Motion that explains, never decorates (`MOTION.md`): a word reveal and slow ribbon parallax in the hero, a border
beam on the search card (desktop), the 180° From/To swap, spring sheets, a traveller stepper whose numbers roll, skeletons
that cross-fade at the same height, a self-drawing success check, fly-to-cart with a badge pop, and the W ribbon loader for
slow route changes. All of it transform and opacity, all of it calm under reduced motion. None of the four competitors
handles reduced motion visibly; Waafa does everywhere.

### 2.7 Trust, content and SEO
- **Ratings.** Akij Air shows "4.8" with no source; ShareTrip shows stars on hotels and packages. Waafa shows approved feedback
  only, with service and date, links to Facebook reviews, and never adds self-serving review markup.
- **Badges.** ShareTrip's footer prints certificate and licence numbers next to a wall of accreditation logos. Waafa never shows
  licence data (PRD §2) and shows payment marks only for methods that are live.
- **Copy.** ShareTrip and Obokash put SEO filler under every heading; Akij Air uses the same eyebrow and two-tone headline on
  every section. Waafa writes one plain line per section, in sentence case, in our own voice.
- **Structure.** Waafa ships one `h1` per page, unique titles and descriptions from admin, BreadcrumbList, Organization,
  TravelAgency, LocalBusiness, TouristTrip, Product, FAQPage and BlogPosting JSON-LD where each applies.

### 2.8 Accessibility
GoZayaan and ShareTrip block zoom; GoZayaan's labels are tiny all-caps 11 px; ShareTrip's grey-on-white paragraph text and
Akij Air's pale pill text fall under 4.5:1 in places (Lighthouse a11y 72 to 88). Waafa keeps zoom on, uses 44 px targets,
AA contrast (gold never carries text), labels on every input, announced errors, a skip link and full keyboard support.

## 3. What Waafa takes, what it leaves

The designer's Stage A board lists ten patterns to adopt and ten mistakes to avoid; this live pass confirms them and adds:

**Adopt (in our own form)**
1. Search state in the URL so results are shareable and Back works (GoZayaan).
2. A phone picker titled with the route being edited (ShareTrip), plus our recent-search chips.
3. "Add return" inside the return slot (Akij Air), with the trip-type control still visible.
4. Header that turns solid once the search card scrolls away (GoZayaan), with our 24 px rule and blur.
5. Skeletons the exact size of the content they replace, with a plain line saying what is happening (GoZayaan), cross-faded.

**Avoid**
1. Anything layered over the search card on a phone (app banners, cookie sheets).
2. Unlabelled numbers on cards (ShareTrip Shop's green tag) and ratings without a source.
3. Eyebrow-plus-two-tone headings on every section (Akij Air); SEO paragraphs under every heading (ShareTrip, Obokash).
4. More than four products in the search card; ads between sections.
5. Blocking zoom; shipping megabytes of script to a phone on 4G.

## 4. Originality check for every screen
Before merging any public page, compare it side by side with the four home pages above (A22 repeats this for every route):
layout, colour, type, imagery and copy must be Waafa's own. If a screen could be mistaken for a competitor's, change it.

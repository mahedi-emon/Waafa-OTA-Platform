import type {
  BannerSchema,
  BaggageRuleSchema,
  BlogCategorySchema,
  BlogPostSchema,
  DestinationSchema,
  EmiBankSchema,
  FaqSchema,
  FeedbackSchema,
  GalleryAlbumSchema,
  PageBlockSchema,
  PageSchema,
  ServicePageSchema,
  TeamMemberSchema,
  TimelineEventSchema,
  TrustItemSchema,
  ValueCardSchema,
} from "@waafa/shared";
import { photo } from "./images";
import type { In } from "./input";

/* ------------------------------------------------------------------------------------------------
 * Pages (FR-PAGE): the three policies and About Us. Sample text from the prototype, waiting for the
 * owner's review (legal review for the policies).
 * Bodies are trusted fixture HTML; in Phase B the API sanitises admin rich text on save (NFR-SEC).
 * ---------------------------------------------------------------------------------------------- */

export const pages: In<typeof PageSchema>[] = [
  {
    id: "page-refund",
    slug: "refund-policy",
    title: "Refund policy",
    summary:
      "How cancellations, changes and refunds work for flights, hotels, tours, visas and Waafas World orders.",
    highlights: [
      "Airline and hotel rules decide most refunds. We explain them before you pay.",
      "Embassy visa fees are never refundable; our service charge is shown separately.",
      "Waafas World: faulty items replaced within 7 days; clothing exchanged for size within 7 days.",
      "Refunds go back the way you paid: bKash or Nagad in 3 working days, bank in up to 7.",
    ],
    sections: [
      {
        id: "flights",
        heading: "Flights",
        body: "<p>Every fare has its own change and refund rules, set by the airline. Your expert explains them in plain words before you pay, and they are on your ticket.</p><p>If you cancel, we pass on everything the airline refunds, minus the airline’s penalty. Our service charge is not refundable once the ticket is issued.</p><table><thead><tr><th>When you cancel</th><th>What you get back</th></tr></thead><tbody><tr><td>Before the ticket is issued</td><td>Everything you paid</td></tr><tr><td>After issue, refundable fare</td><td>Airline refund minus airline penalty</td></tr><tr><td>After issue, non-refundable fare</td><td>Unused taxes only, if the airline returns them</td></tr></tbody></table>",
      },
      {
        id: "hotels",
        heading: "Hotels",
        body: "<p>Free cancellation is possible until the hotel’s deadline, shown on your confirmation. Non-refundable rates are cheaper and are always labelled as such.</p>",
      },
      {
        id: "tours",
        heading: "Tour packages",
        body: "<p>Packages combine flights, hotels and services that each have their own rules, so the refund depends on how close to departure you cancel.</p><table><thead><tr><th>When you cancel</th><th>Refund (sample terms)</th></tr></thead><tbody><tr><td>30 days or more before departure</td><td>Full refund minus a ৳2,000 processing charge</td></tr><tr><td>15 to 29 days before</td><td>50% of the package price</td></tr><tr><td>Less than 15 days before</td><td>No refund, except what airlines and hotels return</td></tr></tbody></table>",
      },
      {
        id: "visa",
        heading: "Visa services",
        body: "<p>Embassy and visa-centre fees are paid to them and are never refundable, even if the visa is refused. That is their rule, not ours.</p><p>Our service charge is refunded in full if you cancel before we start preparing your file.</p>",
      },
      {
        id: "shop",
        heading: "Waafas World orders",
        body: "<p>Tell us within 7 days if an item arrives faulty or damaged, with a photo, and we replace it or refund it.</p><p>Clothing can be exchanged for another size within 7 days if unworn and with tags. Opened software, ink and toner are exchanged only if faulty.</p><p>If you refuse a cash-on-delivery parcel without a reason, we may ask for the delivery charge on your next order.</p>",
      },
      {
        id: "custom",
        heading: "Printing and trading",
        body: "<p>Custom print jobs and sourced goods are made for you, so they cannot be cancelled once production or purchase has started. Your quote shows that date.</p>",
      },
      {
        id: "how",
        heading: "How to ask for a refund",
        body: "<p>Call, WhatsApp or email us with your reference number (for example FLT-, PKG-, VSA- or ORD-). We confirm the amount in writing before we process it.</p><table><thead><tr><th>You paid with</th><th>Refund time once approved</th></tr></thead><tbody><tr><td>bKash or Nagad</td><td>Within 3 working days</td></tr><tr><td>Bank transfer</td><td>Within 7 working days</td></tr><tr><td>Cash at the office</td><td>Same day, at the office</td></tr><tr><td>Airline refunds</td><td>The airline’s timeline, often 4 to 8 weeks</td></tr></tbody></table>",
      },
    ],
    lastUpdated: "2026-10-08",
    status: "published",
    sample: true,
  },
  {
    id: "page-privacy",
    slug: "privacy-policy",
    title: "Privacy policy",
    summary: "What we collect, why we need it, who sees it, and how to ask us to delete it.",
    highlights: [
      "We collect only what we need to book your trip, process your visa or deliver your order.",
      "Passport and visa documents are visible only to our visa team and deleted 90 days after your case closes.",
      "We never sell your data or share it with advertisers.",
      "Ask us any time to see, correct or delete what we hold about you.",
    ],
    sections: [
      {
        id: "collect",
        heading: "What we collect",
        body: "<p>Contact details: your name, mobile number and, if you give it, your email.</p><p>Trip details you enter: routes, dates, travellers and preferences. For visas, the documents you upload. For Waafas World, your delivery address.</p><p>Payment references such as a bKash transaction ID. We never see or store card numbers.</p>",
      },
      {
        id: "use",
        heading: "How we use it",
        body: "<p>To answer your request, confirm prices, book with airlines and hotels, prepare visa files, deliver orders and send receipts.</p><p>To send a monthly newsletter, only if you subscribe. Every email has a one-click unsubscribe.</p>",
      },
      {
        id: "share",
        heading: "Who we share it with",
        body: "<p>Only the people who need it to do the job: the airline, hotel or tour partner you booked, the embassy or visa centre, our courier, and payment providers.</p><table><thead><tr><th>Who</th><th>What they get</th></tr></thead><tbody><tr><td>Airlines and hotels</td><td>Names and passport details as on your booking</td></tr><tr><td>Embassies and visa centres</td><td>Your visa file</td></tr><tr><td>Courier partners</td><td>Name, mobile number and delivery address</td></tr><tr><td>Payment providers</td><td>Amount and reference only</td></tr></tbody></table>",
      },
      {
        id: "documents",
        heading: "Your documents",
        body: "<p>Visa documents are stored privately. Only our visa team can open them, and we delete them 90 days after your case closes. You can ask us to delete them sooner.</p>",
      },
      {
        id: "cookies",
        heading: "Cookies",
        body: "<p>We use essential cookies to keep your cart and searches, and privacy-friendly analytics to see which pages help people. No advertising cookies.</p>",
      },
      {
        id: "rights",
        heading: "Your rights",
        body: "<p>Ask us to see, correct or delete your data by calling 01823-232241 or emailing info@waafasworld.com. We reply within 7 working days.</p>",
      },
    ],
    lastUpdated: "2026-10-08",
    status: "published",
    sample: true,
  },
  {
    id: "page-terms",
    slug: "terms-and-conditions",
    title: "Terms and conditions",
    summary:
      "The rules for using this site and booking with Waafa Tours and Travel, Waafas World and Waafa International.",
    highlights: [
      "Prices marked “from” or “indicative” are a guide; an expert confirms the final price before you pay.",
      "A booking is confirmed only when you receive a confirmation with your reference number.",
      "You are responsible for valid passports and travel documents; embassies decide visas.",
      "These terms follow the laws of Bangladesh.",
    ],
    sections: [
      {
        id: "site",
        heading: "Using this site",
        body: "<p>Use the site for genuine requests and orders. Do not copy its content, scrape prices or try to break its security.</p>",
      },
      {
        id: "prices",
        heading: "Prices and availability",
        body: "<p>In Manual mode, prices for flights, hotels and packages are indicative. Our expert checks live availability and confirms the price for your dates before you pay. In Live mode, prices come straight from airlines and are held for a limited time.</p><p>Waafas World prices include VAT. Stock and delivery estimates can change until your order is confirmed.</p>",
      },
      {
        id: "bookings",
        heading: "Bookings and references",
        body: "<p>Each request gets a reference number, such as FLT-261008-0042. A booking is confirmed only when we send a confirmation with that reference and, for travel, your ticket or voucher.</p>",
      },
      {
        id: "payments",
        heading: "Payments",
        body: "<p>We accept bKash, Nagad, bank transfer and payment at our office. Waafas World also accepts cash on delivery for orders up to ৳20,000. Instalments (EMI) depend on your card and bank.</p>",
      },
      {
        id: "travel",
        heading: "Travel documents and visas",
        body: "<p>You are responsible for a passport valid for at least six months, the right visas and any health documents. Embassies decide visa applications; we cannot guarantee an outcome.</p>",
      },
      {
        id: "content",
        heading: "Feedback and photos",
        body: "<p>When you send feedback or photos, you allow us to show them on this site as you agreed. Ask us and we take them down the same day.</p>",
      },
      {
        id: "liability",
        heading: "Our responsibility",
        body: "<p>We are responsible for the services we provide. Airlines, hotels and other partners are responsible for theirs, under their own terms, which we share with you before you book.</p>",
      },
      {
        id: "law",
        heading: "Law and changes",
        body: "<p>These terms follow the laws of Bangladesh. If we change them, the date at the top changes and the version you agreed to applies to your booking.</p>",
      },
    ],
    lastUpdated: "2026-10-08",
    status: "published",
    sample: true,
  },
  {
    id: "page-about",
    slug: "about-us",
    title: "Connecting the world, creating the future",
    summary:
      "WAAFA stands for Worldwide Alliance for Advancement, Future & Achievement. Waafa International has served Dhaka’s offices since 2010; in 2026 we opened Waafa Tours and Travel and Waafas World with the same promise: people you can call, and an office you can visit.",
    sections: [
      {
        id: "our-story",
        heading: "Our story",
        body: "<p>For nearly sixteen years Waafa International has supplied printing products and toner to Dhaka’s offices, building long-term corporate clients on trust, delivery on time and honest prices. In 2026 the same team opened a new chapter: travel, visas, international trading and the Waafas World store.</p>",
      },
      {
        id: "mission",
        heading: "Our mission",
        body: "<p>To connect Bangladesh with the world through honest travel, visa and trade services, with a real person behind every booking and every order.</p>",
      },
      {
        id: "vision",
        heading: "Our vision",
        body: "<p>Connecting the World, Creating the Future.</p>",
      },
    ],
    lastUpdated: "2026-10-08",
    status: "published",
    sample: true,
  },
];

/* ------------------------------------------------------------------------------------------------
 * Blog (FR-PAGE · Blogs)
 * ---------------------------------------------------------------------------------------------- */

export const blogCategories: In<typeof BlogCategorySchema>[] = [
  { slug: "destinations", name: "Destinations" },
  { slug: "travel-tips", name: "Travel tips" },
  { slug: "visa", name: "Visa" },
  { slug: "waafas-world", name: "Waafas World" },
];

const AUTHOR = "Waafa travel desk";

export const blogPosts: In<typeof BlogPostSchema>[] = [
  {
    id: "post-coxs-bazar-weekend",
    slug: "coxs-bazar-long-weekend",
    title: "Cox’s Bazar on a long weekend: a three-day plan",
    excerpt:
      "When to go, how to get there and a day-by-day plan for families and friends, without spending the trip in traffic.",
    intro:
      "The longest natural sea beach in the world is an hour’s flight from Dhaka. Here is how we plan a three-day weekend there for families and friends, without spending the trip in traffic.",
    sections: [
      {
        id: "when-to-go",
        heading: "When to go",
        body: "<p>November to March is dry, cool and calm, the best time for the beach. April and May get hot. From June to September the monsoon brings rough sea and red-flag days, but also empty hotels and green hills on the Marine Drive.</p><p><strong>Book early for long weekends.</strong> Hotels near Kolatoli and Sugandha fill up weeks before public holidays. Thursday-to-Saturday stays cost more than Sunday-to-Tuesday.</p>",
      },
      {
        id: "getting-there",
        heading: "Getting there",
        body: "<p>Flights from Dhaka take about an hour, and several airlines fly the route every day. Overnight buses take 10 to 12 hours. If you have only three days, fly: you gain a whole beach day.</p>",
      },
      {
        id: "day-1",
        heading: "Day 1: the town beaches",
        body: "<p>Check in, rest, then walk down to Laboni or Sugandha beach for the sunset. Dinner is fresh fish picked from the ice at one of the beach-side restaurants: agree the price per kilo before they cook it.</p>",
      },
      {
        id: "day-2",
        heading: "Day 2: Marine Drive, Himchari and Inani",
        body: "<p>Hire a CNG or a car for the day and take the Marine Drive south, with the sea on one side and hills on the other. Stop at Himchari for the view, then carry on to Inani, where the coral-stone beach is quieter and the water is clearer.</p><p><strong>Swim only where the lifeguards’ flags say it is safe,</strong> and never after dark. Rip currents are strong, even on calm-looking days.</p>",
      },
      {
        id: "day-3",
        heading: "Day 3: Ramu and the flight home",
        body: "<p>If your flight is in the afternoon, spend the morning at the old Buddhist temples of Ramu, a short drive from town. Buy dried fish and Burmese sandals at the market on the way back, and leave an hour for airport traffic.</p>",
      },
      {
        id: "costs",
        heading: "What it costs",
        body: "<table><thead><tr><th>Item</th><th>Indicative cost</th></tr></thead><tbody><tr><td>Return flight from Dhaka</td><td>from ৳9,800 per person</td></tr><tr><td>Hotel near the beach</td><td>৳3,500 to ৳12,000 a night</td></tr><tr><td>Car for the Marine Drive</td><td>about ৳3,000 for the day</td></tr><tr><td>Meals</td><td>৳1,200 to ৳2,500 a day each</td></tr></tbody></table><p>Indicative prices, October 2026. Your expert confirms real prices for your dates.</p>",
      },
    ],
    cover: photo("coxsbazar"),
    category: "destinations",
    author: AUTHOR,
    publishedAt: "2026-10-02",
    readingMinutes: 7,
    featured: true,
    cta: "packages",
    status: "published",
    sample: true,
  },
  {
    id: "post-baggage-rules",
    slug: "cabin-or-checked-baggage-rules",
    title: "Cabin bag or checked bag? Baggage rules made simple",
    excerpt: "Checked, cabin and personal items, and the fees that catch people at the counter.",
    intro:
      "“20 kg” on a ticket can mean one bag or two, and the cabin allowance has its own size rule. Here is how to read your allowance before you pack.",
    sections: [
      {
        id: "three-kinds",
        heading: "Three kinds of baggage",
        body: "<p>A personal item goes under the seat: a handbag or a laptop bag. The cabin bag goes in the overhead bin, usually up to 7 kg and 55 × 40 × 20 cm. Checked bags travel in the hold, usually 20 to 30 kg on economy fares.</p>",
      },
      {
        id: "extra-kilos",
        heading: "Extra kilos",
        body: "<p>Extra baggage costs less when you add it to the ticket than when you pay at the airport. Tell your expert before the ticket is issued.</p>",
      },
    ],
    cover: photo("hero-wing-alt"),
    category: "travel-tips",
    author: AUTHOR,
    publishedAt: "2026-09-28",
    readingMinutes: 4,
    cta: "flights",
    status: "published",
    sample: true,
  },
  {
    id: "post-bangkok-phuket",
    slug: "bangkok-and-phuket-in-six-days",
    title: "Bangkok and Phuket in six days: a first-timer’s plan",
    excerpt: "Three nights in the city, three by the sea, and the domestic flight that links them.",
    intro:
      "Thailand rewards a simple plan: start in Bangkok for temples, markets and food, then fly south to the Andaman coast for the beaches.",
    sections: [
      {
        id: "bangkok",
        heading: "Days 1 to 3: Bangkok",
        body: "<p>Spend the first morning at the Grand Palace and Wat Pho, take a river boat in the afternoon, and keep an evening for a night market. The Skytrain avoids most of the traffic.</p>",
      },
      {
        id: "phuket",
        heading: "Days 4 to 6: Phuket",
        body: "<p>A short flight takes you to Phuket. Stay near Kata or Karon for calmer beaches, and book a day boat to the islands when the sea is calm, usually November to April.</p>",
      },
    ],
    cover: photo("thailand"),
    category: "destinations",
    author: AUTHOR,
    publishedAt: "2026-09-23",
    readingMinutes: 5,
    cta: "packages",
    status: "published",
    sample: true,
  },
  {
    id: "post-sajek",
    slug: "sajek-valley-when-to-go",
    title: "Sajek Valley: when to go and how to get there",
    excerpt: "Clouds at sunrise, jeep rides from Khagrachari and the best months for clear views.",
    intro:
      "Sajek sits on a ridge in the Rangamati hills, and on a good morning the valley below fills with cloud.",
    sections: [
      {
        id: "when",
        heading: "When to go",
        body: "<p>November to February brings clear mornings and cool nights. The monsoon months are green and misty, but the hill roads can close after heavy rain.</p>",
      },
      {
        id: "getting-there",
        heading: "Getting there",
        body: "<p>Take a night bus from Dhaka to Khagrachari, then a shared jeep up to Sajek with the army-escorted convoy. Book your cottage before you leave Dhaka on weekends.</p>",
      },
    ],
    cover: photo("sajek-alt"),
    category: "destinations",
    author: AUTHOR,
    publishedAt: "2026-09-21",
    readingMinutes: 6,
    cta: "packages",
    status: "published",
    sample: true,
  },
  {
    id: "post-malaysia-evisa",
    slug: "malaysia-evisa-step-by-step",
    title: "Malaysia eVisa for Bangladeshis, step by step",
    excerpt: "Photos, bank statements and the mistakes that cause a refusal.",
    intro:
      "Malaysia’s eVisa is applied for online, but the documents still decide the outcome. Here is what to prepare.",
    sections: [
      {
        id: "documents",
        heading: "The documents",
        body: "<p>A passport valid for six months, a recent photo on a white background, a return ticket, your hotel booking and a bank statement for the last six months.</p>",
      },
      {
        id: "mistakes",
        heading: "Mistakes that cause refusals",
        body: "<p>Blurred scans, a photo with a coloured background, and travel dates that don’t match the ticket. We check every file before it is submitted.</p>",
      },
    ],
    cover: photo("kualalumpur"),
    category: "visa",
    author: AUTHOR,
    publishedAt: "2026-09-15",
    readingMinutes: 6,
    cta: "visa",
    status: "published",
    sample: true,
  },
  {
    id: "post-power-bank",
    slug: "flying-with-a-power-bank",
    title: "Flying with a power bank: what airlines allow",
    excerpt: "Why it must go in your cabin bag, and how to read the Wh rating on the label.",
    intro:
      "Power banks are allowed on planes, but only in the cabin, and only up to a certain size.",
    sections: [
      {
        id: "cabin-only",
        heading: "Cabin bag only",
        body: "<p>Spare lithium batteries, including power banks, must never go in checked bags. Keep them in your cabin bag or pocket.</p>",
      },
      {
        id: "watt-hours",
        heading: "Reading the Wh rating",
        body: "<p>Up to 100 Wh is fine; 100 to 160 Wh needs the airline’s approval; over 160 Wh is not allowed. A 20,000 mAh power bank at 3.7 V is about 74 Wh.</p>",
      },
    ],
    cover: photo("flights"),
    category: "travel-tips",
    author: AUTHOR,
    publishedAt: "2026-09-09",
    readingMinutes: 4,
    cta: "shop",
    status: "published",
    sample: true,
  },
  {
    id: "post-maldives-budget",
    slug: "maldives-without-the-resort-price",
    title: "Maldives without the resort price",
    excerpt: "Guesthouse islands, ferries and when a water villa is worth it.",
    intro:
      "The Maldives is not only private-island resorts. Local islands near Malé offer guesthouses, beaches and day trips for far less.",
    sections: [
      {
        id: "local-islands",
        heading: "Local islands",
        body: "<p>Maafushi and Thulusdhoo are a short speedboat ride from Malé, with guesthouses, bikini beaches set apart from the village, and snorkelling trips.</p>",
      },
      {
        id: "water-villa",
        heading: "When a water villa is worth it",
        body: "<p>For a honeymoon or a special birthday, one or two nights in a water villa at the end of the trip gives you the view without the whole-trip price.</p>",
      },
    ],
    cover: photo("maldives-alt"),
    category: "destinations",
    author: AUTHOR,
    publishedAt: "2026-09-01",
    readingMinutes: 8,
    cta: "packages",
    status: "published",
    sample: true,
  },
  {
    id: "post-nepal-first-timers",
    slug: "five-days-in-nepal-for-first-timers",
    title: "Five days in Nepal for first-timers",
    excerpt: "Kathmandu, Pokhara and a gentle hike, with a day-by-day plan.",
    intro:
      "Nepal is about an hour’s flight from Dhaka, and five days are enough for a first look at its cities and mountains.",
    sections: [
      {
        id: "kathmandu",
        heading: "Kathmandu",
        body: "<p>Two days for Durbar Square, Swayambhunath and Boudhanath, and an evening in Thamel for dinner and shopping.</p>",
      },
      {
        id: "pokhara",
        heading: "Pokhara",
        body: "<p>Fly or drive to Pokhara for the lake, then rise early for the sunrise over the Annapurnas from Sarangkot.</p>",
      },
    ],
    cover: photo("nepal-alt"),
    category: "destinations",
    author: AUTHOR,
    publishedAt: "2026-08-24",
    readingMinutes: 7,
    cta: "packages",
    status: "published",
    sample: true,
  },
  {
    id: "post-passport-checklist",
    slug: "passport-checklist-before-any-trip",
    title: "Your passport checklist before any trip",
    excerpt: "Validity, blank pages and the photo rules embassies are strict about.",
    intro:
      "Most trips that go wrong at the airport go wrong because of the passport. Check these three things first.",
    sections: [
      {
        id: "validity",
        heading: "Six months of validity",
        body: "<p>Most countries need your passport to be valid for at least six months after the day you arrive. Renew early if yours is close.</p>",
      },
      {
        id: "pages",
        heading: "Blank pages",
        body: "<p>Keep at least two blank pages for visas and stamps. Some embassies refuse passports without them.</p>",
      },
    ],
    cover: photo("visa"),
    category: "visa",
    author: AUTHOR,
    publishedAt: "2026-08-17",
    readingMinutes: 4,
    cta: "visa",
    status: "published",
    sample: true,
  },
  {
    id: "post-toner-original-compatible",
    slug: "original-or-compatible-toner",
    title: "Original or compatible toner: what offices should buy",
    excerpt: "Cost per page, warranty and when the original is worth it.",
    intro:
      "For most office printing, a good compatible toner prints the same pages for much less. Here is how to choose.",
    sections: [
      {
        id: "cost-per-page",
        heading: "Cost per page",
        body: "<p>Divide the price by the page yield on the box. Compatible cartridges usually cost a fraction of the original per page.</p>",
      },
      {
        id: "when-original",
        heading: "When the original is worth it",
        body: "<p>Choose the original for printers still under the manufacturer’s warranty, or for colour work where exact shades matter.</p>",
      },
    ],
    cover: photo("printing-alt"),
    category: "waafas-world",
    author: AUTHOR,
    publishedAt: "2026-08-10",
    readingMinutes: 5,
    cta: "shop",
    status: "published",
    sample: true,
  },
];

/* ------------------------------------------------------------------------------------------------
 * FAQs (FR-PAGE · FAQs; the five marked onHome feed FR-HOME 11)
 * ---------------------------------------------------------------------------------------------- */

const refundLink = { label: "Read the refund policy", href: "/refund-policy" };

export const faqs: In<typeof FaqSchema>[] = [
  {
    id: "faq-book-flight",
    category: "flights",
    question: "How do I book a flight with WAAFA?",
    answer:
      "Search your route and send the short form. A travel expert calls or messages you with the best options, confirms the fare and the rules, and issues your ticket after you pay.",
    order: 0,
    onHome: true,
    sample: true,
  },
  {
    id: "faq-change-cancel",
    category: "flights",
    question: "Can I change or cancel my ticket?",
    answer:
      "It depends on the airline’s fare rules. We explain them before you pay and handle the change for you.",
    link: refundLink,
    order: 1,
    onHome: true,
    sample: true,
  },
  {
    id: "faq-baggage",
    category: "flights",
    question: "How much baggage can I take?",
    answer:
      "It depends on the airline, route and fare. Your expert tells you before you pay, and it is printed on your ticket.",
    link: { label: "See baggage information", href: "/baggage-information" },
    order: 2,
    sample: true,
  },
  {
    id: "faq-student-group",
    category: "flights",
    question: "Do you offer student or group fares?",
    answer:
      "Yes. Group fares with fixed seats are on the Group fares page, and you can ask for student fares in the search.",
    link: { label: "See group fares", href: "/flights/group-fares" },
    order: 3,
    sample: true,
  },
  {
    id: "faq-hotel-only",
    category: "hotels",
    question: "Can you book a hotel without a flight?",
    answer:
      "Yes. Search by city or hotel name and send the request. An expert confirms the rate and the cancellation rules before you pay.",
    order: 0,
    sample: true,
  },
  {
    id: "faq-package-includes",
    category: "packages",
    question: "What is included in a tour package?",
    answer:
      "Each package page lists what is included and what is not: hotels, transfers, meals, tours and visa help. Prices are per person, twin sharing, unless the page says otherwise.",
    order: 0,
    sample: true,
  },
  {
    id: "faq-custom-trip",
    category: "packages",
    question: "Can you plan a custom trip?",
    answer:
      "Yes. Use Plan my trip: five short questions about where, when, who and your budget. We send a plan and price within one working day.",
    link: { label: "Plan my trip", href: "/plan-my-trip" },
    order: 1,
    sample: true,
  },
  {
    id: "faq-visa-help",
    category: "visa",
    question: "Do you help with visa applications?",
    answer:
      "Yes. We check your documents, complete the forms, book appointments where needed and track the file. The embassy makes the final decision.",
    order: 0,
    onHome: true,
    sample: true,
  },
  {
    id: "faq-visa-types",
    category: "visa",
    question: "Which visas do you help with?",
    answer:
      "Tourist, business, student, medical and transit visas, for the countries listed on our visa pages.",
    link: { label: "Check a country", href: "/visa-services" },
    order: 1,
    sample: true,
  },
  {
    id: "faq-visa-documents",
    category: "visa",
    question: "How do I send my documents?",
    answer:
      "Upload JPG, PNG or PDF files up to 5 MB each on the apply page, or bring them to our office. Only our visa team can open uploaded files, and we delete them 90 days after your case closes.",
    order: 2,
    sample: true,
  },
  {
    id: "faq-visa-refused",
    category: "visa",
    question: "Is the visa fee refundable if my visa is refused?",
    answer:
      "The embassy fee is not refundable; that is the embassy’s rule. Our service charge is shown separately on every country page.",
    link: refundLink,
    order: 3,
    sample: true,
  },
  {
    id: "faq-how-booking-works",
    category: "payments",
    question: "How does booking work on this site?",
    answer:
      "You search or pick a trip and send a request with your contact details. A travel expert checks the live fare or availability and calls or messages you to confirm the price before you pay anything.\n\nYou get a reference number at once, for example FLT-261008-0042 for a flight or PKG-261008-0021 for a package.",
    order: 0,
    sample: true,
  },
  {
    id: "faq-indicative",
    category: "payments",
    question: "Why do prices say “from” or “indicative”?",
    answer:
      "Airline and hotel prices change by the hour. The price you see is a guide; the expert confirms the exact price for your dates before you pay.",
    order: 1,
    sample: true,
  },
  {
    id: "faq-pay-methods",
    category: "payments",
    question: "Can I pay by bank transfer, bKash or Nagad?",
    answer:
      "Yes. You can also pay in cash at our Motijheel office. We share the payment details after your booking is confirmed.",
    link: { label: "How offline payment works", href: "/offline-payment" },
    order: 2,
    onHome: true,
    sample: true,
  },
  {
    id: "faq-emi",
    category: "payments",
    question: "Can I pay in instalments?",
    answer:
      "Yes, on selected credit cards and amounts. Tell your travel expert you want EMI and for how many months.",
    link: { label: "How EMI works", href: "/emi" },
    order: 3,
    sample: true,
  },
  {
    id: "faq-refund-time",
    category: "payments",
    question: "How long do refunds take?",
    answer:
      "Once approved, we refund to the method you paid with: bKash or Nagad in 3 working days, bank transfer in up to 7 working days. Airline refunds follow the airline’s timeline.",
    link: refundLink,
    order: 4,
    sample: true,
  },
  {
    id: "faq-delivery-time",
    category: "shop",
    question: "How long does delivery take?",
    answer:
      "Usually the next day inside Dhaka and 2 to 4 days elsewhere. Your product page shows the estimate for your district.",
    order: 0,
    sample: true,
  },
  {
    id: "faq-cod",
    category: "shop",
    question: "Can I pay cash on delivery?",
    answer: "Yes, for orders up to ৳20,000. Open and check the box before you pay the rider.",
    order: 1,
    sample: true,
  },
  {
    id: "faq-where-order",
    category: "shop",
    question: "Where is my order?",
    answer:
      "Enter your order number (ORD-…) and mobile number on Track order to see each step and the courier tracking number.",
    link: { label: "Track an order", href: "/shop/track" },
    order: 2,
    sample: true,
  },
  {
    id: "faq-returns",
    category: "shop",
    question: "Can I return something?",
    answer:
      "Faulty items are replaced if you tell us within 7 days. Clothing can be exchanged for another size within 7 days if unworn with tags.",
    link: refundLink,
    order: 3,
    sample: true,
  },
  {
    id: "faq-account",
    category: "account",
    question: "Do I need an account to book or order?",
    answer:
      "No. Every request and order works with your name and mobile number. Track any of them with the reference number and the same phone.",
    order: 0,
    sample: true,
  },
  {
    id: "faq-office-hours",
    category: "account",
    question: "When is your office open?",
    answer:
      "Saturday to Thursday, 10 am to 6 pm, closed on Friday. You can send a WhatsApp message any time and we reply when the office opens.",
    order: 1,
    onHome: true,
    sample: true,
  },
];

/* ------------------------------------------------------------------------------------------------
 * Home: offers, trust strip, values, journey, destinations (FR-HOME)
 * ---------------------------------------------------------------------------------------------- */

export const banners: In<typeof BannerSchema>[] = [
  {
    id: "offer-bali-5d",
    placement: "home-offers",
    kicker: "Holiday",
    title: "Five days in Bali",
    body: "Ubud and the south coast, with flights, hotels and visa help. From ৳89,500 per person.",
    image: photo("bali-alt"),
    link: { label: "View", href: "/tour-packages?q=bali" },
    code: "BALI-5D",
    validityText: "Until 15 Dec",
    startsAt: "2026-10-01T00:00:00+06:00",
    endsAt: "2026-12-15T23:59:00+06:00",
    order: 0,
    enabled: true,
    sample: true,
  },
  {
    id: "offer-student-kul",
    placement: "home-offers",
    kicker: "Flights",
    title: "Student fares to Kuala Lumpur",
    body: "Extra baggage on some airlines when you show a valid student ID.",
    image: photo("kualalumpur"),
    link: { label: "View", href: "/flights?to=KUL&fare=student" },
    code: "STUDENT",
    validityText: "Ongoing",
    startsAt: "2026-10-01T00:00:00+06:00",
    order: 1,
    enabled: true,
    sample: true,
  },
  {
    id: "offer-sajek-winter",
    placement: "home-offers",
    kicker: "Bangladesh",
    title: "A weekend in Sajek Valley",
    body: "2 nights in the hills, with the jeep from Khagrachari included. From ৳9,800 per person.",
    image: photo("sajek"),
    link: { label: "View", href: "/tour-packages/sajek-valley-above-the-clouds" },
    code: "SAJEK-WINTER",
    validityText: "Nov to Feb",
    startsAt: "2026-10-01T00:00:00+06:00",
    endsAt: "2027-02-28T23:59:00+06:00",
    order: 2,
    enabled: true,
    sample: true,
  },
  {
    id: "shop-office-restock",
    placement: "shop-hero",
    kicker: "Office restock week · until 15 Oct",
    title: "Restock the office for less",
    body: "Compatible toner, paper and desk supplies, delivered next day in Dhaka.",
    image: photo("cat-stationery"),
    link: { label: "Shop office supplies", href: "/shop/c/office-and-stationery" },
    validityText: "Until 15 Oct",
    startsAt: "2026-10-01T00:00:00+06:00",
    endsAt: "2026-10-15T23:59:00+06:00",
    order: 0,
    enabled: true,
    sample: true,
  },
  {
    id: "shop-power",
    placement: "shop-hero",
    kicker: "New in Electronics & Gadgets",
    title: "Power that lasts the whole week",
    body: "Fast-charging power banks and cables, with cash on delivery anywhere in Bangladesh.",
    image: photo("prod-powerbank"),
    link: { label: "Shop power banks", href: "/shop/c/power-banks" },
    startsAt: "2026-10-01T00:00:00+06:00",
    order: 1,
    enabled: true,
    sample: true,
  },
];

export const trustItems: In<typeof TrustItemSchema>[] = [
  {
    id: "trust-company",
    icon: "building-2",
    title: "Part of Waafa International",
    detail: "Serving Dhaka’s offices since 2010",
    order: 0,
  },
  {
    id: "trust-person",
    icon: "headset",
    title: "A real person helps you",
    detail: "Call or WhatsApp 01823-232241",
    order: 1,
  },
  {
    id: "trust-price",
    icon: "badge-check",
    title: "Price confirmed first",
    detail: "No payment until you agree",
    order: 2,
  },
  {
    id: "trust-pay",
    icon: "wallet",
    title: "Pay the way you prefer",
    detail: "Bank, bKash, Nagad or at our office",
    order: 3,
  },
];

/** The six core values from the PRD brand identity (Why WAAFA and About Us). */
export const values: In<typeof ValueCardSchema>[] = [
  {
    id: "value-trust",
    icon: "shield-check",
    title: "Trust",
    body: "Every relationship starts with it. We tell you the price and the rules before you pay.",
    order: 0,
  },
  {
    id: "value-quality",
    icon: "award",
    title: "Quality",
    body: "Dependable products and service that meet office and traveller expectations.",
    order: 1,
  },
  {
    id: "value-innovation",
    icon: "lightbulb",
    title: "Innovation",
    body: "Smarter tools and new services, from Find by model to online visa tracking.",
    order: 2,
  },
  {
    id: "value-excellence",
    icon: "gem",
    title: "Excellence",
    body: "Care in every step: product, service, communication and follow-up.",
    order: 3,
  },
  {
    id: "value-integrity",
    icon: "handshake",
    title: "Integrity",
    body: "Honest, ethical business. Prices labelled clearly, nothing hidden.",
    order: 4,
  },
  {
    id: "value-global",
    icon: "globe",
    title: "Global vision",
    body: "Connecting Bangladesh with the wider world through travel and trade.",
    order: 5,
  },
];

export const timeline: In<typeof TimelineEventSchema>[] = [
  {
    id: "tl-2010",
    period: "2010",
    text: "Waafa International starts in Motijheel, supplying printing products and toner to Dhaka’s offices.",
    order: 0,
  },
  {
    id: "tl-2010-2025",
    period: "2010–2025",
    text: "Long-term corporate clients, built on trust, delivery on time and honest prices.",
    order: 1,
  },
  {
    id: "tl-2026",
    period: "2026",
    text: "A new chapter: Waafa Tours and Travel, visas, international trading and the Waafas World store.",
    order: 2,
  },
  {
    id: "tl-next",
    period: "Next",
    text: "Live flight booking, and more of Bangladesh connected with the world.",
    order: 3,
  },
];

export const destinations: In<typeof DestinationSchema>[] = [
  {
    id: "dest-maldives",
    slug: "maldives",
    name: "Maldives",
    subtitle: "Island resorts · Maldives",
    iata: "MLE",
    image: photo("maldives-alt"),
    flightTime: "About 4 hours by air",
    visaNote: "Free visa on arrival",
    visaEasy: true,
    bestSeason: "November to April",
    fromPrice: 64900,
    tags: ["visa", "beach"],
    order: 0,
    sample: true,
  },
  {
    id: "dest-kathmandu",
    slug: "kathmandu",
    name: "Kathmandu",
    subtitle: "Mountains and old towns · Nepal",
    iata: "KTM",
    image: photo("nepal"),
    flightTime: "About 1 hour by air",
    visaNote: "Free visa on arrival",
    visaEasy: true,
    bestSeason: "October to December",
    fromPrice: 38500,
    tags: ["visa", "short", "city", "mountain"],
    order: 1,
    sample: true,
  },
  {
    id: "dest-coxs-bazar",
    slug: "coxs-bazar",
    name: "Cox’s Bazar",
    subtitle: "Sea beach · Bangladesh",
    iata: "CXB",
    image: photo("coxsbazar"),
    flightTime: "About 1 hour by air",
    visaNote: "No visa needed",
    visaEasy: true,
    bestSeason: "November to February",
    fromPrice: 12900,
    tags: ["visa", "short", "beach", "domestic"],
    order: 2,
    sample: true,
  },
  {
    id: "dest-bangkok",
    slug: "bangkok",
    name: "Bangkok",
    subtitle: "City and islands · Thailand",
    iata: "BKK",
    image: photo("thailand-alt"),
    flightTime: "About 2.5 hours by air",
    visaNote: "Visa needed; we apply",
    visaEasy: false,
    bestSeason: "November to February",
    fromPrice: 42000,
    tags: ["short", "beach", "city"],
    order: 3,
    sample: true,
  },
  {
    id: "dest-dubai",
    slug: "dubai",
    name: "Dubai",
    subtitle: "City and desert · UAE",
    iata: "DXB",
    image: photo("dubai"),
    flightTime: "About 5 hours by air",
    visaNote: "Visa needed; we apply",
    visaEasy: false,
    bestSeason: "November to March",
    fromPrice: 52000,
    tags: ["city"],
    order: 4,
    sample: true,
  },
  {
    id: "dest-singapore",
    slug: "singapore",
    name: "Singapore",
    subtitle: "City and gardens · Singapore",
    iata: "SIN",
    image: photo("singapore"),
    flightTime: "About 4 hours by air",
    visaNote: "Visa needed; we apply",
    visaEasy: false,
    bestSeason: "All year",
    fromPrice: 58000,
    tags: ["city"],
    order: 5,
    sample: true,
  },
];

/* ------------------------------------------------------------------------------------------------
 * Gallery (FR-GAL). Stock photos stand in until Waafa’s own trip photos are uploaded in Admin, so
 * albums are named after places, not invented customer trips.
 * ---------------------------------------------------------------------------------------------- */

export const galleryAlbums: In<typeof GalleryAlbumSchema>[] = [
  {
    id: "album-sajek",
    slug: "sajek-valley",
    title: "Sajek Valley",
    category: "tours",
    cover: photo("sajek"),
    items: [
      {
        kind: "photo",
        id: "g-sajek-1",
        image: photo("sajek"),
        caption: "Sajek Valley above the clouds",
      },
      { kind: "photo", id: "g-sajek-2", image: photo("sajek-alt") },
    ],
    publishedAt: "2026-09-20",
    sample: true,
  },
  {
    id: "album-coxs-bazar",
    slug: "coxs-bazar",
    title: "Cox’s Bazar",
    category: "tours",
    cover: photo("coxsbazar"),
    items: [
      { kind: "photo", id: "g-cox-1", image: photo("coxsbazar") },
      { kind: "photo", id: "g-cox-2", image: photo("coxsbazar-alt") },
    ],
    publishedAt: "2026-08-30",
    sample: true,
  },
  {
    id: "album-nepal",
    slug: "nepal",
    title: "Kathmandu and Pokhara",
    category: "tours",
    cover: photo("nepal"),
    items: [
      { kind: "photo", id: "g-nepal-1", image: photo("nepal") },
      { kind: "photo", id: "g-nepal-2", image: photo("nepal-alt") },
    ],
    publishedAt: "2026-05-28",
    sample: true,
  },
  {
    id: "album-international",
    slug: "around-the-world",
    title: "Around the world",
    category: "travellers",
    cover: photo("cappadocia"),
    items: [
      { kind: "photo", id: "g-world-1", image: photo("cappadocia") },
      { kind: "photo", id: "g-world-2", image: photo("cappadocia-alt") },
      { kind: "photo", id: "g-world-3", image: photo("bali") },
      { kind: "photo", id: "g-world-4", image: photo("maldives-alt") },
      { kind: "photo", id: "g-world-5", image: photo("dubai-desert") },
      { kind: "photo", id: "g-world-6", image: photo("thailand-alt") },
      { kind: "photo", id: "g-world-7", image: photo("singapore") },
      { kind: "photo", id: "g-world-8", image: photo("kualalumpur") },
    ],
    publishedAt: "2026-04-15",
    sample: true,
  },
];

/**
 * Feedback moderation queue (FR-FDB). Pending only: nothing here is ever shown publicly, and WAAFA
 * never invents reviews. Names and contacts are obviously fictional examples for the admin screens.
 */
export const feedback: In<typeof FeedbackSchema>[] = [
  {
    id: "fb-sample-1",
    name: "Sample Customer",
    contact: "sample.customer@example.com",
    service: "visa",
    rating: 5,
    comment:
      "Sample feedback for the moderation screen. Real feedback arrives through the form and waits here for approval.",
    consentToPublish: true,
    status: "pending",
    submittedAt: "2026-10-08T19:12:00+06:00",
    sample: true,
  },
  {
    id: "fb-sample-2",
    name: "Sample Traveller",
    contact: "sample.traveller@example.com",
    service: "packages",
    rating: 4,
    comment: "Sample feedback without consent to publish. It stays private even after review.",
    consentToPublish: false,
    status: "pending",
    submittedAt: "2026-10-07T11:40:00+06:00",
    sample: true,
  },
];

/**
 * Meet our team (FR-TEAM). Sample cards from the prototype, initials only (no stock faces), until the
 * owner supplies real staff who agree to appear.
 */
export const team: In<typeof TeamMemberSchema>[] = [
  {
    id: "team-nj",
    name: "Nusrat Jahan",
    initials: "NJ",
    designation: "Head of Travel Sales",
    department: "Travel",
    bio: "Plans family holidays and group trips, from the first idea to the last transfer.",
    featured: true,
    visible: true,
    order: 0,
    sample: true,
  },
  {
    id: "team-ta",
    name: "Tanvir Ahmed",
    initials: "TA",
    designation: "Visa Officer",
    department: "Visa",
    bio: "Checks every page of your file before it reaches an embassy, so nothing comes back for a missing paper.",
    visible: true,
    order: 1,
    sample: true,
  },
  {
    id: "team-sr",
    name: "Sadia Rahman",
    initials: "SR",
    designation: "Travel Consultant",
    department: "Travel",
    bio: "Finds the fare that fits your dates and explains baggage and change rules in plain words.",
    visible: true,
    order: 2,
    sample: true,
  },
  {
    id: "team-mk",
    name: "Mahmudul Karim",
    initials: "MK",
    designation: "Store Manager",
    department: "Waafas World",
    bio: "Runs Waafas World, from office supplies to gadgets, and knows which toner fits which printer.",
    visible: true,
    order: 3,
    sample: true,
  },
  {
    id: "team-fh",
    name: "Farzana Haque",
    initials: "FH",
    designation: "Accounts and Payments",
    department: "Accounts",
    bio: "Confirms bKash, Nagad and bank payments and makes sure every receipt is right.",
    visible: true,
    order: 4,
    sample: true,
  },
];

/* ------------------------------------------------------------------------------------------------
 * Baggage Information and EMI (FR-PAGE)
 * ---------------------------------------------------------------------------------------------- */

const VERIFIED = "2026-10-01";

function bag(
  airlineCode: string,
  airlineName: string,
  scope: "domestic" | "international",
  cabinAllowance: string,
  checkedAllowance: string,
  notes: string,
): In<typeof BaggageRuleSchema> {
  return {
    id: `bag-${airlineCode.toLowerCase()}-${scope === "domestic" ? "dom" : "intl"}`,
    airlineCode,
    airlineName,
    scope,
    cabinClass: "economy",
    cabinAllowance,
    checkedAllowance,
    notes,
    lastVerified: VERIFIED,
    sample: true,
  };
}

/** Typical economy allowances from the prototype; the e-ticket is always the final word. */
export const baggageRules: In<typeof BaggageRuleSchema>[] = [
  bag(
    "BG",
    "Biman Bangladesh Airlines",
    "domestic",
    "7 kg",
    "20 kg",
    "Domestic fares usually include 20 kg.",
  ),
  bag(
    "BS",
    "US-Bangla Airlines",
    "domestic",
    "7 kg",
    "20 kg",
    "Domestic fares usually include 20 kg.",
  ),
  bag("VQ", "NOVOAIR", "domestic", "7 kg", "20 kg", "Domestic routes only."),
  bag("2A", "Air Astra", "domestic", "7 kg", "20 kg", "Domestic routes only."),
  bag(
    "BG",
    "Biman Bangladesh Airlines",
    "international",
    "7 kg",
    "20 to 30 kg",
    "Varies by route; Middle East routes often allow more.",
  ),
  bag(
    "BS",
    "US-Bangla Airlines",
    "international",
    "7 kg",
    "20 to 30 kg",
    "Varies by route and fare.",
  ),
  bag(
    "EK",
    "Emirates",
    "international",
    "7 kg",
    "25 to 35 kg",
    "Depends on the fare type you buy.",
  ),
  bag(
    "QR",
    "Qatar Airways",
    "international",
    "7 kg",
    "25 to 30 kg",
    "Depends on the fare type you buy.",
  ),
  bag(
    "SQ",
    "Singapore Airlines",
    "international",
    "7 kg",
    "25 to 30 kg",
    "Depends on the fare type you buy.",
  ),
  bag(
    "MH",
    "Malaysia Airlines",
    "international",
    "7 kg",
    "20 to 30 kg",
    "Some Lite fares have no checked bag.",
  ),
  bag(
    "TK",
    "Turkish Airlines",
    "international",
    "8 kg",
    "20 to 30 kg",
    "Depends on the fare type you buy.",
  ),
  bag(
    "G9",
    "Air Arabia",
    "international",
    "7 kg",
    "Bought with the fare",
    "Low-cost: choose a bag when booking.",
  ),
  bag("6E", "IndiGo", "international", "7 kg", "20 to 30 kg", "Depends on route and fare."),
];

/**
 * EMI partner banks are listed once agreements are live (Emi board). Until then this list stays empty
 * and the page shows the sample rules with "ask us which cards qualify".
 */
export const emiBanks: In<typeof EmiBankSchema>[] = [];

/* Service pages inside Waafas World (A15): copy from the Printing and Trading boards, edited in Admin › Pages. */
export const servicePages: In<typeof ServicePageSchema>[] = [
  {
    key: "printing",
    kicker: "Waafa International · Printing Solutions",
    title: "Printing that keeps working",
    lead: "Toner on a schedule, printer servicing and one monthly invoice for every branch. Serving Dhaka’s offices since 2010.",
    primaryCta: "Request a quote",
    whatsappMessage: "Hi Waafa, I’d like a quote for printing solutions.",
    facts: [
      { value: "Since 2010", label: "serving offices in Dhaka" },
      { value: "One invoice", label: "for every branch" },
      { value: "Motijheel", label: "an office you can visit" },
    ],
    headerSlot: "printing-header",
    formSlot: "printing-quote-side",
    servicesTitle: "Services",
    services: [
      {
        title: "Toner on a schedule",
        body: "We track your usage and deliver toner before it runs out, at a fixed price.",
      },
      {
        title: "Servicing and repair",
        body: "On-site checks and repairs for laser printers and copiers.",
      },
      { title: "New printers", body: "The right printer for each desk, delivered and set up." },
      {
        title: "One monthly invoice",
        body: "All branches on one bill, with a clear breakdown per printer.",
      },
    ],
    stepsTitle: "From first call to a running plan",
    steps: [
      {
        title: "Tell us about your printers",
        body: "Models, branches and roughly how many pages you print",
      },
      { title: "We visit and propose a plan", body: "Usually within a week, at no cost" },
      { title: "You approve a fixed monthly price", body: "No surprise charges" },
      { title: "We keep you supplied", body: "Toner arrives before it runs out" },
    ],
    formTitle: "Request a quote",
    formLead: "We usually reply within one working day, Saturday to Thursday.",
    questions: [
      {
        question: "Do you work with small offices?",
        answer: "Yes. Many of our clients have five printers or fewer.",
      },
      {
        question: "Can you supply original and compatible toner?",
        answer: "Yes. Every quote says which one you get, and you can mix both.",
      },
      {
        question: "Do you service printers outside Dhaka?",
        answer:
          "Inside Dhaka on site; outside Dhaka by courier or with a local partner. Ask us for your city.",
      },
    ],
    seo: {
      title: "Printing Solutions · toner, servicing and one monthly invoice",
      description:
        "Toner on a schedule, printer servicing and a single monthly invoice for every branch, from Waafa International in Motijheel, Dhaka.",
      noIndex: false,
    },
    sample: true,
  },
  {
    key: "trading",
    kicker: "Waafa International · International Trading",
    title: "Sourcing and trade, handled for you",
    lead: "Export, import and sourcing for Bangladeshi businesses. Tell us what you need to buy or sell; we find suppliers, compare quotes and coordinate shipping.",
    primaryCta: "Send an RFQ",
    whatsappMessage: "Hi Waafa, I’d like to send a request for quotation.",
    facts: [
      { value: "Waafa International", label: "trading since 2026" },
      { value: "One contact", label: "from quote to delivery" },
      { value: "Motijheel", label: "an office you can visit" },
    ],
    headerSlot: "trading-header",
    formSlot: "trading-rfq-side",
    servicesTitle: "Services",
    services: [
      {
        title: "Find suppliers",
        body: "We shortlist suppliers abroad and compare their quotes for you.",
      },
      {
        title: "Import to Bangladesh",
        body: "From order to delivery at your warehouse, with one point of contact.",
      },
      {
        title: "Export from Bangladesh",
        body: "We connect Bangladeshi products with buyers abroad.",
      },
      {
        title: "Quality checks",
        body: "Samples and pre-shipment checks before you pay the balance.",
      },
    ],
    stepsTitle: "From first request to delivery",
    steps: [
      { title: "Send a request for quotation", body: "Product, quantity and where it goes" },
      { title: "We compare suppliers", body: "Usually 3 to 5 working days" },
      { title: "You choose and confirm", body: "Price, terms and delivery date" },
      { title: "We coordinate shipping", body: "And keep you updated until delivery" },
    ],
    formTitle: "Request for quotation",
    formLead: "We usually reply within one working day, Saturday to Thursday.",
    questions: [
      {
        question: "What can you source?",
        answer:
          "Office supplies, paper, printing consumables and general goods. Tell us what you need and we will say honestly if we can help.",
      },
      {
        question: "Is there a minimum order?",
        answer: "It depends on the product and supplier. We tell you the minimum in the quote.",
      },
      {
        question: "Do you handle customs?",
        answer:
          "We coordinate shipping and clearance with our logistics partners and explain each cost before you confirm.",
      },
    ],
    seo: {
      title: "International Trading · import, export and sourcing",
      description:
        "Import, export and supplier sourcing for Bangladeshi businesses: send a request for quotation to Waafa International in Motijheel, Dhaka.",
      noIndex: false,
    },
    sample: true,
  },
];

/* Information page cards (A16), edited in Admin › Content › Page blocks. Copy from the About, Baggage, Emi and
 * OfflinePay boards. Baggage rules are general guidance; the e-ticket is the final word (said on the page). */
export const pageBlocks: In<typeof PageBlockSchema>[] = [
  {
    id: "about-travel",
    page: "about",
    group: "services",
    icon: "plane",
    title: "Waafa Tours and Travel",
    body: "Flights, hotels, tour packages and group fares, with an expert who confirms every fare before you pay.",
    link: { label: "Plan a trip", href: "/plan-my-trip" },
    order: 0,
    sample: true,
  },
  {
    id: "about-visa",
    page: "about",
    group: "services",
    icon: "stamp",
    title: "Visa services",
    body: "Tourist, business, student, medical and transit visas, with a document check before anything reaches an embassy.",
    link: { label: "Check a country", href: "/visa-services" },
    order: 1,
    sample: true,
  },
  {
    id: "about-store",
    page: "about",
    group: "services",
    icon: "shopping-bag",
    title: "Waafas World",
    body: "Our online store at waafasworld.com: office supplies, electronics, fashion and more, with cash on delivery.",
    link: { label: "Open the store", href: "/shop" },
    order: 2,
    sample: true,
  },
  {
    id: "about-printing",
    page: "about",
    group: "services",
    icon: "printer",
    title: "Printing and trading",
    body: "Printing Solutions for offices, and International Trading: import, export and sourcing on request.",
    link: { label: "Get a quote", href: "/shop/printing-solutions" },
    order: 3,
    sample: true,
  },
  {
    id: "about-routes",
    page: "about",
    group: "routes",
    icon: "globe",
    title: "Popular routes from Dhaka",
    body: "Tell us where you want to go and a travel expert compares the airlines for your dates.",
    link: { label: "Ask for a fare", href: "/flights" },
    order: 0,
    sample: true,
  },
  {
    id: "baggage-personal",
    page: "baggage",
    group: "facts",
    icon: "briefcase",
    title: "Personal item",
    body: "Handbag or laptop bag under the seat",
    order: 0,
    sample: true,
  },
  {
    id: "baggage-cabin",
    page: "baggage",
    group: "facts",
    icon: "luggage",
    title: "7 kg cabin bag",
    body: "Usually up to 55 × 40 × 20 cm",
    order: 1,
    sample: true,
  },
  {
    id: "baggage-checked",
    page: "baggage",
    group: "facts",
    icon: "scale",
    title: "20 to 30 kg checked",
    body: "One or two bags, by airline and fare",
    order: 2,
    sample: true,
  },
  {
    id: "baggage-extra",
    page: "baggage",
    group: "facts",
    icon: "wallet",
    title: "Extra kilos",
    body: "Cheaper bought with the ticket than at the airport",
    order: 3,
    sample: true,
  },
  {
    id: "baggage-power-banks",
    page: "baggage",
    group: "rules",
    icon: "battery-charging",
    title: "Power banks: cabin bag only",
    body: "Up to 100 Wh is fine; 100 to 160 Wh needs the airline’s approval; over 160 Wh is not allowed. The Wh rating is on the label.",
    link: { label: "Cabin-safe power banks", href: "/shop/c/power-banks" },
    tone: "warning",
    order: 0,
    sample: true,
  },
  {
    id: "baggage-liquids",
    page: "baggage",
    group: "rules",
    icon: "droplets",
    title: "Liquids: 100 ml each",
    body: "On international flights, liquids in the cabin go in containers of 100 ml or less, all in one clear 1-litre bag.",
    order: 1,
    sample: true,
  },
  {
    id: "baggage-medicines",
    page: "baggage",
    group: "rules",
    icon: "pill",
    title: "Medicines with you",
    body: "Keep medicines in the cabin with the prescription, especially for insulin or anything in liquid form.",
    order: 2,
    sample: true,
  },
  {
    id: "baggage-flammables",
    page: "baggage",
    group: "rules",
    icon: "flame",
    title: "Never: flammables",
    body: "Lighter fluid, fireworks, gas canisters and strong chemicals are not allowed in any bag.",
    tone: "danger",
    order: 3,
    sample: true,
  },
  {
    id: "baggage-batteries",
    page: "baggage",
    group: "rules",
    icon: "zap",
    title: "Never in checked bags: spare batteries",
    body: "Spare lithium batteries, e-cigarettes and smart bags with fixed batteries must travel in the cabin.",
    tone: "danger",
    order: 4,
    sample: true,
  },
  {
    id: "baggage-valuables",
    page: "baggage",
    group: "rules",
    icon: "gem",
    title: "Fragile and valuable",
    body: "Keep jewellery, cash, documents and laptops in your cabin bag. Airlines limit what they pay for in checked bags.",
    order: 5,
    sample: true,
  },
  {
    id: "emi-choose",
    page: "emi",
    group: "steps",
    icon: "package",
    title: "Choose your trip or order",
    body: "Send a request as usual. Tell your expert you want to pay by EMI, and for how many months.",
    order: 0,
    sample: true,
  },
  {
    id: "emi-card",
    page: "emi",
    group: "steps",
    icon: "credit-card",
    title: "Pay with your credit card",
    body: "We take the full amount on your partner bank credit card at our office or by a secure payment link.",
    order: 1,
    sample: true,
  },
  {
    id: "emi-bank",
    page: "emi",
    group: "steps",
    icon: "landmark",
    title: "Your bank splits it",
    body: "The bank turns it into monthly instalments on your card statement, usually within 7 working days.",
    order: 2,
    sample: true,
  },
  {
    id: "offline-wait",
    page: "offline-payment",
    group: "steps",
    icon: "clock",
    title: "Wait for the confirmed price",
    body: "Pay only after your expert confirms the final price, or after you place a Waafas World order.",
    order: 0,
    sample: true,
  },
  {
    id: "offline-reference",
    page: "offline-payment",
    group: "steps",
    icon: "receipt",
    title: "Pay with your reference",
    body: "Use the reference number (for example FLT-261008-0042 or ORD-261008-0042) as the payment note.",
    order: 1,
    sample: true,
  },
  {
    id: "offline-proof",
    page: "offline-payment",
    group: "steps",
    icon: "upload",
    title: "Send the proof",
    body: "Upload the slip or screenshot below. We confirm by SMS, usually within an hour in office hours.",
    order: 2,
    sample: true,
  },
];

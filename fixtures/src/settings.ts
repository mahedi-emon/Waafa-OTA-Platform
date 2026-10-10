import type {
  AnnouncementSchema,
  BookingModesSchema,
  ContactSettingsSchema,
  EmiSettingsSchema,
  FooterSettingsSchema,
  HomeContentSchema,
  HomeSectionSchema,
  LeadFormSettingsSchema,
  MaintenanceSettingsSchema,
  MenuSchema,
  NotificationTemplateSchema,
  PaymentSettingsSchema,
  SearchSettingsSchema,
  ShippingSettingsSchema,
  SiteSettingsSchema,
  TrackingSettingsSchema,
} from "@waafa/shared";
import type { In } from "./input";

/** Admin > Settings > General. Brand names and tagline come from the PRD brand identity. */
export const siteSettings: In<typeof SiteSettingsSchema> = {
  travelBrand: "Waafa Tours and Travel",
  storeName: "Waafas World",
  companyName: "Waafa International",
  footerTagline: "Connecting the World, Creating the Future.",
  footerAbout:
    "Waafa International has served Dhaka’s offices since 2010. In 2026 we opened Waafa Tours and Travel: flights, holidays and visas from the same Motijheel office.",
  storeIntro:
    "Waafa International’s online store. Printer and office supplies today, more of what you need every month. Cash on delivery across Bangladesh.",
  accountsLive: false,
  defaultSeo: {
    title: "Waafa Tours and Travel · Flights, tours and visas from Dhaka",
    description:
      "Flights, hotels, tour packages and visas from our Motijheel office, plus Waafas World, Waafa International’s online store. A real person confirms every price.",
  },
  reviewsUrl: "https://www.facebook.com/waafatoursandtravel",
};

/** Public contact details from PRD §2 (the company’s Facebook page). Never hard-coded in components. */
export const contactSettings: In<typeof ContactSettingsSchema> = {
  addressLines: [
    "193/C-1, 4th Floor, East Side, Motijheel Plaza",
    "Aziz Square, Box Kalvat Road, PS Motijheel",
  ],
  city: "Dhaka",
  country: "Bangladesh",
  phoneDisplay: "01823-232241",
  phoneE164: "+8801823232241",
  whatsappE164: "+8801823232241",
  email: "info@waafasworld.com",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Motijheel%20Plaza%2C%20Aziz%20Square%2C%20Motijheel%2C%20Dhaka",
  // Saturday to Thursday, 10 am to 6 pm, Asia/Dhaka. 0 = Sunday … 6 = Saturday; Friday (5) is closed.
  officeHours: { opensAt: 600, closesAt: 1080, days: [6, 0, 1, 2, 3, 4] },
  officeHoursText: "Saturday to Thursday, 10 am to 6 pm",
  closedText: "Closed on Friday",
  helpLine: "Talk to a travel expert in Motijheel",
  visitLabel: "Motijheel Plaza, 4th floor",
  whatsappMessage: "Hello WAAFA, I have a question about {page}.",
  socials: [{ network: "facebook", url: "https://www.facebook.com/waafatoursandtravel" }],
};

/** Header, More panel, footer columns and legal links (PRD §6, FR-FTR-02). Routes follow the PRD sitemap. */
export const menus: In<typeof MenuSchema>[] = [
  {
    key: "header",
    items: [
      { id: "home", label: "Home", href: "/", icon: "house" },
      { id: "packages", label: "Tour Packages", href: "/tour-packages", icon: "map" },
      { id: "visa", label: "Visa Services", href: "/visa-services", icon: "stamp" },
      { id: "shop", label: "Waafas World", href: "/shop", icon: "shopping-bag", panel: "shop" },
      { id: "gallery", label: "Gallery", href: "/gallery", icon: "images" },
      { id: "feedback", label: "Feedback", href: "/feedback", icon: "message-square-quote" },
      { id: "more", label: "More", icon: "layout-grid", panel: "more" },
    ],
  },
  {
    key: "more",
    items: [
      {
        id: "visa-guide",
        label: "Visa Guide",
        href: "/visa-guide",
        icon: "book-open",
        description: "Documents, fees and processing times by country",
      },
      {
        id: "refund",
        label: "Refund Policy",
        href: "/refund-policy",
        icon: "undo-2",
        description: "How cancellations and refunds work",
      },
      {
        id: "baggage",
        label: "Baggage Information",
        href: "/baggage-information",
        icon: "luggage",
        description: "Cabin and checked allowance by airline",
      },
      {
        id: "emi",
        label: "EMI",
        href: "/emi",
        icon: "calendar-range",
        description: "Split trip costs into monthly instalments",
      },
      {
        id: "offline-payment",
        label: "Offline Payment",
        href: "/offline-payment",
        icon: "landmark",
        description: "Bank transfer, mobile banking or pay at our office",
      },
      {
        id: "blog",
        label: "Blogs",
        href: "/blog",
        icon: "newspaper",
        description: "Travel tips, guides and stories",
      },
      {
        id: "faqs",
        label: "FAQs",
        href: "/faqs",
        icon: "circle-help",
        description: "Answers to common questions",
      },
      {
        id: "about",
        label: "About Us",
        href: "/about-us",
        icon: "building-2",
        description: "Our story since 2010",
      },
      {
        id: "contact",
        label: "Contact",
        href: "/contact",
        icon: "phone",
        description: "Call, WhatsApp, email or visit us",
      },
    ],
  },
  {
    key: "drawer",
    items: [
      { id: "dr-home", label: "Home", href: "/", icon: "house" },
      { id: "dr-flights", label: "Flights", href: "/flights", icon: "plane" },
      { id: "dr-hotels", label: "Hotels", href: "/hotels", icon: "bed-double" },
      { id: "dr-packages", label: "Tour Packages", href: "/tour-packages", icon: "map" },
      { id: "dr-visa", label: "Visa Services", href: "/visa-services", icon: "stamp" },
      { id: "dr-shop", label: "Waafas World", href: "/shop", icon: "shopping-bag" },
      { id: "dr-gallery", label: "Gallery", href: "/gallery", icon: "images" },
      { id: "dr-feedback", label: "Feedback", href: "/feedback", icon: "message-square-quote" },
    ],
  },
  {
    key: "tabbar",
    items: [
      { id: "tb-home", label: "Home", href: "/", icon: "house" },
      { id: "tb-packages", label: "Packages", href: "/tour-packages", icon: "map" },
      { id: "tb-shop", label: "Waafas World", href: "/shop", icon: "shopping-bag" },
      { id: "tb-visa", label: "Visa", href: "/visa-services", icon: "stamp" },
      { id: "tb-more", label: "More", icon: "layout-grid", panel: "more" },
    ],
  },
  {
    key: "more-phone",
    items: [
      { id: "mp-gallery", label: "Gallery", href: "/gallery", icon: "images" },
      { id: "mp-feedback", label: "Feedback", href: "/feedback", icon: "message-square-quote" },
      { id: "mp-track", label: "Track order", href: "/shop/track", icon: "truck" },
    ],
  },
  {
    key: "shop-panel",
    items: [
      {
        id: "sp-printing",
        label: "Printing Solutions",
        href: "/shop/printing-solutions",
        icon: "layers",
        description: "Managed printing and toner supply for offices, since 2010.",
        cta: "Get a quote",
      },
      {
        id: "sp-trading",
        label: "International Trading",
        href: "/shop/international-trading",
        icon: "ship",
        description: "Export, import, sourcing and supply.",
        cta: "Send an RFQ",
      },
      {
        id: "sp-finder",
        label: "Find by model",
        href: "/shop/finder",
        icon: "scan-search",
        description: "Toner and ink that fit your printer.",
        cta: "Start",
      },
    ],
  },
  {
    key: "footer-travel",
    items: [
      { id: "ft-flights", label: "Flights", href: "/flights" },
      { id: "ft-hotels", label: "Hotels", href: "/hotels" },
      { id: "ft-packages", label: "Tour Packages", href: "/tour-packages" },
      { id: "ft-visa", label: "Visa Services", href: "/visa-services" },
      { id: "ft-group-fares", label: "Group Fares", href: "/flights/group-fares" },
      { id: "ft-plan", label: "Plan My Trip", href: "/plan-my-trip" },
    ],
  },
  {
    key: "footer-shop",
    items: [
      { id: "fs-all", label: "Shop all products", href: "/shop" },
      { id: "fs-printers", label: "Printers & Supplies", href: "/shop/c/printers-and-supplies" },
      { id: "fs-office", label: "Office & Stationery", href: "/shop/c/office-and-stationery" },
      {
        id: "fs-electronics",
        label: "Electronics & Gadgets",
        href: "/shop/c/electronics-and-gadgets",
      },
      { id: "fs-printing", label: "Printing Solutions", href: "/shop/printing-solutions" },
      { id: "fs-trading", label: "International Trading", href: "/shop/international-trading" },
      { id: "fs-track", label: "Track Order", href: "/shop/track" },
    ],
  },
  {
    key: "footer-help",
    items: [
      { id: "fh-visa-guide", label: "Visa Guide", href: "/visa-guide" },
      { id: "fh-baggage", label: "Baggage Information", href: "/baggage-information" },
      { id: "fh-emi", label: "EMI", href: "/emi" },
      { id: "fh-offline", label: "Offline Payment", href: "/offline-payment" },
      { id: "fh-faqs", label: "FAQs", href: "/faqs" },
      { id: "fh-refund", label: "Refund Policy", href: "/refund-policy" },
      { id: "fh-contact", label: "Contact", href: "/contact" },
    ],
  },
  {
    key: "legal",
    items: [
      { id: "privacy", label: "Privacy", href: "/privacy-policy" },
      { id: "terms", label: "Terms", href: "/terms-and-conditions" },
      { id: "refund-short", label: "Refund", href: "/refund-policy" },
    ],
  },
];

/** Admin > Settings > Footer (FR-FTR). Card payments stay hidden until SSLCommerz is live (FR-FTR-04). */
export const footerSettings: In<typeof FooterSettingsSchema> = {
  columns: [
    { title: "Travel", menu: "footer-travel" },
    { title: "Waafas World", menu: "footer-shop" },
    { title: "Help", menu: "footer-help" },
  ],
  paymentMethods: [
    { id: "bank", label: "Bank transfer", enabled: true },
    { id: "bkash", label: "bKash", enabled: true },
    { id: "nagad", label: "Nagad", enabled: true },
    { id: "office", label: "Pay at our office", enabled: true },
    { id: "cod", label: "Cash on delivery", enabled: true, note: "Waafas World" },
    {
      id: "card",
      label: "Visa, Mastercard, Amex",
      enabled: false,
      note: "Shows when SSLCommerz is live",
    },
  ],
  paymentNote: "Card and online payments appear here once they are live.",
  // ATAB, TOAB and IATA badges appear only once the company holds them (FR-FTR-04).
  trustBadges: [],
  newsletterTitle: "Fare drops and visa news, once a month",
  newsletterPlaceholder: "Your email address",
  newsletterButton: "Subscribe",
  copyrightHolder: "Waafa Tours and Travel and Waafa International",
};

export const announcements: In<typeof AnnouncementSchema>[] = [
  {
    id: "ann-winter-group-fares",
    text: "Winter group fares to Dubai, Kuala Lumpur, Singapore and Bangkok: fixed seats, price confirmed before you pay.",
    link: { label: "See group fares", href: "/flights/group-fares" },
    startsAt: "2026-10-01T00:00:00+06:00",
    endsAt: "2026-12-15T23:59:00+06:00",
    enabled: true,
    sample: true,
  },
];

/** The Golden Switch at launch: every module Manual, Live locked with its reason (FR-GS-03). */
export const bookingModes: In<typeof BookingModesSchema> = [
  {
    module: "flights",
    mode: "manual",
    liveLocked: true,
    lockReason: "No flight provider is connected yet",
    updatedAt: "2026-10-07T18:40:00+06:00",
  },
  {
    module: "hotels",
    mode: "manual",
    liveLocked: true,
    lockReason: "No hotel provider is connected yet",
    updatedAt: "2026-10-07T18:40:00+06:00",
  },
  {
    module: "packages",
    mode: "manual",
    liveLocked: true,
    lockReason: "Online payment is not live yet",
    updatedAt: "2026-10-07T18:40:00+06:00",
  },
  {
    module: "shopPayment",
    mode: "manual",
    liveLocked: true,
    lockReason: "No merchant account is live yet",
    updatedAt: "2026-10-07T18:40:00+06:00",
  },
];

/**
 * Offline payment accounts. Real account numbers are entered by Accounts in Admin > Payments; the bracketed
 * lines are placeholders so no invented number ever looks payable.
 */
export const paymentSettings: In<typeof PaymentSettingsSchema> = {
  offlineAccounts: [
    {
      id: "acc-bank",
      kind: "bank",
      title: "Bank transfer",
      lines: [
        "Account name: Waafa International",
        "Bank and branch: [Set in Admin → Payments]",
        "Account number: [Set in Admin → Payments]",
        "Routing number: [Set in Admin → Payments]",
      ],
      instructions:
        "BEFTN transfers can take a working day to arrive. We confirm as soon as the money is in.",
      sample: true,
    },
    {
      id: "acc-bkash",
      kind: "bkash",
      title: "bKash",
      lines: ["Merchant number: [Set in Admin → Payments]", "Type: Payment (merchant)"],
      instructions:
        "Keep the transaction ID from the confirmation SMS. You will need it to send the proof.",
      sample: true,
    },
    {
      id: "acc-nagad",
      kind: "nagad",
      title: "Nagad",
      lines: ["Merchant number: [Set in Admin → Payments]", "Type: Payment (merchant)"],
      instructions:
        "Keep the transaction ID from the confirmation SMS. You will need it to send the proof.",
      sample: true,
    },
    {
      id: "acc-office",
      kind: "office",
      title: "Pay at our office",
      lines: [
        "193/C-1, 4th Floor, Motijheel Plaza",
        "Cash or card, Saturday to Thursday, 10 am to 6 pm",
      ],
      instructions: "You get a printed receipt on the spot. No proof upload needed.",
      sample: true,
    },
  ],
  codLimit: 20000,
  onlinePaymentLive: false,
};

export const shippingSettings: In<typeof ShippingSettingsSchema> = {
  zones: [
    {
      id: "zone-dhaka",
      name: "Inside Dhaka",
      areas: ["Dhaka"],
      charge: 80,
      estimate: "1 to 2 days",
    },
    {
      id: "zone-outside",
      name: "Outside Dhaka",
      areas: ["*"],
      charge: 150,
      estimate: "2 to 4 days by courier",
    },
  ],
  minimumOrder: 300,
  freeDeliveryThreshold: 3000,
  officePickup: true,
};

/** EMI rules shown on /emi (sample values from the Emi board, set in Admin). */
export const emiSettings: In<typeof EmiSettingsSchema> = {
  minimumAmount: 20000,
  tenuresMonths: [3, 6, 9, 12],
  cardsNote: "Credit cards from partner banks (not debit cards)",
  appliesTo: "Flights, tour packages, hotels and Waafas World orders",
  interestNote:
    "0% interest on partner bank credit cards for these tenures. Your bank may charge its own processing fee; we show it before you pay.",
  sample: true,
};

export const leadFormSettings: In<typeof LeadFormSettingsSchema> = {
  emailRequired: false,
  consentText:
    "I agree that Waafa Tours and Travel may contact me about this request by phone, WhatsApp or email.",
  slaMinutes: 30,
};

export const notificationTemplates: In<typeof NotificationTemplateSchema>[] = [
  {
    key: "lead-received-customer",
    audience: "Customer",
    channel: "email",
    subject: "Thanks, we got your request · {{reference}}",
    body: "Hi {{name}}, thank you! Our travel expert will contact you shortly with the best quotes for {{summary}}.\n\nYour reference is {{reference}}. Reply to this email or WhatsApp us on 01823-232241.",
    variables: ["{{name}}", "{{reference}}", "{{summary}}"],
    enabled: true,
  },
  {
    key: "lead-alert-staff",
    audience: "Staff, by module",
    channel: "email",
    subject: "New {{module}} lead {{reference}} · {{name}}",
    body: "A new {{module}} lead just arrived: {{summary}}.\n\nOpen it in Admin: {{link}}. Reply target: 30 minutes.",
    variables: ["{{module}}", "{{reference}}", "{{name}}", "{{summary}}", "{{link}}"],
    enabled: true,
  },
  {
    key: "order-placed-customer",
    audience: "Customer",
    channel: "email",
    subject: "Your Waafas World order {{order_number}}",
    body: "Hi {{name}}, we got your order {{order_number}} for {{total}}.\n\nWe’ll call to confirm before we ship. Track it any time with your order number and phone.",
    variables: ["{{name}}", "{{order_number}}", "{{total}}"],
    enabled: true,
  },
  {
    key: "order-placed-staff",
    audience: "Waafas World team",
    channel: "email",
    subject: "New order {{order_number}} · {{total}}",
    body: "{{name}} placed order {{order_number}} for {{total}}, paying by {{method}}.\n\nConfirm it in Admin: {{link}}.",
    variables: ["{{name}}", "{{order_number}}", "{{total}}", "{{method}}", "{{link}}"],
    enabled: true,
  },
  {
    key: "visa-status-customer",
    audience: "Customer",
    channel: "email",
    subject: "Your visa application {{reference}}: {{status}}",
    body: "Hi {{name}}, your {{country}} visa application is now {{status}}.\n\nIf we need anything else, we’ll tell you here and on WhatsApp.",
    variables: ["{{name}}", "{{reference}}", "{{country}}", "{{status}}"],
    enabled: true,
  },
  {
    key: "payment-proof-staff",
    audience: "Accounts",
    channel: "email",
    subject: "Payment proof for {{reference}}",
    body: "{{name}} sent a payment proof: {{amount}} by {{method}}, transaction {{trx_id}}.\n\nVerify it in Admin: {{link}}.",
    variables: ["{{name}}", "{{reference}}", "{{amount}}", "{{method}}", "{{trx_id}}", "{{link}}"],
    enabled: true,
  },
  {
    key: "feedback-received-staff",
    audience: "Content editors",
    channel: "email",
    subject: "New feedback to review",
    body: "{{name}} rated {{service}} {{stars}} stars.\n\nApprove or hide it in Admin: {{link}}.",
    variables: ["{{name}}", "{{service}}", "{{stars}}", "{{link}}"],
    enabled: true,
  },
  {
    key: "sign-in-code-customer",
    audience: "Customer",
    channel: "sms",
    subject: "Your Waafa code",
    body: "Your Waafa sign-in code is {{code}}. It expires in 5 minutes. Never share this code.",
    variables: ["{{code}}"],
    // Customer accounts and SMS arrive in Phase 1B (P1).
    enabled: false,
  },
];

export const maintenanceSettings: In<typeof MaintenanceSettingsSchema> = {
  enabled: false,
  message:
    "We’re updating the site and will be back shortly. For anything urgent, call or WhatsApp 01823-232241.",
};

/** Search card: From starts at Dhaka; popular chips match the Home search board. */
export const searchSettings: In<typeof SearchSettingsSchema> = {
  defaultOrigin: "DAC",
  popularFlights: ["CXB", "KUL", "CCU", "BKK", "SIN"],
  hotelNationalities: ["BD", "IN", "NP", "LK", "PK", "GB", "US"],
};

/** Home copy from the Home board (Content › Home). */
export const homeContent: In<typeof HomeContentSchema> = {
  hero: {
    title: "Tell us where.",
    titleAccent: "We’ll handle the rest.",
    lead: "Flights, hotels, holidays and visas. A real travel expert checks the price and the rules with you before you pay.",
    rotatingLabel: "Next stop",
    rotating: ["Bangkok", "Bali", "Dubai", "Kathmandu", "Maldives"],
  },
  why: {
    figure: "Since 2010",
    figureLabel: "Dependable service for Dhaka’s offices",
    body: "Waafa International began in 2010, serving Dhaka’s offices with printing and toner. In 2026 we opened Waafa Tours and Travel, with the same promise: people you can call, and an office you can visit.",
  },
  store: {
    title: "Everything for work and home, delivered",
    body: "Office supplies, electronics, fashion and more from the team that has served Dhaka’s offices since 2010. Pay cash on delivery anywhere in Bangladesh.",
    perks: ["Cash on delivery", "Next day in Dhaka", "Easy returns", "Corporate prices"],
  },
  reviews: {
    facebookTitle: "Read reviews on our Facebook page",
    facebookBody: "Real comments and photos from travellers, in their own words.",
    feedbackTitle: "Travelled with us? Tell us how it went",
    feedbackBody: "We only show reviews here with the traveller’s permission.",
  },
  cta: {
    title: "Not sure where to start?",
    body: "Send your dates and budget on WhatsApp. A travel expert replies with options you can compare, with no obligation to book.",
  },
};

/** Analytics IDs are entered by the owner in Admin; nothing loads until they exist. */
export const trackingSettings: In<typeof TrackingSettingsSchema> = {};

/** FR-HOME: the 13 sections in their default order; testimonials stay off until approved feedback exists. */
export const homeSections: In<typeof HomeSectionSchema>[] = [
  { key: "hero", enabled: true, order: 0 },
  { key: "trust", enabled: true, order: 1 },
  { key: "offers", enabled: true, order: 2, kicker: "This season", title: "Offers worth a look" },
  {
    key: "groupFares",
    enabled: true,
    order: 3,
    title: "Fixed-date seats at a fixed price",
    subtitle:
      "We hold seats with airlines in advance. If your date matches, these are the simplest fares to book: send the names as in each passport, pay, get your e-ticket.",
  },
  {
    key: "destinations",
    enabled: true,
    order: 4,
    title: "Find a trip that fits you",
    subtitle: "Filter by visa, flight time or the kind of trip. Prices are per person, from Dhaka.",
  },
  { key: "packages", enabled: true, order: 5, title: "Trips planned day by day" },
  {
    key: "visa",
    enabled: true,
    order: 6,
    title: "Visa files, prepared properly",
    subtitle:
      "Send photos of your papers on WhatsApp. We check them, fill in the forms, book the appointment and follow the file until the embassy decides.",
  },
  { key: "why", enabled: true, order: 7, title: "What we stand for" },
  { key: "store", enabled: true, order: 8 },
  { key: "testimonials", enabled: false, order: 9 },
  {
    key: "galleryBlogFaq",
    enabled: true,
    order: 10,
    title: "Trips, in travellers’ own photos",
    subtitle:
      "Shared with their permission. Until real ones are added in Admin, these are sample photos.",
  },
  {
    key: "team",
    enabled: true,
    order: 11,
    title: "The people behind WAAFA",
    subtitle:
      "Trip planners, visa specialists and the Waafas World team, all in one Motijheel office.",
  },
  { key: "cta", enabled: true, order: 12 },
];

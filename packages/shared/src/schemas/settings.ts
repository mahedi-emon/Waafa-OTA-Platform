import { z } from "zod";
import {
  EmailSchema,
  HrefSchema,
  ImageSchema,
  IsoDateTimeSchema,
  LinkSchema,
  SampleFlagSchema,
  SeoSchema,
  TakaSchema,
} from "./common";
import { MediaSlotKeySchema } from "./content";
import { IataSchema } from "./travel";

/** Days of the week as used for office hours (0 = Sunday … 6 = Saturday, like Date#getDay in Asia/Dhaka). */
export const WeekdaySchema = z.number().int().min(0).max(6);

export const OpeningHoursSchema = z
  .object({
    /** Minutes after midnight, Asia/Dhaka: 600 = 10:00, 1080 = 18:00. */
    opensAt: z.number().int().min(0).max(1439),
    closesAt: z.number().int().min(1).max(1440),
    days: z.array(WeekdaySchema).min(1),
  })
  .strict()
  .refine((hours) => hours.closesAt > hours.opensAt, {
    message: "Closing time must be after opening time",
  });

/** Public contact details (PRD §2): all editable in Admin > Settings > General and contact, never hard-coded. */
export const ContactSettingsSchema = z
  .object({
    addressLines: z.array(z.string().min(1)).min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    /** National format for display, e.g. "01823-232241". */
    phoneDisplay: z.string().min(1),
    /** E.164 for tel: and wa.me links, e.g. "+8801823232241". */
    phoneE164: z.string().regex(/^\+[1-9]\d{6,14}$/),
    whatsappE164: z.string().regex(/^\+[1-9]\d{6,14}$/),
    email: EmailSchema,
    mapUrl: z.url().optional(),
    officeHours: OpeningHoursSchema,
    /** Plain sentence shown next to the live Open/Closed chip, e.g. "Saturday to Thursday, 10 am to 6 pm". */
    officeHoursText: z.string().min(1),
    closedText: z.string().min(1),
    /** One line under "Need help?" in the help panel, e.g. "Talk to a travel expert in Motijheel". */
    helpLine: z.string().min(1).max(80),
    /** Short address for the help panel's Visit row, e.g. "Motijheel Plaza, 4th floor". */
    visitLabel: z.string().min(1).max(60),
    /** Prefilled WhatsApp message (FR-GLB-04); `{page}` becomes the current page's name. */
    whatsappMessage: z.string().min(1).max(160),
    socials: z
      .array(
        z
          .object({
            network: z.enum(["facebook", "instagram", "youtube", "linkedin", "tiktok", "x"]),
            url: z.url(),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

/** Brand-level settings that admins may edit (company name lines, about text, default SEO). */
export const SiteSettingsSchema = z
  .object({
    travelBrand: z.string().min(1),
    storeName: z.string().min(1),
    companyName: z.string().min(1),
    footerTagline: z.string().min(1),
    footerAbout: z.string().min(1).max(320),
    /** Two or three sentences introducing the store in the Waafas World menu panel. */
    storeIntro: z.string().min(1).max(220),
    /** Customer accounts (P1). Off at launch: the header shows no Log in until accounts ship. */
    accountsLive: z.boolean().default(false),
    defaultSeo: SeoSchema,
    /** Facebook reviews link used until approved feedback exists (FR-HOME 10). */
    reviewsUrl: z.url().optional(),
  })
  .strict();

export const MenuItemSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1).max(40),
    /** Where the item goes. Only the More item, which just opens its panel, has none. */
    href: HrefSchema.optional(),
    /** One line under the title in the More panel (icon + title + one line). */
    description: z.string().max(80).optional(),
    /** Lucide icon name, e.g. "book-open". */
    icon: z.string().optional(),
    /** Opens the Waafas World mega panel or the More panel instead of navigating on hover/tap. */
    panel: z.enum(["shop", "more"]).optional(),
    /** Link text on panel cards, e.g. "Get a quote" (Waafas World panel services). */
    cta: z.string().min(1).max(24).optional(),
    visible: z.boolean().default(true),
  })
  .strict()
  .refine((item) => item.href !== undefined || item.panel === "more", {
    message: "Add a link (only the More panel item can go without one)",
    path: ["href"],
  });

export const MenuSchema = z
  .object({
    key: z.enum([
      "header",
      "more",
      /** Phone drawer: the main links above the More grid. */
      "drawer",
      /** Phone bottom tab bar: exactly five items; the third is the Waafas World disc (correction 3). */
      "tabbar",
      /** Extra items on the phone More sheet after the More menu (Gallery, Feedback, Track order). */
      "more-phone",
      /** Service cards in the Waafas World menu panel (Printing Solutions, International Trading, Find by model). */
      "shop-panel",
      "footer-travel",
      "footer-shop",
      "footer-help",
      "legal",
    ]),
    items: z.array(MenuItemSchema),
  })
  .strict()
  .refine(
    (menu) =>
      menu.key !== "tabbar" ||
      (menu.items.length === 5 &&
        menu.items[2]?.href === "/shop" &&
        menu.items[4]?.panel === "more"),
    {
      message: "The tab bar has five tabs: Waafas World (/shop) in the middle and More last",
      path: ["items"],
    },
  );

export const PaymentMethodBadgeSchema = z
  .object({
    id: z.enum(["bank", "bkash", "nagad", "office", "cod", "card", "sslcommerz"]),
    label: z.string().min(1),
    /** Shown in "We accept" only while the method is live (FR-FTR-04). */
    enabled: z.boolean(),
    note: z.string().optional(),
  })
  .strict();

export const FooterSettingsSchema = z
  .object({
    columns: z
      .array(z.object({ title: z.string().min(1), menu: MenuSchema.shape.key }).strict())
      .min(1),
    paymentMethods: z.array(PaymentMethodBadgeSchema),
    paymentNote: z.string().optional(),
    /** Accreditation marks appear only when the company holds them (FR-FTR-04). */
    trustBadges: z
      .array(z.object({ id: z.string(), label: z.string(), image: ImageSchema }).strict())
      .default([]),
    newsletterTitle: z.string().min(1),
    newsletterPlaceholder: z.string().min(1),
    newsletterButton: z.string().min(1),
    copyrightHolder: z.string().min(1),
  })
  .strict();

export const AnnouncementSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1).max(160),
    link: LinkSchema.optional(),
    startsAt: IsoDateTimeSchema,
    endsAt: IsoDateTimeSchema,
    enabled: z.boolean(),
    sample: SampleFlagSchema,
  })
  .strict();

/** The Golden Switch (PRD §12): one mode per module; Live stays locked until its gate is met. */
export const BookingModuleSchema = z.enum(["flights", "hotels", "packages", "shopPayment"]);
export const BookingModeSchema = z.enum(["manual", "live"]);

export const ModuleModeSchema = z
  .object({
    module: BookingModuleSchema,
    mode: BookingModeSchema,
    liveLocked: z.boolean(),
    /** Why Live is locked, shown in admin (FR-GS-03), e.g. "No flight provider connected". */
    lockReason: z.string().optional(),
    updatedAt: IsoDateTimeSchema,
  })
  .strict()
  .refine((value) => !(value.mode === "live" && value.liveLocked), {
    message: "A module cannot be Live while Live is locked",
  });

export const BookingModesSchema = z.array(ModuleModeSchema).length(4);

export const OfflineAccountSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["bank", "bkash", "nagad", "office"]),
    title: z.string().min(1),
    /** Lines such as account name, number, branch or the office counter address. */
    lines: z.array(z.string().min(1)).min(1),
    instructions: z.string().optional(),
    sample: SampleFlagSchema,
  })
  .strict();

export const PaymentSettingsSchema = z
  .object({
    offlineAccounts: z.array(OfflineAccountSchema),
    /** Highest order total that may be paid cash on delivery (FR-SHOP-07). */
    codLimit: TakaSchema,
    onlinePaymentLive: z.boolean(),
  })
  .strict();

export const ShippingZoneSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    /** Divisions or districts covered; "*" means everywhere else. */
    areas: z.array(z.string().min(1)).min(1),
    charge: TakaSchema,
    estimate: z.string().min(1),
  })
  .strict();

export const ShippingSettingsSchema = z
  .object({
    zones: z.array(ShippingZoneSchema).min(1),
    minimumOrder: TakaSchema,
    freeDeliveryThreshold: TakaSchema.optional(),
    /** Free pick-up from the Motijheel office during office hours, offered at checkout. */
    officePickup: z.boolean().default(true),
  })
  .strict();

/** EMI page rules (FR-PAGE · EMI); partner banks are separate records (EmiBank). */
export const EmiSettingsSchema = z
  .object({
    minimumAmount: TakaSchema,
    tenuresMonths: z.array(z.number().int().positive().max(36)).min(1),
    cardsNote: z.string().min(1).max(120),
    appliesTo: z.string().min(1).max(160),
    interestNote: z.string().max(240).optional(),
    sample: SampleFlagSchema,
  })
  .strict();

export const LeadFormSettingsSchema = z
  .object({
    emailRequired: z.boolean(),
    consentText: z.string().min(1),
    /** First-response target in minutes during office hours (PRD §3: 30). */
    slaMinutes: z.number().int().positive(),
    /** Countries offered in the phone field's country picker (ISO codes, first is the default). */
    phoneCountries: z
      .array(z.string().regex(/^[A-Z]{2}$/))
      .min(1)
      .max(40)
      .default(["BD"]),
  })
  .strict();

export const NotificationTemplateSchema = z
  .object({
    key: z.enum([
      "lead-received-customer",
      "lead-alert-staff",
      "order-placed-customer",
      "order-placed-staff",
      "visa-status-customer",
      "feedback-received-staff",
      "payment-proof-staff",
      "sign-in-code-customer",
    ]),
    /** Who receives it, as shown in Admin > Notifications, e.g. "Customer" or "Staff, by module". */
    audience: z.string().min(1).max(40),
    channel: z.enum(["email", "sms", "whatsapp"]),
    subject: z.string().min(1),
    body: z.string().min(1),
    /** Variables the subject and body may use, e.g. "{{reference}}" or "{{order_number}}". */
    variables: z.array(z.string().regex(/^\{\{[a-z][a-z0-9_]*\}\}$/)),
    enabled: z.boolean(),
  })
  .strict();

export const MaintenanceSettingsSchema = z
  .object({
    enabled: z.boolean(),
    message: z.string().min(1),
    /** When the site is expected back, shown as "Back by …" on the maintenance page. */
    backAt: IsoDateTimeSchema.optional(),
  })
  .strict();

/** Search card defaults and popular picks (Settings › General › Search; FR-SRCH-06, FR-SRCH-07). */
export const SearchSettingsSchema = z
  .object({
    /** The airport the From field starts with. */
    defaultOrigin: IataSchema,
    /** Flight destinations offered as "Popular" chips under the card, in this order. */
    popularFlights: z.array(IataSchema).max(6),
    /** Guest nationalities offered on the hotel tab (ISO 3166-1 alpha-2), first is the default. */
    hotelNationalities: z
      .array(z.string().regex(/^[A-Z]{2}$/))
      .min(1)
      .max(40),
    /** Place chips on Plan my trip (PlanTrip "In Bangladesh" and "Abroad"), in this order. */
    planTripPlaces: z
      .object({
        domestic: z.array(z.string().trim().min(1).max(40)).max(16),
        abroad: z.array(z.string().trim().min(1).max(40)).max(16),
      })
      .strict(),
  })
  .strict();

export const TrackingSettingsSchema = z
  .object({
    ga4Id: z
      .string()
      .regex(/^G-[A-Z0-9]+$/)
      .optional(),
    gtmId: z
      .string()
      .regex(/^GTM-[A-Z0-9]+$/)
      .optional(),
    metaPixelId: z.string().regex(/^\d+$/).optional(),
    searchConsoleToken: z.string().optional(),
  })
  .strict();

/** The 13 home sections of FR-HOME, in admin-controlled order and visibility. */
export const HomeSectionKeySchema = z.enum([
  "hero",
  "trust",
  "offers",
  "groupFares",
  "destinations",
  "packages",
  "visa",
  "why",
  "store",
  "testimonials",
  "galleryBlogFaq",
  "team",
  "cta",
]);

export const HomeSectionSchema = z
  .object({
    key: HomeSectionKeySchema,
    enabled: z.boolean(),
    order: z.number().int().min(0),
    /** Small label above the heading; used sparingly (DESIGN.md: no eyebrow on every section). */
    kicker: z.string().max(40).optional(),
    /** Optional heading override; empty uses the default copy. */
    title: z.string().max(80).optional(),
    subtitle: z.string().max(220).optional(),
  })
  .strict();

/** Waafas World copy that is not a list (Content › Store): strips, corporate band, service cards and trust row. */
export const ShopContentSchema = z
  .object({
    tagline: z.string().min(1).max(60),
    bulkStrip: z
      .object({
        title: z.string().min(1).max(60),
        body: z.string().min(1).max(120),
        cta: z.string().min(1).max(30),
      })
      .strict(),
    finderStrip: z
      .object({
        title: z.string().min(1).max(60),
        body: z.string().min(1).max(120),
        cta: z.string().min(1).max(30),
      })
      .strict(),
    corporate: z
      .object({
        kicker: z.string().min(1).max(40),
        title: z.string().min(1).max(80),
        body: z.string().min(1).max(260),
        steps: z
          .array(
            z
              .object({ title: z.string().min(1).max(40), body: z.string().min(1).max(80) })
              .strict(),
          )
          .max(4),
      })
      .strict(),
    services: z
      .array(
        z
          .object({
            title: z.string().min(1).max(40),
            sub: z.string().min(1).max(60),
            body: z.string().min(1).max(160),
            cta: z.string().min(1).max(30),
            href: z.string().min(1),
            mediaSlot: MediaSlotKeySchema,
          })
          .strict(),
      )
      .max(4),
    trust: z
      .array(
        z
          .object({
            icon: z.string().min(1),
            title: z.string().min(1).max(40),
            detail: z.string().min(1).max(100),
          })
          .strict(),
      )
      .max(6),
  })
  .strict();

/** Home copy that is not a list (Content › Home): hero, Why WAAFA figure, store band, reviews and the closing band. */
export const HomeContentSchema = z
  .object({
    hero: z
      .object({
        title: z.string().min(1).max(60),
        /** Second headline line, set in electric blue (the only accent line on the site). */
        titleAccent: z.string().min(1).max(60),
        lead: z.string().min(1).max(220),
        rotatingLabel: z.string().min(1).max(30),
        rotating: z.array(z.string().min(1).max(30)).min(1).max(8),
      })
      .strict(),
    why: z
      .object({
        figure: z.string().min(1).max(16),
        figureLabel: z.string().min(1).max(60),
        body: z.string().min(1).max(320),
      })
      .strict(),
    store: z
      .object({
        title: z.string().min(1).max(80),
        body: z.string().min(1).max(220),
        perks: z.array(z.string().min(1).max(40)).max(4),
      })
      .strict(),
    reviews: z
      .object({
        facebookTitle: z.string().min(1).max(60),
        facebookBody: z.string().min(1).max(160),
        feedbackTitle: z.string().min(1).max(60),
        feedbackBody: z.string().min(1).max(160),
      })
      .strict(),
    cta: z
      .object({
        title: z.string().min(1).max(60),
        body: z.string().min(1).max(220),
      })
      .strict(),
  })
  .strict();

const ModuleStateSchema = z
  .object({ mode: BookingModeSchema, liveLocked: z.boolean(), lockReason: z.string().optional() })
  .strict();

/**
 * GET /api/v1/config/public (FR-GS-02): what every page needs to pick its Manual or Live body, cached for
 * 60 seconds and revalidated through the `config` tag whenever an admin flips a switch.
 */
export const PublicConfigSchema = z
  .object({
    modes: z
      .object({
        flights: ModuleStateSchema,
        hotels: ModuleStateSchema,
        packages: ModuleStateSchema,
        shopPayment: ModuleStateSchema,
      })
      .strict(),
    onlinePaymentLive: z.boolean(),
    /** Customer accounts (P1): the header's Log in appears only when they are live. */
    accountsLive: z.boolean(),
    /** Cash-on-delivery cap shown at checkout (FR-SHOP-07). */
    codLimit: TakaSchema,
    maintenance: MaintenanceSettingsSchema,
  })
  .strict();

export type Weekday = z.infer<typeof WeekdaySchema>;
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;
export type ContactSettings = z.infer<typeof ContactSettingsSchema>;
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type Menu = z.infer<typeof MenuSchema>;
export type MenuKey = Menu["key"];
export type PaymentMethodBadge = z.infer<typeof PaymentMethodBadgeSchema>;
export type FooterSettings = z.infer<typeof FooterSettingsSchema>;
export type Announcement = z.infer<typeof AnnouncementSchema>;
export type BookingModule = z.infer<typeof BookingModuleSchema>;
export type BookingMode = z.infer<typeof BookingModeSchema>;
export type ModuleMode = z.infer<typeof ModuleModeSchema>;
export type OfflineAccount = z.infer<typeof OfflineAccountSchema>;
export type PaymentSettings = z.infer<typeof PaymentSettingsSchema>;
export type ShippingZone = z.infer<typeof ShippingZoneSchema>;
export type ShippingSettings = z.infer<typeof ShippingSettingsSchema>;
export type EmiSettings = z.infer<typeof EmiSettingsSchema>;
export type LeadFormSettings = z.infer<typeof LeadFormSettingsSchema>;
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;
export type MaintenanceSettings = z.infer<typeof MaintenanceSettingsSchema>;
export type SearchSettings = z.infer<typeof SearchSettingsSchema>;
export type TrackingSettings = z.infer<typeof TrackingSettingsSchema>;
export type HomeSectionKey = z.infer<typeof HomeSectionKeySchema>;
export type HomeSection = z.infer<typeof HomeSectionSchema>;
export type HomeContent = z.infer<typeof HomeContentSchema>;
export type ShopContent = z.infer<typeof ShopContentSchema>;
export type PublicConfig = z.infer<typeof PublicConfigSchema>;

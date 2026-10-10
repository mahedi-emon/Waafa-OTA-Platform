import { z } from "zod";
import {
  IdSchema,
  ImageSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  LinkSchema,
  PublishStatusSchema,
  SampleFlagSchema,
  SeoSchema,
  SlugSchema,
  TakaSchema,
  VideoSchema,
} from "./common";

/**
 * Rich text from the admin editor, already sanitised server-side with an allow-list (NFR-SEC).
 * Rendered with the one allowed dangerouslySetInnerHTML (CLAUDE.md component rules).
 */
export const RichTextSchema = z.string().max(100_000);

/** One headed part of a page; its id is the anchor used by the "On this page" contents list. */
export const PageSectionSchema = z
  .object({
    id: SlugSchema,
    heading: z.string().min(1).max(80),
    body: RichTextSchema,
  })
  .strict();

/** Rich-text pages: Refund Policy, Privacy Policy, Terms and Conditions (FR-PAGE). */
export const PageSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    title: z.string().min(1).max(120),
    /** Lead paragraph under the title. */
    summary: z.string().max(300).optional(),
    /** The "In short" list at the top of policy pages. */
    highlights: z.array(z.string().min(1).max(200)).max(6).default([]),
    sections: z.array(PageSectionSchema).min(1),
    lastUpdated: IsoDateSchema,
    status: PublishStatusSchema,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict()
  .refine(
    (page) => new Set(page.sections.map((section) => section.id)).size === page.sections.length,
    {
      message: "Section anchors must be unique",
      path: ["sections"],
    },
  );

export const BlogCategorySchema = z
  .object({ slug: SlugSchema, name: z.string().min(1).max(40) })
  .strict();

export const BlogPostSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    title: z.string().min(1).max(140),
    excerpt: z.string().min(1).max(300),
    /** Opening paragraph above the first heading. */
    intro: z.string().min(1).max(600),
    /** Headed sections; their headings build the "In this article" list. */
    sections: z.array(PageSectionSchema).min(1),
    cover: ImageSchema,
    category: SlugSchema,
    author: z.string().min(1).max(80),
    publishedAt: IsoDateSchema,
    readingMinutes: z.number().int().positive().max(60),
    featured: z.boolean().default(false),
    /** Service the post leads to, for the call-to-action at its end. */
    cta: z.enum(["flights", "packages", "visa", "shop", "contact"]).default("contact"),
    status: PublishStatusSchema,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict();

export const FaqCategorySchema = z.enum([
  "flights",
  "hotels",
  "packages",
  "visa",
  "payments",
  "shop",
  "account",
]);

export const FaqSchema = z
  .object({
    id: IdSchema,
    category: FaqCategorySchema,
    question: z.string().min(1).max(200),
    /** Plain text; paragraphs are separated by a blank line (also used for FAQPage markup). */
    answer: z.string().min(1).max(1200),
    /** Optional follow-up link under the answer, e.g. "Read the refund policy". */
    link: LinkSchema.optional(),
    order: z.number().int().min(0),
    /** One of the five shown on Home (FR-HOME 11). */
    onHome: z.boolean().default(false),
    sample: SampleFlagSchema,
  })
  .strict();

/** Admin banners and offers with placement and schedule (FR-HOME 3, Admin > Content). */
export const BannerSchema = z
  .object({
    id: IdSchema,
    placement: z.enum(["home-offers", "shop-hero", "shop-campaign", "flights-results"]),
    kicker: z.string().max(40).optional(),
    title: z.string().min(1).max(80),
    body: z.string().max(200).optional(),
    image: ImageSchema,
    link: LinkSchema,
    /** Promo code shown on the card, e.g. "BALI-5D". */
    code: z.string().max(24).optional(),
    /** Short validity line, e.g. "Until 15 Dec" or "Ongoing". */
    validityText: z.string().max(40).optional(),
    startsAt: IsoDateTimeSchema,
    endsAt: IsoDateTimeSchema.optional(),
    order: z.number().int().min(0),
    enabled: z.boolean(),
    sample: SampleFlagSchema,
  })
  .strict();

/**
 * Fixed photo and video slots outside the content collections: page headers, form side images, the home hero
 * (PhotoBrief usage column). Edited in Admin > Content > Media library; a slot without a record shows its placeholder.
 */
export const MediaSlotKeySchema = z.enum([
  "home-hero",
  "flights-header",
  "flights-success",
  "group-fares-header",
  "visa-services-header",
  "visa-apply-side",
  "visa-guide-header",
  "visa-track-header",
  "printing-header",
  "printing-quote-side",
  "trading-header",
  "trading-rfq-side",
  "shop-service-printing",
  "shop-service-trading",
  "office",
]);

export const MediaSlotSchema = z
  .object({
    key: MediaSlotKeySchema,
    image: ImageSchema.optional(),
    video: VideoSchema.optional(),
    sample: SampleFlagSchema,
  })
  .strict()
  .refine((slot) => slot.image !== undefined || slot.video !== undefined, {
    message: "Add a photo or a video",
    path: ["image"],
  });

/** Home trust strip (FR-HOME 2): four admin-edited items with icons. */
export const TrustItemSchema = z
  .object({
    id: IdSchema,
    icon: z.string().min(1),
    title: z.string().min(1).max(60),
    detail: z.string().min(1).max(80),
    order: z.number().int().min(0),
  })
  .strict();

/** Company values (Why WAAFA) and the About journey. Counters only for numbers the owner provides. */
export const ValueCardSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(1).max(40),
    body: z.string().min(1).max(200),
    icon: z.string().min(1),
    order: z.number().int().min(0),
  })
  .strict();

export const TimelineEventSchema = z
  .object({
    id: IdSchema,
    period: z.string().min(1).max(20),
    text: z.string().min(1).max(160),
    order: z.number().int().min(0),
  })
  .strict();

export const DestinationTagSchema = z.enum([
  "visa",
  "short",
  "beach",
  "city",
  "mountain",
  "domestic",
]);

/** Home destination finder (FR-HOME 5): links into filtered packages. */
export const DestinationSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    name: z.string().min(1).max(40),
    subtitle: z.string().min(1).max(80),
    iata: z.string().regex(/^[A-Z]{3}$/),
    image: ImageSchema,
    flightTime: z.string().min(1).max(40),
    visaNote: z.string().min(1).max(40),
    visaEasy: z.boolean(),
    bestSeason: z.string().min(1).max(40),
    fromPrice: TakaSchema,
    tags: z.array(DestinationTagSchema),
    order: z.number().int().min(0),
    sample: SampleFlagSchema,
  })
  .strict();

export const GalleryCategorySchema = z.enum(["tours", "events", "office", "travellers"]);

export const GalleryItemSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("photo"),
      id: IdSchema,
      image: ImageSchema,
      caption: z.string().max(160).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("video"),
      id: IdSchema,
      provider: z.enum(["youtube", "facebook"]),
      url: z.url(),
      poster: ImageSchema,
      caption: z.string().max(160).optional(),
    })
    .strict(),
]);

export const GalleryAlbumSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    title: z.string().min(1).max(80),
    category: GalleryCategorySchema,
    cover: ImageSchema,
    items: z.array(GalleryItemSchema),
    publishedAt: IsoDateSchema,
    sample: SampleFlagSchema,
  })
  .strict();

export const FeedbackServiceSchema = z.enum([
  "flights",
  "hotels",
  "packages",
  "visa",
  "shop",
  "printing",
  "other",
]);

/**
 * Visitor feedback (FR-FDB). Only `approved` items with consent appear publicly; contact details are never shown.
 * Fixtures contain pending items only: WAAFA never invents reviews.
 */
export const FeedbackSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1).max(80),
    contact: z.string().min(1).max(120),
    service: FeedbackServiceSchema,
    /** Optional on the form ("How was it?"); the wall shows stars only when given. */
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(1).max(1000),
    photo: ImageSchema.optional(),
    consentToPublish: z.boolean(),
    status: z.enum(["pending", "approved", "rejected"]),
    submittedAt: IsoDateTimeSchema,
    sample: SampleFlagSchema,
  })
  .strict();

/** What the public wall may show of approved feedback: never the contact details (FR-FDB). */
export const PublicFeedbackSchema = FeedbackSchema.pick({
  id: true,
  name: true,
  service: true,
  rating: true,
  comment: true,
  photo: true,
  submittedAt: true,
});

/** Meet our team (FR-TEAM): real staff who agree to appear; samples use initials, never stock faces. */
export const TeamMemberSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1).max(80),
    initials: z.string().min(1).max(3),
    designation: z.string().min(1).max(60),
    department: z.string().min(1).max(40),
    bio: z.string().max(160).optional(),
    photo: ImageSchema.optional(),
    whatsappE164: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/)
      .optional(),
    email: z.email().optional(),
    linkedinUrl: z.url().optional(),
    featured: z.boolean().default(false),
    showOnHome: z.boolean().default(true),
    showOnAbout: z.boolean().default(true),
    visible: z.boolean(),
    order: z.number().int().min(0),
    sample: SampleFlagSchema,
  })
  .strict();

/** Baggage Information table (FR-PAGE). */
export const BaggageRuleSchema = z
  .object({
    id: IdSchema,
    airlineCode: z.string().regex(/^[A-Z0-9]{2}$/),
    airlineName: z.string().min(1),
    scope: z.enum(["domestic", "international"]),
    cabinClass: z.enum(["economy", "premium-economy", "business", "first"]),
    cabinAllowance: z.string().min(1).max(60),
    checkedAllowance: z.string().min(1).max(60),
    notes: z.string().max(200).optional(),
    lastVerified: IsoDateSchema,
    sample: SampleFlagSchema,
  })
  .strict();

/** EMI page: eligible banks and tenures (FR-PAGE). */
export const EmiBankSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1).max(80),
    tenuresMonths: z.array(z.number().int().positive()).min(1),
    note: z.string().max(160).optional(),
    sample: SampleFlagSchema,
  })
  .strict();

export type RichText = z.infer<typeof RichTextSchema>;
export type PageSection = z.infer<typeof PageSectionSchema>;
export type Page = z.infer<typeof PageSchema>;
export type BlogCategory = z.infer<typeof BlogCategorySchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;
export type FaqCategory = z.infer<typeof FaqCategorySchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type Banner = z.infer<typeof BannerSchema>;
export type MediaSlotKey = z.infer<typeof MediaSlotKeySchema>;
export type MediaSlot = z.infer<typeof MediaSlotSchema>;
export type TrustItem = z.infer<typeof TrustItemSchema>;
export type ValueCard = z.infer<typeof ValueCardSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type DestinationTag = z.infer<typeof DestinationTagSchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type GalleryCategory = z.infer<typeof GalleryCategorySchema>;
export type GalleryItem = z.infer<typeof GalleryItemSchema>;
export type GalleryAlbum = z.infer<typeof GalleryAlbumSchema>;
export type FeedbackService = z.infer<typeof FeedbackServiceSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type PublicFeedback = z.infer<typeof PublicFeedbackSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type BaggageRule = z.infer<typeof BaggageRuleSchema>;
export type EmiBank = z.infer<typeof EmiBankSchema>;

export const ServicePageKeySchema = z.enum(["printing", "trading"]);

/**
 * A Waafa International service page inside Waafas World (Printing Solutions, International Trading): the hero, the
 * services, the process steps and the questions, all admin-edited. Form field labels and option lists are UI chrome
 * (next-intl); the lead goes out with the PRN or TRD module.
 */
export const ServicePageSchema = z
  .object({
    key: ServicePageKeySchema,
    kicker: z.string().min(1).max(60),
    title: z.string().min(1).max(80),
    lead: z.string().min(1).max(260),
    primaryCta: z.string().min(1).max(30),
    whatsappMessage: z.string().min(1).max(160),
    facts: z
      .array(
        z.object({ value: z.string().min(1).max(30), label: z.string().min(1).max(40) }).strict(),
      )
      .max(4),
    headerSlot: MediaSlotKeySchema,
    formSlot: MediaSlotKeySchema,
    servicesTitle: z.string().min(1).max(40),
    services: z
      .array(
        z.object({ title: z.string().min(1).max(40), body: z.string().min(1).max(160) }).strict(),
      )
      .min(1)
      .max(8),
    stepsTitle: z.string().min(1).max(80),
    steps: z
      .array(
        z.object({ title: z.string().min(1).max(60), body: z.string().min(1).max(100) }).strict(),
      )
      .min(1)
      .max(6),
    formTitle: z.string().min(1).max(60),
    formLead: z.string().min(1).max(160),
    questions: z
      .array(
        z
          .object({ question: z.string().min(1).max(160), answer: z.string().min(1).max(600) })
          .strict(),
      )
      .max(8),
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict();

export type ServicePageKey = z.infer<typeof ServicePageKeySchema>;
export type ServicePage = z.infer<typeof ServicePageSchema>;

/** Pages whose cards and lists are admin-edited page blocks (About, Contact, Baggage, EMI, Offline payment). */
export const PageBlockPageSchema = z.enum([
  "about",
  "contact",
  "baggage",
  "emi",
  "offline-payment",
]);

/**
 * One card on an information page, e.g. a "What we do" service on About, a baggage rule, an EMI step or an offline
 * payment step. Blocks are grouped per page (`group`) and ordered; the icon is a MenuIcon name.
 */
export const PageBlockSchema = z
  .object({
    id: IdSchema,
    page: PageBlockPageSchema,
    group: z
      .string()
      .regex(/^[a-z][a-z0-9-]*$/)
      .max(40),
    icon: z.string().max(40).optional(),
    title: z.string().min(1).max(80),
    body: z.string().min(1).max(400),
    link: LinkSchema.optional(),
    tone: z.enum(["default", "warning", "danger"]).default("default"),
    order: z.number().int().min(0),
    sample: SampleFlagSchema,
  })
  .strict();

/** What the public feedback form sends (Feedback board). It is stored as pending until a moderator approves it. */
export const FeedbackCreateInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
    service: FeedbackServiceSchema,
    reference: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}-\d{6}-\d{4}$/)
      .optional(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().min(10).max(1000),
    /** Phase A keeps the photo in the browser; only its name, type and size travel (D87). */
    photo: z
      .object({
        fileName: z.string().min(1).max(120),
        mimeType: z.enum(["image/jpeg", "image/png"]),
        sizeBytes: z
          .number()
          .int()
          .positive()
          .max(5 * 1024 * 1024),
      })
      .strict()
      .optional(),
    consentToPublish: z.boolean(),
  })
  .strict();

export type PageBlockPage = z.infer<typeof PageBlockPageSchema>;
export type PageBlock = z.infer<typeof PageBlockSchema>;
export type FeedbackCreateInput = z.infer<typeof FeedbackCreateInputSchema>;

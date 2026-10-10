import { z } from "zod";
import {
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
  ShopContentSchema,
  SiteSettingsSchema,
  TrackingSettingsSchema,
} from "../schemas/settings";
import {
  BaggageRuleSchema,
  BannerSchema,
  BlogCategorySchema,
  BlogPostSchema,
  DestinationSchema,
  EmiBankSchema,
  FaqSchema,
  GalleryAlbumSchema,
  MediaSlotSchema,
  PageBlockSchema,
  PageSchema,
  ServicePageSchema,
  TeamMemberSchema,
  TimelineEventSchema,
  TrustItemSchema,
  ValueCardSchema,
} from "../schemas/content";
import {
  AirlineSchema,
  AirportSchema,
  GroupFareSchema,
  HotelPlaceSchema,
  TourPackageSchema,
} from "../schemas/travel";
import { VisaCountrySchema, VisaGuideSchema } from "../schemas/visa";
import {
  AttributeSetSchema,
  BrandSchema,
  CategorySchema,
  CollectionSchema,
  CompatibleModelSchema,
  CouponSchema,
  DealSchema,
  ProductSchema,
  StoreRowSchema,
} from "../schemas/shop";

/*
 * The admin-managed content model (Phase B launch decision D125): every settings record is one validated JSON
 * document (a "singleton"), and every content or catalogue record is one validated JSON document in a "collection".
 * The API validates writes with these schemas, the seed loads the fixtures through them, the public snapshot
 * returns them under the same keys the fixture repositories read, and the admin editor is generated from them.
 * Transactional records (leads, orders, feedback, payment proofs, search logs, staff, audit) have their own tables.
 */

export type ContentGroup = "settings" | "home" | "content" | "travel" | "visa" | "shop";

type Singleton<S extends z.ZodType> = { kind: "singleton"; group: ContentGroup; schema: S };
type Collection<S extends z.ZodType> = {
  kind: "collection";
  group: ContentGroup;
  schema: S;
  /** The field that identifies a record, e.g. "id", "slug", "key" or "code". */
  idField: string;
  /** The field shown as the record's title in admin lists. */
  titleField: string;
};

const singleton = <S extends z.ZodType>(group: ContentGroup, schema: S): Singleton<S> => ({
  kind: "singleton",
  group,
  schema,
});

const collection = <S extends z.ZodType>(
  group: ContentGroup,
  schema: S,
  idField: string,
  titleField: string,
): Collection<S> => ({ kind: "collection", group, schema, idField, titleField });

export const CONTENT_MODEL = {
  // Settings
  siteSettings: singleton("settings", SiteSettingsSchema),
  contactSettings: singleton("settings", ContactSettingsSchema),
  footerSettings: singleton("settings", FooterSettingsSchema),
  bookingModes: singleton("settings", BookingModesSchema),
  paymentSettings: singleton("settings", PaymentSettingsSchema),
  shippingSettings: singleton("settings", ShippingSettingsSchema),
  emiSettings: singleton("settings", EmiSettingsSchema),
  leadFormSettings: singleton("settings", LeadFormSettingsSchema),
  maintenanceSettings: singleton("settings", MaintenanceSettingsSchema),
  trackingSettings: singleton("settings", TrackingSettingsSchema),
  searchSettings: singleton("settings", SearchSettingsSchema),
  menus: collection("settings", MenuSchema, "key", "key"),
  announcements: collection("settings", AnnouncementSchema, "id", "text"),
  notificationTemplates: collection("settings", NotificationTemplateSchema, "key", "key"),
  // Home
  homeContent: singleton("home", HomeContentSchema),
  homeSections: collection("home", HomeSectionSchema, "key", "key"),
  trustItems: collection("home", TrustItemSchema, "id", "title"),
  values: collection("home", ValueCardSchema, "id", "title"),
  timeline: collection("home", TimelineEventSchema, "id", "period"),
  destinations: collection("home", DestinationSchema, "id", "name"),
  banners: collection("home", BannerSchema, "id", "title"),
  // Content
  pages: collection("content", PageSchema, "slug", "title"),
  servicePages: collection("content", ServicePageSchema, "key", "title"),
  pageBlocks: collection("content", PageBlockSchema, "id", "title"),
  blogCategories: collection("content", BlogCategorySchema, "slug", "name"),
  blogPosts: collection("content", BlogPostSchema, "slug", "title"),
  faqs: collection("content", FaqSchema, "id", "question"),
  galleryAlbums: collection("content", GalleryAlbumSchema, "slug", "title"),
  team: collection("content", TeamMemberSchema, "id", "name"),
  baggageRules: collection("content", BaggageRuleSchema, "id", "airlineName"),
  emiBanks: collection("content", EmiBankSchema, "id", "name"),
  mediaSlots: collection("content", MediaSlotSchema, "key", "key"),
  // Travel
  airports: collection("travel", AirportSchema, "iata", "city"),
  airlines: collection("travel", AirlineSchema, "code", "name"),
  groupFares: collection("travel", GroupFareSchema, "id", "id"),
  tourPackages: collection("travel", TourPackageSchema, "slug", "title"),
  hotelPlaces: collection("travel", HotelPlaceSchema, "id", "name"),
  // Visa
  visaCountries: collection("visa", VisaCountrySchema, "slug", "name"),
  visaGuides: collection("visa", VisaGuideSchema, "slug", "title"),
  // Shop
  shopContent: singleton("shop", ShopContentSchema),
  attributeSets: collection("shop", AttributeSetSchema, "id", "name"),
  categories: collection("shop", CategorySchema, "slug", "name"),
  brands: collection("shop", BrandSchema, "slug", "name"),
  compatibleModels: collection("shop", CompatibleModelSchema, "id", "model"),
  products: collection("shop", ProductSchema, "slug", "title"),
  collections: collection("shop", CollectionSchema, "slug", "name"),
  deals: collection("shop", DealSchema, "id", "id"),
  storeRows: collection("shop", StoreRowSchema, "key", "key"),
  coupons: collection("shop", CouponSchema, "code", "code"),
};

export type ContentKey = keyof typeof CONTENT_MODEL;
export type SingletonKey = {
  [K in ContentKey]: (typeof CONTENT_MODEL)[K]["kind"] extends "singleton" ? K : never;
}[ContentKey];
export type CollectionKey = Exclude<ContentKey, SingletonKey>;

/** The value a key holds: the record for a singleton, the array of records for a collection. */
export type ContentValue<K extends ContentKey> =
  (typeof CONTENT_MODEL)[K] extends Singleton<infer S>
    ? z.output<S>
    : (typeof CONTENT_MODEL)[K] extends Collection<infer S>
      ? Array<z.output<S>>
      : never;

export type ContentRecord<K extends CollectionKey> =
  (typeof CONTENT_MODEL)[K] extends Collection<infer S> ? z.output<S> : never;

export const CONTENT_KEYS = Object.keys(CONTENT_MODEL) as ContentKey[];

export function isContentKey(value: string): value is ContentKey {
  return Object.hasOwn(CONTENT_MODEL, value);
}

/** The id of a collection record (its id, slug, key or code field), as a string. */
export function contentRecordId(key: CollectionKey, record: unknown): string {
  const entry = CONTENT_MODEL[key];
  const value = (record as Record<string, unknown>)[entry.idField];
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`Record in "${key}" has no ${entry.idField}`);
  }
  return String(value);
}

/** Validates one record of a collection, or the whole value of a singleton, returning the parsed output. */
export function parseContent(key: ContentKey, value: unknown) {
  return CONTENT_MODEL[key].schema.safeParse(value);
}

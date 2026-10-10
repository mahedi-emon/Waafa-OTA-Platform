import { z } from "zod";
import {
  AirlineSchema,
  AirportSchema,
  AnnouncementSchema,
  AttributeSetSchema,
  AuditEntrySchema,
  BaggageRuleSchema,
  BannerSchema,
  BlogCategorySchema,
  BlogPostSchema,
  BookingModesSchema,
  BrandSchema,
  CategorySchema,
  CollectionSchema,
  CompatibleModelSchema,
  ContactSettingsSchema,
  CouponSchema,
  DealSchema,
  DestinationSchema,
  EmiBankSchema,
  EmiSettingsSchema,
  FaqSchema,
  FeedbackSchema,
  FooterSettingsSchema,
  GalleryAlbumSchema,
  GroupFareSchema,
  HomeSectionSchema,
  HotelPlaceSchema,
  LeadFormSettingsSchema,
  LeadSchema,
  MaintenanceSettingsSchema,
  MediaSlotSchema,
  MenuSchema,
  NotificationTemplateSchema,
  OrderSchema,
  PageSchema,
  PaymentSettingsSchema,
  ProductSchema,
  SearchLogSchema,
  ShippingSettingsSchema,
  SiteSettingsSchema,
  StaffUserSchema,
  StoreRowSchema,
  TeamMemberSchema,
  TimelineEventSchema,
  TourPackageSchema,
  SearchSettingsSchema,
  HomeContentSchema,
  ShopContentSchema,
  TrackingSettingsSchema,
  TrustItemSchema,
  ValueCardSchema,
  VisaApplicationSchema,
  VisaCountrySchema,
  VisaGuideSchema,
} from "@waafa/shared";
import { auditLog, staffUsers } from "./admin";
import {
  baggageRules,
  banners,
  blogCategories,
  blogPosts,
  destinations,
  emiBanks,
  faqs,
  feedback,
  galleryAlbums,
  pages,
  team,
  timeline,
  trustItems,
  values,
} from "./content";
import { leads, searchLogs } from "./leads";
import { mediaSlots } from "./media";
import {
  announcements,
  bookingModes,
  contactSettings,
  emiSettings,
  footerSettings,
  homeSections,
  leadFormSettings,
  maintenanceSettings,
  menus,
  notificationTemplates,
  paymentSettings,
  shippingSettings,
  searchSettings,
  homeContent,
  shopContent,
  siteSettings,
  trackingSettings,
} from "./settings";
import {
  attributeSets,
  brands,
  categories,
  collections,
  compatibleModels,
  coupons,
  deals,
  orders,
  products,
  storeRows,
} from "./shop";
import { airlines, airports, groupFares, hotelPlaces, tourPackages } from "./travel";
import { visaApplications, visaCountries, visaGuides } from "./visa";

/**
 * Typed Sample data for Phase A screens and the Phase B seed, written against the zod contracts in
 * `@waafa/shared`. Every content record carries `sample: true` so it can never pass for live content.
 */
export const FIXTURES_VERSION = 1;

export { PHOTO_KEYS, photo, type PhotoKey } from "./images";

function entry<T extends z.ZodType>(schema: T, data: z.input<T>) {
  return { schema, data };
}

/** Every fixture collection with the schema it must satisfy. Tests parse each one. */
export const fixtureRegistry = {
  // Settings
  siteSettings: entry(SiteSettingsSchema, siteSettings),
  contactSettings: entry(ContactSettingsSchema, contactSettings),
  menus: entry(z.array(MenuSchema), menus),
  footerSettings: entry(FooterSettingsSchema, footerSettings),
  announcements: entry(z.array(AnnouncementSchema), announcements),
  bookingModes: entry(BookingModesSchema, bookingModes),
  paymentSettings: entry(PaymentSettingsSchema, paymentSettings),
  shippingSettings: entry(ShippingSettingsSchema, shippingSettings),
  emiSettings: entry(EmiSettingsSchema, emiSettings),
  leadFormSettings: entry(LeadFormSettingsSchema, leadFormSettings),
  notificationTemplates: entry(z.array(NotificationTemplateSchema), notificationTemplates),
  maintenanceSettings: entry(MaintenanceSettingsSchema, maintenanceSettings),
  trackingSettings: entry(TrackingSettingsSchema, trackingSettings),
  searchSettings: entry(SearchSettingsSchema, searchSettings),
  homeContent: entry(HomeContentSchema, homeContent),
  shopContent: entry(ShopContentSchema, shopContent),
  homeSections: entry(z.array(HomeSectionSchema), homeSections),
  // Content
  pages: entry(z.array(PageSchema), pages),
  blogCategories: entry(z.array(BlogCategorySchema), blogCategories),
  blogPosts: entry(z.array(BlogPostSchema), blogPosts),
  faqs: entry(z.array(FaqSchema), faqs),
  banners: entry(z.array(BannerSchema), banners),
  trustItems: entry(z.array(TrustItemSchema), trustItems),
  values: entry(z.array(ValueCardSchema), values),
  timeline: entry(z.array(TimelineEventSchema), timeline),
  destinations: entry(z.array(DestinationSchema), destinations),
  galleryAlbums: entry(z.array(GalleryAlbumSchema), galleryAlbums),
  feedback: entry(z.array(FeedbackSchema), feedback),
  team: entry(z.array(TeamMemberSchema), team),
  baggageRules: entry(z.array(BaggageRuleSchema), baggageRules),
  emiBanks: entry(z.array(EmiBankSchema), emiBanks),
  mediaSlots: entry(z.array(MediaSlotSchema), mediaSlots),
  // Travel
  airports: entry(z.array(AirportSchema), airports),
  airlines: entry(z.array(AirlineSchema), airlines),
  groupFares: entry(z.array(GroupFareSchema), groupFares),
  tourPackages: entry(z.array(TourPackageSchema), tourPackages),
  hotelPlaces: entry(z.array(HotelPlaceSchema), hotelPlaces),
  // Visa
  visaCountries: entry(z.array(VisaCountrySchema), visaCountries),
  visaGuides: entry(z.array(VisaGuideSchema), visaGuides),
  visaApplications: entry(z.array(VisaApplicationSchema), visaApplications),
  // Shop
  attributeSets: entry(z.array(AttributeSetSchema), attributeSets),
  categories: entry(z.array(CategorySchema), categories),
  brands: entry(z.array(BrandSchema), brands),
  compatibleModels: entry(z.array(CompatibleModelSchema), compatibleModels),
  products: entry(z.array(ProductSchema), products),
  collections: entry(z.array(CollectionSchema), collections),
  deals: entry(z.array(DealSchema), deals),
  storeRows: entry(z.array(StoreRowSchema), storeRows),
  coupons: entry(z.array(CouponSchema), coupons),
  orders: entry(z.array(OrderSchema), orders),
  // Leads and admin
  leads: entry(z.array(LeadSchema), leads),
  searchLogs: entry(z.array(SearchLogSchema), searchLogs),
  staffUsers: entry(z.array(StaffUserSchema), staffUsers),
  auditLog: entry(z.array(AuditEntrySchema), auditLog),
};

export type FixtureKey = keyof typeof fixtureRegistry;

/** Parsed fixtures: schema outputs with defaults applied, exactly what the API will return. */
export type FixtureData = { [K in FixtureKey]: z.output<(typeof fixtureRegistry)[K]["schema"]> };

/** Parses one collection, throwing a readable error that names the fixture when it breaks a rule. */
export function parseFixture<K extends FixtureKey>(key: K): FixtureData[K] {
  const { schema, data } = fixtureRegistry[key];
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Fixture "${key}" does not match its schema:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data as FixtureData[K];
}

/** Freezes a value and everything inside it, so a consumer that sorts or edits in place fails loudly. */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

let cache: FixtureData | undefined;

/** All fixtures, parsed once per process and frozen (copy before sorting). */
export function loadFixtures(): FixtureData {
  if (!cache) {
    const parsed: Partial<Record<FixtureKey, unknown>> = {};
    for (const key of Object.keys(fixtureRegistry) as FixtureKey[]) {
      parsed[key] = parseFixture(key);
    }
    cache = deepFreeze(parsed as FixtureData);
  }
  return cache;
}

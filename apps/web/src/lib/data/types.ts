import type {
  Airline,
  Airport,
  Announcement,
  AttributeSet,
  BaggageRule,
  Banner,
  BlogCategory,
  BlogPost,
  Brand,
  Category,
  Collection,
  CompatibleModel,
  ContactSettings,
  Coupon,
  Order,
  Deal,
  Destination,
  EmiBank,
  EmiSettings,
  Faq,
  FaqCategory,
  FeedbackService,
  FooterSettings,
  GalleryAlbum,
  GalleryCategory,
  GroupFare,
  HomeContent,
  ServicePage,
  ServicePageKey,
  ShopContent,
  HomeSection,
  HotelPlace,
  LeadCreated,
  LeadCreateInput,
  LeadFormSettings,
  MediaSlot,
  MediaSlotKey,
  Menu,
  MenuKey,
  Page,
  PackageCategory,
  PaymentSettings,
  Product,
  PublicConfig,
  PublicFeedback,
  SearchLog,
  SearchLogInput,
  SearchSettings,
  ShippingSettings,
  SiteSettings,
  StoreRow,
  TeamMember,
  TimelineEvent,
  TourPackage,
  TrackingSettings,
  TrustItem,
  ValueCard,
  VisaCountry,
  VisaGuide,
  VisaRegion,
} from "@waafa/shared";

/*
 * Repository contracts. Pages and components read data only through the cached accessors in this folder,
 * which call these interfaces. Phase A runs the fixtures implementation; Phase C swaps in the API one
 * (`source.ts`) without touching the UI. Every method returns what a visitor may see: published, visible,
 * enabled and in date. Time-dependent methods take `now` so they stay pure and testable.
 */

/** One slice of a long list, for "Load more". */
export type ListPage<T> = {
  items: T[];
  total: number;
  /** Offset of the next slice, or null when this is the last one. */
  nextOffset: number | null;
};

export type ListWindow = { offset?: number; limit?: number };

export interface SettingsRepository {
  getSiteSettings(): Promise<SiteSettings>;
  getContactSettings(): Promise<ContactSettings>;
  getMenu(key: MenuKey): Promise<Menu>;
  getFooterSettings(): Promise<FooterSettings>;
  /** The announcement bar: the first enabled announcement whose date range includes `now`. */
  getActiveAnnouncement(now: Date): Promise<Announcement | null>;
  /** Booking modes, payment switches, COD cap and maintenance (FR-GS-02). */
  getPublicConfig(): Promise<PublicConfig>;
  getPaymentSettings(): Promise<PaymentSettings>;
  getShippingSettings(): Promise<ShippingSettings>;
  getEmiSettings(): Promise<EmiSettings>;
  getLeadFormSettings(): Promise<LeadFormSettings>;
  getTrackingSettings(): Promise<TrackingSettings>;
  /** Search card defaults and popular picks. */
  getSearchSettings(): Promise<SearchSettings>;
  /** Home copy that is not a list: hero, Why WAAFA figure, store band, reviews and closing band. */
  getHomeContent(): Promise<HomeContent>;
  /** Waafas World copy: strips, corporate band, service cards and trust row. */
  getShopContent(): Promise<ShopContent>;
  /** Enabled home sections in admin order (FR-HOME). */
  listHomeSections(): Promise<HomeSection[]>;
}

export type BlogQuery = ListWindow & { category?: string; search?: string };
export type FaqQuery = { category?: FaqCategory; onHome?: boolean; search?: string };
export type TeamPlacement = "home" | "about";
export type BaggageQuery = { scope?: BaggageRule["scope"]; search?: string };

export interface ContentRepository {
  getPage(slug: string): Promise<Page | null>;
  /** A Waafa International service page (Printing Solutions, International Trading). */
  getServicePage(key: ServicePageKey): Promise<ServicePage | null>;
  listBlogCategories(): Promise<BlogCategory[]>;
  /** Newest first; the featured post is included in the list. */
  listBlogPosts(query?: BlogQuery): Promise<ListPage<BlogPost>>;
  getBlogPost(slug: string): Promise<BlogPost | null>;
  /** Up to `limit` other posts, same category first. */
  listRelatedBlogPosts(slug: string, limit?: number): Promise<BlogPost[]>;
  listFaqs(query?: FaqQuery): Promise<Faq[]>;
  /** Enabled banners for a placement whose schedule includes `now`, in admin order. */
  listBanners(placement: Banner["placement"], now: Date): Promise<Banner[]>;
  listTrustItems(): Promise<TrustItem[]>;
  listValues(): Promise<ValueCard[]>;
  listTimeline(): Promise<TimelineEvent[]>;
  listDestinations(): Promise<Destination[]>;
  listGalleryAlbums(category?: GalleryCategory): Promise<GalleryAlbum[]>;
  getGalleryAlbum(slug: string): Promise<GalleryAlbum | null>;
  /** Approved feedback with consent only, without contact details, newest first (FR-FDB). */
  listPublicFeedback(service?: FeedbackService): Promise<PublicFeedback[]>;
  /** Visible members for Home or About Us, featured first, then admin order (FR-TEAM). */
  listTeam(placement: TeamPlacement): Promise<TeamMember[]>;
  listBaggageRules(query?: BaggageQuery): Promise<BaggageRule[]>;
  listEmiBanks(): Promise<EmiBank[]>;
  /** The photo or video in a fixed page slot (hero, page headers, form side images); null shows the placeholder. */
  getMediaSlot(key: MediaSlotKey): Promise<MediaSlot | null>;
  /** Every filled slot, for the admin media library. */
  listMediaSlots(): Promise<MediaSlot[]>;
}

export type GroupFareQuery = { now: Date; to?: string; month?: string };

export type PackageSort = "popular" | "price-asc" | "price-desc" | "shortest";

export type PackageQuery = ListWindow & {
  search?: string;
  category?: PackageCategory;
  destination?: string;
  minNights?: number;
  maxNights?: number;
  maxPrice?: number;
  minPrice?: number;
  /** "2026-11" */
  month?: string;
  /** Card chips that must all be present, e.g. ["Flights", "Visa help"]. */
  includes?: string[];
  sort?: PackageSort;
};

export interface TravelRepository {
  /** The pinned airports in PRD order (FR-SRCH-06). */
  listPinnedAirports(): Promise<Airport[]>;
  /** Code match first, then city and airport name, then country. */
  searchAirports(query: string, limit?: number): Promise<Airport[]>;
  getAirport(iata: string): Promise<Airport | null>;
  listAirlines(): Promise<Airline[]>;
  /** The airline strip on Home. */
  listFeaturedAirlines(): Promise<Airline[]>;
  /** Group fares that have not expired, soonest departure first (FR-FLT-07). */
  listGroupFares(query: GroupFareQuery): Promise<GroupFare[]>;
  /** A fare by id while it is still on offer (not expired at `now`). */
  getGroupFare(id: string, now: Date): Promise<GroupFare | null>;
  listPackages(query?: PackageQuery): Promise<ListPage<TourPackage>>;
  getPackage(slug: string): Promise<TourPackage | null>;
  listRelatedPackages(slug: string): Promise<TourPackage[]>;
  searchHotelPlaces(query: string, limit?: number): Promise<HotelPlace[]>;
}

export type VisaQuery = { region?: VisaRegion; search?: string; popular?: boolean };

export interface VisaRepository {
  listVisaCountries(query?: VisaQuery): Promise<VisaCountry[]>;
  getVisaCountry(slug: string): Promise<VisaCountry | null>;
  listVisaGuides(): Promise<VisaGuide[]>;
  getVisaGuide(slug: string): Promise<VisaGuide | null>;
}

export type ProductSort = "popular" | "newest" | "price-asc" | "price-desc";

export type ProductQuery = ListWindow & {
  /** Category slug; products in its sub-categories are included. */
  category?: string;
  brand?: string;
  collection?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  /**
   * The category's select attributes (FR-SHOP-02): a product matches when a variant option with the key, or a spec row
   * with the label, has one of the values.
   */
  attributes?: Array<{ key: string; label: string; values: string[] }>;
  sort?: ProductSort;
};

export type DealWithProduct = Deal & { product: Product };

export interface ShopRepository {
  /** The whole category tree, flat, in admin order. */
  listCategories(): Promise<Category[]>;
  getCategory(slug: string): Promise<Category | null>;
  getAttributeSet(id: string): Promise<AttributeSet | null>;
  listBrands(): Promise<Brand[]>;
  getBrand(slug: string): Promise<Brand | null>;
  listProducts(query?: ProductQuery): Promise<ListPage<Product>>;
  getProduct(slug: string): Promise<Product | null>;
  listCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;
  /** Deals that have not ended, ending soonest first. */
  listDeals(now: Date): Promise<DealWithProduct[]>;
  /** Enabled store rows in admin order (FR-SHOP-01). */
  listStoreRows(): Promise<StoreRow[]>;
  /** Printer models for Find by model, optionally for one brand (FR-SHOP-05). */
  listCompatibleModels(brand?: string): Promise<CompatibleModel[]>;
  /** Products that fit a printer model, or that match a part code such as "CF280A" or "80A". */
  findCompatibleProducts(query: { modelId: string } | { partCode: string }): Promise<Product[]>;
  /** A coupon by code, if it exists, is enabled and is valid at `now`. */
  findCoupon(code: string, now: Date): Promise<Coupon | null>;
  /** Published or not, the products that own these variants (the cart and the order intake price from them). */
  getProductsByVariantIds(ids: readonly string[]): Promise<Product[]>;
  /** Stores a priced order, assigns its id and ORD reference, and starts its history at "placed" (FR-SHOP-09). */
  createOrder(draft: NewOrder, now: Date): Promise<Order>;
  /** An order by reference, only when the phone number matches (Track order, FR-SHOP-09). */
  findOrder(reference: string, phone: string): Promise<Order | null>;
}

/** An order as priced by the server; the repository adds id, reference, status, history and the time. */
export type NewOrder = Omit<
  Order,
  "id" | "reference" | "status" | "history" | "createdAt" | "sample"
>;

export type SearchLogQuery = ListWindow & { module?: SearchLog["module"] };

export interface LeadsRepository {
  /** Stores a lead and returns its reference (FLT-261008-0042) for the success screen and emails. */
  createLead(input: LeadCreateInput, now: Date): Promise<LeadCreated>;
  /** Records a submitted search (FR-SRCH-10); callers never wait on it. */
  logSearch(input: SearchLogInput, now: Date): Promise<void>;
  /** Search activity for Admin, newest first. */
  listSearchLogs(query?: SearchLogQuery): Promise<ListPage<SearchLog>>;
}

export interface Repositories {
  settings: SettingsRepository;
  content: ContentRepository;
  travel: TravelRepository;
  visa: VisaRepository;
  shop: ShopRepository;
  leads: LeadsRepository;
}

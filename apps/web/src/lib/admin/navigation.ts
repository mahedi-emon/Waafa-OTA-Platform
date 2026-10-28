import {
  canEditContentKey,
  hasAnyRole,
  type ContentKey,
  type InboxCountKey,
  type Role,
} from "@waafa/shared";

/** Icon names the admin navigation uses (mapped to lucide icons in AdminNavIcon). */
export type AdminIconName =
  | "dashboard"
  | "reports"
  | "customers"
  | "leads"
  | "bookings"
  | "search"
  | "fares"
  | "routes"
  | "hotels"
  | "airlines"
  | "packages"
  | "visa"
  | "guide"
  | "passport"
  | "orders"
  | "proofs"
  | "products"
  | "categories"
  | "brands"
  | "collections"
  | "deals"
  | "rows"
  | "attributes"
  | "models"
  | "coupons"
  | "home"
  | "menus"
  | "announcement"
  | "banners"
  | "team"
  | "gallery"
  | "feedback"
  | "pages"
  | "blog"
  | "faqs"
  | "media"
  | "content"
  | "modes"
  | "footer"
  | "payments"
  | "notifications"
  | "users"
  | "integrations"
  | "general"
  | "newsletter"
  | "audit"
  | "trash"
  | "settings";

export type AdminNavItem = {
  key: string;
  /** Message key under Admin.nav; the one-line help is Admin.navHelp.<key>. */
  label: string;
  href: string;
  icon: AdminIconName;
  /** Who sees it; Super Admin sees everything. Empty = every signed-in person. */
  roles: Role[];
  /** Work waiting here, shown as a count badge. */
  badge?: InboxCountKey;
  /** When this count is above zero the badge turns red (overdue work). */
  urgent?: InboxCountKey;
  /** Other pages that belong to this item (detail pages, related lists); the longest match wins. */
  also?: string[];
};

export type AdminNavGroup = { label: string; items: AdminNavItem[] };

const ADMIN = "/secure-admin-control";
const content = (key: ContentKey) => `${ADMIN}/content/${key}`;

const LEADS: Role[] = ["admin", "travel-sales", "visa-officer", "shop-manager"];
const STORE_OPS: Role[] = ["admin", "shop-manager", "accounts"];
const CONTENT: Role[] = ["admin", "content-editor"];
const TRAVEL: Role[] = ["admin", "content-editor", "travel-sales"];
const SHOP: Role[] = ["admin", "shop-manager"];
const REPORTS: Role[] = ["admin", "accounts", "shop-manager", "travel-sales", "visa-officer"];

/**
 * The sidebar (docs/design/ADMIN.md §3.1): Home, Inbox, Travel, Waafa’s World and Website. Settings sits in the
 * sidebar footer. Items whose dedicated screen arrives later (R6, R7, R9) open the closest existing screen.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "home",
    items: [
      { key: "dashboard", label: "dashboard", href: ADMIN, icon: "dashboard", roles: [] },
      {
        key: "reports",
        label: "reports",
        href: `${ADMIN}/reports`,
        icon: "reports",
        roles: REPORTS,
        also: [`${ADMIN}/search`],
      },
    ],
  },
  {
    label: "inbox",
    items: [
      {
        key: "leads",
        label: "leads",
        href: `${ADMIN}/leads`,
        icon: "leads",
        roles: LEADS,
        badge: "newLeads",
        urgent: "overdueLeads",
      },
      {
        key: "bookings",
        label: "bookings",
        href: `${ADMIN}/bookings`,
        icon: "bookings",
        // Sales who may open the lead, and Accounts for the payments (issue 242).
        roles: ["admin", "travel-sales", "visa-officer", "accounts"],
      },
      {
        key: "visaApplications",
        label: "visaApplications",
        href: `${ADMIN}/visa-applications`,
        // A visa lead opened from this list stays under it (D0 R6).
        also: [`${ADMIN}/leads?queue=visa`],
        icon: "passport",
        roles: ["admin", "visa-officer"],
        badge: "visaWaiting",
      },
      {
        key: "orders",
        label: "orders",
        href: `${ADMIN}/orders`,
        icon: "orders",
        roles: STORE_OPS,
        badge: "ordersToConfirm",
      },
      {
        key: "proofs",
        label: "paymentProofs",
        href: `${ADMIN}/payments`,
        icon: "proofs",
        roles: ["admin", "accounts", "shop-manager"],
        badge: "proofsToVerify",
      },
      {
        key: "customers",
        label: "customers",
        href: `${ADMIN}/customers`,
        icon: "customers",
        roles: REPORTS,
        also: [`${ADMIN}/subscribers`],
      },
      {
        key: "feedback",
        label: "feedback",
        href: `${ADMIN}/feedback`,
        icon: "feedback",
        roles: CONTENT,
        badge: "feedbackToReview",
      },
      {
        key: "reviews",
        label: "reviews",
        href: `${ADMIN}/reviews`,
        icon: "feedback",
        roles: ["content-editor", "shop-manager", "travel-sales"],
        badge: "reviewsToModerate",
      },
    ],
  },
  {
    label: "travel",
    items: [
      {
        key: "packages",
        label: "packages",
        href: content("tourPackages"),
        icon: "packages",
        roles: TRAVEL,
      },
      {
        key: "groupFares",
        label: "groupFares",
        href: content("groupFares"),
        icon: "fares",
        roles: TRAVEL,
        badge: "groupFaresEnding",
      },
      {
        key: "flightRoutes",
        label: "flightRoutes",
        href: content("flightRoutes"),
        icon: "routes",
        roles: TRAVEL,
      },
      {
        key: "hotels",
        label: "hotels",
        href: content("hotels"),
        icon: "hotels",
        roles: TRAVEL,
      },
      {
        key: "hotelPlaces",
        label: "hotelPlaces",
        href: content("hotelPlaces"),
        icon: "hotels",
        roles: TRAVEL,
      },
      {
        key: "visaCountries",
        label: "visaCountries",
        href: content("visaCountries"),
        icon: "visa",
        roles: ["admin", "visa-officer", "content-editor"],
      },
      {
        key: "visaGuides",
        label: "visaGuides",
        href: content("visaGuides"),
        icon: "guide",
        roles: ["admin", "visa-officer", "content-editor"],
      },
      {
        key: "airlines",
        label: "airlines",
        href: content("airlines"),
        icon: "airlines",
        roles: TRAVEL,
        also: [content("airports"), content("baggageRules")],
      },
    ],
  },
  {
    label: "store",
    items: [
      {
        key: "products",
        label: "products",
        href: content("products"),
        icon: "products",
        roles: SHOP,
        badge: "lowStock",
      },
      {
        key: "categories",
        label: "categories",
        href: content("categories"),
        icon: "categories",
        roles: SHOP,
      },
      { key: "brands", label: "brands", href: content("brands"), icon: "brands", roles: SHOP },
      {
        key: "collections",
        label: "collections",
        href: content("collections"),
        icon: "collections",
        roles: SHOP,
      },
      { key: "deals", label: "deals", href: content("deals"), icon: "deals", roles: SHOP },
      {
        key: "storeRows",
        label: "storeRows",
        href: content("storeRows"),
        icon: "rows",
        roles: SHOP,
        also: [content("shopContent")],
      },
      { key: "coupons", label: "coupons", href: content("coupons"), icon: "coupons", roles: SHOP },
      {
        key: "attributes",
        label: "attributes",
        href: content("attributeSets"),
        icon: "attributes",
        roles: SHOP,
      },
      {
        key: "compatibleModels",
        label: "compatibleModels",
        href: content("compatibleModels"),
        icon: "models",
        roles: SHOP,
      },
    ],
  },
  {
    label: "website",
    items: [
      {
        key: "homePage",
        label: "homePage",
        href: `${ADMIN}/website/home`,
        icon: "home",
        roles: CONTENT,
        also: [
          `${ADMIN}/content?group=home`,
          content("homeContent"),
          content("homeSections"),
          content("trustItems"),
          content("values"),
          content("timeline"),
          content("destinations"),
        ],
      },
      {
        key: "menus",
        label: "menus",
        href: `${ADMIN}/website/menus`,
        icon: "menus",
        // Menus and the footer are settings documents: managers edit them (packages/shared access rules).
        roles: ["admin"],
        also: [content("menus"), content("footerSettings")],
      },
      {
        key: "announcements",
        label: "announcements",
        href: content("announcements"),
        icon: "announcement",
        roles: CONTENT,
      },
      {
        key: "banners",
        label: "banners",
        href: content("banners"),
        icon: "banners",
        roles: ["admin", "content-editor"],
      },
      {
        key: "pages",
        label: "pages",
        href: content("pages"),
        icon: "pages",
        roles: CONTENT,
        also: [content("servicePages"), content("pageBlocks")],
      },
      {
        key: "blog",
        label: "blog",
        href: content("blogPosts"),
        icon: "blog",
        roles: CONTENT,
        also: [content("blogCategories")],
      },
      { key: "faqs", label: "faqs", href: content("faqs"), icon: "faqs", roles: CONTENT },
      {
        key: "gallery",
        label: "gallery",
        href: content("galleryAlbums"),
        icon: "gallery",
        roles: CONTENT,
      },
      { key: "team", label: "team", href: content("team"), icon: "team", roles: CONTENT },
      {
        key: "mediaLibrary",
        label: "mediaLibrary",
        href: `${ADMIN}/media`,
        icon: "media",
        roles: ["admin", "content-editor", "shop-manager", "travel-sales"],
        also: [content("mediaSlots")],
      },
      // Deleted records of the lists this person edits, restorable for 30 days (D0 R4, ADMIN.md §9).
      {
        key: "trash",
        label: "trash",
        href: `${ADMIN}/trash`,
        icon: "trash",
        roles: ["admin", "content-editor", "shop-manager", "travel-sales", "visa-officer"],
      },
    ],
  },
];

/** Settings live behind one door in the sidebar footer (R9 turns the index into one page with a left sub-navigation). */
export const SETTINGS_ITEM: AdminNavItem = {
  key: "settings",
  label: "settings",
  href: `${ADMIN}/settings`,
  icon: "settings",
  roles: ["admin", "accounts", "shop-manager"],
  also: [
    `${ADMIN}/content?group=settings`,
    `${ADMIN}/content?group=payments`,
    `${ADMIN}/users`,
    `${ADMIN}/integrations`,
    `${ADMIN}/audit`,
    `${ADMIN}/notifications`,
    content("siteSettings"),
    content("contactSettings"),
    content("bookingModes"),
    content("paymentSettings"),
    content("shippingSettings"),
    content("emiSettings"),
    content("emiBanks"),
    content("leadFormSettings"),
    content("maintenanceSettings"),
    content("trackingSettings"),
    content("searchSettings"),
    content("notificationTemplates"),
    `${ADMIN}/content`,
  ],
};

/** Records staff can create from "+ New" (ADMIN.md §3.2), grouped like the sidebar. */
export type NewRecordItem = { key: ContentKey; label: string; icon: AdminIconName };
export type NewRecordGroup = { label: string; items: NewRecordItem[] };

export const NEW_RECORDS: NewRecordGroup[] = [
  {
    label: "travel",
    items: [
      { key: "tourPackages", label: "tourPackage", icon: "packages" },
      { key: "groupFares", label: "groupFare", icon: "fares" },
      { key: "hotels", label: "hotel", icon: "hotels" },
      { key: "flightRoutes", label: "flightRoute", icon: "routes" },
      { key: "visaCountries", label: "visaCountry", icon: "visa" },
      { key: "visaGuides", label: "visaGuide", icon: "guide" },
    ],
  },
  {
    label: "store",
    items: [
      { key: "products", label: "product", icon: "products" },
      { key: "categories", label: "category", icon: "categories" },
      { key: "brands", label: "brand", icon: "brands" },
      { key: "collections", label: "collection", icon: "collections" },
      { key: "deals", label: "deal", icon: "deals" },
      { key: "coupons", label: "coupon", icon: "coupons" },
    ],
  },
  {
    label: "website",
    items: [
      { key: "banners", label: "banner", icon: "banners" },
      { key: "announcements", label: "announcement", icon: "announcement" },
      { key: "blogPosts", label: "blogPost", icon: "blog" },
      { key: "faqs", label: "faq", icon: "faqs" },
      { key: "pages", label: "page", icon: "pages" },
      { key: "galleryAlbums", label: "galleryAlbum", icon: "gallery" },
      { key: "team", label: "teamMember", icon: "team" },
    ],
  },
];

export function canSee(roles: readonly Role[], item: AdminNavItem): boolean {
  if (item.roles.length === 0) return true;
  return hasAnyRole(roles, ...item.roles);
}

/** The navigation this person sees: groups without visible items are dropped. */
export function navFor(roles: readonly Role[]): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(roles, item)),
  })).filter((group) => group.items.length > 0);
}

/** The "+ New" menu for this person: only records their role can edit. */
export function newRecordsFor(roles: readonly Role[]): NewRecordGroup[] {
  return NEW_RECORDS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canEditContentKey(roles, item.key)),
  })).filter((group) => group.items.length > 0);
}

/** How well `href` matches the current page: its length when it matches, else 0 (query hrefs need their query). */
function matchLength(href: string, path: string, here: string): number {
  const [hrefPath = "", hrefQuery] = href.split("?");
  if (hrefQuery) {
    // A page under the path whose address carries these parameters, in any order.
    const present = new URLSearchParams(here.split("?")[1] ?? "");
    const wanted = [...new URLSearchParams(hrefQuery)];
    const under = path === hrefPath || path.startsWith(`${hrefPath}/`);
    return under && wanted.every(([key, value]) => present.get(key) === value) ? href.length : 0;
  }
  if (path === hrefPath) return href.length;
  // The admin root and the content overview only match exactly; everything lives under them.
  if (hrefPath === ADMIN || hrefPath === `${ADMIN}/content`) return 0;
  return path.startsWith(`${hrefPath}/`) ? href.length : 0;
}

/** The active item for a pathname and query: the longest matching href (or `also` page) wins. */
export function activeKey(
  pathname: string,
  search: string,
  items: readonly AdminNavItem[],
): string | null {
  const path = pathname.replace(/^\/[a-z]{2}(?=\/secure-admin-control)/, "");
  const here = `${path}${search}`;
  let best: { key: string; length: number } | null = null;
  for (const item of items) {
    for (const href of [item.href, ...(item.also ?? [])]) {
      const length = matchLength(href, path, here);
      if (length > 0 && (!best || length > best.length)) best = { key: item.key, length };
    }
  }
  return best?.key ?? null;
}

/** Every item in display order, Settings last: for breadcrumbs, Ctrl+K and active state. */
export function allItems(groups: readonly AdminNavGroup[], roles: readonly Role[]): AdminNavItem[] {
  const items = groups.flatMap((group) => group.items);
  return canSee(roles, SETTINGS_ITEM) ? [...items, SETTINGS_ITEM] : items;
}

/** The group an item belongs to (Settings has none). */
export function groupOf(groups: readonly AdminNavGroup[], key: string): AdminNavGroup | undefined {
  return groups.find((group) => group.items.some((item) => item.key === key));
}

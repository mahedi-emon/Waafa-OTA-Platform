import type { Role } from "@waafa/shared";

/** Icon names the admin navigation uses (mapped to lucide icons in AdminNavIcon). */
export type AdminIconName =
  | "dashboard"
  | "leads"
  | "search"
  | "fares"
  | "packages"
  | "visa"
  | "passport"
  | "orders"
  | "proofs"
  | "products"
  | "categories"
  | "collections"
  | "coupons"
  | "home"
  | "team"
  | "gallery"
  | "feedback"
  | "pages"
  | "media"
  | "content"
  | "modes"
  | "footer"
  | "payments"
  | "notifications"
  | "users"
  | "general"
  | "newsletter"
  | "audit";

export type AdminNavItem = {
  key: string;
  /** Message key under Admin.nav. */
  label: string;
  href: string;
  icon: AdminIconName;
  /** Who sees it; Super Admin sees everything. Empty = every signed-in person. */
  roles: Role[];
};

export type AdminNavGroup = { label: string; items: AdminNavItem[] };

const MANAGERS: Role[] = ["admin"];
const SALES: Role[] = ["admin", "travel-sales", "visa-officer", "shop-manager"];
const CONTENT: Role[] = ["admin", "content-editor"];
const TRAVEL: Role[] = ["admin", "content-editor", "travel-sales"];
const SHOP: Role[] = ["admin", "shop-manager"];

/** The sidebar (AdminSide board), grouped as on the board; items without a launch screen open the content editor. */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "overview",
    items: [{ key: "dashboard", label: "dashboard", href: "/admin", icon: "dashboard", roles: [] }],
  },
  {
    label: "sales",
    items: [
      { key: "leads", label: "leads", href: "/admin/leads", icon: "leads", roles: SALES },
      {
        key: "search",
        label: "searchActivity",
        href: "/admin/search",
        icon: "search",
        roles: ["admin", "travel-sales"],
      },
      {
        key: "groupFares",
        label: "groupFares",
        href: "/admin/content/groupFares",
        icon: "fares",
        roles: TRAVEL,
      },
    ],
  },
  {
    label: "travel",
    items: [
      {
        key: "packages",
        label: "packages",
        href: "/admin/content/tourPackages",
        icon: "packages",
        roles: TRAVEL,
      },
      {
        key: "visaLeads",
        label: "visaLeads",
        href: "/admin/leads?module=visa",
        icon: "passport",
        roles: ["admin", "visa-officer"],
      },
      {
        key: "visaCountries",
        label: "visaCountries",
        href: "/admin/content/visaCountries",
        icon: "visa",
        roles: ["admin", "visa-officer", "content-editor"],
      },
    ],
  },
  {
    label: "store",
    items: [
      {
        key: "orders",
        label: "orders",
        href: "/admin/orders",
        icon: "orders",
        roles: ["admin", "shop-manager", "accounts"],
      },
      {
        key: "proofs",
        label: "paymentProofs",
        href: "/admin/payments",
        icon: "proofs",
        roles: ["admin", "accounts", "shop-manager"],
      },
      {
        key: "products",
        label: "products",
        href: "/admin/content/products",
        icon: "products",
        roles: SHOP,
      },
      {
        key: "categories",
        label: "categories",
        href: "/admin/content/categories",
        icon: "categories",
        roles: SHOP,
      },
      {
        key: "collections",
        label: "collections",
        href: "/admin/content/collections",
        icon: "collections",
        roles: SHOP,
      },
      {
        key: "coupons",
        label: "coupons",
        href: "/admin/content/coupons",
        icon: "coupons",
        roles: SHOP,
      },
    ],
  },
  {
    label: "content",
    items: [
      {
        key: "home",
        label: "home",
        href: "/admin/content?group=home",
        icon: "home",
        roles: CONTENT,
      },
      { key: "team", label: "team", href: "/admin/content/team", icon: "team", roles: CONTENT },
      {
        key: "gallery",
        label: "gallery",
        href: "/admin/content/galleryAlbums",
        icon: "gallery",
        roles: CONTENT,
      },
      {
        key: "feedback",
        label: "feedback",
        href: "/admin/feedback",
        icon: "feedback",
        roles: CONTENT,
      },
      {
        key: "pages",
        label: "pages",
        href: "/admin/content?group=content",
        icon: "pages",
        roles: CONTENT,
      },
      {
        key: "media",
        label: "media",
        href: "/admin/content/mediaSlots",
        icon: "media",
        roles: CONTENT,
      },
      {
        key: "subscribers",
        label: "subscribers",
        href: "/admin/subscribers",
        icon: "newsletter",
        roles: CONTENT,
      },
      {
        key: "allContent",
        label: "allContent",
        href: "/admin/content",
        icon: "content",
        roles: [],
      },
    ],
  },
  {
    label: "settings",
    items: [
      {
        key: "modes",
        label: "modes",
        href: "/admin/content/bookingModes",
        icon: "modes",
        roles: MANAGERS,
      },
      {
        key: "footer",
        label: "footer",
        href: "/admin/content/footerSettings",
        icon: "footer",
        roles: MANAGERS,
      },
      {
        key: "payments",
        label: "payments",
        href: "/admin/content?group=payments",
        icon: "payments",
        roles: ["admin", "shop-manager", "accounts"],
      },
      {
        key: "notifications",
        label: "notifications",
        href: "/admin/notifications",
        icon: "notifications",
        roles: MANAGERS,
      },
      { key: "users", label: "users", href: "/admin/users", icon: "users", roles: ["super-admin"] },
      {
        key: "general",
        label: "general",
        href: "/admin/content?group=settings",
        icon: "general",
        roles: MANAGERS,
      },
      { key: "audit", label: "audit", href: "/admin/audit", icon: "audit", roles: MANAGERS },
    ],
  },
];

export function canSee(roles: readonly Role[], item: AdminNavItem): boolean {
  if (item.roles.length === 0 || roles.includes("super-admin")) return true;
  return item.roles.some((role) => roles.includes(role));
}

/** The navigation this person sees: groups without visible items are dropped. */
export function navFor(roles: readonly Role[]): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(roles, item)),
  })).filter((group) => group.items.length > 0);
}

/** The active item for a pathname and query: the longest matching href wins. */
export function activeKey(
  pathname: string,
  search: string,
  groups: AdminNavGroup[],
): string | null {
  const path = pathname.replace(/^\/[a-z]{2}(?=\/admin)/, "");
  const here = `${path}${search}`;
  let best: { key: string; length: number } | null = null;
  for (const item of groups.flatMap((group) => group.items)) {
    const [itemPath = "", itemQuery] = item.href.split("?");
    const matches = itemQuery
      ? here.startsWith(item.href)
      : path === itemPath || (itemPath !== "/admin" && path.startsWith(`${itemPath}/`));
    if (matches && (!best || item.href.length > best.length))
      best = { key: item.key, length: item.href.length };
  }
  return best?.key ?? null;
}

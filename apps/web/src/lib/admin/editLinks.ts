import type { ContentKey, Role } from "@waafa/shared";
import { describeHref, type SitePageId } from "./linkTargets";

const ADMIN = "/secure-admin-control";

/** An admin screen, with what decides who may open it: the content it edits, or the roles of its sidebar item. */
export type EditTarget =
  { href: string; key: ContentKey } | { href: string; roles: readonly Role[] };

const content = (key: ContentKey, id?: string): EditTarget => ({
  href: `${ADMIN}/content/${key}${id ? `/${encodeURIComponent(id)}` : ""}`,
  key,
});

/** The admin screen behind each page of the site (D0 R7, "Edit this page"). */
const PAGE_EDITORS: Record<SitePageId, EditTarget> = {
  home: { href: `${ADMIN}/website/home`, key: "homeSections" },
  flights: content("flightRoutes"),
  groupFares: content("groupFares"),
  hotels: content("hotelPlaces"),
  packages: content("tourPackages"),
  planTrip: content("leadFormSettings"),
  visa: content("visaCountries"),
  visaGuide: content("visaGuides"),
  shop: content("shopContent"),
  shopCategories: content("categories"),
  deals: content("deals"),
  finder: content("compatibleModels"),
  track: content("shopContent"),
  printing: content("servicePages", "printing"),
  trading: content("servicePages", "trading"),
  blog: content("blogPosts"),
  gallery: content("galleryAlbums"),
  faqs: content("faqs"),
  about: content("pages", "about-us"),
  contact: content("contactSettings"),
  feedback: { href: `${ADMIN}/feedback`, roles: ["admin", "content-editor"] },
  offlinePayment: content("paymentSettings"),
  baggage: content("baggageRules"),
  emi: content("emiBanks"),
  privacy: content("pages", "privacy-policy"),
  refund: content("pages", "refund-policy"),
  terms: content("pages", "terms-and-conditions"),
};

/**
 * Where "Edit this page" goes from a public address (a locale prefix is ignored): the page's own screen, or the
 * record's editor for a record page. Null for a page nothing edits.
 */
export function editTargetFor(
  pathname: string,
  locales: readonly string[] = [],
): EditTarget | null {
  const prefix = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  const path = (prefix ? pathname.slice(prefix.length + 1) : pathname) || "/";
  const target = describeHref(path.length > 1 ? path.replace(/\/+$/, "") : path);
  if (target?.kind === "page") return PAGE_EDITORS[target.page];
  if (target?.kind === "record") return content(target.key, target.id);
  return null;
}

/** "Edit sections": the home page manager with one section's sheet open. */
export function sectionEditHref(mark: string): string | null {
  const key = mark === "hero" ? "hero" : mark.startsWith("homeSections:") ? mark.slice(13) : "";
  return key ? `${ADMIN}/website/home?section=${encodeURIComponent(key)}` : null;
}

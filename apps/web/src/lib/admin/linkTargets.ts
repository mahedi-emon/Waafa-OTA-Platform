/*
 * Where a link can go (D0 R7): a page of the site, a record that has its own page, a web address, a phone number or
 * an email. The link picker shows these in words and writes the path; staff never type one. No zod here: the
 * picker runs in the browser (D202).
 */

/** The site's own pages, in the order the picker lists them (labels in Admin.link.pages). */
export const SITE_PAGES = [
  { id: "home", path: "/" },
  { id: "flights", path: "/flights" },
  { id: "groupFares", path: "/flights/group-fares" },
  { id: "hotels", path: "/hotels" },
  { id: "packages", path: "/tour-packages" },
  { id: "planTrip", path: "/plan-my-trip" },
  { id: "visa", path: "/visa" },
  { id: "visaGuide", path: "/visa-guide" },
  { id: "shop", path: "/shop" },
  { id: "shopCategories", path: "/shop/categories" },
  { id: "deals", path: "/shop/deals" },
  { id: "finder", path: "/shop/finder" },
  { id: "track", path: "/shop/track" },
  { id: "printing", path: "/shop/printing-solutions" },
  { id: "trading", path: "/shop/international-trading" },
  { id: "blog", path: "/blog" },
  { id: "gallery", path: "/gallery" },
  { id: "faqs", path: "/faqs" },
  { id: "about", path: "/about-us" },
  { id: "contact", path: "/contact" },
  { id: "feedback", path: "/feedback" },
  { id: "offlinePayment", path: "/offline-payment" },
  { id: "baggage", path: "/baggage-information" },
  { id: "emi", path: "/emi" },
  { id: "privacy", path: "/privacy-policy" },
  { id: "refund", path: "/refund-policy" },
  { id: "terms", path: "/terms-and-conditions" },
] as const;

export type SitePageId = (typeof SITE_PAGES)[number]["id"];

/** Lists whose records have a page, with the start of that page's address (the record's id ends it). */
export const RECORD_LINKS = [
  { key: "tourPackages", prefix: "/tour-packages/" },
  { key: "visaCountries", prefix: "/visa/" },
  { key: "visaGuides", prefix: "/visa-guide/" },
  { key: "flightRoutes", prefix: "/flights/" },
  { key: "blogPosts", prefix: "/blog/" },
  { key: "galleryAlbums", prefix: "/gallery/" },
  { key: "products", prefix: "/shop/p/" },
  { key: "categories", prefix: "/shop/c/" },
  { key: "brands", prefix: "/shop/brand/" },
  { key: "collections", prefix: "/shop/collection/" },
] as const;

export type RecordLinkKey = (typeof RECORD_LINKS)[number]["key"];

export type LinkTarget =
  | { kind: "page"; page: SitePageId; path: string }
  | { kind: "record"; key: RecordLinkKey; id: string; path: string }
  | { kind: "web"; url: string }
  | { kind: "phone"; number: string }
  | { kind: "email"; address: string }
  /** A path on the site the picker doesn't list (kept as it is). */
  | { kind: "path"; path: string };

/** The page of one record. */
export function recordHref(key: RecordLinkKey, id: string): string {
  const link = RECORD_LINKS.find((item) => item.key === key);
  return `${link?.prefix ?? "/"}${encodeURIComponent(id)}`;
}

/**
 * What a link points at, for the picker to say in words. A full address on the site itself counts as the page it
 * names ("https://waafasworld.com/visa" is the Visa page).
 */
export function describeHref(href: string, siteUrl = ""): LinkTarget | null {
  const value = href.trim();
  if (!value) return null;
  if (value.startsWith("tel:")) return { kind: "phone", number: value.slice(4) };
  if (value.startsWith("mailto:")) return { kind: "email", address: value.slice(7) };
  const site = siteUrl.replace(/\/+$/, "");
  const own = site && (value === site || value.startsWith(`${site}/`));
  if (value.startsWith("http") && !own) return { kind: "web", url: value };
  const relative = (own ? value.slice(site.length) : value) || "/";
  // A filtered link ("/tour-packages?destination=bali") is shown as it is, so its filter isn't hidden or lost.
  if (/[?#]/.test(relative)) return { kind: "path", path: relative };
  const path = relative;
  const page = SITE_PAGES.find((item) => item.path === path);
  if (page) return { kind: "page", page: page.id, path };
  for (const link of RECORD_LINKS) {
    if (!path.startsWith(link.prefix)) continue;
    const rest = path.slice(link.prefix.length);
    // One more part only: "/visa/thailand/apply" is not the Thailand page itself.
    if (rest && !rest.includes("/"))
      return { kind: "record", key: link.key, id: decoded(rest), path };
  }
  return { kind: "path", path };
}

/** A record id from its address; a stray "%" in a stored link keeps the id as written instead of failing. */
function decoded(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/** A web address staff typed, made a link: "waafasworld.com/visa" → "/visa" on this site, "example.com" → https. */
export function normaliseWebAddress(input: string, siteUrl = ""): string | null {
  const value = input.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (!url.hostname.includes(".")) return null;
  const site = siteUrl ? new URL(siteUrl).hostname : "";
  if (site && url.hostname.replace(/^www\./, "") === site.replace(/^www\./, ""))
    return `${url.pathname}${url.search}${url.hash}` || "/";
  return url.protocol === "http:"
    ? `https://${url.host}${url.pathname}${url.search}${url.hash}`
    : url.href;
}

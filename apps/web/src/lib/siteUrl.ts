/**
 * Canonical origin for metadata, sitemaps and JSON-LD. Set NEXT_PUBLIC_SITE_URL per environment (staging, production);
 * the production domain is an open owner question (TRACKER section 11).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/** "/visa-services" → "https://…/visa-services". */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

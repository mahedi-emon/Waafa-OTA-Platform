/**
 * Canonical origin for metadata, sitemaps and JSON-LD. Set NEXT_PUBLIC_SITE_URL per environment (staging, production).
 * A production deploy without it would publish localhost URLs in the sitemap and canonicals, so it fails instead.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" || process.env.REQUIRE_SITE_URL === "1") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set for a production build");
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

/** "/visa-services" → "https://…/visa-services". */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

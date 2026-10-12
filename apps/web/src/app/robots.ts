import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteUrl";

/** robots.txt (FR-SEO): the public site is crawlable, API routes and My account (issue 134) are not; admin pages send X-Robots-Tag noindex and are not named here (#85). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/account"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

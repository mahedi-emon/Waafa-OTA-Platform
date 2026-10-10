import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteUrl";

/** robots.txt (FR-SEO): the public site is crawlable; admin and API routes are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

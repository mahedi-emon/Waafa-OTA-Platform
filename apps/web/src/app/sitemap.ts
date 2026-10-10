import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * sitemap.xml (FR-SEO). Each issue that ships a public route adds it here; data-driven routes (packages, visa
 * countries, products, posts) are listed from the data layer when their pages exist (A9–A16).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 }];
}

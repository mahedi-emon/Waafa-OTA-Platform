import type { MetadataRoute } from "next";
import { listPackages } from "@/lib/data/travel";
import { listVisaCountries, listVisaGuides } from "@/lib/data/visa";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * sitemap.xml (FR-SEO). Each issue that ships a public route adds it here; data-driven routes (packages, visa
 * countries, products, posts) are listed from the data layer when their pages exist (A9–A16).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ items: packages }, countries, guides] = await Promise.all([
    listPackages({ limit: 100 }),
    listVisaCountries(),
    listVisaGuides(),
  ]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/flights"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/flights/group-fares"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/hotels"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/tour-packages"), changeFrequency: "daily", priority: 0.9 },
    ...packages
      .filter((pkg) => !pkg.seo.noIndex)
      .map((pkg) => ({
        url: absoluteUrl(`/tour-packages/${pkg.slug}`),
        lastModified: pkg.publishedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    { url: absoluteUrl("/plan-my-trip"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/visa-services"), changeFrequency: "weekly", priority: 0.9 },
    ...countries
      .filter((country) => !country.seo.noIndex)
      .map((country) => ({
        url: absoluteUrl(`/visa-services/${country.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    { url: absoluteUrl("/visa-guide"), changeFrequency: "weekly", priority: 0.6 },
    ...guides
      .filter((guide) => !guide.seo.noIndex)
      .map((guide) => ({
        url: absoluteUrl(`/visa-guide/${guide.slug}`),
        lastModified: guide.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}

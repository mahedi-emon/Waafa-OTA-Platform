import type { MetadataRoute } from "next";
import type { Product } from "@waafa/shared";
import { getPage, getServicePage, listBlogPosts, listGalleryAlbums } from "@/lib/data/content";
import {
  listBrands,
  listCategories,
  listCampaigns,
  listCollections,
  listProducts,
} from "@/lib/data/shop";
import { listFlightRoutes, listPackages } from "@/lib/data/travel";
import { listVisaCountries, listVisaGuides } from "@/lib/data/visa";
import { isIndexable } from "@/lib/seo/indexing";
import { absoluteUrl } from "@/lib/siteUrl";

/** Every product, read page by page (the data layer caps a page at 100). */
async function allProducts(): Promise<Product[]> {
  const products: Product[] = [];
  let offset: number | null = 0;
  while (offset !== null) {
    const page = await listProducts({ offset, limit: 100 });
    products.push(...page.items);
    offset = page.nextOffset;
  }
  return products;
}

/**
 * Every indexable public route (FR-SEO): records the admin set to SEO › noindex (issue 183), empty categories and pages
 * that do not exist stay out; data-driven routes (packages, visa countries, products, posts, albums) are listed from
 * the data layer, with their photos as image entries (#96). app/sitemap.ts serves them in parts (issue 287).
 */
export async function sitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const [
    { items: packages },
    countries,
    guides,
    categories,
    brands,
    collections,
    campaigns,
    products,
    { items: posts },
    albums,
    printing,
    trading,
    routes,
    ...policies
  ] = await Promise.all([
    listPackages({ limit: 100 }),
    listVisaCountries(),
    listVisaGuides(),
    listCategories(),
    listBrands(),
    listCollections(),
    listCampaigns(),
    allProducts(),
    listBlogPosts({ limit: 100 }),
    listGalleryAlbums(),
    getServicePage("printing"),
    getServicePage("trading"),
    listFlightRoutes(),
    getPage("about-us"),
    getPage("refund-policy"),
    getPage("privacy-policy"),
    getPage("terms-and-conditions"),
  ]);

  // A category is worth indexing when it or a sub-category holds an indexable product.
  const indexedProducts = products.filter(isIndexable);
  const parentOf = new Map(categories.map((category) => [category.id, category.parentId]));
  const stocked = new Set<string>();
  for (const product of indexedProducts) {
    let id: string | null | undefined = product.categoryId;
    while (id) {
      stocked.add(id);
      id = parentOf.get(id);
    }
  }

  const page = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly",
  ) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "daily"),
    page("/flights", 0.8, "weekly"),
    page("/flights/group-fares", 0.8, "daily"),
    ...routes.filter(isIndexable).map((route) => ({
      ...page(`/flights/${route.slug}`, 0.8, "weekly"),
      images: [absoluteUrl(route.image.src)],
    })),
    page("/hotels", 0.7, "weekly"),
    page("/tour-packages", 0.9, "daily"),
    ...packages.filter(isIndexable).map((pkg) => ({
      url: absoluteUrl(`/tour-packages/${pkg.slug}`),
      lastModified: pkg.publishedAt,
      images: [absoluteUrl(pkg.cover.src)],
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    page("/plan-my-trip", 0.7, "monthly"),
    page("/visa", 0.9, "weekly"),
    ...countries.filter(isIndexable).map((country) => page(`/visa/${country.slug}`, 0.8, "weekly")),
    page("/visa-guide", 0.6, "weekly"),
    ...guides.filter(isIndexable).map((guide) => ({
      url: absoluteUrl(`/visa-guide/${guide.slug}`),
      lastModified: guide.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    page("/shop", 0.9, "daily"),
    page("/shop/categories", 0.6, "weekly"),
    page("/shop/deals", 0.7, "daily"),
    page("/shop/finder", 0.6, "monthly"),
    ...(printing && isIndexable(printing)
      ? [page("/shop/printing-solutions", 0.7, "monthly")]
      : []),
    ...(trading && isIndexable(trading)
      ? [page("/shop/international-trading", 0.7, "monthly")]
      : []),
    ...categories
      .filter((category) => isIndexable(category) && stocked.has(category.id))
      .map((category) => page(`/shop/c/${category.slug}`, 0.7, "daily")),
    ...brands
      .filter(
        (brand) =>
          isIndexable(brand) && indexedProducts.some((product) => product.brandId === brand.id),
      )
      .map((brand) => page(`/shop/brand/${brand.slug}`, 0.5, "weekly")),
    ...collections
      .filter(isIndexable)
      .map((collection) => page(`/shop/collection/${collection.slug}`, 0.5, "weekly")),
    // Campaign pages (issue 247); one that ended says so and keeps its products.
    ...campaigns
      .filter(isIndexable)
      .map((campaign) => page(`/shop/campaign/${campaign.slug}`, 0.6, "daily")),
    ...indexedProducts.map((product) => ({
      ...page(`/shop/p/${product.slug}`, 0.8, "daily"),
      images: product.images.slice(0, 3).map((image) => absoluteUrl(image.src)),
    })),
    page("/blog", 0.6, "weekly"),
    ...posts.filter(isIndexable).map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.publishedAt,
      images: [absoluteUrl(post.cover.src)],
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    page("/gallery", 0.5, "weekly"),
    ...albums.filter(isIndexable).map((album) => ({
      url: absoluteUrl(`/gallery/${album.slug}`),
      lastModified: album.publishedAt,
      images: [absoluteUrl(album.cover.src)],
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    page("/feedback", 0.5, "weekly"),
    page("/contact", 0.7, "monthly"),
    page("/faqs", 0.6, "monthly"),
    page("/baggage-information", 0.5, "monthly"),
    page("/emi", 0.4, "monthly"),
    page("/offline-payment", 0.4, "monthly"),
    ...policies
      .filter((item): item is NonNullable<typeof item> => item !== null && isIndexable(item))
      .map((item) => ({
        url: absoluteUrl(`/${item.slug}`),
        lastModified: item.lastUpdated,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      })),
  ];
}

/** The parts of the sitemap index (issue 287): one file per area of the site. */
export const SITEMAP_PARTS = ["pages", "travel", "visa", "store", "blog"] as const;
export type SitemapPart = (typeof SITEMAP_PARTS)[number];

/** Which part a page belongs to, by its path; every URL lands in exactly one part. */
export function partOf(url: string): SitemapPart {
  const path = new URL(url).pathname;
  if (/^\/(flights|hotels|tour-packages|plan-my-trip)(\/|$)/.test(path)) return "travel";
  if (/^\/(visa|visa-guide)(\/|$)/.test(path)) return "visa";
  if (/^\/shop(\/|$)/.test(path)) return "store";
  if (/^\/(blog|gallery)(\/|$)/.test(path)) return "blog";
  return "pages";
}

const escapeXml = (value: string) =>
  value.replace(
    /[<>&'"]/g,
    (char) => `&${{ "<": "lt", ">": "gt", "&": "amp", "'": "apos", '"': "quot" }[char]};`,
  );

/** One part as sitemap XML with image entries (the same shape Next's metadata sitemap wrote). */
export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map((entry) => {
    const lines = [`<loc>${escapeXml(entry.url)}</loc>`];
    if (entry.lastModified)
      lines.push(`<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`);
    if (entry.changeFrequency) lines.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
    if (entry.priority !== undefined) lines.push(`<priority>${entry.priority}</priority>`);
    for (const image of entry.images ?? [])
      lines.push(`<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`);
    return `<url>\n${lines.map((line) => `  ${line}`).join("\n")}\n</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`;
}

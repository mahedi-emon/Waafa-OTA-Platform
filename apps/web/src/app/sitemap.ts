import type { MetadataRoute } from "next";
import type { Product } from "@waafa/shared";
import { getPage, getServicePage, listBlogPosts, listGalleryAlbums } from "@/lib/data/content";
import { listBrands, listCategories, listCollections, listProducts } from "@/lib/data/shop";
import { listPackages } from "@/lib/data/travel";
import { listVisaCountries, listVisaGuides } from "@/lib/data/visa";
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
 * sitemap.xml (FR-SEO): every indexable public route. Noindex records, empty categories and pages that do not exist
 * stay out; data-driven routes (packages, visa countries, products, posts, albums) are listed from the data layer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    { items: packages },
    countries,
    guides,
    categories,
    brands,
    collections,
    products,
    { items: posts },
    albums,
    printing,
    trading,
    ...policies
  ] = await Promise.all([
    listPackages({ limit: 100 }),
    listVisaCountries(),
    listVisaGuides(),
    listCategories(),
    listBrands(),
    listCollections(),
    allProducts(),
    listBlogPosts({ limit: 100 }),
    listGalleryAlbums(),
    getServicePage("printing"),
    getServicePage("trading"),
    getPage("about-us"),
    getPage("refund-policy"),
    getPage("privacy-policy"),
    getPage("terms-and-conditions"),
  ]);

  // A category is worth indexing when it or a sub-category holds a product.
  const parentOf = new Map(categories.map((category) => [category.id, category.parentId]));
  const stocked = new Set<string>();
  for (const product of products) {
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
    page("/hotels", 0.7, "weekly"),
    page("/tour-packages", 0.9, "daily"),
    ...packages
      .filter((pkg) => !pkg.seo.noIndex)
      .map((pkg) => ({
        url: absoluteUrl(`/tour-packages/${pkg.slug}`),
        lastModified: pkg.publishedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    page("/plan-my-trip", 0.7, "monthly"),
    page("/visa-services", 0.9, "weekly"),
    ...countries
      .filter((country) => !country.seo.noIndex)
      .map((country) => page(`/visa-services/${country.slug}`, 0.8, "weekly")),
    page("/visa-guide", 0.6, "weekly"),
    ...guides
      .filter((guide) => !guide.seo.noIndex)
      .map((guide) => ({
        url: absoluteUrl(`/visa-guide/${guide.slug}`),
        lastModified: guide.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    page("/shop", 0.9, "daily"),
    page("/shop/categories", 0.6, "weekly"),
    page("/shop/deals", 0.7, "daily"),
    page("/shop/finder", 0.6, "monthly"),
    ...(printing && !printing.seo.noIndex
      ? [page("/shop/printing-solutions", 0.7, "monthly")]
      : []),
    ...(trading && !trading.seo.noIndex
      ? [page("/shop/international-trading", 0.7, "monthly")]
      : []),
    ...categories
      .filter((category) => !category.seo.noIndex && stocked.has(category.id))
      .map((category) => page(`/shop/c/${category.slug}`, 0.7, "daily")),
    ...brands
      .filter((brand) => products.some((product) => product.brandId === brand.id))
      .map((brand) => page(`/shop/brand/${brand.slug}`, 0.5, "weekly")),
    ...collections.map((collection) => page(`/shop/collection/${collection.slug}`, 0.5, "weekly")),
    ...products
      .filter((product) => !product.seo.noIndex)
      .map((product) => page(`/shop/p/${product.slug}`, 0.8, "daily")),
    page("/blog", 0.6, "weekly"),
    ...posts
      .filter((post) => !post.seo.noIndex)
      .map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.publishedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    page("/gallery", 0.5, "weekly"),
    ...albums.map((album) => ({
      url: absoluteUrl(`/gallery/${album.slug}`),
      lastModified: album.publishedAt,
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
      .filter((item): item is NonNullable<typeof item> => item !== null && !item.seo.noIndex)
      .map((item) => ({
        url: absoluteUrl(`/${item.slug}`),
        lastModified: item.lastUpdated,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      })),
  ];
}

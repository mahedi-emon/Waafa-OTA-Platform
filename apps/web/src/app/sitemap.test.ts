import { beforeEach, describe, expect, it, vi } from "vitest";

type Seo = { noIndex: boolean };
type Rec = { sample: boolean; seo: Seo; slug: string };

/** The records the data layer returns; each test flips the Sample flags it needs. */
const data = {
  packages: [] as Array<Rec & { publishedAt: string; cover: { src: string } }>,
  routes: [] as Array<Rec & { image: { src: string } }>,
  guides: [] as Array<Rec & { updatedAt: string }>,
  countries: [] as Rec[],
  posts: [] as Array<Rec & { publishedAt: string; cover: { src: string } }>,
  products: [] as Array<
    Rec & { id: string; categoryId: string; brandId: string; images: Array<{ src: string }> }
  >,
  categories: [] as Array<Rec & { id: string; parentId: string | null }>,
  brands: [] as Array<{ id: string; slug: string; sample: boolean }>,
  collections: [] as Array<{ slug: string; sample: boolean }>,
  albums: [] as Array<{
    slug: string;
    sample: boolean;
    publishedAt: string;
    cover: { src: string };
  }>,
  pages: {} as Record<string, (Rec & { lastUpdated: string }) | null>,
};

vi.mock("@/lib/data/travel", () => ({
  listPackages: async () => ({ items: data.packages }),
  listFlightRoutes: async () => data.routes,
}));
vi.mock("@/lib/data/visa", () => ({
  listVisaCountries: async () => data.countries,
  listVisaGuides: async () => data.guides,
}));
vi.mock("@/lib/data/content", () => ({
  listBlogPosts: async () => ({ items: data.posts }),
  listGalleryAlbums: async () => data.albums,
  getServicePage: async () => null,
  getPage: async (slug: string) => data.pages[slug] ?? null,
}));
vi.mock("@/lib/data/shop", () => ({
  listProducts: async () => ({ items: data.products, nextOffset: null }),
  listCategories: async () => data.categories,
  listBrands: async () => data.brands,
  listCollections: async () => data.collections,
}));

const { default: sitemap } = await import("./sitemap");

const seo = { noIndex: false };
const urls = async () => (await sitemap()).map((entry) => new URL(entry.url).pathname);

beforeEach(() => {
  data.packages = [
    {
      slug: "real-package",
      sample: false,
      seo,
      publishedAt: "2026-10-01",
      cover: { src: "/a.jpg" },
    },
    {
      slug: "sample-package",
      sample: true,
      seo,
      publishedAt: "2026-10-01",
      cover: { src: "/b.jpg" },
    },
  ];
  data.routes = [
    { slug: "dhaka-to-real", sample: false, seo, image: { src: "/r.jpg" } },
    { slug: "dhaka-to-sample", sample: true, seo, image: { src: "/s.jpg" } },
  ];
  data.guides = [
    { slug: "real-guide", sample: false, seo, updatedAt: "2026-10-01" },
    { slug: "sample-guide", sample: true, seo, updatedAt: "2026-10-01" },
  ];
  data.countries = [
    { slug: "real-country", sample: false, seo },
    { slug: "sample-country", sample: true, seo },
  ];
  data.posts = [
    { slug: "real-post", sample: false, seo, publishedAt: "2026-10-01", cover: { src: "/p.jpg" } },
    { slug: "sample-post", sample: true, seo, publishedAt: "2026-10-01", cover: { src: "/q.jpg" } },
  ];
  data.categories = [
    { id: "c1", parentId: null, slug: "real-category", sample: false, seo },
    { id: "c2", parentId: null, slug: "sample-only-category", sample: false, seo },
  ];
  data.products = [
    {
      id: "p1",
      slug: "real-product",
      sample: false,
      seo,
      categoryId: "c1",
      brandId: "b1",
      images: [{ src: "/x.jpg" }],
    },
    {
      id: "p2",
      slug: "sample-product",
      sample: true,
      seo,
      categoryId: "c2",
      brandId: "b2",
      images: [{ src: "/y.jpg" }],
    },
  ];
  data.brands = [
    { id: "b1", slug: "real-brand", sample: false },
    { id: "b2", slug: "sample-stock-brand", sample: false },
  ];
  data.collections = [
    { slug: "real-collection", sample: false },
    { slug: "sample-collection", sample: true },
  ];
  data.albums = [
    { slug: "real-album", sample: false, publishedAt: "2026-10-01", cover: { src: "/g.jpg" } },
    { slug: "sample-album", sample: true, publishedAt: "2026-10-01", cover: { src: "/h.jpg" } },
  ];
  data.pages = {
    "about-us": { slug: "about-us", sample: false, seo, lastUpdated: "2026-10-01" },
    "privacy-policy": { slug: "privacy-policy", sample: true, seo, lastUpdated: "2026-10-01" },
  };
});

describe("sitemap (issue 168)", () => {
  it("lists real records and leaves every Sample record out", async () => {
    const paths = await urls();
    for (const path of [
      "/tour-packages/real-package",
      "/flights/dhaka-to-real",
      "/visa-guide/real-guide",
      "/visa-services/real-country",
      "/blog/real-post",
      "/shop/p/real-product",
      "/shop/c/real-category",
      "/shop/brand/real-brand",
      "/shop/collection/real-collection",
      "/gallery/real-album",
      "/about-us",
    ]) {
      expect(paths, path).toContain(path);
    }
    for (const path of [
      "/tour-packages/sample-package",
      "/flights/dhaka-to-sample",
      "/visa-guide/sample-guide",
      "/visa-services/sample-country",
      "/blog/sample-post",
      "/shop/p/sample-product",
      "/shop/collection/sample-collection",
      "/gallery/sample-album",
      "/privacy-policy",
    ]) {
      expect(paths, path).not.toContain(path);
    }
  });

  it("leaves out categories and brands that hold only Sample products", async () => {
    const paths = await urls();
    expect(paths).not.toContain("/shop/c/sample-only-category");
    expect(paths).not.toContain("/shop/brand/sample-stock-brand");
  });

  it("keeps the static routes whatever the records are", async () => {
    for (const list of Object.values(data)) if (Array.isArray(list)) list.length = 0;
    const paths = await urls();
    for (const path of ["/", "/flights", "/tour-packages", "/visa-services", "/shop", "/blog"]) {
      expect(paths).toContain(path);
    }
  });

  it("lists a record again once the admin turns Sample off", async () => {
    expect(await urls()).not.toContain("/tour-packages/sample-package");
    data.packages[1]!.sample = false;
    expect(await urls()).toContain("/tour-packages/sample-package");
  });

  it("still respects SEO › noindex on a real record", async () => {
    data.posts[0]!.seo = { noIndex: true };
    expect(await urls()).not.toContain("/blog/real-post");
  });

  it("leaves Sample photos out of the image entries", async () => {
    const images = (await sitemap()).flatMap((entry) => entry.images ?? []);
    expect(images.some((src) => src.endsWith("/a.jpg"))).toBe(true);
    expect(images.some((src) => src.endsWith("/b.jpg"))).toBe(false);
    expect(images.some((src) => src.endsWith("/y.jpg"))).toBe(false);
  });
});

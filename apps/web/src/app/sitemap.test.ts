import { beforeEach, describe, expect, it, vi } from "vitest";

type Seo = { noIndex: boolean };
type Rec = { sample: boolean; seo: Seo; slug: string };

/** The records the data layer returns; each test flips the flags it needs. */
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
const hidden = { noIndex: true };
const urls = async () => (await sitemap()).map((entry) => new URL(entry.url).pathname);

beforeEach(() => {
  data.packages = [
    {
      slug: "sample-package",
      sample: true,
      seo,
      publishedAt: "2026-10-01",
      cover: { src: "/a.jpg" },
    },
    {
      slug: "hidden-package",
      sample: false,
      seo: hidden,
      publishedAt: "2026-10-01",
      cover: { src: "/b.jpg" },
    },
  ];
  data.routes = [
    { slug: "dhaka-to-sample", sample: true, seo, image: { src: "/r.jpg" } },
    { slug: "dhaka-to-hidden", sample: false, seo: hidden, image: { src: "/s.jpg" } },
  ];
  data.guides = [
    { slug: "sample-guide", sample: true, seo, updatedAt: "2026-10-01" },
    { slug: "hidden-guide", sample: false, seo: hidden, updatedAt: "2026-10-01" },
  ];
  data.countries = [
    { slug: "sample-country", sample: true, seo },
    { slug: "hidden-country", sample: false, seo: hidden },
  ];
  data.posts = [
    { slug: "sample-post", sample: true, seo, publishedAt: "2026-10-01", cover: { src: "/p.jpg" } },
    {
      slug: "hidden-post",
      sample: false,
      seo: hidden,
      publishedAt: "2026-10-01",
      cover: { src: "/q.jpg" },
    },
  ];
  data.categories = [
    { id: "c1", parentId: null, slug: "stocked-category", sample: true, seo },
    { id: "c2", parentId: null, slug: "hidden-stock-category", sample: false, seo },
  ];
  data.products = [
    {
      id: "p1",
      slug: "sample-product",
      sample: true,
      seo,
      categoryId: "c1",
      brandId: "b1",
      images: [{ src: "/x.jpg" }],
    },
    {
      id: "p2",
      slug: "hidden-product",
      sample: false,
      seo: hidden,
      categoryId: "c2",
      brandId: "b2",
      images: [{ src: "/y.jpg" }],
    },
  ];
  data.brands = [
    { id: "b1", slug: "stocked-brand", sample: true },
    { id: "b2", slug: "hidden-stock-brand", sample: false },
  ];
  data.collections = [{ slug: "sample-collection", sample: true }];
  data.albums = [
    { slug: "sample-album", sample: true, publishedAt: "2026-10-01", cover: { src: "/g.jpg" } },
  ];
  data.pages = {
    "about-us": { slug: "about-us", sample: true, seo, lastUpdated: "2026-10-01" },
    "privacy-policy": {
      slug: "privacy-policy",
      sample: false,
      seo: hidden,
      lastUpdated: "2026-10-01",
    },
  };
});

describe("sitemap (issue 183)", () => {
  it("lists every published record, Sample ones too", async () => {
    const paths = await urls();
    for (const path of [
      "/tour-packages/sample-package",
      "/flights/dhaka-to-sample",
      "/visa-guide/sample-guide",
      "/visa/sample-country",
      "/blog/sample-post",
      "/shop/p/sample-product",
      "/shop/c/stocked-category",
      "/shop/brand/stocked-brand",
      "/shop/collection/sample-collection",
      "/gallery/sample-album",
      "/about-us",
    ]) {
      expect(paths, path).toContain(path);
    }
  });

  it("leaves out records the admin set to SEO › noindex", async () => {
    const paths = await urls();
    for (const path of [
      "/tour-packages/hidden-package",
      "/flights/dhaka-to-hidden",
      "/visa-guide/hidden-guide",
      "/visa/hidden-country",
      "/blog/hidden-post",
      "/shop/p/hidden-product",
      "/privacy-policy",
    ]) {
      expect(paths, path).not.toContain(path);
    }
  });

  it("leaves out categories and brands that hold only noindex products", async () => {
    const paths = await urls();
    expect(paths).not.toContain("/shop/c/hidden-stock-category");
    expect(paths).not.toContain("/shop/brand/hidden-stock-brand");
  });

  it("keeps the static routes whatever the records are", async () => {
    for (const list of Object.values(data)) if (Array.isArray(list)) list.length = 0;
    const paths = await urls();
    for (const path of ["/", "/flights", "/tour-packages", "/visa", "/shop", "/blog"]) {
      expect(paths).toContain(path);
    }
  });

  it("lists a record again once the admin turns noindex off", async () => {
    expect(await urls()).not.toContain("/tour-packages/hidden-package");
    data.packages[1]!.seo = { noIndex: false };
    expect(await urls()).toContain("/tour-packages/hidden-package");
  });

  it("keeps the photos of indexed records only", async () => {
    const images = (await sitemap()).flatMap((entry) => entry.images ?? []);
    expect(images.some((src) => src.endsWith("/a.jpg"))).toBe(true);
    expect(images.some((src) => src.endsWith("/x.jpg"))).toBe(true);
    expect(images.some((src) => src.endsWith("/b.jpg"))).toBe(false);
    expect(images.some((src) => src.endsWith("/y.jpg"))).toBe(false);
  });
});

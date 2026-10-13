import { expect, test, type Page } from "@playwright/test";

/*
 * Share previews and structured data (#96): every public page has its own og:title and description, an og:image,
 * a large Twitter card and Google's large image preview; listings carry ItemList; the sitemap lists the real pages.
 * Record pages still marked Sample send noindex, follow and stay out of the sitemap (issue 168).
 */
/** Pages that are not admin records: always indexed. */
const INDEXED = ["/", "/flights", "/tour-packages", "/visa-services", "/shop", "/blog", "/contact"];
/** Record pages: every fixture record is Sample, so these send noindex, follow (issue 168). */
const SAMPLE_RECORDS = [
  "/flights/dhaka-to-dubai",
  "/tour-packages/maldives-island-stay",
  "/visa-services/thailand",
  "/shop/p/better-day-ce505a-cf280a-black-toner",
  "/about-us",
];
const ROUTES = [...INDEXED, ...SAMPLE_RECORDS];

const meta = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

test("every public page has its own share preview", async ({ page }) => {
  // Twelve full page loads in one test: allow three times the default on slow machines.
  test.slow();
  const titles = new Set<string>();
  for (const route of ROUTES) {
    await page.goto(route);
    const ogTitle = await meta(page, 'meta[property="og:title"]');
    expect(ogTitle, `${route} og:title`).toBeTruthy();
    titles.add(ogTitle ?? "");
    expect(
      await meta(page, 'meta[property="og:description"]'),
      `${route} og:description`,
    ).toBeTruthy();
    expect(await meta(page, 'meta[property="og:image"]'), `${route} og:image`).toMatch(
      /^https?:\/\//,
    );
    expect(await meta(page, 'meta[property="og:site_name"]'), `${route} og:site_name`).toBeTruthy();
    expect(await meta(page, 'meta[name="twitter:card"]'), `${route} twitter:card`).toBe(
      "summary_large_image",
    );
    expect(await meta(page, 'meta[name="robots"]'), `${route} robots`).toBe(
      SAMPLE_RECORDS.includes(route) ? "noindex, follow" : "index, follow",
    );
  }
  // Each page names itself: no page shares another page's title.
  expect(titles.size).toBe(ROUTES.length);
});

test("Google may show large image previews", async ({ page }) => {
  await page.goto("/");
  expect(await meta(page, 'meta[name="googlebot"]')).toContain("max-image-preview:large");
});

test("listings carry ItemList and Home names the website", async ({ page }) => {
  for (const route of ["/tour-packages", "/visa-services", "/blog"]) {
    await page.goto(route);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(
      blocks.some((block) => block.includes('"@type":"ItemList"')),
      `${route} ItemList`,
    ).toBe(true);
  }
  await page.goto("/");
  const home = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(
    "",
  );
  expect(home).toContain('"@type":"WebSite"');
  expect(home).toContain('"@type":["TravelAgency","LocalBusiness"]');
});

/** Every JSON-LD block on the page, parsed; `@graph` nodes are flattened into the list. */
async function structuredData(page: Page): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => {
    const data = JSON.parse(block) as Record<string, unknown>;
    return Array.isArray(data["@graph"])
      ? (data["@graph"] as Array<Record<string, unknown>>)
      : [data];
  });
}

const typed = (nodes: Array<Record<string, unknown>>, type: string) =>
  nodes.find((node) =>
    Array.isArray(node["@type"]) ? node["@type"].includes(type) : node["@type"] === type,
  );

test("store, About, Gallery, Visa Guide and visa services describe themselves (issue 125)", async ({
  page,
}) => {
  await page.goto("/shop");
  let nodes = await structuredData(page);
  expect(typed(nodes, "OnlineStore")?.name).toBe("Waafas World");
  expect(typed(nodes, "ItemList")?.numberOfItems).toBeGreaterThan(0);

  await page.goto("/about-us");
  nodes = await structuredData(page);
  expect(typed(nodes, "AboutPage")).toBeTruthy();
  const organization = typed(nodes, "Organization");
  expect(organization?.["@id"]).toMatch(/#organization$/);
  expect(JSON.stringify(organization?.brand)).toContain("Waafas World");

  await page.goto("/gallery");
  nodes = await structuredData(page);
  expect((typed(nodes, "ImageGallery")?.mainEntity as { "@type": string })["@type"]).toBe(
    "ItemList",
  );

  await page.goto("/visa-guide");
  nodes = await structuredData(page);
  expect((typed(nodes, "CollectionPage")?.mainEntity as { "@type": string })["@type"]).toBe(
    "ItemList",
  );

  await page.goto("/visa-services/thailand");
  nodes = await structuredData(page);
  const service = typed(nodes, "Service");
  expect((service?.provider as { "@id": string })["@id"]).toMatch(/#agency$/);
  const offers = service?.offers as Array<{ priceCurrency: string; price: number }>;
  expect(offers.length).toBeGreaterThan(0);
  for (const offer of offers) {
    expect(offer.priceCurrency).toBe("BDT");
    expect(offer.price).toBeGreaterThan(0);
  }
  // Reviews and ratings are never invented.
  expect(JSON.stringify(nodes)).not.toMatch(/aggregateRating|"review"/i);
});

test("the sitemap lists the public pages and leaves Sample records out (issue 168)", async ({
  request,
}) => {
  const body = await (await request.get("/sitemap.xml")).text();
  for (const route of INDEXED.filter((path) => path !== "/")) {
    expect(body, route).toContain(`${route}</loc>`);
  }
  for (const route of SAMPLE_RECORDS) {
    expect(body, route).not.toContain(`${route}</loc>`);
  }
  expect(body).not.toContain("secure-admin-control");
});

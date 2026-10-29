import { expect, test, type Page } from "@playwright/test";

/*
 * Share previews and structured data (#96): every public page has its own og:title and description, an og:image,
 * a large Twitter card and Google's large image preview; listings carry ItemList; the sitemap lists the public pages.
 * Record pages are indexed and listed even while marked Sample; only SEO › noindex hides one (issue 183).
 */
/** Pages that are not admin records: always indexed. */
const INDEXED = ["/", "/flights", "/tour-packages", "/visa", "/shop", "/blog", "/contact"];
/** Record pages: every fixture record is Sample, and they are indexed all the same (issue 183). */
const RECORDS = [
  "/flights/dhaka-to-dubai",
  "/tour-packages/maldives-island-stay",
  "/visa/thailand",
  "/shop/p/better-day-ce505a-cf280a-black-toner",
  "/about-us",
];
const ROUTES = [...INDEXED, ...RECORDS];

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
    expect(await meta(page, 'meta[name="robots"]'), `${route} robots`).toBe("index, follow");
  }
  // Each page names itself: no page shares another page's title.
  expect(titles.size).toBe(ROUTES.length);
});

test("Google may show large image previews", async ({ page }) => {
  await page.goto("/");
  expect(await meta(page, 'meta[name="googlebot"]')).toContain("max-image-preview:large");
});

test("listings carry ItemList and Home names the website", async ({ page }) => {
  for (const route of ["/tour-packages", "/visa", "/blog"]) {
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
  expect(typed(nodes, "OnlineStore")?.name).toBe("Waafa's World");
  expect(typed(nodes, "OnlineStore")?.alternateName).toEqual(["Waafas World"]);
  expect(typed(nodes, "ItemList")?.numberOfItems).toBeGreaterThan(0);

  await page.goto("/about-us");
  nodes = await structuredData(page);
  expect(typed(nodes, "AboutPage")).toBeTruthy();
  const organization = typed(nodes, "Organization");
  expect(organization?.["@id"]).toMatch(/#organization$/);
  expect(JSON.stringify(organization?.brand)).toContain("Waafa's World");

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

  await page.goto("/visa/thailand");
  nodes = await structuredData(page);
  const service = typed(nodes, "Service");
  expect((service?.provider as { "@id": string })["@id"]).toMatch(/#agency$/);
  // A range or a starting price per visa type, never one fixed price (issue 179).
  const offers = service?.offers as Array<{
    "@type": string;
    priceCurrency: string;
    lowPrice: number;
    highPrice?: number;
  }>;
  expect(offers.length).toBeGreaterThan(0);
  for (const offer of offers) {
    expect(offer["@type"]).toBe("AggregateOffer");
    expect(offer.priceCurrency).toBe("BDT");
    expect(offer.lowPrice).toBeGreaterThan(0);
    if (offer.highPrice !== undefined) expect(offer.highPrice).toBeGreaterThan(offer.lowPrice);
  }
  expect(offers.some((offer) => offer.highPrice !== undefined)).toBe(true);
  // Reviews and ratings are never invented.
  expect(JSON.stringify(nodes)).not.toMatch(/aggregateRating|"review"/i);
});

test("the sitemap lists the public pages and every record page, Sample ones too (issue 183)", async ({
  request,
}) => {
  // Issue 287: /sitemap.xml is an index of one sitemap per area; read every part.
  const index = await (await request.get("/sitemap.xml")).text();
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1] ?? "").pathname,
  );
  expect(parts).toEqual([
    "/sitemap/pages.xml",
    "/sitemap/travel.xml",
    "/sitemap/visa.xml",
    "/sitemap/store.xml",
    "/sitemap/blog.xml",
    // Every page again at /bn (issue 254).
    "/sitemap/bangla.xml",
  ]);
  let body = "";
  for (const part of parts) {
    const answer = await request.get(part);
    expect(answer.status(), part).toBe(200);
    body += await answer.text();
  }
  for (const route of [...INDEXED.filter((path) => path !== "/"), ...RECORDS]) {
    expect(body, route).toContain(`${route}</loc>`);
  }
  expect(body).not.toContain("secure-admin-control");
});

/** Public pages for the on-page checks: list pages, info pages and one record of each kind (issue 173). */
const ON_PAGE_ROUTES = [
  ...INDEXED,
  ...RECORDS,
  "/hotels",
  "/plan-my-trip",
  "/flights/group-fares",
  "/visa-guide",
  "/visa-guide/thailand",
  "/visa-guide/india",
  "/gallery",
  "/gallery/nepal",
  "/faqs",
  "/feedback",
  "/emi",
  "/shop/printing-solutions",
  "/refund-policy",
];

test("every public page has one h1, a title within 60, a description within 155 and alt on every image (issue 173)", async ({
  page,
}) => {
  test.slow();
  const titles = new Map<string, string>();
  for (const route of ON_PAGE_ROUTES) {
    await page.goto(route);
    await expect(page.locator("h1"), `${route} h1`).toHaveCount(1);
    const title = await page.title();
    expect(title.length, `${route} title "${title}"`).toBeLessThanOrEqual(60);
    expect(
      titles.get(title),
      `${route} shares its title with ${titles.get(title)}`,
    ).toBeUndefined();
    titles.set(title, route);
    const description = (await meta(page, 'meta[name="description"]')) ?? "";
    expect(description.length, `${route} description`).toBeGreaterThan(0);
    expect(description.length, `${route} description "${description}"`).toBeLessThanOrEqual(155);
    expect(await page.locator("img:not([alt])").count(), `${route} images without alt`).toBe(0);
  }
});

test("Home names the brand in its h1 and its structured data (issue 173)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Waafa Tours and Travel");
  const nodes = await structuredData(page);
  const names = nodes.flatMap((node) => [
    node.name,
    ...((node.alternateName as string[] | undefined) ?? []),
  ]);
  for (const name of [
    "Waafa Tours and Travel",
    "Waafa International",
    "WAAFA",
    "Waafa's World",
    "Waafas World",
  ]) {
    expect(names, name).toContain(name);
  }
});

test("pages with few links end with Explore more (issue 173)", async ({ page }) => {
  for (const route of ["/hotels", "/contact", "/visa/thailand", "/gallery/nepal"]) {
    await page.goto(route);
    const explore = page.getByRole("navigation", { name: "Explore more" });
    await expect(explore, route).toBeVisible();
    expect(await explore.getByRole("link").count(), route).toBeGreaterThanOrEqual(4);
    await expect(explore.locator(`a[href="${route}"]`)).toHaveCount(0);
  }
});

test("old /visa-services links move permanently to /visa (issue 176)", async ({ request }) => {
  for (const [from, to] of [
    ["/visa-services", "/visa"],
    ["/visa-services/thailand", "/visa/thailand"],
    ["/visa-services/thailand/apply", "/visa/thailand/apply"],
  ] as const) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect([301, 308], from).toContain(response.status());
    expect(new URL(response.headers()["location"] ?? "", "http://x").pathname, from).toBe(to);
  }
  const page = await request.get("/visa");
  expect(page.status()).toBe(200);
});

test("visa prices read as a range or a starting price, never one fixed price (issue 179)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/visa/thailand");
  const card = page.getByRole("complementary", { name: /fee/i });
  await expect(card.getByText("৳7,500 – ৳9,500")).toBeVisible();
  await page.goto("/visa/thailand?type=business");
  await expect(card.getByText(/^From ৳\d/)).toBeVisible();
});

test("Home tells search engines what the agency sells and how to reach it (issue 184)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Waafa Tours and Travel: Travel Agency in Dhaka, Bangladesh");
  const nodes = await structuredData(page);
  const agency = nodes.find((node) => JSON.stringify(node["@type"]).includes("TravelAgency"));
  const catalogue = agency?.hasOfferCatalog as
    { itemListElement: Array<{ itemOffered: { name: string; url: string } }> } | undefined;
  expect(catalogue?.itemListElement.map((item) => item.itemOffered.name)).toEqual([
    "Air tickets",
    "Hotel booking",
    "Tour packages",
    "Visa processing",
  ]);
  const organization = nodes.find((node) => node["@type"] === "Organization");
  const points = organization?.contactPoint as Array<{ telephone: string }> | undefined;
  expect(points?.map((point) => point.telephone)).toEqual(["+8801823232241", "+8801823232242"]);
});

test("llms.txt sums up the business for AI search, without prices (issue 184)", async ({
  request,
}) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const body = await response.text();
  expect(body.startsWith("# Waafa Tours and Travel\n")).toBe(true);
  for (const text of [
    "Waafa International",
    "Waafa’s World",
    "/visa/thailand)",
    "/tour-packages/maldives-island-stay)",
    "+880 1823-232241, +880 1823-232242",
  ]) {
    expect(body, text).toContain(text);
  }
  expect(body).not.toContain("৳");
});

test("share previews load a small resized image that WhatsApp can show (issue 185)", async ({
  page,
  request,
}) => {
  for (const route of ["/", "/tour-packages/maldives-island-stay", "/gallery/nepal"]) {
    await page.goto(route);
    const image = await meta(page, 'meta[property="og:image"]');
    expect(image, route).toContain("/_next/image?url=");
    expect(image, route).toContain("w=1200");
    // Link preview crawlers ask for any image type and get a JPEG well under WhatsApp's 300 KB.
    const response = await request.get(
      new URL(image ?? "").pathname + new URL(image ?? "").search,
      {
        headers: { accept: "*/*" },
      },
    );
    expect(response.status(), route).toBe(200);
    expect(response.headers()["content-type"], route).toBe("image/jpeg");
    expect((await response.body()).length, route).toBeLessThan(300_000);
  }
});

test("a visa country without a photo shares a card in the brand colours (issue 287)", async ({
  page,
  request,
}) => {
  await page.goto("/visa/india");
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toMatch(/\/og\/visa\/india\.png$/);
  const answer = await request.get(new URL(image ?? "").pathname);
  expect(answer.status()).toBe(200);
  expect(answer.headers()["content-type"]).toBe("image/png");
  expect((await answer.body()).length).toBeLessThan(300 * 1024);
});

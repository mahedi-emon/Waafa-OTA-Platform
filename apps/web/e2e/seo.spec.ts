import { expect, test, type Page } from "@playwright/test";

/*
 * Share previews and structured data (#96): every public page has its own og:title and description, an og:image,
 * a large Twitter card and Google's large image preview; listings carry ItemList; the sitemap lists photos.
 */
const ROUTES = [
  "/",
  "/flights",
  "/flights/dhaka-to-dubai",
  "/tour-packages",
  "/tour-packages/maldives-island-stay",
  "/visa-services",
  "/visa-services/thailand",
  "/shop",
  "/shop/p/better-day-ce505a-cf280a-black-toner",
  "/blog",
  "/contact",
  "/about-us",
] as const;

const meta = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

test("every public page has its own share preview", async ({ page }) => {
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
    expect(await meta(page, 'meta[name="robots"]'), `${route} robots`).toContain("index");
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

test("the sitemap lists photos", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text();
  expect(body).toContain("<image:loc>");
  expect(body).not.toContain("secure-admin-control");
});

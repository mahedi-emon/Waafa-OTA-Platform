import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Bangla at /bn (issue 254): every public route renders in Bangla at phone and desktop widths with axe passing, the
 * language switch moves between the two versions of a page, and each page lists both (hreflang).
 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const ROUTES = [
  "/",
  "/flights",
  "/hotels",
  "/tour-packages",
  "/tour-packages/maldives-island-stay",
  "/plan-my-trip",
  "/visa",
  "/visa/thailand",
  "/visa/thailand/apply",
  "/shop",
  "/shop/p/better-day-ce505a-cf280a-black-toner",
  "/shop/cart",
  "/track",
  "/about-us",
  "/contact",
  "/faqs",
] as const;

test.use({ reducedMotion: "reduce" });

for (const route of ROUTES) {
  for (const width of [320, 1440] as const) {
    test(`/bn${route === "/" ? "" : route} is Bangla at ${width}px`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`/bn${route === "/" ? "" : route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "bn");
      await expect(page.locator("h1").first()).toBeVisible();
      // The page's own words are Bangla (brand names and codes stay Latin).
      const text = await page.locator("main").innerText();
      expect(text).toMatch(/[ঀ-৿]{3,}/);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
      const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(axe.violations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test("the language switch goes between the two versions of a page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tour-packages");
  await page.getByRole("banner").getByRole("link", { name: /বাংলা/ }).click();
  await expect(page).toHaveURL(/\/bn\/tour-packages$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await page
    .getByRole("banner")
    .getByRole("link", { name: /English/ })
    .click();
  await expect(page).toHaveURL(/\/tour-packages$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("both versions list each other, and Bangla pages are canonical at /bn", async ({ page }) => {
  await page.goto("/bn/tour-packages");
  const bn = page.locator('link[rel="alternate"][hreflang="bn"]');
  await expect(bn).toHaveAttribute("href", /\/bn\/tour-packages$/);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /[^n]\/tour-packages$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/bn\/tour-packages$/,
  );
  await page.goto("/tour-packages");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /[^n]\/tour-packages$/,
  );
});

test("the Bangla sitemap lists every page at /bn", async ({ request }) => {
  const index = await (await request.get("/sitemap.xml")).text();
  expect(index).toContain("/sitemap/bangla.xml");
  const bangla = await (await request.get("/sitemap/bangla.xml")).text();
  expect(bangla).toContain("/bn/tour-packages</loc>");
  expect(bangla).toContain('hreflang="en"');
});

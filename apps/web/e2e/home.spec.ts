import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Home (A7): sections render in the admin order from the fixtures, disabled sections stay out, the hero holds the
 * search card, phone carousels scroll instead of overflowing the page, and the page passes axe.
 */
test.use({ reducedMotion: "reduce" });

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Admin order in fixtures/src/settings.ts `homeSections` (testimonials disabled, hero first). */
const EXPECTED_ORDER = [
  "home-hero-title",
  "home-offers",
  "home-group-fares",
  "home-destinations",
  "home-packages",
  "home-visa",
  "home-why",
  "home-store",
  "home-gallery",
  "home-blog",
  "home-faq",
  "home-team",
  "home-cta",
];

async function sectionOrder(page: Page): Promise<string[]> {
  return page.$$eval("main > section[aria-labelledby]", (sections) =>
    sections.map((section) => section.getAttribute("aria-labelledby") ?? ""),
  );
}

test.describe("home at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders the enabled sections in admin order and leaves disabled ones out", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    expect(await sectionOrder(page)).toEqual(EXPECTED_ORDER);
    await expect(page.locator("#home-testimonials")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Tell\s+us\s+where\.\s*We’ll\s+handle\s+the\s+rest\./,
    );
    await expect(
      page.getByRole("region", { name: "Search flights, hotels, tours and visas" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("keeps carousels inside the page width", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("filters destinations by trip type", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", { name: "Find a trip that fits you" });
    const all = await section.getByRole("listitem").count();
    await section.getByRole("radio", { name: "Bangladesh" }).click();
    const domestic = await section.getByRole("listitem").count();
    expect(domestic).toBeGreaterThan(0);
    expect(domestic).toBeLessThan(all);
  });

  test("passes axe", async ({ page }) => {
    await page.goto("/");
    const result = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
      .analyze();
    expect(result.violations).toEqual([]);
  });
});

test.describe("home at 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("passes axe and shows Organization and TravelAgency structured data", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graph = ld.map((text) => JSON.stringify(JSON.parse(text))).join(" ");
    expect(graph).toContain('"Organization"');
    expect(graph).toContain('"TravelAgency"');
    const result = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
      .analyze();
    expect(result.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
});

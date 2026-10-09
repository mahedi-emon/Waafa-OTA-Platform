import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/** Widths every public route must hold (CLAUDE.md Quality gates). */
const WIDTHS = [320, 390, 768, 1024, 1440] as const;
const ROUTES = ["/"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Console errors and failed responses. Links to routes that later issues build (A7-A16) are prefetched and 404 for
 * now: those RSC prefetches are expected; any other 404 (pages, images, scripts) is an error. Remove the prefetch
 * allowance in A22, when every linked route exists.
 */
for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`${route} renders cleanly at ${width}px`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width, height: 900 });

      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();

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

test("pages declare English and keep pinch-zoom enabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/);
});

test("the skip link is the first stop for keyboard users", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});

test("the default locale has no URL prefix", async ({ page }) => {
  await page.goto("/en");
  await expect(page).toHaveURL(/\/$/);
});

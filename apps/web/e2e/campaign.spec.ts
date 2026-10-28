import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/* Campaign pages (issue 247): banner, words, the running strip with its end date, and the campaign's products. */
for (const width of [390, 1440]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 844 : 900 } });

    test("a running campaign shows its end, countdown and products", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = collectErrors(page);
      await page.goto("/shop/campaign/winter-office-week");
      await expect(
        page.getByRole("heading", { level: 1, name: "Winter office week" }),
      ).toBeVisible();
      await expect(page.getByText(/On now · ends 31 Jan 2027/)).toBeVisible();
      await expect(page.getByRole("link", { name: /Voltaro Power Bank/ }).first()).toBeVisible();
      const axe = await new AxeBuilder({ page }).include("main").analyze();
      expect(axe.violations).toEqual([]);
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(scroll).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  });
}

test("an unknown campaign shows the not-found page", async ({ page }) => {
  await page.goto("/shop/campaign/no-such-campaign");
  await expect(
    page.getByRole("heading", { name: "This page took a different flight" }),
  ).toBeVisible();
});

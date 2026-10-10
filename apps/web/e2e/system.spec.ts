import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/* A17 system states: branded 404 inside the site frame, and the offline notice. */
test.use({ reducedMotion: "reduce" });

for (const width of [320, 1440]) {
  test(`unknown URLs show the branded 404 at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/this-route-does-not-exist/at-all");
    await expect(
      page.getByRole("heading", { name: "This page took a different flight", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
    await page
      .getByRole("navigation", { name: "Popular pages" })
      .getByRole("link", { name: "Tour packages" })
      .click();
    await expect(page).toHaveURL(/\/tour-packages$/);
  });
}

test("unknown records use the same 404", async ({ page }) => {
  await page.goto("/shop/p/not-a-real-product");
  await expect(
    page.getByRole("heading", { name: "This page took a different flight", level: 1 }),
  ).toBeVisible();
});

test("the offline notice appears and clears with the connection", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText("You’re offline")).toBeVisible();
  await expect(page.getByRole("link", { name: "Call us instead" })).toHaveAttribute(
    "href",
    /^tel:\+880/,
  );
  await context.setOffline(false);
  await expect(page.getByText("You’re offline")).toBeHidden();
});

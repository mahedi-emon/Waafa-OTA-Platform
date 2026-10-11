import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/* Flight route landing pages (#99): facts, FAQ markup, a prefilled request and links from /flights. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const width of [390, 1440]) {
  test(`a route page reads well and leads to a prefilled request at ${width}`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/flights/dhaka-to-dubai");
    await expect(
      page.getByRole("heading", { level: 1, name: "Dhaka to Dubai flights" }),
    ).toBeVisible();
    await expect(page.getByText("About 5 hours non-stop", { exact: true })).toBeVisible();
    await expect(page.getByText("Emirates", { exact: true }).first()).toBeVisible();

    const jsonLd = (
      await page.locator('script[type="application/ld+json"]').allTextContents()
    ).join("");
    expect(jsonLd).toContain('"@type":"FAQPage"');
    expect(jsonLd).toContain('"@type":"BreadcrumbList"');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

    await page.getByRole("link", { name: "Get fares for this route" }).click();
    await expect(page).toHaveURL(/\/flights\?from=DAC&to=DXB/);
    expect(errors).toEqual([]);
  });
}

test("/flights links the popular routes and an unknown route is not found", async ({ page }) => {
  await page.goto("/flights");
  await expect(page.getByRole("heading", { name: "Popular routes from Dhaka" })).toBeVisible();
  await page.getByRole("link", { name: "Dhaka to Kuala Lumpur flights" }).click();
  await expect(page).toHaveURL(/\/flights\/dhaka-to-kuala-lumpur$/);
  // Unknown slugs get the branded not-found with noindex (streamed, D78).
  await page.goto("/flights/dhaka-to-atlantis");
  await expect(
    page.getByRole("heading", { name: "This page took a different flight", level: 1 }),
  ).toBeVisible();
});

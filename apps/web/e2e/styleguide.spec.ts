import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/**
 * The dev-only styleguide (issue #3). Production builds return 404 unless built with STYLEGUIDE=1,
 * so these checks skip themselves when the page is not part of the build.
 */
const WIDTHS = [320, 390, 768, 1024, 1440] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function openStyleguide(page: Page) {
  const response = await page.goto("/styleguide");
  test.skip(response?.status() === 404, "styleguide not included in this build (set STYLEGUIDE=1)");
  await expect(page.getByRole("heading", { level: 1, name: "WAAFA styleguide" })).toBeVisible();
}

for (const width of WIDTHS) {
  test(`styleguide is clean at ${width}px`, async ({ page }) => {
    const errors = collectErrors(page);

    await page.setViewportSize({ width, height: 900 });
    await openStyleguide(page);

    // Scroll through once so scroll reveals have run before axe reads the page.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
    }

    // Let scroll reveals finish fading in before axe measures contrast.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);

    const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("dialogs open from the keyboard and close with Escape", async ({ page }) => {
  await openStyleguide(page);
  const trigger = page.getByRole("button", { name: "Open dialog" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Fare rules" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the accordion toggles with Enter and reports its state", async ({ page }) => {
  await openStyleguide(page);
  const question = page.getByRole("button", { name: "How do I pay?" });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Bank transfer, bKash, Nagad or at our office")).toBeVisible();
});

test("a success toast appears and can be read", async ({ page }) => {
  await openStyleguide(page);
  await page.getByRole("button", { name: "Success toast" }).click();
  await expect(page.getByText("Added to cart")).toBeVisible();
  await expect(page.getByRole("button", { name: "View cart" })).toBeVisible();
});

test("reduced motion still shows every specimen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStyleguide(page);
  await page.locator("#motion").scrollIntoViewIfNeeded();
  await expect(page.getByText("Count up once in view (sample number)")).toBeVisible();
  await expect(page.locator("#motion [data-reveal]").first()).toHaveCSS("opacity", "1");
});

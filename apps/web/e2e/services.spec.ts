import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/* Waafa International service pages (A15): the printing quote (PRN) and the trading RFQ (TRD). */
test.use({ reducedMotion: "reduce" });

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(results.violations).toEqual([]);
}

async function contactStep(page: Page) {
  await page.getByLabel("Full name").fill("Sample Rahim Uddin");
  await page.getByLabel("Mobile number").fill("01712-345678");
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("service pages at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sends a printing quote and shows a PRN reference", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/shop/printing-solutions");
    await expect(
      page.getByRole("heading", { name: "Printing that keeps working", level: 1 }),
    ).toBeVisible();
    await axe(page);

    await contactStep(page);
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.getByText("Enter your company name.")).toBeVisible();
    await expect(page.getByText("Choose how many printers you have.")).toBeVisible();

    await page.getByLabel("Company").fill("Sample Rahman Traders");
    await page.locator("label", { hasText: "6 to 20" }).click();
    await page.locator("label", { hasText: "2,000 to 10,000" }).click();
    await page.locator("label", { hasText: "2 to 5" }).click();
    await page.getByLabel("Where are your offices?").fill("Motijheel, Dhaka");
    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    await axe(page);
    await page.getByRole("button", { name: "Request a quote" }).click();
    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
    await expect(page.getByText(/^PRN-\d{6}-\d{4}$/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("sends a trading RFQ and shows a TRD reference", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/shop/international-trading");
    await expect(
      page.getByRole("heading", { name: "Sourcing and trade, handled for you", level: 1 }),
    ).toBeVisible();

    await contactStep(page);
    await page.getByRole("button", { name: "Send RFQ" }).click();
    await expect(page.getByText("Enter the product or material.")).toBeVisible();
    await expect(page.getByText("Enter a quantity above zero.")).toBeVisible();

    await page.getByLabel("Company").fill("Sample Rahman Traders");
    await page.getByLabel(/Product or material/).fill("A4 copy paper, 80 gsm");
    await page.getByLabel(/^Quantity/).fill("1200");
    await page.getByLabel(/^Country/).fill("China");
    await page.getByLabel(/^Specifications/).fill("500 sheets per ream, 5 reams per carton");
    await page.locator("label", { hasText: "1 to 3 months" }).click();
    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    await axe(page);
    await page.getByRole("button", { name: "Send RFQ" }).click();
    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
    await expect(page.getByText(/^TRD-\d{6}-\d{4}$/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test("service pages are clean at 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ["/shop/printing-solutions", "/shop/international-trading"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await axe(page);
  }
});

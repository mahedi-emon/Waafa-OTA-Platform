import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/* Tour packages and Plan my trip (A11): filter → detail → query → PKG success; plan → CTR success. */
test.use({ reducedMotion: "reduce" });

const PACKAGE = "/tour-packages/istanbul-and-cappadocia-in-a-week";

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(results.violations).toEqual([]);
}

async function contactStep(page: Page) {
  await page.getByLabel("Full name").fill("Sample Nadia Islam");
  await page.getByLabel("Mobile number").fill("01912-345678");
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("packages at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("filters the list and opens a package", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/tour-packages");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("button", { name: /Filters/ }).click();
    await page.getByLabel("Kind of trip").selectOption("honeymoon");
    await page.getByRole("button", { name: "Show packages" }).click();
    await expect(page).toHaveURL(/category=honeymoon/);
    await expect(page.getByRole("heading", { name: /\d+ packages?/ })).toBeVisible();
    await axe(page);

    await page.getByRole("link", { name: "Maldives island stay with speedboat transfers" }).click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Maldives island stay with speedboat transfers",
      }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("sends a package query from the booking bar", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(PACKAGE);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Istanbul and Cappadocia in a week",
    );
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
    await axe(page);

    await page.getByRole("button", { name: "Send query" }).click();
    await expect(
      page.getByRole("heading", { name: "Send a query for this trip" }),
    ).toBeInViewport();
    await contactStep(page);
    await expect(page.getByRole("heading", { name: "Dates, people and rooms" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Departure" })).toContainText("12 Nov 2026");
    await page.getByRole("button", { name: "Adults: add one" }).click();
    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(page.getByRole("heading", { name: "Query sent" })).toBeFocused();
    await expect(page.getByText(/^PKG-\d{6}-\d{4}$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "More packages" })).toHaveAttribute(
      "href",
      "/tour-packages",
    );
    expect(errors).toEqual([]);
  });

  test("shows not found for an unknown package", async ({ page }) => {
    // The layout shell streams first (Cache Components), so the status stays 200; Next adds noindex (D78).
    await page.goto("/tour-packages/not-a-real-trip");
    await expect(page.getByText("This page could not be found.")).toBeVisible();
    await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
  });
});

test.describe("package booking card at 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("carries the card choices into the query", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(PACKAGE);
    const card = page.getByRole("complementary", { name: "Book this trip" });
    await expect(card).toContainText("৳2,90,000");
    await card.getByRole("button", { name: "Adults: add one" }).click();
    await expect(card).toContainText("৳4,35,000");
    await expect(card).toContainText("3 travellers, Twin sharing");

    await card.getByRole("button", { name: "Send query" }).click();
    await contactStep(page);
    const adults = page.locator("#query").getByRole("group", { name: "Adults" });
    await expect(adults.locator("output")).toHaveText("3");

    await page.getByRole("button", { name: /All \d+ photos/ }).click();
    await expect(
      page.getByRole("dialog", { name: /Photos: Istanbul and Cappadocia/ }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    expect(errors).toEqual([]);
  });
});

test.describe("plan my trip at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("explains what is missing, then sends the plan", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/plan-my-trip?place=Bali");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Tell us the trip. We’ll plan it day by day.",
    );
    await contactStep(page);
    await expect(page.getByRole("heading", { name: "Where, when, who and budget" })).toBeVisible();
    await page.getByRole("button", { name: "Bali" }).click();
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(
      page.getByText("Choose at least one place, or pick “Not sure yet”."),
    ).toBeVisible();
    await expect(page.getByText("Choose a month")).toBeVisible();
    await axe(page);

    await page.getByRole("textbox", { name: "Add a place" }).fill("Sylhet tea gardens");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sylhet tea gardens" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page
      .getByRole("radiogroup", { name: "Which month could work?" })
      .getByRole("radio")
      .nth(2)
      .check();
    await page.getByRole("radio", { name: "Couple" }).check();
    await page.getByRole("button", { name: "Beaches" }).click();
    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(page.getByRole("heading", { name: "Request sent" })).toBeFocused();
    await expect(page.getByText(/^CTR-\d{6}-\d{4}$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse packages" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

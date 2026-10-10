import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/* Regression tests for the 10 Oct review findings (#51). */
test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

/** Clicks a button after centring it, so the fixed tab bar on phones never covers it. */
async function press(page: Page, name: string) {
  const button = page.getByRole("button", { name });
  await button.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await button.click();
}

async function contactStep(page: Page) {
  await page.getByLabel("Full name").fill("Sample Karim Ahmed");
  await page.getByLabel("Mobile number").fill("01812-345678");
  await page.getByRole("button", { name: "Continue" }).click();
}

test("a destination-only flight link prefills To and the default origin, and asks who travels", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto("/flights?to=KUL&fare=student");
  await contactStep(page);
  await expect(page.locator("#trip-from")).toContainText("DAC");
  await expect(page.locator("#trip-to")).toContainText("KUL");
  await expect(page.getByRole("group", { name: "Adults", exact: true })).toBeVisible();
  await press(page, "One more: Adults");
  await expect(
    page.getByRole("group", { name: "Adults", exact: true }).locator("output"),
  ).toHaveText("2");
  await press(page, "One more: Infants");
  await press(page, "One more: Infants");
  // Infants stop at the number of adults.
  await expect(page.getByRole("button", { name: "One more: Infants" })).toBeDisabled();
  await expect(
    page.getByRole("group", { name: "Infants", exact: true }).locator("output"),
  ).toHaveText("2");
  expect(errors).toEqual([]);
});

test("the hotel step asks for rooms, guests and the hotel class", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/hotels");
  await contactStep(page);
  await expect(page.getByRole("group", { name: "Rooms", exact: true })).toBeVisible();
  await press(page, "One more: Children");
  await expect(page.getByLabel("Age of child 1")).toBeVisible();
  await page.locator("label", { hasText: "4 star" }).click();
  await expect(page.getByRole("radio", { name: "4 star" })).toBeChecked();
  expect(errors).toEqual([]);
});

test("the store bar lists categories, services and Track order", async ({ page }) => {
  await page.goto("/shop");
  const row = page.getByRole("navigation", { name: "Shop by category" });
  await expect(row.getByRole("link", { name: "Printing Solutions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Track order" })).toHaveAttribute(
    "href",
    "/shop/track",
  );
});

test("one WAAFA logo per page: the footer names the brand in text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "WAAFA home" })).toHaveCount(1);
  await expect(
    page.getByRole("contentinfo").getByText("Waafa Tours and Travel").first(),
  ).toBeVisible();
});

test("the visa list offers to start an application", async ({ page }) => {
  await page.goto("/visa-services");
  await expect(page.getByRole("link", { name: "Start an application" })).toHaveAttribute(
    "href",
    "#visa-search",
  );
});

test("Home has its own canonical and the admin SEO title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Waafa Tours and Travel · Flights, tours and visas from Dhaka");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/$/);
});

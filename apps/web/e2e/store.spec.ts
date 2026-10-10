import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/* Waafas World catalogue (A13): store home, search suggestions, attribute filters, variants, cart, finder, bulk quote. */
test.use({ reducedMotion: "reduce" });

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe("store at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens a product from the search suggestions", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "Waafas World", level: 1 })).toBeAttached();
    await axe(page);
    const search = page.getByRole("combobox", { name: "Search products, brands and categories" });
    await search.fill("cf280a");
    await expect(page.getByRole("option", { name: /CF280A Black Toner/ })).toBeVisible();
    await search.press("ArrowDown");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/shop\/p\/better-day-ce505a-cf280a-black-toner$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Better Day CE505A / CF280A Black Toner",
    );
    expect(errors).toEqual([]);
  });

  test("filters by an attribute, changes variants and adds to the cart", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/shop/c/t-shirts");
    await page.getByRole("button", { name: /Filters/ }).click();
    await page.getByLabel("Size").selectOption("XXL");
    await page.getByRole("button", { name: "Show products" }).click();
    await expect(page).toHaveURL(/a\.size=XXL/);
    await expect(page.getByRole("heading", { name: "1 product" })).toBeVisible();
    await page.getByRole("link", { name: "Classic Cotton Crew T-shirt" }).click();

    await expect(page.getByText("SKU TSR-TEE-WHT-M")).toBeVisible();
    await page.getByRole("button", { name: "Navy", exact: true }).click();
    await expect(page.getByText("SKU TSR-TEE-NVY-M")).toBeVisible();
    await page.getByRole("button", { name: "XXL", exact: true }).click();
    await expect(page.getByText("SKU TSR-TEE-NVY-XXL")).toBeVisible();
    await expect(page.locator("main").getByText("৳700").first()).toBeVisible();
    await page.getByRole("button", { name: "Black", exact: true }).click();
    await page.getByRole("button", { name: "S, sold out" }).click();
    await expect(page.getByText("This option is sold out")).toBeVisible();
    await page.getByRole("button", { name: "M", exact: true }).click();
    await axe(page);
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await expect(page.getByRole("link", { name: /Cart \(1\)/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("turns Add to cart into a stepper on cards", async ({ page }) => {
    await page.goto("/shop/brand/better-day");
    await page.getByRole("button", { name: /Add Better Day CE505A \/ CF280A to cart/ }).click();
    await expect(
      page.getByRole("group", { name: "Better Day CE505A / CF280A Black Toner" }),
    ).toContainText("1");
    await page.getByRole("button", { name: "Add one more Better Day CE505A / CF280A" }).click();
    await expect(
      page.getByRole("group", { name: "Better Day CE505A / CF280A Black Toner" }),
    ).toContainText("2");
    await page.reload();
    await expect(page.getByRole("link", { name: /Cart \(2\)/ })).toBeVisible();
  });
});

test.describe("store at 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("finds toner by printer model and by part code", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/shop/finder");
    await page.getByLabel("Printer brand").selectOption("HP");
    await page.getByRole("button", { name: "Show what fits" }).click();
    await page.getByLabel("Printer model").selectOption({ label: "LaserJet P2035" });
    await page.getByRole("button", { name: "Show what fits" }).click();
    await expect(
      page.getByRole("heading", { name: "1 product fits the HP LaserJet P2035" }),
    ).toBeVisible();
    await page.getByLabel("Part code").fill("80A");
    await page.getByRole("button", { name: "Search", exact: true }).last().click();
    await expect(page.getByRole("heading", { name: /“80A”/ })).toBeVisible();
    await axe(page);
    expect(errors).toEqual([]);
  });

  test("sends a corporate quote with a QTE reference", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/shop/p/better-day-ce505a-cf280a-black-toner");
    await page.getByRole("button", { name: "Get a corporate price" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Full name").fill("Sample Rafiq Hasan");
    await dialog.getByLabel("Mobile number").fill("01812-345678");
    await dialog.getByRole("button", { name: "Continue" }).click();
    await expect(dialog.getByLabel("Products and quantities")).toHaveValue(
      /Better Day CE505A \/ CF280A Black Toner, quantity: /,
    );
    await dialog.getByLabel("Company").fill("Sample Traders Ltd");
    await dialog
      .getByLabel("Products and quantities")
      .fill("Better Day CF280A, 20 pieces every month");
    await dialog.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    await dialog.getByRole("button", { name: "Send request" }).click();
    await expect(dialog.getByText(/^QTE-\d{6}-\d{4}$/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows deals with timers", async ({ page }) => {
    await page.goto("/shop/deals");
    await expect(page.getByRole("timer").first()).toBeVisible();
    await expect(page.getByText("Deal", { exact: true }).first()).toBeVisible();
  });
});

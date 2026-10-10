import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/* Waafas World cart, checkout and tracking (A14): coupon, delivery area, COD and transfer orders, track by phone. */
test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(results.violations).toEqual([]);
}

const TONER = {
  productId: "prod-bd-cf280a",
  variantId: "bd-cf280a",
  slug: "better-day-ce505a-cf280a-black-toner",
  title: "Better Day CE505A / CF280A Black Toner",
  variantLabel: "",
  sku: "BD-CF280A",
  price: 1450,
  qty: 2,
  maxQty: 20,
};

async function seedCart(page: Page, qty = 2) {
  // Seeds once per browser context, so later navigations keep the cart as the app left it.
  await page.addInitScript(
    ([key, line]) => {
      if (window.sessionStorage.getItem("seeded")) return;
      window.sessionStorage.setItem("seeded", "1");
      window.localStorage.setItem(key as string, JSON.stringify([line]));
    },
    ["waafa:cart:v1", { ...TONER, qty }] as const,
  );
}

async function fillCustomer(page: Page, phone = "01712-345678") {
  await page.getByLabel("Full name").fill("Rahim Uddin");
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("combobox", { name: /Division/ }).click();
  await page.getByRole("option", { name: "Dhaka" }).click();
  await page.getByLabel("District").fill("Dhaka");
  await page.getByLabel("Area or thana").fill("Motijheel");
  await page.locator("#co-street").fill("House 4, Road 2");
}

test("prices the cart, applies and rejects coupons, and lowers quantities", async ({ page }) => {
  const errors = collectErrors(page);
  await seedCart(page);
  await page.goto("/shop/cart");
  await expect(page.getByRole("heading", { name: "Your cart", level: 1 })).toBeVisible();
  const summary = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary.getByText("৳2,980")).toBeVisible();

  await summary.getByLabel("Coupon code").fill("welcome10");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByText("WELCOME10: ৳290 off")).toBeVisible();
  await expect(summary.getByText("৳2,690")).toBeVisible();

  await summary.getByRole("button", { name: "Remove coupon" }).click();
  await summary.getByLabel("Coupon code").fill("FREESHIP");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByText(/isn’t valid or has expired/)).toBeVisible();

  await summary.getByRole("radio", { name: "Outside Dhaka" }).click();
  await expect(summary.getByText("৳3,050")).toBeVisible();
  await axe(page);

  await page.getByRole("button", { name: /One more of/ }).click();
  await expect(summary.getByText("৳4,350")).toBeVisible();
  await page.getByRole("button", { name: /Remove .* from your cart/ }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("places a cash-on-delivery order and tracks it with the phone number", async ({ page }) => {
  const errors = collectErrors(page);
  await seedCart(page);
  await page.goto("/shop/checkout");
  await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Enter your full name.").first()).toBeVisible();

  await fillCustomer(page);
  await axe(page);
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  const reference =
    (await page
      .getByText(/^ORD-\d{6}-\d{4}$/)
      .first()
      .textContent()) ?? "";
  expect(reference).toMatch(/^ORD-\d{6}-\d{4}$/);

  // The cart is empty after the order.
  await page.goto("/shop/cart");
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();

  await page.goto(`/shop/track?ref=${reference}&phone=01712345678`);
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  await expect(page.getByText("৳2,980")).toBeVisible();

  await page.goto(`/shop/track?ref=${reference}&phone=01999000000`);
  await expect(page.getByRole("heading", { name: "We couldn’t find that order" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("blocks cash on delivery above the limit and takes a bKash order with a transaction ID", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await seedCart(page, 20);
  await page.goto("/shop/checkout");
  await expect(page.getByRole("radio", { name: /^Cash on delivery/ })).toBeDisabled();
  await expect(page.getByText(/Cash on delivery is for orders up to/)).toBeVisible();

  await fillCustomer(page);
  await page.getByRole("radio", { name: "bKash", exact: true }).click();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Enter the transaction ID from the SMS.")).toBeVisible();
  await page.getByLabel(/Transaction ID/).fill("8N7A6B5C4D");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
  await expect(page.getByText(/We check your transaction 8N7A6B5C4D/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("the tracked sample order shows its courier timeline", async ({ page }) => {
  await page.goto("/shop/track?ref=ORD-260921-0108&phone=%2B8801000000003");
  await expect(page.getByRole("heading", { name: "Delivered" })).toBeVisible();
  await axe(page);
});

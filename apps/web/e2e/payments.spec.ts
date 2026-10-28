import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Online payment (FR-SHOP-07, issue 251), the parts the browser sees: nothing online until a gateway is live (this
 * build has no gateway), the gateway's return lands on /shop/payment with the outcome, and the result page explains
 * each outcome. Gateway contracts and the paid-once rules are in apps/api (gateways.unit.test, payments.test).
 */
test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

test("checkout offers no online payment until a gateway is live", async ({ page }) => {
  await page.goto("/shop/checkout");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/^Pay online/)).toHaveCount(0);
});

for (const [outcome, title] of [
  ["paid", "Payment received"],
  ["failed", "The payment didn't go through"],
  ["cancelled", "Payment cancelled"],
  ["anything", "We're checking your payment"],
] as const) {
  test(`the result page explains "${outcome}"`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/shop/payment?outcome=${outcome}&order=ORD-261104-0007`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("ORD-261104-0007")).toBeVisible();
    await expect(page.getByRole("link", { name: "Track your order" })).toHaveAttribute(
      "href",
      "/track?reference=ORD-261104-0007",
    );
    const axe = await new AxeBuilder({ page })
      .include("#main")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("a gateway's return redirects to the result page; unknown gateways and odd orders are refused", async ({
  request,
}) => {
  const back = await request.post("/api/payments/sslcommerz/cancel", {
    form: { tran_id: "ORD-261104-0007_1" },
    maxRedirects: 0,
  });
  expect(back.status()).toBe(303);
  expect(back.headers().location).toContain("/shop/payment?outcome=");
  const ipn = await request.post("/api/payments/sslcommerz/ipn", {
    form: { val_id: "x" },
    maxRedirects: 0,
  });
  expect(ipn.status()).toBe(200);
  expect((await request.get("/api/payments/paypal/success", { maxRedirects: 0 })).status()).toBe(
    404,
  );
  const odd = await request.get("/shop/payment?outcome=paid&order=<script>");
  expect(await odd.text()).not.toContain("<script>");
});

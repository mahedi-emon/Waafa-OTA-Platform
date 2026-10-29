import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Integration hub setup guides (issue 251): every payment card says in Banglish how to get the keys and lists the
 * addresses to paste into the gateway's panel, each with a Copy button. API mode only (the hub reads the API).
 */
const API = process.env.WAAFA_API_URL ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");

async function signIn(page: Page) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.91" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

test("payment cards show the steps and the addresses to copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page);
  const errors = collectErrors(page);
  await page.goto("/secure-admin-control/integrations");
  await page.getByRole("tab", { name: "Payments" }).click();
  const card = page.getByRole("article", { name: /^SSLCommerz/ });
  await card.getByText("How to connect it (step by step)").click();
  await expect(card.getByText(/developer\.sslcommerz\.com e sandbox store khulun/)).toBeVisible();
  await expect(card.getByText(/\/api\/payments\/sslcommerz\/ipn$/)).toBeVisible();
  await expect(card.getByRole("button", { name: "Copy IPN URL" })).toBeVisible();
  const bkash = page.getByRole("article", { name: /^bKash/ });
  await bkash.getByText("How to connect it (step by step)").click();
  await expect(bkash.getByText(/\/api\/payments\/bkash\/callback$/)).toBeVisible();
  const axe = await new AxeBuilder({ page }).include("main").analyze();
  expect(axe.violations).toEqual([]);
  expect(errors).toEqual([]);
});

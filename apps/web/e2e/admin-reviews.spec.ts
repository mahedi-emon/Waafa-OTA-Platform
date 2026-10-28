import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";
import { whenHydrated } from "./hydration";

/*
 * Reviews and product questions (issue 245): a visitor asks a question on a product, staff answer it in Admin and the
 * answer shows on the product page; signed out, "Write a review" asks the customer to sign in (only real customers
 * review; the booked/delivered rule is covered by the API tests). API mode only; own data per run.
 */
const API = process.env.WAAFA_API_URL ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";
const PRODUCT = "/shop/p/voltaro-power-bank-22-5w";

test.skip(!API || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

const STAMP = String(Date.now()).slice(-6);

async function signIn(page: Page) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.90" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

test("a product question is answered in Admin and shows on the product page", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = collectErrors(page);
  await page.goto(PRODUCT);
  const questions = page.getByRole("region", { name: "Questions and answers" });
  await expect(questions).toBeVisible();
  // Signed out: reviews come from real customers, so the page asks to sign in instead of showing a form.
  await expect(
    page
      .getByRole("region", { name: "Reviews" })
      .getByRole("link", { name: /Sign in to review it/ }),
  ).toBeVisible();

  const question = `Does it charge two phones at once? ${STAMP}`;
  const name = questions.getByLabel("Your name");
  await whenHydrated(name);
  await name.fill("Rafiq Hasan");
  await questions.getByLabel("Your question").fill(question);
  await questions.getByRole("button", { name: "Send question" }).click();
  await expect(questions.getByText(/Our team will answer here/)).toBeVisible();
  // Not on the page until answered.
  await page.reload();
  await expect(page.getByText(question)).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).include("main").analyze();
  expect(axe.violations).toEqual([]);

  const staff = await browser.newPage();
  await signIn(staff);
  await staff.goto("/secure-admin-control/reviews");
  const item = staff.getByRole("listitem").filter({ hasText: question });
  await item.getByLabel("Answer").fill("Yes, through its two USB ports.");
  await item.getByRole("button", { name: "Publish answer" }).click();
  await expect(staff.getByText("Saved").first()).toBeVisible();
  await staff.close();

  await expect(async () => {
    await page.reload();
    await expect(page.getByText(question)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.getByText("Yes, through its two USB ports.")).toBeVisible();
  await expect(page.getByText("Asked by Rafiq H.")).toBeVisible();
  expect(errors).toEqual([]);
});

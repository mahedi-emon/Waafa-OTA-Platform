import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { collectErrors } from "./errors";
import { totpCode } from "./totp";

/*
 * Two-step sign-in (issue 234), the way staff meet it: the Super Admin adds an Admin with a first password; that
 * person's first sign-in sets up the authenticator and shows recovery codes; the next sign-in on a new browser asks
 * for a code, takes a recovery code once, and lists in My account; the Super Admin sees their sign-ins and resets it.
 * API mode only. The seed Super Admin's own browser is trusted by staff.setup.ts.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

const STAMP = String(Date.now()).slice(-6);
const NAME = `Sample Manager ${STAMP}`;
const EMAIL = `two-step-${STAMP}@example.com`;
const PASSWORD = `first-password-${STAMP}`;
let address = 0;

/** A browser with no device cookie: what a new laptop or phone looks like. */
async function freshPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    reducedMotion: "reduce",
    baseURL: test.info().project.use.baseURL,
  });
  const page = await context.newPage();
  address += 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${150 + address}` });
  return page;
}

async function password(page: Page, email: string, secret: string) {
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function ownerSignIn(page: Page) {
  address += 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${150 + address}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await password(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  // staff.setup.ts trusted this browser: no code step.
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

let secret = "";
let recoveryCodes: string[] = [];

test("the Super Admin adds an Admin, whose first sign-in sets up two-step sign-in", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await ownerSignIn(page);
  await page.goto("/secure-admin-control/users");
  await page.getByRole("button", { name: "Add staff" }).click();
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    await dialog.getByRole("textbox", { name: "Full name", exact: true }).fill(NAME);
    await expect(dialog.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
      NAME,
      {
        timeout: 1_500,
      },
    );
  }).toPass({ timeout: 30_000 });
  await dialog.getByRole("textbox", { name: "Work email", exact: true }).fill(EMAIL);
  await dialog.getByRole("radio", { name: /Set a first password now/ }).check();
  await dialog.getByRole("textbox", { name: "First password" }).fill(PASSWORD);
  await dialog.getByRole("checkbox", { name: "Admin / Manager" }).check();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Staff added")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: NAME })).toContainText("Not set up");

  const fresh = await freshPage(browser);
  const freshErrors = collectErrors(fresh);
  await password(fresh, EMAIL, PASSWORD);
  await expect(fresh.getByRole("heading", { name: "Set up two-step sign-in" })).toBeVisible();
  await expect(
    fresh.getByRole("img", { name: "QR code for your authenticator app" }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page: fresh })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  secret = ((await fresh.locator("code").first().textContent()) ?? "").replace(/\s/g, "");

  // A wrong first code says so and keeps the setup open.
  await fresh.getByLabel("6-digit code").fill("000000");
  await expect(fresh.getByText(/That code didn't work/)).toBeVisible();
  await fresh.getByLabel("6-digit code").fill(totpCode(secret));
  await expect(fresh.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
  recoveryCodes = await fresh
    .getByRole("list", { name: "Your recovery codes" })
    .getByRole("listitem")
    .allTextContents();
  expect(recoveryCodes).toHaveLength(10);
  const continueButton = fresh.getByRole("button", { name: "Continue to Admin" });
  await expect(continueButton).toBeDisabled();
  await fresh.getByLabel("I saved my recovery codes").check();
  await continueButton.click();
  await expect(fresh.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
  expect(freshErrors).toEqual([]);
  await fresh.context().close();
  expect(errors).toEqual([]);
});

test("a new browser asks for a code, takes a recovery code once, and My account lists the sign-ins", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const page = await freshPage(browser);
  const errors = collectErrors(page);
  await password(page, EMAIL, PASSWORD);
  await expect(page.getByRole("heading", { name: "Enter your sign-in code" })).toBeVisible();
  await page.getByLabel("6-digit code").fill("123456");
  await expect(page.getByText(/That code didn't work/)).toBeVisible();

  await page.getByRole("button", { name: "Use a recovery code instead" }).click();
  const [first = ""] = recoveryCodes;
  await page.getByLabel("Recovery code").fill(first);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();

  await page.goto("/secure-admin-control/account");
  await expect(page.getByRole("heading", { name: "Two-step sign-in" })).toBeVisible();
  await expect(page.getByText("9 recovery codes left")).toBeVisible();
  // Admins can't turn it off.
  await expect(page.getByRole("button", { name: "Turn off" })).toHaveCount(0);
  const history = page.getByRole("region", { name: "Recent sign-ins" });
  await expect(history.getByText("Signed in with a recovery code")).toBeVisible();
  await expect(history.getByText("Wrong code").first()).toBeVisible();
  await page.context().close();

  // The same recovery code doesn't work twice.
  const again = await freshPage(browser);
  await password(again, EMAIL, PASSWORD);
  await again.getByRole("button", { name: "Use a recovery code instead" }).click();
  await again.getByLabel("Recovery code").fill(first);
  await again.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(again.getByText(/That code didn't work/)).toBeVisible();
  await again.context().close();
  expect(errors).toEqual([]);
});

test("the Super Admin sees the sign-ins and resets two-step sign-in for a lost phone", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await ownerSignIn(page);
  await page.goto(`/secure-admin-control/users?q=${encodeURIComponent(EMAIL)}`);
  const row = page.getByRole("row").filter({ hasText: NAME });
  await expect(row).toContainText("On");
  await row.getByRole("cell").nth(2).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("region", { name: "Recent sign-ins" })).toContainText(
    "Signed in with a recovery code",
  );
  await sheet.getByRole("button", { name: "Reset two-step sign-in" }).click();
  await sheet.getByRole("button", { name: "Reset two-step sign-in" }).last().click();
  await expect(page.getByText("Two-step sign-in reset")).toBeVisible();

  const fresh = await freshPage(browser);
  await password(fresh, EMAIL, PASSWORD);
  await expect(fresh.getByRole("heading", { name: "Set up two-step sign-in" })).toBeVisible();
  await fresh.context().close();
  expect(errors).toEqual([]);
});

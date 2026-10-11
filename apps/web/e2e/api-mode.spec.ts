import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * API mode end to end (C1, A18): the site reads the API snapshot and writes to the API, staff work in Admin, and an
 * admin save reaches the public site through the signed revalidation call. Runs only when the job starts the API
 * (WAAFA_API_URL set); the fixture-mode suite covers everything else.
 */
const apiMode = Boolean(process.env.WAAFA_API_URL);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.describe.configure({ mode: "serial" });
test.skip(!apiMode, "API mode only (WAAFA_API_URL)");

let reference = "";

async function signIn(page: Page) {
  await page.goto("/secure-admin-control");
  await expect(page).toHaveURL(/\/secure-admin-control\/sign-in/);
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

test("the public site renders from the API snapshot", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.goto("/faqs");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a contact message becomes a lead with a CNT reference", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Sample Integration Customer");
  await page.locator("#contact-phone").fill("01712-345678");
  await page.locator("label", { hasText: "Visa" }).first().click();
  await page.locator("#contact-message").fill("Do you handle Thailand tourist visas for families?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();
  reference = (await page.getByText(/^CNT-\d{6}-\d{4}$/).textContent()) ?? "";
  expect(reference).toMatch(/^CNT-\d{6}-\d{4}$/);
});

test("staff sign in, find the lead and move it to Quoted", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto(`/secure-admin-control/leads?q=${reference}`);
  await page.getByRole("link", { name: reference }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(reference);
  await page.locator("#lead-status").selectOption("quoted");
  await expect(page.getByText("Lead updated").first()).toBeVisible();
  await expect(page.getByText(/Status new → quoted/)).toBeVisible();
  await page
    .getByLabel("What happened? (visible to staff only)")
    .fill("Called, sent the checklist.");
  await page.getByRole("button", { name: "Add to timeline" }).click();
  await expect(page.getByText("Called, sent the checklist.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("an FAQ saved in Admin shows on the public site", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const answer = `Yes, every price includes VAT. Checked ${Date.now()}.`;
  await signIn(page);
  await page.goto("/secure-admin-control/content/faqs");
  await page.locator("main ul li a").first().click();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await page.locator("#field-answer").fill(answer);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved").first()).toBeVisible();
  // The API batches revalidation for two seconds, then the web expires its caches.
  await expect(async () => {
    await page.goto("/faqs");
    // Answers sit in closed accordions; the FAQPage structured data carries every answer.
    expect(await page.content()).toContain(answer);
  }).toPass({ timeout: 30_000 });
});

test("a newsletter sign-up reaches the Admin list", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const email = `reader.${Date.now()}@example.com`;
  await page.goto("/");
  await page.locator("#newsletter-email-footer").fill(email);
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText(/Fare drops and visa news will reach you/)).toBeVisible();
  await signIn(page);
  await page.goto("/secure-admin-control/subscribers");
  await expect(page.getByText(email)).toBeVisible();
});

test("a Super Admin connects an external API, turns it on and reveals the secret on request", async ({
  page,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/integrations");
  await expect(page.getByRole("heading", { level: 1, name: "Integrations" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Flight APIs" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Sabre" }) });
  await card.getByRole("button", { name: "Connect" }).click();
  await card.getByLabel("API base URL").fill("https://example.com");
  await card.getByLabel("Client ID").fill("e2e-client");
  await card.getByLabel("Client secret", { exact: true }).fill("e2e-client-secret-4321");
  await card.getByLabel("PCC (pseudo city code)").fill("E2E1");
  await card.getByRole("button", { name: "Save", exact: true }).click();
  await expect(card.getByText("Saved, ends in 4321. Leave empty to keep it.")).toBeVisible();
  await expect(card.getByLabel("Client secret", { exact: true })).toHaveValue("");
  expect(await page.content()).not.toContain("e2e-client-secret-4321");

  // Active with Sandbox credentials and a 5% markup.
  await card.getByRole("switch", { name: "Active" }).click();
  await card.getByRole("radio", { name: "Percentage" }).click();
  await card.getByLabel("Value").fill("5");
  await card.getByRole("button", { name: "Save settings" }).click();
  await expect(card.getByText("Active", { exact: true }).first()).toBeVisible();
  await expect(card.getByRole("switch", { name: "Active" })).toBeChecked();

  // The saved secret is shown only on request (and logged by the API).
  await card.getByRole("button", { name: "Reveal saved value" }).click();
  await expect(card.getByText("e2e-client-secret-4321")).toBeVisible();

  // A custom SMS provider in the Communication tab.
  await page.getByRole("tab", { name: "SMS and email" }).click();
  const panel = page.getByRole("tabpanel", { name: "SMS and email" });
  await panel.getByLabel("Provider name").fill("E2E SMS Gateway");
  await panel.getByRole("button", { name: "Add provider" }).click();
  await expect(panel.getByRole("heading", { name: /E2E SMS Gateway/ })).toBeVisible();
  expect(errors).toEqual([]);
});

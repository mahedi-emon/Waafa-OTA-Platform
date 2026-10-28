import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Customers and custom roles (issue 244): a tag and a note on a customer, the list filtered by the tag and exported as
 * CSV; a custom role made in Users shows as a column of the permission matrix. API mode only; own data per run.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

const STAMP = String(Date.now()).slice(-6);
const PHONE = `+88017${STAMP}${String(Date.now()).slice(-3, -1)}`.slice(0, 14);
let signIns = 0;

async function signIn(page: Page) {
  signIns += 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${120 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

test("a customer gets a tag and a note, the list filters by the tag and exports CSV", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  const date = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const response = await request.post(`${API}/api/v1/public/leads`, {
    headers: {
      "x-intake-key": INTAKE_KEY,
      "idempotency-key": randomUUID(),
      "x-client-ip": `203.0.113.${(Number(STAMP) % 100) + 30}`,
    },
    data: {
      contact: { name: `Tagged Customer ${STAMP}`, phone: PHONE },
      consent: true,
      payload: {
        module: "flights",
        search: {
          tripType: "one-way",
          legs: [{ from: "DAC", to: "DXB", date }],
          travellers: { adults: 1, childAges: [], infants: 0 },
          cabin: "economy",
        },
      },
    },
  });
  expect(response.ok(), await response.text()).toBe(true);

  await signIn(page);
  await page.goto(`/secure-admin-control/customers/${encodeURIComponent(PHONE)}`);
  const tags = page.getByRole("region", { name: "Tags" });
  const tag = `VIP${STAMP}`;
  await tags.getByLabel("Add tag").fill(tag);
  await tags.getByLabel("Add tag").press("Enter");
  await tags.getByRole("button", { name: "Save tags" }).click();
  await expect(page.getByText("Saved").first()).toBeVisible();

  const notes = page.getByRole("region", { name: "Notes" });
  await notes.getByRole("textbox").fill("<b>Prefers window seats</b>");
  await notes.getByRole("button", { name: "Add note" }).click();
  // Typed markup stays text.
  await expect(notes.getByText("<b>Prefers window seats</b>")).toBeVisible();
  const axe = await new AxeBuilder({ page }).include("main").analyze();
  expect(axe.violations).toEqual([]);

  await page.goto(`/secure-admin-control/customers?tag=${tag}`);
  await expect(page.getByText(`Tagged Customer ${STAMP}`).first()).toBeVisible();
  const csv = await page.request.get(`/secure-admin-control/customers/export?tag=${tag}`);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain(tag);
  expect(errors).toEqual([]);
});

test("a custom role shows as a column of the permission matrix", async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/users");
  const panel = page.getByRole("region", { name: "Custom roles" });
  await panel.getByRole("button", { name: "Add a custom role" }).click();
  const name = `Senior sales ${STAMP}`;
  await panel.getByLabel("Role name").fill(name);
  await panel.getByLabel("Travel sales").check();
  await panel.getByLabel("Visa officer").check();
  await panel.getByRole("button", { name: "Save" }).click();
  await expect(panel.getByRole("listitem").filter({ hasText: name })).toBeVisible();
  await expect(page.getByRole("columnheader", { name })).toBeVisible();
  const axe = await new AxeBuilder({ page }).include("main").analyze();
  expect(axe.violations).toEqual([]);
  await panel.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(panel.getByRole("listitem").filter({ hasText: name })).toHaveCount(0);
  expect(errors).toEqual([]);
});

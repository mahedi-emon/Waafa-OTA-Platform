import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * The admin shell (D0 R1, docs/design/ADMIN.md §3): grouped sidebar with count badges, Ctrl K search over pages,
 * actions and records, "+ New", the notification bell, breadcrumbs, the Settings door and the phone menu. Uses only
 * visible, labelled controls. API mode only (the admin needs the API).
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
const PHONE_TAIL = String(Date.now()).slice(-6);
const CUSTOMER = `Sample Shell Person ${PHONE_TAIL}`;

/** Clicks or keys only work once React has hydrated the frame: retry the gesture until its result shows. */
async function until(gesture: () => Promise<unknown>, shown: Locator) {
  await expect(async () => {
    await gesture();
    await expect(shown).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function signIn(page: Page) {
  signIns += 1;
  // Own test addresses: the API allows 5 sign-ins per address in 15 minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${120 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

test("a new request shows up as a badge, in the bell and in Ctrl K", async ({ page, request }) => {
  test.setTimeout(120_000);
  const response = await request.post(`${API}/api/v1/public/leads`, {
    headers: {
      "x-intake-key": INTAKE_KEY,
      "x-client-ip": `10.77.0.${Number(PHONE_TAIL) % 200}`,
      "idempotency-key": randomUUID(),
    },
    data: {
      contact: { name: CUSTOMER, phone: `+8801000${PHONE_TAIL}` },
      payload: {
        module: "contact",
        topic: "visa",
        message: "Do you process Thailand visas for families?",
      },
      consent: true,
    },
  });
  expect(response.status()).toBe(201);

  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);

  const sidebar = page.getByRole("navigation", { name: "Admin" });
  for (const group of ["Home", "Inbox", "Travel", "Waafas World", "Website"])
    await expect(sidebar.getByRole("button", { name: group, exact: true })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: /^Leads, \d+ new leads?/ })).toBeVisible();

  // The bell lists it under "New for you"; marking everything as seen clears the count.
  const unseen = page.getByRole("tab", { name: /New for you/ });
  await until(
    () => page.getByRole("button", { name: /^Notifications, \d+ new notifications?$/ }).click(),
    unseen,
  );
  await unseen.click();
  await expect(page.getByRole("link", { name: new RegExp(CUSTOMER) })).toBeVisible();
  await page.getByRole("button", { name: "Mark all as seen" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();

  // Ctrl K finds the person by part of the phone number and opens the lead.
  const palette = page.getByRole("dialog", { name: "Search Waafa Admin" });
  await until(() => page.keyboard.press("Control+k"), palette);
  await palette.getByRole("combobox").fill(PHONE_TAIL);
  await palette
    .getByRole("option", { name: new RegExp(CUSTOMER) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/secure-admin-control\/(leads|customers)\//);
  expect(errors).toEqual([]);
});

test("Ctrl K finds pages and actions, + New creates, breadcrumbs say where you are", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);

  const palette = page.getByRole("dialog", { name: "Search Waafa Admin" });
  await until(() => page.getByRole("button", { name: "Search or jump to…" }).click(), palette);
  await palette.getByRole("combobox").fill("group fares");
  await palette
    .getByRole("option", { name: /Group fares/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Group fares" })).toBeVisible();
  const crumbs = page.getByRole("navigation", { name: "breadcrumb" });
  await expect(crumbs.getByText("Travel")).toBeVisible();

  const tourPackage = page.getByRole("menuitem", { name: "Tour package" });
  await until(() => page.getByRole("button", { name: "New", exact: true }).click(), tourPackage);
  await tourPackage.click();
  await expect(page).toHaveURL(/\/content\/tourPackages\/new$/);
  await expect(
    page
      .getByRole("navigation", { name: "breadcrumb" })
      .getByRole("link", { name: "Tour packages" }),
  ).toBeVisible();

  // Folding a group is remembered on this device.
  const sidebar = page.getByRole("navigation", { name: "Admin" });
  await sidebar.getByRole("button", { name: "Waafas World", exact: true }).click();
  await expect(sidebar.getByRole("link", { name: "Products" })).toBeHidden();
  await page.reload();
  await expect(
    page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Products" }),
  ).toBeHidden();
  await page
    .getByRole("navigation", { name: "Admin" })
    .getByRole("button", { name: "Waafas World", exact: true })
    .click();

  // Settings is one door with plain sections.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Users and roles/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Business, contact and office hours/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("on a phone the menu opens as a sheet and closes after picking a page", async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  const menu = page.getByRole("dialog", { name: "Menu" });
  await until(() => page.getByRole("button", { name: "Open menu" }).click(), menu);
  await menu.getByRole("link", { name: /^Orders/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
  await expect(menu).toBeHidden();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("a wrong password says so in plain words, and Show password reveals it", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.140" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("not-the-password-123");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "That email and password don't match" }),
  ).toBeVisible();
});

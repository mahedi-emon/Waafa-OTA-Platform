import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Status automation (D0 R4, docs/design/ADMIN.md §8 and §9): buttons set a record's status and every chip says why,
 * Trash brings a deleted package back, a changed link keeps its old address, a WhatsApp reply moves a new lead, a
 * booking takes its amount, order steps ask for what they need, and a matched payment proof confirms its order.
 * Only visible, labelled controls. API mode only; every test makes its own data.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
let calls = 0;
const STAMP = String(Date.now()).slice(-6);

/** Clicks only work once React has hydrated the page: retry the gesture until its result shows. */
async function until(gesture: () => Promise<unknown>, shown: Locator) {
  await expect(async () => {
    await gesture();
    await expect(shown).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function signIn(page: Page) {
  signIns += 1;
  // Own test addresses: the API allows 5 sign-ins per address in 15 minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${200 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  // A reply on WhatsApp opens wa.me in a new tab: answered here, so the test never leaves the machine.
  await page
    .context()
    .route("https://wa.me/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<title>WhatsApp</title>" }),
    );
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/** The public API the website uses, with the intake key. */
async function intake<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  calls += 1;
  const response = await request.post(`${API}/api/v1/public/${path}`, {
    headers: {
      "x-intake-key": INTAKE_KEY,
      "idempotency-key": randomUUID(),
      "x-client-ip": `203.0.113.${(calls % 200) + 20}`,
    },
    data,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()) as T;
}

/** Opens a lead by its reference from the list's search. */
async function openLead(page: Page, reference: string) {
  await page.goto(`/secure-admin-control/leads?q=${reference}`);
  // The table names the customer as a link to the lead; a phone card opens the sheet, whose Open goes there.
  const row = page.getByRole("row").filter({ hasText: reference }).getByRole("link");
  const card = page.getByRole("listitem").filter({ hasText: reference });
  await expect(row.or(card).first()).toBeVisible();
  if (await row.first().isVisible()) await row.first().click();
  else {
    await page
      .getByRole("listitem")
      .filter({ hasText: reference })
      .getByRole("button")
      .first()
      .click();
    await page.getByRole("dialog").getByRole("link", { name: "Open" }).click();
  }
  // The title is the customer's name; the reference is in the line under it (D0 R6).
  await expect(page.getByRole("heading", { level: 1 }).locator("xpath=../..")).toContainText(
    reference,
  );
}

/** A tour package's editor, once it can be used. */
async function openPackage(page: Page, slug: string) {
  await page.goto(`/secure-admin-control/content/tourPackages/${slug}`);
  await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Save changes" })).toBeVisible();
}

test("a package is scheduled with its date on the chip, then published now", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await signIn(page);
  await openPackage(page, "sajek-valley-above-the-clouds");
  const panel = page.getByRole("region", { name: "Status" });

  // Live: Unpublish first (a live record is never "saved as a draft").
  await until(
    () =>
      page
        .getByRole("button", { name: "Unpublish" })
        .or(page.getByRole("button", { name: "Cancel schedule" }))
        .first()
        .click(),
    page.getByText("Taken off the site. It's a draft now.").first(),
  );
  await until(
    () => page.getByRole("button", { name: "Schedule…" }).click(),
    page.getByRole("dialog", { name: "Schedule publishing" }),
  );
  const dialog = page.getByRole("dialog", { name: "Schedule publishing" });
  await expect(dialog.getByText(/Goes live on .+ \(Dhaka time\)\./)).toBeVisible();
  await dialog.getByRole("button", { name: "Schedule" }).click();
  await expect(page.getByText(/Scheduled\. It goes live on /).first()).toBeVisible();
  await expect(panel.getByText(/^Goes live on \d{1,2} \w{3} \d{4}, /).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel schedule" })).toBeVisible();

  // The list says Scheduled too, with the date a hover away.
  await page.goto("/secure-admin-control/content/tourPackages");
  await expect(page.getByText(/^Scheduleds*: Goes live on /).first()).toBeAttached();

  await openPackage(page, "sajek-valley-above-the-clouds");
  await until(
    () => page.getByRole("button", { name: "Publish now" }).click(),
    page.getByText("Published. It's live on the site.").first(),
  );
  await expect(page.getByText(/^Live on the site since /).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("a deleted package goes to Trash and comes back with Restore", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await signIn(page);
  await openPackage(page, "maldives-island-stay");
  const title = await page.getByRole("heading", { level: 1 }).textContent();
  await until(
    () => page.getByRole("button", { name: "Move to Trash" }).first().click(),
    page.getByRole("alertdialog"),
  );
  await page.getByRole("alertdialog").getByRole("button", { name: "Move to Trash" }).click();
  await expect(page.getByText("Moved to Trash.").first()).toBeVisible();
  await expect(page).toHaveURL(/\/content\/tourPackages$/);

  await page.goto("/secure-admin-control/trash");
  await expect(page.getByRole("heading", { level: 1, name: "Trash" })).toBeVisible();
  const row = page
    .getByRole("listitem")
    .filter({ hasText: title ?? "Maldives" })
    .first();
  await expect(row).toContainText("Tour package");
  await expect(row).toContainText(/30 days left|29 days left/);
  await until(
    () => row.getByRole("button", { name: "Restore" }).click(),
    page.getByText(/^Restored “/).first(),
  );
  await openPackage(page, "maldives-island-stay");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title ?? "");
  expect(errors).toEqual([]);
});

test("a live package's new link keeps the old address working", async ({ page }) => {
  test.setTimeout(150_000);
  await signIn(page);
  const slug = "kathmandu-and-pokhara";
  const moved = `${slug}-${STAMP}`;
  await openPackage(page, slug);
  await until(
    () => page.getByRole("button", { name: "Edit link" }).click(),
    page.getByRole("textbox", { name: "Web address" }),
  );
  await expect(page.getByText(/Old links keep working/)).toBeVisible();
  await page.getByRole("textbox", { name: "Web address" }).fill(moved);
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByText("Updated on the site.").first()).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/content/tourPackages/${moved}$`));

  // The site follows within seconds; the old address now lands on the new one.
  // The page shell is static, so the redirect arrives with the stream (a 308 marker and a refresh), not as a header.
  await expect(async () => {
    await page.goto(`/tour-packages/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/tour-packages/${moved}$`), { timeout: 5_000 });
  }).toPass({ timeout: 45_000 });

  // Back to its own address, so other runs find it where they expect.
  await openPackage(page, moved);
  await until(
    () => page.getByRole("button", { name: "Edit link" }).click(),
    page.getByRole("textbox", { name: "Web address" }),
  );
  await page.getByRole("textbox", { name: "Web address" }).fill(slug);
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByText("Updated on the site.").first()).toBeVisible();
});

test("a WhatsApp reply moves a new lead to In progress, and Convert to booking books it", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  const { reference } = await intake<{ reference: string }>(request, "leads", {
    contact: { name: `Sample Reply ${STAMP}`, phone: "+8801712345611" },
    payload: {
      module: "contact",
      topic: "visa",
      message: "Can you help with a Thailand tourist visa for two?",
    },
    consent: true,
  });
  await signIn(page);
  await openLead(page, reference);
  // The status chip sits beside the title (D0 R6).
  const heading = page.getByRole("heading", { level: 1 }).locator("xpath=../..");
  await expect(heading).toContainText("New");

  const popup = page.waitForEvent("popup");
  await until(
    () => page.getByRole("link", { name: "Reply on WhatsApp" }).click(),
    page.getByText("Contact logged. The lead is in progress.").first(),
  );
  await (await popup).close();
  await expect(heading).toContainText("In progress");
  await expect(page.getByText("Replied on WhatsApp · Moved to In progress")).toBeVisible();

  await page.getByRole("button", { name: "Convert to booking" }).click();
  const dialog = page.getByRole("dialog", { name: "Convert to booking" });
  // The amount is needed: without it the dialog says so and nothing moves.
  await dialog.getByRole("button", { name: "Convert to booking" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Enter the booked amount in taka.");
  await dialog.getByLabel("Booked amount").fill("58500");
  await expect(dialog.getByLabel("Booked amount")).toHaveValue("58,500");
  await dialog.getByRole("button", { name: "Convert to booking" }).click();
  await expect(page.getByText("Converted to a booking.").first()).toBeVisible();
  await expect(heading).toContainText("Booked");
  await expect(page.getByText("Converted to a booking: ৳58,500")).toBeVisible();
  expect(errors).toEqual([]);
});

test("a payment proof that matches its order is verified, and the order is confirmed", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  const order = await intake<{ reference: string; total: number }>(request, "orders", {
    lines: [{ variantId: "bd-w1510a", quantity: 1 }],
    address: {
      name: `Sample Payer ${STAMP}`,
      phone: "+8801712345612",
      division: "Dhaka",
      district: "Dhaka",
      area: "Motijheel",
      street: "House 4, Road 2",
    },
    payment: { method: "offline", accountId: "acc-bkash", transactionId: `TX${STAMP}` },
  });
  await intake(request, "payment-proofs", {
    reference: order.reference,
    name: `Sample Payer ${STAMP}`,
    phone: "+8801712345612",
    amount: order.total,
    accountId: "acc-bkash",
    transactionId: `TX${STAMP}`,
  });
  await signIn(page);
  await page.goto("/secure-admin-control/payments");
  const row = page.getByRole("row").filter({ hasText: order.reference }).first();
  await expect(row.getByText("Matched", { exact: true })).toBeVisible();
  await expect(row.getByText(new RegExp(`Matches order ${order.reference}`))).toBeVisible();
  // The decision sits in the row's side sheet (D0 R5).
  const sheet = page.getByRole("dialog");
  await until(() => row.click(), sheet);
  await until(
    () => sheet.getByRole("button", { name: "Verify" }).click(),
    page.getByText(new RegExp(`Verified ${order.reference}\\. The order is paid\\.`)).first(),
  );
  await page.goto(`/secure-admin-control/orders?q=${order.reference}`);
  await page.getByRole("table").getByRole("link").first().click();
  await expect(page.getByText("Confirmed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Payment verified \(TX\d+\), order confirmed/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("an order is packed and shipped with its courier and tracking number", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  const order = await intake<{ reference: string }>(request, "orders", {
    lines: [{ variantId: "bd-w1510a", quantity: 1 }],
    address: {
      name: `Sample Shipping ${STAMP}`,
      phone: "+8801712345613",
      division: "Dhaka",
      district: "Dhaka",
      area: "Motijheel",
      street: "House 4, Road 2",
    },
    payment: { method: "cod" },
  });
  await signIn(page);
  await page.goto(`/secure-admin-control/orders?q=${order.reference}`);
  await page.getByRole("table").getByRole("link").first().click();
  await until(
    () => page.getByRole("button", { name: "Confirmed on call" }).click(),
    page.getByText("Order confirmed.").first(),
  );
  await page.getByRole("button", { name: "Start packing" }).click();
  await expect(page.getByText("Packing started.").first()).toBeVisible();
  await page.getByRole("button", { name: "Mark shipped" }).click();
  const dialog = page.getByRole("dialog", { name: "Mark as shipped" });
  await dialog.getByRole("button", { name: "Mark shipped" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Name the courier and enter the tracking number.",
  );
  await dialog.getByLabel("Courier").fill("Pathao");
  await dialog.getByLabel("Tracking number").fill(`PA${STAMP}`);
  await dialog.getByRole("button", { name: "Mark shipped" }).click();
  await expect(page.getByText("Marked as shipped.").first()).toBeVisible();
  await expect(page.getByText(`Pathao · PA${STAMP}`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark delivered" })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`Trash, a lead's next steps and the proofs queue pass axe at ${width} px`, async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const { reference } = await intake<{ reference: string }>(request, "leads", {
      contact: { name: `Sample Axe ${STAMP}`, phone: "+8801712345614" },
      payload: { module: "contact", topic: "visa", message: "A question about visas, please." },
      consent: true,
    });
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await openLead(page, reference);
    for (const path of ["", "/secure-admin-control/trash", "/secure-admin-control/payments"]) {
      if (path) await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
    }
  });
}

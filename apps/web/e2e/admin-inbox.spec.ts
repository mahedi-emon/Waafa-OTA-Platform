import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * The inbox (D0 R6, docs/design/ADMIN.md §5.5): reply, convert, verify a proof and ship an order at 1440 and 390 px;
 * the queue beside a lead; the board asking for the lead page's inputs; visa applications by stage. Only visible,
 * labelled controls. API mode only; every test makes its own data.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

const STAMP = String(Date.now()).slice(-6);
let signIns = 0;
let calls = 0;
let phones = 0;

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
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${100 + signIns}` });
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

/** A phone number no other test uses, so the customer card and duplicates stay apart. */
const phone = () => {
  phones += 1;
  return `+88017${String(30_000_000 + Number(STAMP) * 10 + phones).slice(-8)}`;
};

const contactLead = (request: APIRequestContext, name: string) =>
  intake<{ reference: string }>(request, "leads", {
    contact: { name, phone: phone() },
    payload: { module: "contact", topic: "visa", message: "Do you process Thailand visas?" },
    consent: true,
  });

/** The detail header: the name, the status chips beside it and the line under it. */
const header = (page: Page) => page.getByRole("heading", { level: 1 }).locator("xpath=../..");

/** Opens the first row of a list: the name link in the table, or the phone card's sheet and its Open. */
async function openFirst(page: Page) {
  const link = page.getByRole("table").getByRole("link").first();
  const card = page.getByRole("main").getByRole("listitem").getByRole("button").first();
  await expect(link.or(card)).toBeVisible();
  if (await link.isVisible()) await link.click();
  else {
    await until(() => card.click(), page.getByRole("dialog"));
    await page.getByRole("dialog").getByRole("link", { name: "Open" }).click();
  }
}

for (const width of [1440, 390]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 844 : 900 } });

    test("a WhatsApp reply moves a new lead on and the booking converts it", async ({
      page,
      request,
    }) => {
      test.setTimeout(120_000);
      const errors = collectErrors(page);
      const name = `Sample Inbox ${width} ${STAMP}`;
      const { reference } = await contactLead(request, name);
      await signIn(page);
      await page.goto(`/secure-admin-control/leads?q=${reference}`);
      await openFirst(page);
      await expect(page).toHaveURL(/\/leads\/[^/?]+\?q=/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
      await expect(header(page)).toContainText(reference);
      await expect(header(page)).toContainText("New");
      await expect(
        header(page)
          .getByText(/^Reply within \d+ min/)
          .first(),
      ).toBeVisible();

      // On a phone the reply buttons sit in the bottom bar.
      const reply =
        width < 768
          ? page
              .getByRole("region", { name: "Quick steps" })
              .getByRole("link", { name: "WhatsApp" })
          : page.getByRole("link", { name: "Reply on WhatsApp" });
      await until(
        () => reply.click(),
        page.getByText("Contact logged. The lead is in progress.").first(),
      );
      await expect(header(page)).toContainText("In progress");
      await expect(header(page).getByText(/^Reply within/)).toHaveCount(0);
      await expect(page.getByText(/^Replied on WhatsApp · Moved to In progress$/)).toBeVisible();

      await page.getByRole("button", { name: "Convert to booking" }).click();
      const dialog = page.getByRole("dialog", { name: "Convert to booking" });
      await dialog.getByLabel("Booked amount").fill("45000");
      await dialog.getByRole("button", { name: "Convert to booking" }).click();
      await expect(page.getByText("Converted to a booking.").first()).toBeVisible();
      await expect(header(page)).toContainText("Booked");

      const results = await new AxeBuilder({ page }).include("main").analyze();
      expect(results.violations.map((item) => `${item.id}: ${item.help}`)).toEqual([]);
      expect(errors).toEqual([]);
    });

    test("a matched payment proof is verified from its sheet and the order is confirmed", async ({
      page,
      request,
    }) => {
      test.setTimeout(120_000);
      const errors = collectErrors(page);
      const payer = `Sample Payer ${width} ${STAMP}`;
      const order = await intake<{ reference: string; total: number }>(request, "orders", {
        lines: [{ variantId: "bd-cf280a", quantity: 1 }],
        address: {
          name: payer,
          phone: phone(),
          division: "Dhaka",
          district: "Dhaka",
          area: "Motijheel",
          street: "House 4, Road 2",
        },
        payment: { method: "offline", accountId: "acc-bkash", transactionId: `TX${width}${STAMP}` },
      });
      await intake(request, "payment-proofs", {
        reference: order.reference,
        name: payer,
        phone: phone(),
        amount: order.total,
        accountId: "acc-bkash",
        transactionId: `TX${width}${STAMP}`,
      });
      await signIn(page);
      await page.goto(`/secure-admin-control/payments?q=${order.reference}`);
      const sheet = page.getByRole("dialog");
      const row =
        width < 768
          ? page
              .getByRole("main")
              .getByRole("listitem")
              .filter({ hasText: order.reference })
              .getByRole("button")
              .first()
          : page.getByRole("row").filter({ hasText: order.reference }).getByRole("cell").nth(3);
      await until(() => row.click(), sheet);
      await expect(sheet.getByText(new RegExp(`Matches order ${order.reference}`))).toBeVisible();
      await until(
        () => sheet.getByRole("button", { name: "Verify" }).click(),
        page.getByText(new RegExp(`Verified ${order.reference}\\. The order is paid\\.`)).first(),
      );
      await page.goto(`/secure-admin-control/orders?q=${order.reference}`);
      await openFirst(page);
      await expect(header(page)).toContainText("Confirmed");
      expect(errors).toEqual([]);
    });

    test("an order is confirmed, packed and shipped with its courier and tracking number", async ({
      page,
      request,
    }) => {
      test.setTimeout(120_000);
      const errors = collectErrors(page);
      const order = await intake<{ reference: string }>(request, "orders", {
        lines: [{ variantId: "bd-cf280a", quantity: 1 }],
        address: {
          name: `Sample Shipping ${width} ${STAMP}`,
          phone: phone(),
          division: "Dhaka",
          district: "Dhaka",
          area: "Motijheel",
          street: "House 4, Road 2",
        },
        payment: { method: "cod" },
      });
      await signIn(page);
      await page.goto(`/secure-admin-control/orders?q=${order.reference}`);
      await openFirst(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(order.reference);
      // On a phone the step that moves the order on is in the bottom bar.
      const confirm =
        width < 768
          ? page
              .getByRole("region", { name: "Quick steps" })
              .getByRole("button", { name: "Confirmed on call" })
          : page.getByRole("button", { name: "Confirmed on call" });
      await until(() => confirm.click(), page.getByText("Order confirmed.").first());
      await page.getByRole("button", { name: "Start packing" }).first().click();
      await expect(page.getByText("Packing started.").first()).toBeVisible();
      await page.getByRole("button", { name: "Mark shipped" }).first().click();
      const dialog = page.getByRole("dialog", { name: "Mark as shipped" });
      await dialog.getByLabel("Courier").fill("Pathao");
      await dialog.getByLabel("Tracking number").fill(`PT${width}${STAMP}`);
      await dialog.getByRole("button", { name: "Mark shipped" }).click();
      await expect(header(page)).toContainText("Shipped");
      await expect(page.getByText(new RegExp(`Pathao · PT${width}${STAMP}`))).toBeVisible();
      expect(errors).toEqual([]);
    });
  });
}

test("the queue stays beside a lead on a wide screen and the next lead is one click away", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectErrors(page);
  const tag = `Sample Queue ${STAMP}`;
  const first = await contactLead(request, `${tag} A`);
  const second = await contactLead(request, `${tag} B`);
  await signIn(page);
  await page.goto(`/secure-admin-control/leads?q=${encodeURIComponent(tag)}`);
  await page
    .getByRole("table")
    .getByRole("link", { name: `${tag} A` })
    .click();
  const pane = page.getByRole("navigation", { name: "Leads" });
  await expect(pane.locator('a[aria-current="page"]')).toContainText(first.reference);
  await pane.getByRole("link", { name: new RegExp(second.reference) }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${tag} B`);
  await expect(pane.locator('a[aria-current="page"]')).toContainText(second.reference);
  // The list comes back as it was left.
  await pane.getByRole("link", { name: "Full list" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/leads\\?q=${encodeURIComponent(tag).replace(/%20/g, "(%20|\\+)")}`),
  );
  expect(errors).toEqual([]);
});

test("the board asks for what the lead page asks when a card moves", async ({ page, request }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectErrors(page);
  const { reference } = await contactLead(request, `Sample Board ${STAMP}`);
  await signIn(page);
  await page.goto("/secure-admin-control/leads/board?module=contact");
  const column = (stage: string) => page.locator(`li[aria-labelledby="stage-${stage}"]`);
  const card = (stage: string) =>
    column(stage).getByRole("listitem").filter({ hasText: reference });
  await expect(card("new")).toBeVisible();

  // Drag New → Quoted: the quote dialog opens, as on the lead page.
  const quoteDialog = page.getByRole("dialog", { name: `Log a quote: ${reference}` });
  await until(async () => {
    const from = await card("new").boundingBox();
    const to = await column("quoted").boundingBox();
    if (!from || !to) throw new Error("board not laid out");
    await page.mouse.move(from.x + from.width / 2, from.y + 20);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 12, from.y + 24, { steps: 3 });
    await page.mouse.move(to.x + to.width / 2, to.y + 60, { steps: 12 });
    await page.mouse.up();
  }, quoteDialog);
  await quoteDialog.getByLabel("Quoted amount (optional)").fill("38500");
  await quoteDialog.getByRole("button", { name: "Log quote" }).click();
  await expect(card("quoted")).toBeVisible();

  // Move to… for keyboards: closing asks for the outcome and the reason.
  await card("quoted")
    .getByRole("button", { name: `Move to… ${reference}` })
    .click();
  await expect(page.getByRole("menuitem", { name: "New" })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "Lost or cancelled" }).click();
  const closeDialog = page.getByRole("dialog", { name: `Close this lead: ${reference}` });
  await closeDialog.getByRole("button", { name: "Close lead" }).click();
  await expect(closeDialog.getByRole("alert")).toHaveText("Say why in a few words.");
  await closeDialog.getByLabel("Reason").fill("Booked with another agent");
  await closeDialog.getByRole("button", { name: "Close lead" }).click();
  await expect(card("closed")).toBeVisible();

  // A move the rules don't have is refused in words, and the card stays. The last stages sit to the right: scroll
  // them into view and drag onto Booked, beside Lost or cancelled.
  await card("closed").scrollIntoViewIfNeeded();
  await until(async () => {
    const from = await card("closed").boundingBox();
    const to = await column("booked").boundingBox();
    if (!from || !to) throw new Error("board not laid out");
    await page.mouse.move(from.x + from.width / 2, from.y + 20);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 - 12, from.y + 24, { steps: 3 });
    await page.mouse.move(to.x + to.width / 2, to.y + 60, { steps: 12 });
    await page.mouse.up();
  }, page.getByText("Reopen it first: move it to In progress.").first());
  await expect(card("closed")).toBeVisible();
  expect(errors).toEqual([]);
});

test("on a phone the board moves a card with Move to…", async ({ page, request }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = collectErrors(page);
  const { reference } = await contactLead(request, `Sample Phone Board ${STAMP}`);
  await signIn(page);
  await page.goto("/secure-admin-control/leads/board?module=contact");
  const card = (stage: string) =>
    page
      .locator(`li[aria-labelledby="stage-${stage}"]`)
      .getByRole("listitem")
      .filter({ hasText: reference });
  await until(
    () =>
      card("new")
        .getByRole("button", { name: `Move to… ${reference}` })
        .click(),
    page.getByRole("menuitem", { name: "In progress" }),
  );
  await page.getByRole("menuitem", { name: "In progress" }).click();
  const dialog = page.getByRole("dialog", { name: `Log the reply: ${reference}` });
  await dialog.getByRole("radio", { name: "Phone call" }).check();
  await dialog.getByRole("button", { name: "Log reply" }).click();
  await expect(card("in-progress")).toBeAttached();
  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations.map((item) => `${item.id}: ${item.help}`)).toEqual([]);
  expect(errors).toEqual([]);
});

test("visa applications list by stage and open beside their list", async ({ page, request }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectErrors(page);
  const name = `Sample Visa ${STAMP}`;
  const { reference } = await intake<{ reference: string }>(request, "leads", {
    contact: { name, phone: phone() },
    payload: {
      module: "visa",
      countrySlug: "thailand",
      countryName: "Thailand",
      visaType: "tourist",
      applicants: 1,
      travelDate: "2026-12-10",
    },
    consent: true,
  });
  await signIn(page);
  await page.goto("/secure-admin-control/visa-applications");
  await expect(page.getByRole("heading", { level: 1, name: "Visa applications" })).toBeVisible();
  const stages = page.getByRole("group", { name: "Stage" });
  await until(
    () => stages.getByRole("button", { name: /^Documents pending/ }).click(),
    stages.getByRole("button", { name: /^Documents pending/, pressed: true }),
  );
  await expect(page).toHaveURL(/stage=documentsPending/);
  const row = page.getByRole("row").filter({ hasText: reference });
  await expect(row).toContainText("Documents pending");
  await expect(row).toContainText("0 of 6");
  await row.getByRole("link", { name }).click();

  const pane = page.getByRole("navigation", { name: "Visa applications" });
  await expect(pane.locator('a[aria-current="page"]')).toContainText(reference);
  await expect(page.getByRole("link", { name: "Visa applications" }).first()).toBeVisible();
  await until(
    () => page.getByRole("checkbox", { name: "Passport" }).check(),
    page.getByRole("main").getByText("1 of 6").first(),
  );
  await pane.getByRole("link", { name: "Full list" }).click();
  await expect(page).toHaveURL(/\/visa-applications\?stage=documentsPending/);
  await expect(page.getByRole("row").filter({ hasText: reference })).toContainText("1 of 6");
  expect(errors).toEqual([]);
});

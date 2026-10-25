import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Dashboard, Settings, users, audit log, message templates and reports (D0 R9, docs/design/ADMIN.md §5.2 and §5.6),
 * done the way staff would, with visible, labelled controls only. Staff task 10 (office hours and a phone number)
 * runs end to end to the public contact page. API mode only; changed settings are put back at the end.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
const STAMP = String(Date.now()).slice(-6);

async function signIn(page: Page) {
  signIns += 1;
  // Own test addresses: the API allows 5 sign-ins per address in 15 minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${200 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/** Types into a box once React has hydrated it (the value sticks). */
async function fill(page: Page, name: string, value: string) {
  const box = page.getByRole("textbox", { name, exact: true });
  await expect(async () => {
    await box.fill(value);
    await expect(box).toHaveValue(value, { timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function save(page: Page) {
  await page
    .getByRole("region", { name: "Save changes" })
    .getByRole("button", { name: "Save" })
    .click();
  await expect(page.getByText("All changes saved").first()).toBeVisible();
}

test("the dashboard shows today's work, the week, leads by day and the setup checklist", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await signIn(page);
  await expect(page.getByRole("heading", { level: 2, name: "Today" })).toBeVisible();
  await expect(page.getByRole("link", { name: /new leads?|New leads/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "This week" })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "New leads per day over the last 14 days" }),
  ).toBeVisible();
  // The chart's numbers are a table one click away.
  await page.getByText("Show as a table").click();
  await expect(
    page.getByRole("table", { name: "New leads per day over the last 14 days" }),
  ).toBeVisible();
  const setup = page.getByRole("region", { name: "Get the site ready" });
  await expect(setup).toBeVisible();
  await expect(setup.getByRole("img", { name: /of \d+ steps done/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("task 10: office hours and a phone number change in Settings and show on the contact page", async ({
  page,
  request,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/settings");
  const sections = page.getByRole("navigation", { name: "Settings sections" }).first();

  // Office hours: closing time and the words visitors read.
  await sections.getByRole("link", { name: /Office hours/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Office hours" })).toBeVisible();
  const hours = `Saturday to Thursday, 10:00 am to 7:00 pm (${STAMP})`;
  await fill(page, "Office hours as written", hours);
  await save(page);

  // A phone number: Business and contact.
  await sections.getByRole("link", { name: /Business and contact/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Business and contact" })).toBeVisible();
  const phone = page.getByRole("textbox", { name: "Phone number as shown", exact: true });
  const before = await phone.inputValue();
  const next = `01823-2${STAMP}`;
  await fill(page, "Phone number as shown", next);
  await save(page);

  // The site shows both after its revalidation (about two seconds).
  await expect(async () => {
    const html = await (await request.get("/contact")).text();
    expect(html).toContain(next);
    expect(html).toContain(hours);
  }).toPass({ timeout: 45_000 });

  // The audit log says it in a sentence, filtered to Settings.
  await page.goto("/secure-admin-control/audit?area=settings");
  await expect(page.getByText(/saved the Contact and office hours settings/).first()).toBeVisible();
  await page.getByText("Show what changed").first().click();
  await expect(page.getByText(new RegExp(`${next}`)).first()).toBeVisible();

  // Put the phone back for the specs after this one.
  await page.goto("/secure-admin-control/settings/business");
  await fill(page, "Phone number as shown", before);
  await save(page);
  expect(errors).toEqual([]);
});

test("a message template gets a detail with Insert and shows the email as it will arrive", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/settings/forms?tab=messages");
  await expect(page.getByRole("navigation", { name: "Parts of Forms and messages" })).toBeVisible();
  await page
    .getByRole("link", { name: /Request received \(to the customer\)/ })
    .first()
    .click();
  const body = page.getByRole("textbox", { name: "Message text", exact: true });
  await expect(body).toBeVisible();
  // Put the cursor at the start and insert the reference there.
  await expect(async () => {
    await body.focus();
    await body.press("Control+Home");
    await page.getByRole("button", { name: "Insert Reference" }).last().click();
    await expect(body).toHaveValue(/^\{\{reference\}\}/, { timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
  // The preview fills the details with samples, never the raw codes.
  const preview = page.getByRole("figure").filter({ hasText: "Preview" });
  await expect(preview).toContainText("FLT-261025-0001");
  await expect(preview).not.toContainText("{{");
  expect(errors).toEqual([]);
});

test("reports offer ranges in one tap and each download as Excel and CSV", async ({ page }) => {
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/reports");
  // The default range is the last 30 days, shown as chosen.
  await expect(page.getByRole("link", { name: "Last 30 days" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await page.getByRole("link", { name: "Last 7 days" }).click();
  await expect(page.getByRole("link", { name: "Last 7 days" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  const excel = page.getByRole("link", { name: "Download Leads as Excel" });
  const href = await excel.getAttribute("href");
  const file = await page.request.get(href ?? "");
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toBe(
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  expect((await file.body()).subarray(0, 2).toString()).toBe("PK");
  await expect(page.getByRole("link", { name: "Download Leads as CSV" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What people searched" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a new staff member is invited by email and the welcome page sets their password", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/users");
  await page.getByRole("button", { name: "Add staff" }).click();
  await fill(page, "Full name", `Sample Invitee ${STAMP}`);
  await fill(page, "Work email", `invitee-${STAMP}@example.com`);
  // Invite is the default: no password box until "Set a first password now" is picked.
  await expect(page.getByRole("radio", { name: /Send an invite email/ })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "First password" })).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Travel Sales" }).check();
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByText(`Invite sent to invitee-${STAMP}@example.com`)).toBeVisible();

  // The list shows them as invited; their sheet offers the invite again.
  const row = page.getByRole("row").filter({ hasText: `Sample Invitee ${STAMP}` });
  await expect(row).toContainText("Invited");
  // The permission matrix reads the same rules as the sidebar.
  await expect(
    page.getByRole("table", { name: "Screens and settings each role can open" }),
  ).toBeVisible();

  // A link that doesn't work says so plainly, signed out.
  await page.context().clearCookies();
  await page.goto("/secure-admin-control/welcome?token=not-a-real-invite-token");
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome to Waafa Admin" }),
  ).toBeVisible();
  await expect(page.getByText("This link doesn't work")).toBeVisible();
  await page.goto(`/secure-admin-control/welcome?token=${"a".repeat(43)}`);
  await page.getByLabel("New password").fill("a-long-new-password");
  await page.getByLabel("The same password again").fill("a-long-new-password");
  await page.getByRole("button", { name: "Set password" }).click();
  await expect(page.getByText(/This invite link has expired or was already used/)).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`the dashboard, settings, the audit log, reports and users pass axe at ${width} px`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    for (const path of [
      "/secure-admin-control",
      "/secure-admin-control/settings",
      "/secure-admin-control/settings/hours",
      "/secure-admin-control/settings/payments?tab=delivery",
      "/secure-admin-control/audit",
      "/secure-admin-control/reports",
      "/secure-admin-control/users",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(scroll, `${path} scrolls sideways at ${width} px`).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, path).toEqual([]);
      await page.screenshot({
        path: `test-results/admin-shots/r9-${path.replace(/[^a-z]+/g, "-")}-${width}.png`,
        fullPage: true,
      });
    }
  });
}

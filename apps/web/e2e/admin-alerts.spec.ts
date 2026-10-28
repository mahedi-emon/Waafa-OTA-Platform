import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Reminders and real-time alerts (issue 243): a reminder set on a lead shows there and on the dashboard and is done
 * with one click; a request sent by a visitor reaches an open admin tab through the event stream well before the
 * 30-second poll; the bell's own alerts tab and the sound switch pass axe. API mode only; each test makes its own data.
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

async function signIn(page: Page) {
  signIns += 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${150 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

async function newLead(request: APIRequestContext, name: string): Promise<string> {
  calls += 1;
  const date = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const response = await request.post(`${API}/api/v1/public/leads`, {
    headers: {
      "x-intake-key": INTAKE_KEY,
      "idempotency-key": randomUUID(),
      "x-client-ip": `203.0.113.${(calls % 100) + 120}`,
    },
    data: {
      contact: { name, phone: `+880170${STAMP}${String(calls).padStart(2, "0")}`.slice(0, 14) },
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
  return ((await response.json()) as { reference: string }).reference;
}

test("a reminder on a lead shows there and on the dashboard, and Done clears it", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  const reference = await newLead(request, `Reminder Traveller ${STAMP}`);
  await signIn(page);
  await page.goto(`/secure-admin-control/leads?q=${reference}`);
  await page.getByRole("row").filter({ hasText: reference }).getByRole("link").first().click();
  const panel = page.getByRole("region", { name: "Your reminders" });
  await expect(panel).toBeVisible();

  const note = `Call back about the Emirates fare ${STAMP}`;
  await panel.getByLabel("Remind me to").fill(note);
  await panel.getByLabel("When").selectOption("tomorrowMorning");
  await panel.getByRole("button", { name: "Set reminder" }).click();
  await expect(panel.getByText(note)).toBeVisible();
  await expect(panel.getByText("Coming up")).toBeVisible();

  await page.goto("/secure-admin-control");
  const dashboard = page.getByRole("region", { name: "Your reminders" });
  await expect(dashboard.getByText(note)).toBeVisible();
  await expect(dashboard.getByRole("link", { name: new RegExp(reference) })).toBeVisible();
  const axe = await new AxeBuilder({ page }).include("main").analyze();
  expect(axe.violations).toEqual([]);

  await dashboard
    .getByRole("listitem")
    .filter({ hasText: note })
    .getByRole("button", { name: "Done" })
    .click();
  await expect(page.getByText("Marked done")).toBeVisible();
  await expect(page.getByText(note)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a new request reaches an open admin tab through the stream, before the next poll", async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await signIn(page);
  const stream = page.waitForResponse((response) =>
    response.url().includes("/secure-admin-control/api/events"),
  );
  await page.goto("/secure-admin-control");
  expect((await stream).headers()["content-type"]).toContain("text/event-stream");
  // Give the browser a moment to hear "ready" before the visitor sends the request.
  await page.waitForTimeout(1_000);

  const name = `Live Traveller ${STAMP}`;
  await newLead(request, name);
  // Within a few seconds, not 30: the stream asked the bell for fresh numbers.
  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

  await page.getByRole("tab", { name: /Your alerts/ }).click();
  await expect(page.getByRole("switch", { name: /Sound for new alerts/ })).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include("[role=dialog], [data-slot=popover-content]")
    .analyze();
  expect(axe.violations).toEqual([]);
  expect(errors).toEqual([]);
});

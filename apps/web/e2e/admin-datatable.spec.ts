import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * The shared DataTable (D0 R5, docs/design/ADMIN.md §10): search, filter chips, sort, saved views, columns, bulk
 * steps, server pages, the row sheet, phone cards, and INP on a 500-lead list. API mode only; the leads are its own.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

// INP is measured here: Playwright's trace takes a DOM snapshot around every action, which on a 100-row page stalls
// frames and adds 150 ms or more to each interaction (issue 219). Traces stay on in every other spec.
test.use({ trace: "off" });

const STAMP = String(Date.now()).slice(-6);
const TAG = `Sample Table ${STAMP}`;
const LEADS = 500;
let signIns = 0;

/** Clicks only work once React has hydrated the page: retry the gesture until its result shows. */
async function until(gesture: () => Promise<unknown>, shown: Locator) {
  await expect(async () => {
    await gesture();
    await expect(shown).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

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

/** 500 contact leads that share one tag, sent in small batches across many addresses (rate limits apply). */
async function makeLeads(request: APIRequestContext) {
  for (let start = 0; start < LEADS; start += 25) {
    await Promise.all(
      Array.from({ length: Math.min(25, LEADS - start) }, async (_, offset) => {
        const index = start + offset;
        const response = await request.post(`${API}/api/v1/public/leads`, {
          headers: {
            "x-intake-key": INTAKE_KEY,
            "idempotency-key": randomUUID(),
            "x-client-ip": `203.0.113.${(index % 200) + 20}`,
          },
          data: {
            contact: {
              name: `${TAG} ${String(index).padStart(3, "0")}`,
              phone: `+88017${String(10_000_000 + index).slice(-8)}`,
            },
            payload: { module: "contact", topic: "visa", message: "Testing the leads table." },
            consent: true,
          },
        });
        expect(response.ok(), await response.text()).toBe(true);
      }),
    );
  }
}

/** The longest interaction since the page loaded, from the Event Timing API (what INP reports). */
async function longestInteraction(page: Page): Promise<{ name: string; duration: number }> {
  return page.evaluate(
    () =>
      new Promise<{ name: string; duration: number }>((resolve) => {
        let longest = { name: "", duration: 0 };
        new PerformanceObserver((list) => {
          // Only real interactions count for INP (taps, clicks and keys carry an interactionId).
          for (const entry of list.getEntries() as Array<
            PerformanceEntry & { interactionId?: number }
          >)
            if ((entry.interactionId ?? 0) > 0 && entry.duration > longest.duration)
              longest = { name: entry.name, duration: entry.duration };
        }).observe({
          type: "event",
          buffered: true,
          durationThreshold: 16,
        } as PerformanceObserverInit);
        setTimeout(() => resolve(longest), 500);
      }),
  );
}

test("a content list searches, filters, sorts, saves a view and hides a column", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/content/tourPackages");
  const table = page.getByRole("table");
  await expect(table).toBeVisible();

  // Search is in the address, so Back and a shared link show the same rows.
  const search = page.getByRole("searchbox", { name: "Search" });
  await until(
    async () => {
      await search.fill("kathmandu");
      await search.press("Enter");
    },
    table.getByRole("link", { name: /Kathmandu/ }),
  );
  await expect(page).toHaveURL(/q=kathmandu/);
  await expect(table.getByRole("row")).toHaveCount(2);

  // A filter chip, then a sort on the name.
  await search.fill("");
  await expect(page).not.toHaveURL(/q=/);
  const live = page.getByRole("group", { name: "Status" }).getByRole("button", { name: "Live" });
  await live.click();
  await expect(page).toHaveURL(/chip=live/);
  await expect(live).toHaveAttribute("aria-pressed", "true");
  await table.getByRole("button", { name: "Name" }).click();
  await expect(page).toHaveURL(/sort=title\.asc/);
  await expect(table.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );

  // Saved on this device, then opened from the menu.
  await page.getByRole("button", { name: "Saved views" }).click();
  await page.getByRole("menuitem", { name: "Save this view…" }).click();
  await page.getByLabel("Name this view").fill("Live by name");
  await page.getByRole("button", { name: "Save view" }).click();
  await page.goto("/secure-admin-control/content/tourPackages");
  await page.getByRole("button", { name: "Saved views" }).click();
  await page.getByRole("menuitem", { name: "Live by name" }).click();
  await expect(page).toHaveURL(/chip=live/);
  await expect(page).toHaveURL(/sort=title\.asc/);

  // A hidden column stays hidden after a reload.
  await page.getByRole("button", { name: "Columns" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Updated" }).click();
  await page.keyboard.press("Escape");
  await expect(table.getByRole("columnheader", { name: "Updated" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("table").getByRole("columnheader", { name: "Updated" })).toHaveCount(
    0,
  );
  expect(errors).toEqual([]);
});

test("500 leads page by the server, open a summary sheet, take a bulk step and stay quick", async ({
  page,
  request,
}) => {
  test.setTimeout(300_000);
  const errors = collectErrors(page);
  await makeLeads(request);
  await signIn(page);
  await page.goto(`/secure-admin-control/leads?q=${encodeURIComponent(TAG)}&pageSize=100`);
  const table = page.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(101);
  await expect(page.getByText(`1 to 100 of ${LEADS}`)).toBeVisible();

  // Next page, from the server.
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText(`101 to 200 of ${LEADS}`)).toBeVisible();
  await expect(page).toHaveURL(/page=2/);

  // A row opens its summary; Escape closes it.
  const first = table.getByRole("row").nth(1);
  const sheet = page.getByRole("dialog");
  await until(() => first.getByRole("cell").nth(3).click(), sheet);
  await expect(sheet.getByRole("link", { name: "Open" })).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Call" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);

  // Select the page and assign it: one step, a count in plain words.
  await table.getByRole("checkbox", { name: "Select all on this page" }).check();
  const bar = page.getByRole("region", { name: "100 selected" });
  await expect(bar).toBeVisible();
  await bar.getByRole("combobox", { name: "Assign to" }).selectOption({ label: "Unassigned" });
  await bar.getByRole("button", { name: "Assign" }).click();
  await expect(page.getByText(/^100 leads updated/).first()).toBeVisible();

  // INP on the default page (25 of the 500) and on the largest page (100, issue 219): select all, open a sheet and
  // close it, each under 200 ms. A busy machine can stall one frame: each run is repeated up to three times; a real
  // slowdown fails every time. The page settles first (an interaction during hydration is not what INP measures).
  for (const size of [25, 100]) {
    await expect(async () => {
      await page.goto(
        `/secure-admin-control/leads?q=${encodeURIComponent(TAG)}${size === 25 ? "" : `&pageSize=${size}`}`,
      );
      await expect(table.getByRole("row")).toHaveCount(size + 1);
      await page.waitForLoadState("load");
      await page.waitForTimeout(1_000);
      await table.getByRole("checkbox", { name: "Select all on this page" }).check();
      await table.getByRole("checkbox", { name: "Select all on this page" }).uncheck();
      await until(() => table.getByRole("row").nth(3).getByRole("cell").nth(3).click(), sheet);
      await page.keyboard.press("Escape");
      const slowest = await longestInteraction(page);
      expect(slowest.duration, `${size} rows: ${slowest.name}`).toBeLessThan(200);
    }).toPass({ intervals: [500], timeout: 90_000 });
  }
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`the table passes axe at ${width} px and turns into cards on a phone`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors = collectErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.goto("/secure-admin-control/content/tourPackages");
    if (width < 768) {
      await expect(page.getByRole("table")).toBeHidden();
      const card = page.getByRole("list").getByRole("button").first();
      await until(() => card.click(), page.getByRole("dialog"));
      await page.keyboard.press("Escape");
    } else {
      await expect(page.getByRole("table")).toBeVisible();
    }
    const scroll = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(scroll).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).include("main").analyze();
    expect(results.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Flights Manual mode (A9): search → step 1 → step 2 → boarding-pass success with a reference; validation; a double
 * submit makes one lead; group fares page and its request flow. Reduced motion keeps runs stable.
 */
test.use({ reducedMotion: "reduce" });

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function dhakaDate(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function axe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(result.violations).toEqual([]);
}

async function fillContact(page: Page) {
  await page.getByLabel("Full name").fill("Sample Rahim Uddin");
  await page.getByLabel("Mobile number").fill("01712-345678");
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("flights at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sends a request prefilled from the search and shows the reference", async ({ page }) => {
    const errors = collectErrors(page);
    const depart = dhakaDate(12);
    await page.goto(`/flights?from=DAC&to=DXB&depart=${depart}`);
    await expect(page.getByRole("region", { name: "Your search" })).toContainText("DAC → DXB");
    await axe(page);

    await fillContact(page);
    await expect(page.getByRole("heading", { name: "Check your trip" })).toBeVisible();
    await expect(page.getByLabel("Departure", { exact: true })).toHaveValue(depart);
    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    const leadResponse = page.waitForResponse((response) => response.url().endsWith("/api/leads"));
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    expect((await leadResponse).status()).toBe(201);

    await expect(page.getByRole("heading", { name: "Request sent" })).toBeFocused();
    await expect(page.getByText(/^FLT-\d{6}-\d{4}$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Send reference on WhatsApp" })).toHaveAttribute(
      "href",
      /FLT-\d{6}-\d{4}/,
    );
    await axe(page);
    expect(errors).toEqual([]);
  });

  test("shows each problem under its field and keeps the visitor on step 1", async ({ page }) => {
    await page.goto("/flights");
    await page.getByLabel("Full name").fill("R");
    await page.getByLabel("Mobile number").fill("0171");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Enter your full name")).toBeVisible();
    await expect(
      page.getByText(/Check the number: it should have 10 digits after \+880/),
    ).toBeVisible();
    await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("heading", { name: "Check your trip" })).toHaveCount(0);
  });

  test("asks for consent and the trip on step 2 when the URL had none", async ({ page }) => {
    await page.goto("/flights");
    await fillContact(page);
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(page.getByText("Tick the box so our expert can contact you.")).toBeVisible();
    await expect(page.getByText("Choose where you are flying from")).toBeVisible();
    await expect(page.getByText("Choose a departure date")).toBeVisible();
  });
});

test.describe("flights at 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("one request per idempotency key, even when the button is pressed twice", async ({
    page,
  }) => {
    await page.goto(`/flights?from=DAC&to=KUL&depart=${dhakaDate(20)}`);
    await fillContact(page);
    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/leads")) requests.push(request.postData() ?? "");
    });
    const submit = page.getByRole("button", { name: "Send to a travel expert" });
    await submit.dblclick();
    await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible();
    const keys = new Set(
      requests.map((body) => (JSON.parse(body) as { idempotencyKey: string }).idempotencyKey),
    );
    expect(keys.size).toBe(1);
  });

  test("requests a group fare from the group fares page with its fixed date", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/flights/group-fares");
    await expect(
      page.getByRole("heading", { level: 1, name: "Fixed-date seats from Dhaka" }),
    ).toBeVisible();
    await axe(page);
    await page
      .getByRole("link", { name: /^Request/ })
      .first()
      .click();
    await page.waitForURL("**/flights?fare=*");
    await expect(page.getByText("Group fare", { exact: true })).toBeVisible();
    await fillContact(page);
    await expect(page.getByLabel("Departure", { exact: true })).toHaveAttribute("readonly", "");
    expect(errors).toEqual([]);
  });

  test("filters group fares and shows the empty state with a way forward", async ({ page }) => {
    await page.goto("/flights/group-fares?to=JFK");
    await expect(page.getByRole("heading", { name: "No group fares match" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ask an expert for a fare" })).toBeVisible();
  });
});

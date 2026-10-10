import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/* Hotels Manual mode (A10): hotel search → step 1 → step 2 → success with an HTL reference; stay rules. */
test.use({ reducedMotion: "reduce" });

function dhakaDate(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test.describe("hotels at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sends a hotel request prefilled from the search", async ({ page }) => {
    const errors = collectErrors(page);
    const checkin = dhakaDate(20);
    const checkout = dhakaDate(22);
    await page.goto(
      `/hotels?place=city-coxs-bazar&placeName=Cox%E2%80%99s+Bazar&checkin=${checkin}&checkout=${checkout}`,
    );
    await expect(page.getByRole("region", { name: "Your search" })).toContainText("Cox’s Bazar");
    await expect(page.getByRole("region", { name: "Your search" })).toContainText("2 nights");

    await page.getByLabel("Full name").fill("Sample Karim Ahmed");
    await page.getByLabel("Mobile number").fill("01812-345678");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Check your stay" })).toBeVisible();
    await expect(page.getByLabel("City or hotel")).toHaveValue("Cox’s Bazar");
    await expect(page.getByLabel("Check-in")).toHaveValue(checkin);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
      .analyze();
    expect(results.violations).toEqual([]);

    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(page.getByRole("heading", { name: "Request sent" })).toBeFocused();
    await expect(page.getByText(/^HTL-\d{6}-\d{4}$/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("explains stay rules on step 2", async ({ page }) => {
    await page.goto("/hotels");
    await page.getByLabel("Full name").fill("Sample Karim Ahmed");
    await page.getByLabel("Mobile number").fill("01812-345678");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Check-in").fill(dhakaDate(10));
    await page.getByLabel("Check-out").fill(dhakaDate(9));
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(page.getByText("Tell us the city or hotel")).toBeVisible();
    await expect(page.getByText("Check-out must be after check-in")).toBeVisible();
    await expect(page.getByText("Tick the box so our expert can contact you.")).toBeVisible();
  });
});

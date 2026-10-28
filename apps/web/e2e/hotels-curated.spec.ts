import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Curated hotels (FR-HTL-02, issue 249): /hotels lists the hotels the team recommends; a hotel's page shows photos,
 * amenities and room types with from prices; Request on a room opens the hotel request with the hotel and room.
 */
test.use({ reducedMotion: "reduce" });

const HOTEL = "/hotels/sample-beach-resort-coxs-bazar";

function dhakaDate(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

for (const width of [390, 1440]) {
  test.describe(`curated hotels at ${width}`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 900 } });

    test("a room's Request booking sends a hotel request with the hotel and room", async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.goto("/hotels");
      const curated = page.getByRole("region", { name: "Hotels our team recommends" });
      await expect(curated).toBeVisible();
      await curated.getByRole("link", { name: "Sample Beach Resort" }).click();

      await expect(page).toHaveURL(new RegExp(`${HOTEL}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: "Sample Beach Resort" }),
      ).toBeVisible();
      await expect(
        page.getByRole("main").locator("header").getByRole("img", { name: "4-star hotel" }),
      ).toBeVisible();
      await expect(page.getByRole("region", { name: "What the hotel offers" })).toContainText(
        "Swimming pool",
      );
      const rooms = page.getByRole("region", { name: "Rooms" });
      await expect(rooms.getByRole("heading", { name: "Family suite" })).toBeVisible();
      await expect(rooms).toContainText("From ৳12,800");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
        .analyze();
      expect(axe.violations).toEqual([]);

      await rooms.getByRole("link", { name: "Request Family suite" }).click();
      await expect(page).toHaveURL(
        /\/hotels\?hotel=sample-beach-resort-coxs-bazar&room=family-suite/,
      );
      await expect(
        page.getByText("You are asking about Sample Beach Resort · Family suite."),
      ).toBeVisible();
      await page.getByLabel("Full name").fill("Sample Karim Ahmed");
      await page.getByLabel("Mobile number").fill("01812-345678");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByLabel("City or hotel")).toHaveValue(
        "Sample Beach Resort, Cox’s Bazar",
      );
      await page.getByLabel("Check-in").fill(dhakaDate(20));
      await page.getByLabel("Check-out").fill(dhakaDate(22));
      await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
      await page.getByRole("button", { name: "Send to a travel expert" }).click();
      await expect(page.getByRole("heading", { name: "Request sent" })).toBeFocused();
      await expect(page.getByText(/^HTL-\d{6}-\d{4}$/)).toBeVisible();
      expect(errors).toEqual([]);
    });
  });
}

test("an unknown hotel shows the not-found page", async ({ page }) => {
  await page.goto("/hotels/no-such-hotel");
  await expect(
    page.getByRole("heading", { name: "This page took a different flight" }),
  ).toBeVisible();
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Unified search card (A8): each tab submits to the right URL, pickers open as sheets on phones and popovers on
 * desktop, validation is announced, searches are logged without delaying navigation, and the back button
 * restores the form. Reduced motion keeps runs stable (MOTION.md §4).
 */
test.use({ reducedMotion: "reduce" });

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** A calendar date `days` from today in Asia/Dhaka, as YYYY-MM-DD. */
function dhakaDate(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function pickDay(page: Page, iso: string) {
  await page.locator(`td[data-day="${iso}"] button`).click();
}

async function expectNoAxeViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(result.violations).toEqual([]);
}

test.describe("phone (390)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("searches a one-way flight through full-screen sheets, logs it and restores it on back", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const card = page.getByRole("region", { name: "Search flights, hotels, tours and visas" });
    await expect(card.getByRole("button", { name: /From\s*Dhaka/ })).toBeVisible();

    await card.locator("#search-to").click();
    const sheet = page.getByRole("dialog", { name: "Where are you flying to?" });
    await expect(sheet).toBeVisible();
    await sheet.getByPlaceholder("City or airport, e.g. Dubai or DXB").fill("kua");
    await sheet.getByRole("option", { name: /Kuala Lumpur/ }).click();

    const dates = page.getByRole("dialog", { name: "Choose your departure date" });
    await expect(dates).toBeVisible();
    const depart = dhakaDate(14);
    await pickDay(page, depart);
    await dates.getByRole("button", { name: "Done" }).click();
    await expect(dates).toBeHidden();
    await expect(card.locator("#search-depart")).toBeFocused();
    expect(errors).toEqual([]);
    await expectNoAxeViolations(page);

    // The beacon body is not readable in Playwright; a 204 means the server accepted it under the shared contract.
    const log = page.waitForResponse((response) => response.url().endsWith("/api/search/log"));
    await card.getByRole("button", { name: "Search flights" }).click();
    await page.waitForURL(`**/flights?from=DAC&to=KUL&depart=${depart}`);
    expect((await log).status()).toBe(204);

    await page.goBack();
    await expect(card.getByRole("button", { name: /To\s*Kuala Lumpur/ })).toBeVisible();
    await expect(card.getByRole("link", { name: /DAC → KUL/ })).toBeVisible();
  });

  test("sets travellers with child ages and keeps infants within adults", async ({ page }) => {
    await page.goto("/");
    await page.locator("#search-travellers").click();
    const sheet = page.getByRole("dialog", { name: "Travellers and cabin class" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Infants: add one" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await sheet.getByRole("button", { name: "Infants: add one" }).click();
    const addInfant = sheet.getByRole("button", { name: "Infants: add one" });
    await expect(addInfant).toHaveAttribute("aria-disabled", "true");
    // At the limit the button keeps keyboard focus (aria-disabled, not disabled).
    await addInfant.focus();
    await page.keyboard.press("Enter");
    await expect(addInfant).toBeFocused();
    await sheet.getByRole("button", { name: "Children: add one" }).click();
    await sheet.getByRole("combobox", { name: "Child 1" }).click();
    await page.getByRole("option", { name: "7 years" }).click();
    await sheet.getByText("Business", { exact: true }).click();
    await expect(sheet.getByText("3 travellers")).toBeVisible();
    await sheet.getByRole("button", { name: "Done" }).click();
    await expect(page.locator("#search-travellers")).toContainText("3 travellers");
    await expect(page.locator("#search-travellers")).toContainText("Business");
  });

  test("re-opens the dates sheet and can move the departure to an earlier month", async ({
    page,
  }) => {
    await page.goto("/");
    const late = dhakaDate(75);
    const early = dhakaDate(3);
    await page.locator("#search-depart").click();
    const dates = page.getByRole("dialog", { name: "Choose your departure date" });
    await pickDay(page, late);
    await dates.getByRole("button", { name: "Done" }).click();
    await page.locator("#search-depart").click();
    await expect(page.locator(`td[data-day="${late}"] button`)).toBeInViewport();
    await pickDay(page, early);
    await dates.getByRole("button", { name: "Done" }).click();
    const [, , day] = early.split("-");
    await expect(page.locator("#search-depart")).toContainText(String(Number(day)));
  });

  test("shows and announces errors, then focuses the first one", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search flights" }).click();
    await expect(page.locator("#search-to")).toBeFocused();
    await expect(page.locator("#search-to-error")).toHaveText("Choose where you are flying to");
    await expect(page.locator("#search-to")).toHaveAttribute("aria-describedby", "search-to-error");
    await expect(page.locator("#search-depart-error")).toHaveText("Choose a departure date");
    await expect(page.locator('section p[aria-live="assertive"]')).toHaveText(
      "Choose where you are flying to",
    );
  });
});

test.describe("phone (320)", () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test("fits without horizontal scrolling on every tab", async ({ page }) => {
    await page.goto("/");
    for (const tab of ["Flight", "Hotel", "Tour", "Visa"]) {
      await page.getByRole("tab", { name: tab }).click();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, tab).toBeLessThanOrEqual(0);
    }
  });
});

test.describe("desktop (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("searches a round trip with popovers and swaps From and To", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.getByRole("radio", { name: "Round trip" }).click();
    await page.locator("#search-to").click();
    const picker = page.getByRole("dialog", { name: "Where are you flying to?" });
    await expect(picker).toBeVisible();
    // Pressing the open field closes its popover instead of reopening it.
    await page.locator("#search-to").click();
    await expect(picker).toBeHidden();
    await page.locator("#search-to").click();
    await picker.getByRole("option", { name: /Dubai/ }).click();
    const dates = page.getByRole("dialog", { name: "Choose your dates" });
    const depart = dhakaDate(10);
    const back = dhakaDate(17);
    await pickDay(page, depart);
    await pickDay(page, back);
    await expect(dates.getByText("7 nights away")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dates).toBeHidden();

    await page.getByRole("button", { name: "Swap From and To" }).click();
    await expect(page.locator("#search-from")).toContainText("Dubai");
    await expect(page.locator("#search-to")).toContainText("Dhaka");
    expect(errors).toEqual([]);
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "Search flights" }).click();
    await page.waitForURL(
      `**/flights?trip=round-trip&from=DXB&to=DAC&depart=${depart}&return=${back}`,
    );
  });

  test("searches hotels with a stay of at most thirty nights", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Hotel" }).click();
    await page.locator("#search-place").click();
    await page
      .getByRole("dialog", { name: "Where do you want to stay?" })
      .getByRole("option", { name: /Cox’s Bazar/ })
      .click();
    const stay = page.getByRole("dialog", { name: "Check-in and check-out" });
    await expect(stay).toBeVisible();
    const checkin = dhakaDate(5);
    await pickDay(page, checkin);
    await expect(page.locator(`td[data-day="${dhakaDate(36)}"] button`)).toBeDisabled();
    await pickDay(page, dhakaDate(8));
    await stay.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "Search hotels" }).click();
    await page.waitForURL(
      `**/hotels?place=city-coxs-bazar&placeName=*&checkin=${checkin}&checkout=${dhakaDate(8)}`,
    );
  });

  test("finds tours by destination and month", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Tour" }).click();
    await page.locator("#search-destination").click();
    await page
      .getByRole("dialog", { name: "Where would you like to go?" })
      .getByRole("option", { name: /Maldives/ })
      .click();
    const months = page.getByRole("dialog", { name: "When do you want to travel?" });
    await months.getByRole("button", { name: "I’m flexible" }).click();
    await page
      .getByRole("dialog", { name: "Who is travelling?" })
      .getByRole("button", { name: "Done" })
      .click();
    await page.getByRole("button", { name: "Find tours" }).click();
    await page.waitForURL("**/tour-packages?destination=maldives");
  });

  test("checks visa requirements for a country and purpose", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Visa" }).click();
    await page.getByRole("button", { name: "Check requirements" }).click();
    await expect(page.locator("#search-country-error")).toHaveText("Choose a country");
    await page.locator("#search-country").click();
    await page
      .getByRole("dialog", { name: "Which country is the visa for?" })
      .getByRole("option", { name: /Thailand/ })
      .click();
    await page
      .getByRole("dialog", { name: "What is the visit for?" })
      .getByRole("option", { name: /Business/ })
      .click();
    const applicants = page.getByRole("dialog", { name: "How many people are applying?" });
    await applicants.getByRole("button", { name: "Applicants: add one" }).click();
    await applicants.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "Check requirements" }).click();
    await page.waitForURL("**/visa-services/thailand?type=business&applicants=2");
  });

  test("works by keyboard: tabs with arrows, pickers with Enter and Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Flight" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Hotel" })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowLeft");
    await page.locator("#search-to").focus();
    await page.keyboard.press("Enter");
    const picker = page.getByRole("dialog", { name: "Where are you flying to?" });
    await expect(picker.getByRole("combobox")).toBeFocused();
    await page.keyboard.type("dub");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Choose your departure date" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#search-depart")).toBeFocused();
    await expect(page.locator("#search-to")).toContainText("Dubai");
  });

  test("builds multi-city trips of up to five flights", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Multi-city" }).click();
    await expect(page.getByText("Flight 2", { exact: true })).toBeVisible();
    for (let i = 0; i < 3; i += 1)
      await page.getByRole("button", { name: "Add another flight" }).click();
    await expect(page.getByText("Flight 5", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add another flight" })).toHaveCount(0);
    await page.getByRole("button", { name: "Remove flight 5" }).click();
    await expect(page.getByText("Flight 5", { exact: true })).toHaveCount(0);
  });
});

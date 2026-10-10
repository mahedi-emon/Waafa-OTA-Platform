import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * Layout shell (A6): header, Waafas World and More panels, help menu, phone drawer, tab bar, More sheet, footer,
 * announcement and the floating WhatsApp button. Reduced motion keeps runs stable (MOTION.md §4).
 */
test.use({ reducedMotion: "reduce" });

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page) {
  // Radix NavigationMenu adds a visually hidden focus proxy (aria-hidden, tabindex 0) after an open trigger; it
  // forwards focus into the panel, so it is excluded here (known Radix pattern).
  const result = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(result.violations).toEqual([]);
}

test.describe("desktop header (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows the seven nav items once, with the logo once", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main", exact: true });
    for (const label of [
      "Home",
      "Tour Packages",
      "Visa Services",
      "Waafas World",
      "Gallery",
      "Feedback",
      "More",
    ]) {
      await expect(nav).toContainText(label);
    }
    await expect(page.getByRole("link", { name: "WAAFA home" }).first()).toBeVisible();
    await expect(nav.getByRole("link", { name: /^Home\s*\(current page\)$/ })).toBeVisible();
  });

  test("opens the Waafas World panel by keyboard and closes it with Escape", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Waafas World" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const shopAll = page.locator("header").getByRole("link", { name: "Shop all products" });
    await expect(shopAll).toBeVisible();
    await expect(
      page.locator("header").getByRole("link", { name: /Printing Solutions/ }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    await page.keyboard.press("Escape");
    await expect(shopAll).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("opens the More panel with the live office status", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "More", exact: true }).first().click();
    await expect(page.getByRole("link", { name: /Visa Guide/ }).first()).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText(/Open now|Closed/);
  });

  test("opens the help popover with call, WhatsApp, email and visit", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /Need help\?/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: /^Call 01823-232241$/ })).toHaveAttribute(
      "href",
      "tel:+8801823232241",
    );
    await expect(dialog.getByRole("link", { name: /^WhatsApp/ })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/8801823232241/,
    );
    await expect(dialog.getByRole("link", { name: /^Email/ })).toHaveAttribute(
      "href",
      "mailto:info@waafasworld.com",
    );
    await expect(dialog.getByRole("link", { name: /^Visit/ })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("renders the footer from data with the developer credit from code", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("heading", { name: "Travel" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Group Fares" })).toBeVisible();
    await expect(footer.getByText("Bank transfer")).toBeVisible();
    await expect(footer.getByText(/Visa, Mastercard/)).toHaveCount(0);
    const credit = footer.getByRole("link", { name: "Mahedi Hasan Emon" });
    await expect(credit).toHaveAttribute("href", "https://www.mahedihasanemon.site/");
    await expect(credit).toHaveAttribute("target", "_blank");
  });

  test("validates the newsletter email", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Email address");
    await input.fill("not-an-email");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.locator("#newsletter-error-footer")).toContainText(
      "Enter a valid email address",
    );
    await input.fill("sample@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText(/Fare drops and visa news will reach you/)).toBeVisible();
  });
});

test.describe("phone shell (390)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows five tabs with Waafas World in the middle", async ({ page }) => {
    await page.goto("/");
    const tabs = page.getByRole("navigation", { name: "Main sections" });
    await expect(tabs.getByRole("link", { name: /^Home\s*\(current page\)$/ })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Waafas World" })).toHaveAttribute("href", "/shop");
    await expect(tabs.getByText("Waafas World")).toBeVisible();
    await expect(tabs.getByRole("link")).toHaveCount(4);
    await expect(tabs.getByRole("button", { name: "More" })).toBeVisible();
  });

  test("opens and closes the More sheet", async ({ page }) => {
    await page.goto("/");
    const more = page.getByRole("navigation", { name: "Main sections" }).getByRole("button");
    await more.click();
    const sheet = page.getByRole("dialog", { name: "More from WAAFA" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Gallery" })).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Track order" })).toBeVisible();
    await expect(sheet.getByRole("link", { name: "WhatsApp" })).toBeVisible();
    await expectNoAxeViolations(page);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("opens the drawer, closes it and returns focus to the menu button", async ({ page }) => {
    await page.goto("/");
    const open = page.getByRole("button", { name: "Open menu" });
    await open.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer.getByRole("link", { name: "Flights" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Hotels" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Call us" })).toHaveAttribute(
      "href",
      "tel:+8801823232241",
    );
    await expectNoAxeViolations(page);
    await drawer.getByRole("button", { name: "Close menu" }).click();
    await expect(drawer).toBeHidden();
    await expect(open).toBeFocused();
  });

  test("opens the help sheet", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Need help\?/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("link", { name: /^Call 01823-232241$/ })).toBeVisible();
  });

  test("the WhatsApp button names the current page in its message", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("link", { name: "Chat on WhatsApp" }).last();
    await expect(button).toHaveAttribute("href", /^https:\/\/wa\.me\/8801823232241/);
    await button.evaluate((anchor) =>
      anchor.addEventListener("click", (event) => event.preventDefault()),
    );
    await button.click();
    await expect(button).toHaveAttribute("href", /text=Hello%20WAAFA%2C%20I%20have%20a%20question/);
  });

  test("dismisses the announcement and remembers it", async ({ page }) => {
    await page.goto("/");
    const close = page.getByRole("button", { name: "Dismiss announcement" });
    await expect(close).toBeVisible();
    await close.click();
    await expect(close).toBeHidden();
    await page.reload();
    await expect(page.getByRole("button", { name: "Dismiss announcement" })).toBeHidden();
  });
});

test("the tab bar label wraps at 320 px instead of being cut", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const label = page.getByRole("navigation", { name: "Main sections" }).getByText("Waafas World");
  const box = await label.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(72);
  const scroll = await label.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(scroll).toBeLessThanOrEqual(0);
});

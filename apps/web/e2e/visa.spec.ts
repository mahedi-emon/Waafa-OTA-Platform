import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/* Visa services (A12): list → country tabs and checklist → apply with documents → VSA reference; Visa Guide. */
test.use({ reducedMotion: "reduce" });

function dhakaDate(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe("visa at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("finds a country and reads its checklist", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/visa-services");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Visa files, prepared properly",
    );
    await page.getByRole("searchbox", { name: "Search countries" }).fill("thai");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/q=thai/);
    await expect(page.getByRole("heading", { name: "1 country" })).toBeVisible();
    await axe(page);

    await page.getByRole("link", { name: "Thailand", exact: true }).last().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Thailand visa for Bangladeshi passports",
    );
    await page.getByRole("tab", { name: "Medical" }).click();
    await expect(page).toHaveURL(/type=medical/);
    const panel = page.getByRole("tabpanel");
    await panel.getByText("Hospital appointment letter").click();
    await expect(panel.getByText("1/7")).toBeVisible();
    await expect(page.getByRole("link", { name: "Apply", exact: true })).toHaveAttribute(
      "href",
      "/visa-services/thailand/apply?type=medical",
    );
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
    await axe(page);
    expect(errors).toEqual([]);
  });

  test("offers WhatsApp when a country is not listed", async ({ page }) => {
    await page.goto("/visa-services?q=atlantis");
    await expect(page.getByRole("heading", { name: "We don’t list “atlantis” yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ask on WhatsApp" })).toHaveAttribute(
      "href",
      /wa\.me/,
    );
  });

  test("applies with documents, rejecting a wrong file", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/visa-services/thailand/apply?type=medical&applicants=2");
    await page.getByLabel("Full name").fill("Sample Nusrat Jahan");
    await page.getByLabel("Mobile number").fill("01712-345678");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Your trip, documents and visit" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: "Medical" })).toBeChecked();
    await expect(page.getByText("Applicants 2 and more")).toBeVisible();

    const passport = page.locator('input[type="file"]').first();
    await passport.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a passport"),
    });
    await expect(
      page.getByRole("alert").filter({ hasText: "Use a JPG, PNG or PDF file" }),
    ).toBeVisible();
    await passport.setInputFiles({
      name: "passport.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(2048, 1),
    });
    await expect(page.getByText("passport.jpg")).toBeVisible();
    await expect(page.getByText("1 of 4 added")).toBeVisible();

    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(page.getByText("Choose your travel date")).toBeVisible();
    await axe(page);

    await page.getByLabel("Travel date").fill(dhakaDate(30));
    await page.getByRole("switch", { name: "Visit our office? (optional)" }).click();
    await page.getByRole("radiogroup", { name: "Choose a day" }).getByRole("radio").first().check();
    await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
    await page.getByRole("button", { name: "Send to a travel expert" }).click();
    await expect(page.getByRole("heading", { name: "Application received" })).toBeFocused();
    await expect(page.getByText(/^VSA-\d{6}-\d{4}$/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("visa guide at 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("links the guide and the service both ways", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/visa-guide");
    await page.getByRole("link", { name: /Thailand visa from Bangladesh/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Thailand visa from Bangladesh",
    );
    await page
      .getByRole("navigation", { name: "On this page" })
      .getByRole("link", { name: "Fees" })
      .click();
    await expect(page).toHaveURL(/#fees$/);
    await axe(page);
    await page.getByRole("link", { name: "See Thailand visa services" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Thailand visa for Bangladeshi passports",
    );
    await expect(page.getByRole("link", { name: "Read the Thailand visa guide" })).toHaveAttribute(
      "href",
      "/visa-guide/thailand",
    );
    expect(errors).toEqual([]);
  });
});

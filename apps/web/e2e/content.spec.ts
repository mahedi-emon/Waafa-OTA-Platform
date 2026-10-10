import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/* A16 information pages: every route renders cleanly, and each form or filter works end to end. */
test.use({ reducedMotion: "reduce" });

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .exclude('[data-slot="navigation-menu-item"] > span[aria-hidden="true"][tabindex="0"]')
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
  ).toEqual([]);
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

const ROUTES: Array<[string, RegExp]> = [
  ["/about-us", /Connecting the world/],
  ["/contact", /Talk to a person/],
  ["/faqs", /Answers before you ask/],
  ["/blog", /Travel tips, guides and stories/],
  ["/blog/coxs-bazar-long-weekend", /Cox’s Bazar/],
  ["/gallery", /Trips, in travellers’ own photos/],
  ["/gallery/around-the-world", /Around the world/],
  ["/feedback", /What travellers tell us/],
  ["/refund-policy", /Refund/],
  ["/privacy-policy", /Privacy/],
  ["/terms-and-conditions", /Terms/],
  ["/baggage-information", /What you can carry/],
  ["/emi", /Travel now, pay monthly/],
  ["/offline-payment", /Pay by bank, bKash, Nagad/],
];

for (const width of [320, 1440]) {
  test(`information pages render cleanly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = collectErrors(page);
    for (const [path, heading] of ROUTES) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await noOverflow(page);
    }
    expect(errors).toEqual([]);
  });
}

test("information pages pass axe at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path] of ROUTES) {
    await page.goto(path);
    await axe(page);
  }
});

test.describe("forms and filters at 390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("contact message validates and returns a CNT reference", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await page.getByLabel("Your name").fill("Sample Rahim Uddin");
    await page.locator("#contact-phone").fill("01712-345678");
    await page.locator("label", { hasText: "Visa" }).first().click();
    await page
      .locator("#contact-message")
      .fill("Do you handle Thailand tourist visas for families?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();
    await expect(page.getByText(/^CNT-\d{6}-\d{4}$/)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("feedback is received for moderation, never shown straight away", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/feedback");
    await expect(page.getByRole("heading", { name: "No published reviews yet" })).toBeVisible();
    await page.getByLabel("Your name").fill("Sample Nadia Islam");
    await page.locator("#fb-phone").fill("01712-345678");
    await page.getByRole("radio", { name: "4 stars" }).click({ force: true });
    await page
      .getByLabel("Your feedback")
      .fill("The Sajek trip was well planned and the guide was kind.");
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByRole("heading", { name: "Thank you, Sample" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "No published reviews yet" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("payment proof needs a transaction ID or a slip, then confirms the reference", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/offline-payment");
    await page.getByLabel("Reference number").fill("ord-261008-0042");
    await page.getByLabel("Amount paid", { exact: false }).fill("3450");
    await page.getByLabel("Your name").fill("Sample Rahim Uddin");
    await page.locator("#proof-phone").fill("01712-345678");
    await page.getByRole("button", { name: "Send proof" }).click();
    await expect(page.getByText("Add the transaction ID or the payment slip.")).toBeVisible();
    await page.getByLabel("Transaction ID").fill("8N7A6B5C4D");
    await page.getByRole("button", { name: "Send proof" }).click();
    await expect(
      page.getByRole("heading", { name: "Proof received for ORD-261008-0042" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("FAQ search narrows the list and offers WhatsApp when nothing matches", async ({ page }) => {
    await page.goto("/faqs");
    const search = page.getByRole("searchbox", { name: "Search the FAQs" });
    await search.fill("baggage");
    await expect(page.getByRole("button", { name: "How much baggage can I take?" })).toBeVisible();
    await search.fill("zzzz nothing");
    await expect(page.getByRole("heading", { name: /No answer for/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ask on WhatsApp" })).toHaveAttribute(
      "href",
      /wa\.me/,
    );
  });

  test("baggage table filters by route and airline", async ({ page }) => {
    await page.goto("/baggage-information");
    await page.locator("label", { hasText: "Domestic" }).click();
    const cards = page.getByRole("listitem");
    await expect(cards.filter({ hasText: "Air Astra" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search an airline" }).fill("novo");
    await expect(cards.filter({ hasText: "NOVOAIR" })).toBeVisible();
    await expect(cards.filter({ hasText: "Air Astra" })).toHaveCount(0);
  });

  test("EMI calculator updates the monthly amount", async ({ page }) => {
    await page.goto("/emi");
    await page.locator("label", { hasText: "12 months" }).click();
    await expect(page.getByText("৳8,334")).toBeVisible();
  });

  test("album photos open in the lightbox", async ({ page }) => {
    await page.goto("/gallery/around-the-world");
    await page.getByRole("button", { name: "Open photo 1 of 8" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

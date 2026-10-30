import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Shared-element morphs (issue 256, MOTION.md "Search → results" and "Shared image card → detail"): React starts a
 * view transition on these navigations with the pair's name on the old page. The test records the names present when
 * `document.startViewTransition` is called. Browsers without the API navigate normally. Reduced motion is on, as in
 * every flow test: the morph is instant there (globals.css), but the transition still runs.
 */
test.use({ reducedMotion: "reduce" });

declare global {
  interface Window {
    waafaMorphs?: string[][];
  }
}

async function recordTransitions(page: Page) {
  await page.addInitScript(() => {
    window.waafaMorphs = [];
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((...args: Parameters<typeof start>) => {
      const names = [...document.querySelectorAll<HTMLElement>("*")]
        .map((element) => getComputedStyle(element).viewTransitionName)
        .filter((name) => name && name !== "none");
      window.waafaMorphs?.push(names);
      return start(...args);
    }) as typeof start;
  });
}

async function morphNames(page: Page): Promise<string[] | null> {
  return page.evaluate(() =>
    "startViewTransition" in document ? (window.waafaMorphs ?? []).flat() : null,
  );
}

/** A calendar date `days` from today in Asia/Dhaka, as YYYY-MM-DD. */
function dhakaDate(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test.describe("phone (390)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("the Home search card becomes the results summary bar", async ({ page }) => {
    const errors = collectErrors(page);
    await recordTransitions(page);
    await page.goto("/");
    const card = page.getByRole("region", { name: "Search flights, hotels, tours and visas" });
    await card.locator("#search-to").click();
    const sheet = page.getByRole("dialog", { name: "Where are you flying to?" });
    await sheet.getByPlaceholder("City or airport, e.g. Dubai or DXB").fill("kua");
    await sheet.getByRole("option", { name: /Kuala Lumpur/ }).click();
    const dates = page.getByRole("dialog", { name: "Choose your departure date" });
    const depart = dhakaDate(14);
    await page.locator(`td[data-day="${depart}"]:not([data-outside]) button`).click();
    await dates.getByRole("button", { name: "Done" }).click();

    await card.getByRole("button", { name: "Search flights" }).click();
    await page.waitForURL(`**/flights?from=DAC&to=KUL&depart=${depart}`);
    await expect(page.getByRole("region", { name: "Your search" })).toContainText("DAC → KUL");
    const names = await morphNames(page);
    if (names) expect(names).toContain("trip-summary");
    expect(errors).toEqual([]);
  });
});

test.describe("desktop (1280)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("a package card's photo grows into the package page", async ({ page }) => {
    const errors = collectErrors(page);
    await recordTransitions(page);
    await page.goto("/tour-packages");
    const link = page.locator('main ul a[href^="/tour-packages/"]').first();
    const slug = ((await link.getAttribute("href")) ?? "").split("/").pop() ?? "";
    // Fetched ahead on hover, as a pointer does: the morph needs the destination ready in the same commit.
    const ahead = page.waitForResponse((response) => response.url().includes(`${slug}?_rsc`));
    await link.hover();
    await ahead;
    await link.click();
    await page.waitForURL(`**/tour-packages/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const names = await morphNames(page);
    if (names) expect(names).toContain(`package-${slug}`);
    expect(errors).toEqual([]);
  });

  test("a product card's photo grows into the product page", async ({ page }) => {
    const errors = collectErrors(page);
    await recordTransitions(page);
    await page.goto("/shop/c/power-banks");
    const link = page.locator('main a[href^="/shop/p/"]').first();
    const slug = ((await link.getAttribute("href")) ?? "").split("/").pop() ?? "";
    // Fetched ahead on hover, as a pointer does: the morph needs the destination ready in the same commit.
    const ahead = page.waitForResponse((response) => response.url().includes(`${slug}?_rsc`));
    await link.hover();
    await ahead;
    await link.click();
    await page.waitForURL(`**/shop/p/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const names = await morphNames(page);
    if (names) expect(names).toContain(`product-${slug}`);
    expect(errors).toEqual([]);
  });
});

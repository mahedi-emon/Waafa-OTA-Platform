import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Website builder (D0 R7, docs/design/ADMIN.md §5.8): the home page manager with its side sheets and live preview,
 * the menus with the link picker, Preview of unpublished changes on Next.js draft mode, and the staff tools on the
 * public site (Edit this page, Edit sections) that visitors never load. Only visible, labelled controls; every test
 * puts back what it changed. API mode only.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
const STAMP = String(Date.now()).slice(-6);

/** Clicks only work once React has hydrated the page: retry the gesture until its result shows. */
async function until(gesture: () => Promise<unknown>, shown: Locator) {
  await expect(async () => {
    await gesture();
    await expect(shown).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function signIn(page: Page) {
  signIns += 1;
  // Own test addresses: the API allows 5 sign-ins per address in 15 minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${230 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/** The public site follows an admin save within seconds (revalidation): reload until it shows. */
async function eventually(page: Page, path: string, check: () => Promise<void>) {
  await expect(async () => {
    await page.goto(path);
    await check();
  }).toPass({ timeout: 45_000 });
}

/** A visitor's browser: no staff cookies at all. */
async function visitor(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  return page;
}

async function openHomeManager(page: Page) {
  await page.goto("/secure-admin-control/website/home");
  await expect(page.getByRole("heading", { level: 1, name: "Home page" })).toBeVisible();
}

/** The hero sheet's "Line under the headline", set and saved. */
async function saveHeroLead(page: Page, lead: string) {
  await openHomeManager(page);
  const sheet = page.getByRole("dialog", { name: "Hero" });
  await until(() => page.getByRole("button", { name: "Edit Hero" }).click(), sheet);
  const field = sheet.getByRole("textbox", { name: "Line under the headline" });
  await expect(field).toBeEditable();
  const before = await field.inputValue();
  await field.fill(lead);
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved. The home page shows it within a few seconds.")).toBeVisible();
  return before;
}

test("the hero's words change in a side sheet with a preview, and the home page shows them", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await openHomeManager(page);
  // Every section is a row with its thumbnail, name, state and Edit.
  const rows = page.getByRole("main").getByRole("listitem");
  await expect(rows.filter({ hasText: "Meet our team" })).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Show Meet our team on the website" }),
  ).toBeVisible();

  const sheet = page.getByRole("dialog", { name: "Hero" });
  await until(() => page.getByRole("button", { name: "Edit Hero" }).click(), sheet);
  // The preview is the live home page at phone width, inside the sheet (staff may frame their own site).
  await expect(sheet.locator("iframe")).toBeVisible();
  await sheet.getByRole("button", { name: "Close" }).first().click();

  const lead = `Fares checked by a real person before you pay ${STAMP}.`;
  const before = await saveHeroLead(page, lead);
  try {
    await eventually(page, "/", async () => {
      await expect(page.getByText(lead)).toBeVisible({ timeout: 2_000 });
    });
  } finally {
    await saveHeroLead(page, before);
  }
  expect(errors).toEqual([]);
});

test("a section is hidden and moved on a phone, and the home page follows", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await openHomeManager(page);
  const marks = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-edit]")).map(
        (element) => element.dataset.edit,
      ),
    );

  const team = page.getByRole("switch", { name: "Show Meet our team on the website" });
  await expect(team).toBeChecked();
  await until(
    () => team.click(),
    page.getByText("Meet our team is hidden from the home page.").first(),
  );
  try {
    await eventually(page, "/", async () => {
      expect(await marks()).not.toContain("homeSections:team");
    });
  } finally {
    await openHomeManager(page);
    await until(
      () => page.getByRole("switch", { name: "Show Meet our team on the website" }).click(),
      page.getByText("Meet our team is on the home page again.").first(),
    );
  }

  // Phones move a section with its arrows (drag needs a long press there).
  await openHomeManager(page);
  await until(
    () => page.getByRole("button", { name: "Move Closing call to action up" }).click(),
    page.getByText("Order saved. The home page follows within a few seconds.").first(),
  );
  try {
    await eventually(page, "/", async () => {
      const order = await marks();
      expect(order.indexOf("homeSections:cta")).toBeLessThan(order.indexOf("homeSections:team"));
    });
  } finally {
    await openHomeManager(page);
    await until(
      () => page.getByRole("button", { name: "Move Closing call to action down" }).click(),
      page.getByText("Order saved. The home page follows within a few seconds.").first(),
    );
  }
  expect(errors).toEqual([]);
});

test("a menu item is added with the link picker, shows in the footer and is removed with Undo on offer", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/website/menus");
  await expect(page.getByRole("heading", { level: 1, name: "Menus" })).toBeVisible();
  const card = page.getByRole("region", { name: "Footer: help" });
  const label = `Group seats ${STAMP}`;

  const sheet = page.getByRole("dialog", { name: "Add a menu item" });
  await until(() => card.getByRole("button", { name: "Add an item" }).click(), sheet);
  // Nothing typed yet: the sheet says what it needs.
  await sheet.getByRole("button", { name: "Add item" }).click();
  await expect(sheet.getByRole("alert")).toHaveText("Write the words the menu shows.");
  await sheet.getByRole("textbox", { name: "Words on the menu" }).fill(label);
  await sheet.getByRole("button", { name: "Add item" }).click();
  await expect(sheet.getByRole("alert")).toHaveText("Choose where the item goes.");

  // Where it goes is picked by name, never typed as a path.
  await sheet.getByRole("combobox", { name: "Where it goes" }).click();
  await page.getByPlaceholder("Search pages, packages, visas, products…").fill("group fares");
  await page.getByRole("option", { name: "Group fares", exact: true }).click();
  await expect(sheet.getByRole("combobox", { name: "Where it goes" })).toContainText("Group fares");
  await sheet.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText(`${label} added.`).first()).toBeVisible();
  await expect(card.getByText(label)).toBeVisible();

  try {
    await eventually(page, "/", async () => {
      await expect(
        page.getByRole("contentinfo").getByRole("link", { name: label, exact: true }),
      ).toHaveAttribute("href", "/flights/group-fares", { timeout: 2_000 });
    });
  } finally {
    await page.goto("/secure-admin-control/website/menus");
    const remove = page
      .getByRole("region", { name: "Footer: help" })
      .getByRole("button", { name: `Remove ${label}` });
    await until(() => remove.click(), page.getByText(`${label} removed.`).first());
    await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();
  }
  await eventually(page, "/", async () => {
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: label, exact: true }),
    ).toHaveCount(0, { timeout: 2_000 });
  });
  expect(errors).toEqual([]);
});

test("Preview of unpublished changes shows a draft to staff only, and Exit preview ends it", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  const slug = "five-days-in-nepal-for-first-timers";
  await signIn(page);
  await page.goto(`/secure-admin-control/content/blogPosts/${slug}`);
  const unpublish = page.getByRole("button", { name: "Unpublish" });
  const publish = page.getByRole("button", { name: "Publish", exact: true });
  await expect(unpublish.or(publish)).toBeVisible();
  // A run that stopped half way left it a draft already.
  if (await unpublish.isVisible()) {
    await until(
      () => unpublish.click(),
      page.getByText("Taken off the site. It's a draft now.").first(),
    );
  }
  try {
    const preview = page.getByRole("link", { name: "Preview on site" });
    await expect(preview).toHaveAttribute(
      "href",
      `/secure-admin-control/preview?path=${encodeURIComponent(`/blog/${slug}`)}`,
    );
    const title = (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";

    // A visitor gets "not found" for the draft.
    const guest = await visitor(browser);
    await expect(async () => {
      const response = await guest.goto(`/blog/${slug}`);
      expect(response?.status()).toBe(404);
    }).toPass({ timeout: 45_000 });
    await guest.context().close();

    // Staff see it as it will look, under the banner.
    await page.goto((await preview.getAttribute("href")) ?? "/");
    await expect(page).toHaveURL(new RegExp(`/blog/${slug}$`));
    const banner = page.getByRole("status").filter({ hasText: "Preview of unpublished changes" });
    await expect(banner).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

    await banner.getByRole("link", { name: "Exit preview" }).click();
    await expect(page).toHaveURL(new RegExp(`/blog/${slug}$`));
    await expect(banner).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(title);
  } finally {
    await page.goto(`/secure-admin-control/content/blogPosts/${slug}`);
    await until(
      () => page.getByRole("button", { name: "Publish", exact: true }).click(),
      page.getByText("Published. It's live on the site.").first(),
    );
  }
  // After Exit preview the draft's page is "not found" again: that answer is expected, nothing else.
  expect(errors.filter((line) => !line.endsWith(`/blog/${slug}`))).toEqual([]);
});

test("staff get Edit this page and Edit sections on the site; visitors never load them", async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);

  const guest = await visitor(browser);
  const asked: string[] = [];
  guest.on("request", (request) => {
    if (request.url().includes("/api/staff-tools")) asked.push(request.url());
  });
  await guest.goto("/");
  await expect(guest.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(guest.getByRole("region", { name: "Staff tools" })).toHaveCount(0);
  expect(asked).toEqual([]);
  await guest.context().close();

  await signIn(page);
  await page.goto("/");
  const tools = page.getByRole("region", { name: "Staff tools" });
  await expect(tools.getByRole("link", { name: "Edit this page" })).toHaveAttribute(
    "href",
    "/secure-admin-control/website/home",
  );
  await until(
    () => tools.getByRole("button", { name: "More staff tools" }).click(),
    page.getByRole("menuitemcheckbox", { name: "Edit sections" }),
  );
  await page.getByRole("menuitemcheckbox", { name: "Edit sections" }).click();
  const hero = page.getByRole("link", { name: "Edit Hero" });
  await expect(hero).toHaveAttribute("href", "/secure-admin-control/website/home?section=hero");
  await expect(page.getByRole("link", { name: "Edit Meet our team" })).toBeAttached();
  await hero.click();
  await expect(page.getByRole("dialog", { name: "Hero" })).toBeVisible();

  // A record's page opens that record's editor.
  await page.goto("/tour-packages/kathmandu-and-pokhara");
  await expect(
    page.getByRole("region", { name: "Staff tools" }).getByRole("link", { name: "Edit this page" }),
  ).toHaveAttribute("href", "/secure-admin-control/content/tourPackages/kathmandu-and-pokhara");
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`the home page manager and the menus pass axe at ${width} px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    for (const path of [
      "/secure-admin-control/website/home",
      "/secure-admin-control/website/menus",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(scroll, `${path} scrolls sideways at ${width} px`).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, path).toEqual([]);
      await page.screenshot({
        path: `test-results/admin-shots/website-${path.split("/").pop()}-${width}.png`,
        fullPage: true,
      });
    }
  });
}

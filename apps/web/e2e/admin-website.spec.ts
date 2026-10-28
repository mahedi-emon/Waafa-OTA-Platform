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

/**
 * Clicks only work once React has hydrated the page: retry the gesture until its result shows. Only for gestures
 * that can safely run twice (opening a sheet or a menu, or one that checks it is still needed).
 */
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

/** The public site follows an admin save at once on this server: reload until it shows. */
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

/** The home page manager, hydrated: its drag handles appear only once React and the drag code have loaded. */
async function openHomeManager(page: Page) {
  await page.goto("/secure-admin-control/website/home");
  await expect(page.getByRole("heading", { level: 1, name: "Home page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drag to reorder: Hero" })).toBeVisible();
}

/** The menus page, hydrated (its drag handles are there). */
async function openMenus(page: Page) {
  await page.goto("/secure-admin-control/website/menus");
  await expect(page.getByRole("heading", { level: 1, name: "Menus" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Drag to reorder: Home" }).first()).toBeVisible();
}

/** The hero sheet's "Line under the headline", set and saved. */
async function saveHeroLead(page: Page, lead: string) {
  await openHomeManager(page);
  const sheet = page.getByRole("dialog", { name: "Hero" });
  await page.getByRole("button", { name: "Edit Hero" }).click();
  await expect(sheet).toBeVisible();
  const field = sheet.getByRole("textbox", { name: "Line under the headline" });
  await expect(field).toBeEditable();
  const before = await field.inputValue();
  await field.fill(lead);
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByText("Saved. The home page shows it within a few seconds.").first(),
  ).toBeVisible();
  return before;
}

/** Turns a home section's Show switch to the wanted state and waits for the save. */
async function showSection(page: Page, name: string, on: boolean) {
  await openHomeManager(page);
  const toggle = page.getByRole("switch", { name: `Show ${name} on the website` });
  if ((await toggle.isChecked()) !== on) await toggle.click();
  await expect(toggle).toBeChecked({ checked: on });
  await expect(
    page
      .getByText(
        on ? `${name} is on the home page again.` : `${name} is hidden from the home page.`,
      )
      .first(),
  ).toBeVisible();
}

test("the hero's words change in a side sheet with a preview, and the home page shows them", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await openHomeManager(page);
  // Every section is a row with its thumbnail, name, state, arrows and Edit.
  const rows = page.getByRole("main").getByRole("listitem");
  await expect(rows.filter({ hasText: "Meet our team" })).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Show Meet our team on the website" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Move Meet our team up" })).toBeVisible();

  const sheet = page.getByRole("dialog", { name: "Hero" });
  await page.getByRole("button", { name: "Edit Hero" }).click();
  await expect(sheet).toBeVisible();
  // The preview is the live home page at phone width, inside the sheet, and out of the tab order.
  await expect(sheet.locator("iframe")).toBeVisible();
  await expect(sheet.locator("iframe")).toHaveAttribute("tabindex", "-1");
  // Opening the sheet leaves it at its top: the words come first.
  await expect(sheet.getByRole("textbox", { name: "Headline", exact: true })).toBeInViewport();
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

test("a section's standard words show in grey, and a reopened sheet starts from what is saved", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await signIn(page);
  await openHomeManager(page);
  const sheet = page.getByRole("dialog", { name: "Tour packages" });
  await page.getByRole("button", { name: "Edit Tour packages" }).click();
  await expect(sheet).toBeVisible();
  const heading = sheet.getByRole("textbox", { name: "Heading", exact: true });
  const saved = await heading.inputValue();
  await heading.fill("");
  await expect(heading).toHaveAttribute("placeholder", "Trips planned day by day");
  // Typed and closed without Save: the next opening shows the saved words again.
  await heading.fill(`Not saved ${STAMP}`);
  await sheet.getByRole("button", { name: "Close" }).first().click();
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Edit Tour packages" }).click();
  await expect(sheet.getByRole("textbox", { name: "Heading", exact: true })).toHaveValue(saved);
  expect(errors).toEqual([]);
});

test("a section is hidden and moved on a phone, and the home page follows", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  const marks = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-edit]")).map(
        (element) => element.dataset.edit,
      ),
    );

  await showSection(page, "Meet our team", false);
  try {
    await eventually(page, "/", async () => {
      expect(await marks()).not.toContain("homeSections:team");
    });
  } finally {
    await showSection(page, "Meet our team", true);
  }

  // Move up and down sit in every row; the moved row keeps keyboard focus.
  await openHomeManager(page);
  const up = page.getByRole("button", { name: "Move Closing call to action up" });
  const down = page.getByRole("button", { name: "Move Closing call to action down" });
  await expect(down).toBeDisabled();
  await up.click();
  await expect(down).toBeEnabled();
  await expect(up).toBeFocused();
  await expect(
    page.getByText("Order saved. The home page follows within a few seconds.").first(),
  ).toBeVisible();
  try {
    await eventually(page, "/", async () => {
      const order = await marks();
      expect(order.indexOf("homeSections:cta")).toBeLessThan(order.indexOf("homeSections:team"));
    });
  } finally {
    await openHomeManager(page);
    const back = page.getByRole("button", { name: "Move Closing call to action down" });
    if (await back.isEnabled()) await back.click();
    await expect(back).toBeDisabled();
    await expect(
      page.getByText("Order saved. The home page follows within a few seconds.").first(),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("a menu item is picked by name, then sent to a typed website, and removed with Undo on offer", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await signIn(page);
  await openMenus(page);
  const card = page.getByRole("region", { name: "Footer: help" });
  const label = `Group seats ${STAMP}`;
  const footerLink = () =>
    page.getByRole("contentinfo").getByRole("link", { name: label, exact: true });

  const sheet = page.getByRole("dialog", { name: "Add a menu item" });
  await card.getByRole("button", { name: "Add an item" }).click();
  await expect(sheet).toBeVisible();
  // Nothing typed yet: the sheet says what it needs.
  await sheet.getByRole("button", { name: "Add item" }).click();
  await expect(sheet.getByRole("alert")).toHaveText("Write the words the menu shows.");
  await sheet.getByRole("textbox", { name: "Words on the menu" }).fill(label);
  await sheet.getByRole("button", { name: "Add item" }).click();
  await expect(sheet.getByRole("alert")).toHaveText("Choose where the item goes.");

  // Where it goes is picked by name, never typed as a path; letters spread over words don't match.
  await sheet.getByRole("combobox", { name: "Where it goes" }).click();
  const search = page.getByPlaceholder("Search pages, packages, visas, products…");
  await search.fill("thai");
  await expect(page.getByRole("option", { name: "International Trading" })).toHaveCount(0);
  await search.fill("group fares");
  await page.getByRole("option", { name: "Group fares", exact: true }).click();
  await expect(sheet.getByRole("combobox", { name: "Where it goes" })).toContainText("Group fares");
  await sheet.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText(`${label} added.`).first()).toBeVisible();
  await expect(card.getByText(label)).toBeVisible();

  try {
    await eventually(page, "/", async () => {
      await expect(footerLink()).toHaveAttribute("href", "/flights/group-fares", {
        timeout: 2_000,
      });
    });

    // A website typed in the picker fills the link; Enter there doesn't save or close the item's sheet.
    await openMenus(page);
    const edit = page.getByRole("dialog", { name: "Edit menu item" });
    await page
      .getByRole("region", { name: "Footer: help" })
      .getByRole("button", { name: `Edit ${label}` })
      .click();
    await expect(edit).toBeVisible();
    await edit.getByRole("combobox", { name: "Where it goes" }).click();
    await page.getByRole("option", { name: "Another website…" }).click();
    const address = page.getByRole("textbox", { name: "Website address" });
    await address.fill("facebook.com/waafa");
    await address.press("Enter");
    await expect(edit).toBeVisible();
    await expect(edit.getByRole("combobox", { name: "Where it goes" })).toContainText(
      "https://facebook.com/waafa",
    );
    await expect(page.getByText("Saved. The site follows within a few seconds.")).toHaveCount(0);
    await edit.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Saved. The site follows within a few seconds.").first(),
    ).toBeVisible();
    await eventually(page, "/", async () => {
      await expect(footerLink()).toHaveAttribute("href", "https://facebook.com/waafa", {
        timeout: 2_000,
      });
    });
  } finally {
    await openMenus(page);
    const more = page
      .getByRole("region", { name: "Footer: help" })
      .getByRole("button", { name: `More for ${label}` });
    const remove = page.getByRole("menuitem", { name: "Remove" });
    await until(() => more.click(), remove);
    await remove.click();
    await expect(page.getByText(`${label} removed.`).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();
  }
  await eventually(page, "/", async () => {
    await expect(footerLink()).toHaveCount(0, { timeout: 2_000 });
  });
  expect(errors).toEqual([]);
});

test("the phone tab bar keeps its five tabs in place, with the middle one locked", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signIn(page);
  await page.goto("/secure-admin-control/website/menus");
  const tabs = page.getByRole("region", { name: "Phone tab bar" });
  await expect(tabs.getByRole("listitem")).toHaveCount(5);
  await expect(tabs.getByText("Always Waafa’s World, in the middle")).toBeVisible();
  await expect(tabs.getByRole("button", { name: "Edit Waafa’s World" })).toHaveCount(0);
  await expect(tabs.getByRole("button", { name: /^Drag to reorder/ })).toHaveCount(0);
  await expect(tabs.getByRole("switch")).toHaveCount(0);
  await expect(tabs.getByRole("button", { name: "Add an item" })).toHaveCount(0);
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
  // Clicks only while still needed: a click before hydration does nothing, one after it changes the button.
  await until(async () => {
    if (await unpublish.isVisible()) await unpublish.click({ timeout: 2_000 });
  }, publish);
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

    // A preview link that tries to leave the site stays on it.
    const response = await page.request.get("/api/preview/exit?path=%2F.%2F%2Fevil.example", {
      maxRedirects: 0,
    });
    expect(response.headers().location).toBe("/");
  } finally {
    await page.goto(`/secure-admin-control/content/blogPosts/${slug}`);
    await until(async () => {
      if (await publish.isVisible()) await publish.click({ timeout: 2_000 });
    }, unpublish);
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
  // Keyboards reach the outlines at once: the first link takes focus; Escape ends them.
  await expect(hero).toBeFocused();
  await expect(page.getByRole("link", { name: "Edit Meet our team" })).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(hero).toHaveCount(0);
  await expect(tools.getByRole("button", { name: "More staff tools" })).toBeFocused();

  await tools.getByRole("button", { name: "More staff tools" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Edit sections" }).click();
  await page.getByRole("link", { name: "Edit Hero" }).click();
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

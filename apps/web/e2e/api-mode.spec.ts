import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * API mode end to end (C1, A18): the site reads the API snapshot and writes to the API, staff work in Admin, and an
 * admin save reaches the public site through the signed revalidation call. Runs only when the job starts the API
 * (WAAFA_API_URL set); the fixture-mode suite covers everything else.
 */
const apiMode = Boolean(process.env.WAAFA_API_URL);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.describe.configure({ mode: "serial" });
test.skip(!apiMode, "API mode only (WAAFA_API_URL)");

let reference = "";

/**
 * Each sign-in comes from its own test address: the API allows 5 sign-ins per address in 15 minutes (PRD NFR-SEC),
 * and this file signs in more often than that. Production nginx overwrites X-Forwarded-For, so this only works here.
 */
let signIns = 0;

async function signIn(page: Page) {
  signIns += 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${signIns}` });
  await page.goto("/secure-admin-control");
  await expect(page).toHaveURL(/\/secure-admin-control\/sign-in/);
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

test("the public site renders from the API snapshot", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.goto("/faqs");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a contact message becomes a lead with a CNT reference", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Sample Integration Customer");
  await page.locator("#contact-phone").fill("01712-345678");
  await page.locator("label", { hasText: "Visa" }).first().click();
  await page.locator("#contact-message").fill("Do you handle Thailand tourist visas for families?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();
  reference = (await page.getByText(/^CNT-\d{6}-\d{4}$/).textContent()) ?? "";
  expect(reference).toMatch(/^CNT-\d{6}-\d{4}$/);
});

test("staff sign in, find the lead and move it to Quoted", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto(`/secure-admin-control/leads?q=${reference}`);
  await page.getByRole("link", { name: reference }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(reference);
  await page.locator("#lead-status").selectOption("quoted");
  await expect(page.getByText("Lead updated").first()).toBeVisible();
  await expect(page.getByText(/Status new → quoted/)).toBeVisible();
  await page
    .getByLabel("What happened? (visible to staff only)")
    .fill("Called, sent the checklist.");
  await page.getByRole("button", { name: "Add to timeline" }).click();
  await expect(page.getByText("Called, sent the checklist.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("an FAQ saved in Admin shows on the public site", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const answer = `Yes, every price includes VAT. Checked ${Date.now()}.`;
  await signIn(page);
  await page.goto("/secure-admin-control/content/faqs");
  await page.locator("main ul li a").first().click();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await page.locator("#field-answer").fill(answer);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved").first()).toBeVisible();
  // The API batches revalidation for two seconds, then the web expires its caches.
  await expect(async () => {
    await page.goto("/faqs");
    // Answers sit in closed accordions; the FAQPage structured data carries every answer.
    expect(await page.content()).toContain(answer);
  }).toPass({ timeout: 30_000 });
});

test("a newsletter sign-up reaches the Admin list", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const email = `reader.${Date.now()}@example.com`;
  await page.goto("/");
  await page.locator("#newsletter-email-footer").fill(email);
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText(/Fare drops and visa news will reach you/)).toBeVisible();
  await signIn(page);
  await page.goto("/secure-admin-control/subscribers");
  await expect(page.getByText(email)).toBeVisible();
});

test("a Super Admin connects an external API, turns it on and reveals the secret on request", async ({
  page,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/integrations");
  await expect(page.getByRole("heading", { level: 1, name: "Integrations" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Flight APIs" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Sabre" }) });
  // "Manage" when a retry finds the connection already saved.
  await card.getByRole("button", { name: /^(Connect|Manage)$/ }).click();
  await card.getByLabel("API base URL").fill("https://example.com");
  await card.getByLabel("Client ID").fill("e2e-client");
  await card.getByLabel("Client secret", { exact: true }).fill("e2e-client-secret-4321");
  await card.getByLabel("PCC (pseudo city code)").fill("E2E1");
  await card.getByRole("button", { name: "Save", exact: true }).click();
  await expect(card.getByText("Saved, ends in 4321. Leave empty to keep it.")).toBeVisible();
  await expect(card.getByLabel("Client secret", { exact: true })).toHaveValue("");
  expect(await page.content()).not.toContain("e2e-client-secret-4321");

  // Active with Sandbox credentials and a 5% markup.
  // Turn it on (a rerun on a used database may find it on already).
  const active = card.getByRole("switch", { name: "Active" });
  if (!(await active.isChecked())) await active.click();
  await card.getByRole("radio", { name: "Percentage" }).click();
  await card.getByLabel("Value").fill("5");
  await card.getByRole("button", { name: "Save settings" }).click();
  await expect(card.getByText("Active", { exact: true }).first()).toBeVisible();
  await expect(card.getByRole("switch", { name: "Active" })).toBeChecked();

  // The saved secret is shown only on request (and logged by the API).
  await card.getByRole("button", { name: "Reveal saved value" }).click();
  await expect(card.getByText("e2e-client-secret-4321")).toBeVisible();

  // A custom SMS provider in the Communication tab.
  await page.getByRole("tab", { name: "SMS and email" }).click();
  const panel = page.getByRole("tabpanel", { name: "SMS and email" });
  await panel.getByLabel("Provider name").fill("E2E SMS Gateway");
  await panel.getByRole("button", { name: "Add provider" }).click();
  await expect(panel.getByRole("heading", { name: /E2E SMS Gateway/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("an editor uploads a photo to the media library and the site serves it (issue 109)", async ({
  page,
  request,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/media");
  await expect(page.getByRole("heading", { level: 1, name: "Media library" })).toBeVisible();
  // A 4 x 4 PNG made in the test: the API re-encodes it to WebP.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAD0lEQVQImWNgCL6OQMRxANcTEqEIh1beAAAAAElFTkSuQmCC",
    "base64",
  );
  await page
    .getByLabel("Photo", { exact: true })
    .setInputFiles({ name: "e2e.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Alt text", { exact: true }).first().fill("E2E test swatch in brand blue");
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText("Photo uploaded")).toBeVisible();
  const address = page
    .locator("code", { hasText: /^\/uploads\/\d{4}\/\d{2}\/[a-z0-9]+\.webp$/ })
    .first();
  await expect(address).toBeVisible();
  const url = (await address.textContent()) ?? "";
  const served = await request.get(url);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/webp");
  expect(errors).toEqual([]);
});

test("a policy body edited in the rich text editor shows on the site (issue 116)", async ({
  page,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  const line = `Refund requests are answered within two working days. Checked ${Date.now()}.`;
  await signIn(page);
  await page.goto("/secure-admin-control/content/pages/refund-policy");
  await expect(page.getByRole("toolbar", { name: "Text formatting" }).first()).toBeVisible();
  const body = page.locator('[role="textbox"][aria-multiline="true"]').first();
  await body.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(line);
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Bold" }).first().click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved").first()).toBeVisible();
  await expect(async () => {
    await page.goto("/refund-policy");
    await expect(page.locator("strong", { hasText: line })).toBeVisible();
  }).toPass({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

test("a Super Admin connects Google sign-in and the Log in page offers it (issue 134)", async ({
  page,
  request,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  await signIn(page);

  // Admin › Integrations › Sign-in: Google's client ID and secret, then Active.
  await page.goto("/secure-admin-control/integrations");
  await page.getByRole("tab", { name: "Sign-in" }).click();
  const panel = page.getByRole("tabpanel", { name: "Sign-in" });
  await expect(panel.getByText(/\/api\/auth\/google\/callback/)).toBeVisible();
  await expect(panel.getByRole("button", { name: "Add provider" })).toHaveCount(0);
  const card = panel
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Google sign-in" }) });
  await card.getByRole("button", { name: /^(Connect|Manage)$/ }).click();
  await card.getByLabel("Client ID").fill("e2e-123.apps.googleusercontent.com");
  await card.getByLabel("Client secret", { exact: true }).fill("e2e-google-secret-5678");
  await card.getByRole("button", { name: "Save", exact: true }).click();
  await expect(card.getByText("Saved, ends in 5678. Leave empty to keep it.")).toBeVisible();
  const active = card.getByRole("switch", { name: "Active" });
  if (!(await active.isChecked())) await active.click();
  await card.getByRole("button", { name: "Save settings" }).click();
  await expect(card.getByRole("switch", { name: "Active" })).toBeChecked();

  // Settings › Site › Accounts live shows the Log in link and page.
  const setAccountsLive = async (on: boolean) => {
    await page.goto("/secure-admin-control/content/siteSettings");
    const live = page.locator("#field-accountsLive");
    await expect(live).toBeVisible();
    if ((await live.isChecked()) !== on) await live.click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved").first()).toBeVisible();
  };
  await setAccountsLive(true);
  // The settings save reaches the site through the batched revalidation (about two seconds); poll without the
  // browser so the 404s before it lands are not counted as page errors.
  await expect(async () => {
    expect((await request.get("/login")).status()).toBe(200);
  }).toPass({ timeout: 30_000 });
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();

  // The start route sends the visitor to Google with PKCE and the site's own callback.
  const start = await request.get("/api/auth/google/start?next=/visa-services", {
    maxRedirects: 0,
  });
  expect(start.status()).toBe(303);
  const google = new URL(start.headers()["location"] ?? "");
  expect(google.origin).toBe("https://accounts.google.com");
  expect(google.searchParams.get("client_id")).toBe("e2e-123.apps.googleusercontent.com");
  expect(google.searchParams.get("code_challenge_method")).toBe("S256");
  expect(google.searchParams.get("redirect_uri")).toMatch(/\/api\/auth\/google\/callback$/);
  expect(start.headers()["set-cookie"] ?? "").toContain("waafa_oauth=");
  expect(google.toString()).not.toContain("e2e-google-secret");

  // With the Log in button in the header, no width scrolls sideways and the header stays on the page grid: the
  // right controls end inside the content edge and the nav keeps its distance (issues 138, 140, 142 and 146).
  for (const width of [1024, 1280, 1300, 1360, 1439, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/login"]) {
      await page.goto(path);
      // The interactive menu (with More) replaces the server-rendered one after hydration.
      await page.waitForLoadState("load");
      await page.waitForTimeout(400);
      const layout = await page.evaluate(() => {
        const box = document.querySelector("header .site-container");
        const login = document.querySelector('header a[href="/login"]');
        const items = document.querySelectorAll("header nav li");
        const last = items[items.length - 1];
        const logo = box?.firstElementChild;
        const nav = document.querySelector("header nav");
        if (!box || !login?.parentElement || !last || !logo || !nav) return null;
        const contentRight =
          box.getBoundingClientRect().right - parseFloat(getComputedStyle(box).paddingRight);
        const controls = login.parentElement.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          pastGrid: controls.right - contentRight,
          navGap: controls.left - last.getBoundingClientRect().right,
          logoGap: nav.getBoundingClientRect().left - logo.getBoundingClientRect().right,
        };
      });
      expect(layout, `${path} at ${width}px`).not.toBeNull();
      expect(layout?.overflow, `${path} at ${width}px: horizontal scroll`).toBeLessThanOrEqual(0);
      expect(layout?.pastGrid, `${path} at ${width}px: past the grid`).toBeLessThanOrEqual(0.5);
      expect(layout?.navGap, `${path} at ${width}px: nav gap`).toBeGreaterThanOrEqual(8);
      expect(layout?.logoGap, `${path} at ${width}px: logo gap`).toBeGreaterThanOrEqual(8);
    }
  }
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();

  // My account without a session asks to log in.
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=/);

  // Back to the launch state for the other tests, and wait until the site has it.
  await setAccountsLive(false);
  await expect(async () => {
    expect((await request.get("/login")).status()).toBe(404);
  }).toPass({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

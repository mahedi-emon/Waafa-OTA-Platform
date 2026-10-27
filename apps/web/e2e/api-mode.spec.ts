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
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
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

test("a visit from a campaign is credited on the lead and in Where leads come from (issue 237)", async ({
  page,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const campaign = `e2e-${String(Date.now()).slice(-6)}`;
  // The proxy remembers the UTM tags in a first-party cookie the page never reads.
  await page.goto(`/contact?utm_source=newsletter&utm_medium=email&utm_campaign=${campaign}`);
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "waafa_src")).toMatchObject({ httpOnly: true });
  await page.getByLabel("Your name").fill("Sample Campaign Customer");
  await page.locator("#contact-phone").fill("01712-345679");
  await page.locator("label", { hasText: "Visa" }).first().click();
  await page.locator("#contact-message").fill("Saw your newsletter: Thailand visa for two.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();

  await signIn(page);
  await page.goto("/secure-admin-control/reports");
  const sources = page.getByRole("region", { name: "Where leads come from" });
  const row = sources.getByRole("row").filter({ hasText: campaign });
  await expect(row.getByRole("cell").first()).toHaveText("Newsletter (email)");
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
  await page.getByRole("table").getByRole("link").first().click();
  // The title is the customer's name; the reference is in the line under it (D0 R6).
  await expect(page.getByRole("heading", { level: 1 }).locator("xpath=../..")).toContainText(
    reference,
  );
  // Steps move the status (D0 R4): Log quote, with nothing more to fill in.
  await page.getByRole("button", { name: "Log quote" }).click();
  await page
    .getByRole("dialog", { name: "Log a quote" })
    .getByRole("button", { name: "Log quote" })
    .click();
  await expect(page.getByText("Quote logged.").first()).toBeVisible();
  await expect(page.getByText("Quote logged · Moved to Quoted")).toBeVisible();
  await page
    .getByLabel("What happened? (visible to staff only)")
    .fill("Called, sent the checklist.");
  await page.getByRole("button", { name: "Add to timeline" }).click();
  await expect(page.getByText("Called, sent the checklist.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the request shows its progress on /track and nothing for a wrong phone (issue 240)", async ({
  page,
}) => {
  test.skip(!ADMIN_PASSWORD, "the request is quoted by the staff test above");
  const errors = collectErrors(page);
  await page.goto(`/track?ref=${reference.toLowerCase()}&phone=01712-345678`);
  await expect(page.getByRole("heading", { level: 2, name: "Quote sent" })).toBeVisible();
  await expect(page.getByText("Request received")).toBeVisible();
  // No personal data: the name and the message never show.
  await expect(page.getByText("Sample Integration Customer")).toHaveCount(0);
  await expect(page.getByText(/Thailand tourist visas/)).toHaveCount(0);

  await page.goto(`/track?ref=${reference}&phone=01799-999999`);
  await expect(page.getByRole("heading", { name: "We couldn’t find that" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("an FAQ saved in Admin shows on the public site", async ({ page }) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const answer = `Yes, every price includes VAT. Checked ${Date.now()}.`;
  await signIn(page);
  await page.goto("/secure-admin-control/content/faqs");
  await page.getByRole("table").getByRole("link").first().click();
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
  // Newsletter is a DataTable (issue 229): the sign-up is a row of the table.
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();
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
  // Saved already when a rerun finds these exact settings (the button stays off with nothing to save).
  const saveSettings = card.getByRole("button", { name: "Save settings" });
  if (await saveSettings.isEnabled()) await saveSettings.click();
  await expect(card.getByText("Active", { exact: true }).first()).toBeVisible();
  await expect(card.getByRole("switch", { name: "Active" })).toBeChecked();

  // The saved secret is shown only on request (and logged by the API).
  await card.getByRole("button", { name: "Reveal saved value" }).click();
  await expect(card.getByText("e2e-client-secret-4321")).toBeVisible();

  // A custom SMS provider in the Communication tab.
  await page.getByRole("tab", { name: "SMS and email" }).click();
  const panel = page.getByRole("tabpanel", { name: "SMS and email" });
  // Its own name, so a rerun on a used database adds a new provider instead of clashing with the last one.
  const provider = `E2E SMS Gateway ${String(Date.now()).slice(-5)}`;
  await panel.getByLabel("Provider name").fill(provider);
  await panel.getByRole("button", { name: "Add provider" }).click();
  await expect(panel.getByRole("heading", { name: provider })).toBeVisible();
  expect(errors).toEqual([]);
});

test("an editor uploads a photo to the media library and the site serves it (issue 109)", async ({
  page,
  request,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  const stamp = String(Date.now()).slice(-6);
  await signIn(page);
  await page.goto(`/secure-admin-control/media?q=${stamp}`);
  await expect(page.getByRole("heading", { level: 1, name: "Media library" })).toBeVisible();
  // A 4 x 4 PNG made in the test: the API re-encodes it to WebP.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAD0lEQVQImWNgCL6OQMRxANcTEqEIh1beAAAAAElFTkSuQmCC",
    "base64",
  );
  const input = page
    .getByRole("group", { name: "Drop photos or videos here, or paste them" })
    .locator('input[type="file"]');
  const added = page.getByText(/1 file added/).first();
  // The drop zone listens once React has hydrated: try again only if nothing arrived.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await input.setInputFiles({
      name: `e2e-swatch-${stamp}.png`,
      mimeType: "image/png",
      buffer: png,
    });
    if (
      await added.waitFor({ timeout: 20_000 }).then(
        () => true,
        () => false,
      )
    )
      break;
  }
  await expect(added).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: new RegExp(`E2e swatch ${stamp}`) })
    .first()
    .click();
  const url = (await page.getByRole("link", { name: "Open file" }).getAttribute("href")) ?? "";
  expect(url).toMatch(/^\/uploads\/\d{4}\/\d{2}\/[a-z0-9]+\.webp$/);
  const served = await request.get(url);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/webp");
  expect(errors).toEqual([]);
});

test("a policy body edited in the rich text editor shows on the site (issue 116)", async ({
  page,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  // Typing, saving and the site's refresh after the save take longer than the default 30 s on a busy runner.
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  const line = `Refund requests are answered within two working days. Checked ${Date.now()}.`;
  await signIn(page);
  await page.goto("/secure-admin-control/content/pages/refund-policy");
  // A long page starts with its sections folded (D0 R2): open the first one to write in it, once React listens.
  const card = page.getByRole("button", { name: /^Flights (Expand|Collapse)$/ });
  await expect(async () => {
    if ((await card.getAttribute("aria-expanded")) !== "true") await card.click();
    await expect(card).toHaveAttribute("aria-expanded", "true", { timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
  await expect(page.getByRole("toolbar", { name: "Text formatting" }).first()).toBeVisible({
    timeout: 15_000,
  });
  const body = page.locator('[role="textbox"][aria-multiline="true"]').first();
  await expect(body).toHaveAttribute("contenteditable", "true");
  // Typing only counts once the editor listens: retry until the words are in it.
  await expect(async () => {
    await body.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(line);
    await expect(body).toContainText(line, { timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
  await page.keyboard.press("ControlOrMeta+a");
  // A rerun types over an earlier bold line and keeps its bold: press Bold only when it is off.
  const bold = page.getByRole("button", { name: "Bold" }).first();
  if ((await bold.getAttribute("aria-pressed")) !== "true") await bold.click();
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  // A live page saves with Update (the sticky action bar).
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.getByText("Updated on the site.").first()).toBeVisible();
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
  // Three saves and a wait of up to 30 s for the site to follow: more than the default 30 s test time.
  test.setTimeout(90_000);
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
  // A rerun finds it active already, with nothing new to save.
  const saveSettings = card.getByRole("button", { name: "Save settings" });
  if (await saveSettings.isEnabled()) await saveSettings.click();
  await expect(card.getByRole("switch", { name: "Active" })).toBeChecked();

  // Settings › SEO and tracking › Accounts live shows the Log in link and page.
  const setAccountsLive = async (on: boolean) => {
    await page.goto("/secure-admin-control/settings/seo?tab=connections");
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
  const start = await request.get("/api/auth/google/start?next=/visa", {
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

test("a visa application's passport reaches staff through a logged link (issue 232)", async ({
  page,
}) => {
  test.skip(!ADMIN_PASSWORD, "needs SEED_ADMIN_PASSWORD");
  const errors = collectErrors(page);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const travel = new Date(`${today}T00:00:00Z`);
  travel.setUTCDate(travel.getUTCDate() + 30);
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(4096, 9)]);

  await page.goto("/visa/nepal/apply?applicants=1");
  await page.getByLabel("Full name").fill("Sample Passport Upload");
  await page.getByLabel("Mobile number").fill("01712-000232");
  await page.getByRole("button", { name: "Continue" }).click();
  const uploaded = page.waitForResponse((response) => response.url().includes("/api/uploads"));
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: "passport-232.jpg", mimeType: "image/jpeg", buffer: jpeg });
  expect((await uploaded).status()).toBe(201);
  await expect(page.getByText("1 of 4 added")).toBeVisible();
  await page.getByLabel("Travel date").fill(travel.toISOString().slice(0, 10));
  await page.getByLabel(/I agree that Waafa Tours and Travel may contact me/).check();
  await page.getByRole("button", { name: "Send to a travel expert" }).click();
  await expect(page.getByRole("heading", { name: "Application received" })).toBeFocused();
  const visaReference = (await page.getByText(/^VSA-\d{6}-\d{4}$/).textContent()) ?? "";

  await signIn(page);
  await page.goto(`/secure-admin-control/leads?q=${visaReference}`);
  await page.getByRole("table").getByRole("link").first().click();
  const files = page.getByRole("region", { name: "Files" });
  await expect(files.getByText("passport-232.jpg")).toBeVisible();
  await expect(files.getByText(/Passport bio page/)).toBeVisible();
  const href = await files
    .getByRole("link", { name: "Open passport-232.jpg in a new tab" })
    .getAttribute("href");
  expect(href).toMatch(/^\/secure-admin-control\/files\/cf_[A-Za-z0-9_-]{32}$/);
  const response = await page.request.get(href ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/jpeg");
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  expect(Buffer.from(await response.body()).equals(jpeg)).toBe(true);
  // Signed out, the same address opens nothing.
  const anonymous = await page.context().browser()?.newContext();
  const outside = await anonymous?.request.get(new URL(href ?? "", page.url()).toString(), {
    maxRedirects: 0,
  });
  expect(outside?.status()).toBe(303);
  await anonymous?.close();
  expect(errors).toEqual([]);
});

import { randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { collectErrors } from "./errors";
import { whenHydrated } from "./hydration";

/*
 * The staff tasks from the admin epic that no other spec covers yet (D0 R10): 2 (the home hero's photo and headline),
 * 8 (a banner scheduled for next Friday), 12 (a customer found by phone with all their requests and orders, on a wide
 * screen and a phone) and 13 (a wrong price undone from History). Visible, labelled controls only; nothing typed that
 * the system knows. Every test puts the site back as it found it. API mode only.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
let calls = 0;
const STAMP = String(Date.now()).slice(-6);

/** A plain PNG of one colour, big enough for any photo frame. */
function png(width: number, height: number, rgb: [number, number, number]): Buffer {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = (table[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x += 1) row.set(rgb, 1 + x * 3);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(Array.from({ length: height }, () => row)))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function signIn(page: Page) {
  signIns += 1;
  // Own test addresses: the API allows 5 sign-ins per address in 15 minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${170 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/** The website's own intake (a request or an order), with the intake key. */
async function intake<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  calls += 1;
  const response = await request.post(`${API}/api/v1/public/${path}`, {
    headers: {
      "x-intake-key": INTAKE_KEY,
      "idempotency-key": randomUUID(),
      "x-client-ip": `203.0.113.${(calls % 200) + 30}`,
    },
    data,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()) as T;
}

/** Saves the editor and waits for it; a click while a photo is still finishing is tried again (saving twice is safe). */
async function saveChanges(page: Page, button: RegExp = /^Save changes$/) {
  await expect(async () => {
    await page.getByRole("button", { name: button }).click();
    await expect(page.getByText("All changes saved").first()).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 60_000 });
}

/** Restores a record's first change from its History tab (the version before this test). */
async function restoreFirstChange(page: Page) {
  const history = page.getByRole("tab", { name: "History" });
  await whenHydrated(history);
  await history.click();
  await expect(history).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Restore the version before this change" }).click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.getByText("The older version is back.").first()).toBeVisible();
}

/** The next Friday after today in Dhaka, as the calendar names its day button ("Friday, October 30th, 2026"). */
function nextFriday(): { label: RegExp; day: number } {
  const dhaka = new Date(Date.now() + 6 * 60 * 60_000);
  const ahead = (5 - dhaka.getUTCDay() + 7) % 7 || 7;
  const friday = new Date(dhaka.getTime() + ahead * 24 * 60 * 60_000);
  const month = friday.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const date = friday.getUTCDate();
  const suffix =
    date % 10 === 1 && date !== 11
      ? "st"
      : date % 10 === 2 && date !== 12
        ? "nd"
        : date % 10 === 3 && date !== 13
          ? "rd"
          : "th";
  return {
    label: new RegExp(`Friday, ${month} ${date}${suffix}, ${friday.getUTCFullYear()}`),
    day: date,
  };
}

test("task 2: the home hero gets a new photo and headline, and the home page shows them", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/website/home");
  await expect(page.getByRole("button", { name: "Drag to reorder: Hero" })).toBeVisible();
  const sheet = page.getByRole("dialog", { name: "Hero" });
  const editHero = page.getByRole("button", { name: "Edit Hero" });
  await whenHydrated(editHero);
  await editHero.click();
  await expect(sheet).toBeVisible();

  // The headline, in the sheet.
  const headline = sheet.getByRole("textbox", { name: "Headline", exact: true });
  await expect(headline).toBeEditable();
  const before = await headline.inputValue();
  const next = `Trips checked by people ${STAMP}`;
  await headline.fill(next);
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByText("Saved. The home page shows it within a few seconds.").first(),
  ).toBeVisible();

  // Everything after the headline save is undone at the end, even when a step fails.
  let photoSaved = false;
  try {
    // The photo: from the sheet to the hero's own photo and video, upload one, and let the photo show.
    // The sheet stays open after a save; reopen it only if it closed.
    if (!(await sheet.isVisible())) await editHero.click();
    await sheet.getByRole("link", { name: "Change photo or video" }).click();
    // Wait for the hero's own editor, not any page with a heading (issue 276).
    await page.waitForURL(/\/content\/mediaSlots\/home-hero/);
    // The hero's Photo field (the video below has a poster photo of its own).
    const field = page.getByRole("group", { name: "Photo (optional)", exact: true });
    const input = field.locator('input[type="file"]').first();
    const preview = field.getByRole("img", { name: "Photo preview" });
    const description = field.getByRole("textbox", { name: "Photo description" });
    await whenHydrated(input);
    const before = (await preview.count()) ? await preview.getAttribute("src") : null;
    await input.setInputFiles({
      name: `hero-${STAMP}.png`,
      mimeType: "image/png",
      buffer: png(2000, 1250, [40, 90, 160]),
    });
    // The upload is done when the field shows the new photo.
    await expect(preview).toBeVisible({ timeout: 60_000 });
    if (before) await expect(preview).not.toHaveAttribute("src", before, { timeout: 60_000 });
    await description.fill(`Boats at the pier at sunrise ${STAMP}`);
    // The hero plays a video when one is set; remove it so the new photo shows. Its button reads "Remove video Video".
    const removeVideo = page.getByRole("button", { name: /^Remove video/ });
    if (await removeVideo.isVisible()) {
      await whenHydrated(removeVideo);
      await removeVideo.click();
      await expect(removeVideo).toBeHidden();
    }
    await saveChanges(page);
    photoSaved = true;

    await expect(async () => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(next, { timeout: 2_000 });
      await expect(
        page.getByRole("img", { name: `Boats at the pier at sunrise ${STAMP}` }),
      ).toBeAttached({ timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
  } finally {
    // Put the video and the headline back.
    if (photoSaved) {
      await page.goto("/secure-admin-control/content/mediaSlots/home-hero");
      await restoreFirstChange(page);
    }
    await page.goto("/secure-admin-control/website/home");
    await expect(page.getByRole("button", { name: "Drag to reorder: Hero" })).toBeVisible();
    await whenHydrated(editHero);
    await editHero.click();
    await expect(sheet.getByRole("textbox", { name: "Headline", exact: true })).toBeEditable();
    await sheet.getByRole("textbox", { name: "Headline", exact: true }).fill(before);
    await sheet.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Saved. The home page shows it within a few seconds.").first(),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("task 8: a banner is scheduled for next Friday and its chip says so", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/content/banners");
  await page.getByRole("table").getByRole("link").first().click();
  await expect(page.getByRole("region", { name: "Save changes" })).toBeVisible();

  // Starts: next Friday, from the calendar, at 10:00 am.
  const { label } = nextFriday();
  const starts = page.locator("#field-startsAt");
  const day = page.getByRole("button", { name: label });
  await expect(async () => {
    await starts.click();
    await expect(page.getByRole("grid").first()).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
  for (let step = 0; step < 2 && !(await day.isVisible()); step += 1)
    await page.getByRole("button", { name: /next month/i }).click();
  await day.click();
  await expect(starts).toContainText(/Fri|\d{1,2} \w{3} \d{4}/);
  await saveChanges(page);

  // The chip says Scheduled and why; the list says it too.
  const status = page.getByRole("region", { name: "Status" });
  await expect(status.getByText(/Scheduled/).first()).toBeVisible();
  try {
    await page.goto("/secure-admin-control/content/banners");
    await expect(page.getByText(/^Scheduled/).first()).toBeAttached();
  } finally {
    await page.goBack();
    await expect(page.getByRole("region", { name: "Save changes" })).toBeVisible();
    await restoreFirstChange(page);
  }
  expect(errors).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`task 12: a customer found by phone shows all their requests and orders (${width} px)`, async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    const tail = `${STAMP}${width === 390 ? "9" : "4"}`.slice(-7);
    const phone = `+880171${tail}`;
    const local = `0171${tail}`;
    const name = `Sample Caller ${tail}`;
    const lead = await intake<{ reference: string }>(request, "leads", {
      contact: { name, phone },
      payload: { module: "contact", topic: "visa", message: "Do you handle Malaysia visas?" },
      consent: true,
    });
    const order = await intake<{ reference: string }>(request, "orders", {
      // A well-stocked toner: the workflow spec needs the few W1510A ones (3 in stock).
      lines: [{ variantId: "bd-cf280a", quantity: 1 }],
      address: {
        name,
        phone,
        division: "Dhaka",
        district: "Dhaka",
        area: "Motijheel",
        street: "House 4, Road 2",
      },
      payment: { method: "cod" },
    });

    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.goto("/secure-admin-control/customers");
    // The number as people say it, without the country code.
    const search = page.getByRole("searchbox", { name: "Name, phone or email" });
    await expect(async () => {
      await search.fill(local);
      await search.press("Enter");
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    const link = page.getByRole("link", { name }).first();
    if (await link.isVisible()) await link.click();
    else {
      await page
        .getByRole("listitem")
        .filter({ hasText: name })
        .getByRole("button")
        .first()
        .click();
      await page.getByRole("dialog").getByRole("link", { name: "Open" }).click();
    }
    await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
    await expect(page.getByText(lead.reference).first()).toBeVisible();
    await expect(page.getByText(order.reference).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("task 13: a wrong price is undone by restoring the version before it", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/content/tourPackages/dubai-city-and-desert");
  await expect(page.getByRole("region", { name: "Save changes" })).toBeVisible();
  const price = page
    .getByRole("group", { name: "Price options" })
    .getByRole("textbox", { name: "Price per person" })
    .first();
  await expect(price).toBeVisible();
  const right = await price.inputValue();
  // The slip: one zero too many.
  await expect(async () => {
    await price.fill(`${right.replace(/\D/g, "")}0`);
    await expect(page.getByText("Unsaved changes")).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
  await saveChanges(page, /^(Update|Save changes)$/);

  // History says what changed in words, and puts the price back.
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByText(/Price per person/).first()).toBeVisible();
  await page.getByRole("button", { name: "Restore the version before this change" }).click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.getByText("The older version is back.").first()).toBeVisible();
  await page.getByRole("tab", { name: "Edit" }).click();
  await expect(
    page
      .getByRole("group", { name: "Price options" })
      .getByRole("textbox", { name: "Price per person" })
      .first(),
  ).toHaveValue(right);
  expect(errors).toEqual([]);
});

import { deflateSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Purpose-built editors (D0 R8, docs/design/ADMIN.md §7): staff tasks 1, 7, 9 and 11 from the epic, done the way a
 * first-time staff member would, with visible, labelled controls only and nothing typed that the system knows (no
 * id, link, date or "price from"). API mode only; every test makes or restores its own data.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
const STAMP = String(Date.now()).slice(-6);

/** A plain PNG of one colour (big enough for every photo frame). */
function png(width: number, height: number, rgb: [number, number, number]): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
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
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const photo = (name: string, rgb: [number, number, number], width = 1800, height = 1200) => ({
  name: `${name}-${STAMP}.png`,
  mimeType: "image/png",
  buffer: png(width, height, rgb),
});

async function signIn(page: Page) {
  signIns += 1;
  // Own test addresses: the API allows 5 sign-ins per address in 15 minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${150 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/** Opens a new record's editor once React has hydrated it (the first field's counter follows the typing). */
async function newRecord(page: Page, key: string, heading: string, first: string, value: string) {
  await page.goto(`/secure-admin-control/content/${key}/new`);
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  const box = page.getByRole("textbox", { name: first, exact: true });
  await expect(async () => {
    await box.fill(value);
    await expect(page.getByText(`${value.length} of `).first()).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

/** Gives files to a drop zone and waits until they have uploaded (the zone listens once hydrated). */
async function upload(zone: Locator, files: ReturnType<typeof photo>[], done: Locator) {
  const input = zone.locator('input[type="file"]').first();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await input.setInputFiles(files);
    if (
      await done.waitFor({ timeout: 45_000 }).then(
        () => true,
        () => false,
      )
    )
      return;
  }
  await expect(done).toBeVisible();
}

/** Picks the first choice of a searchable picker. */
async function pickFirst(page: Page, picker: Locator) {
  await picker.click();
  await page.getByRole("option").first().click();
  await expect(picker).not.toHaveText(/^Choose/);
}

test("task 1: a tour package with 5 photos, 3 days and 2 prices is published", async ({ page }) => {
  test.setTimeout(300_000);
  const errors = collectErrors(page);
  await signIn(page);
  const name = `Sylhet tea trail ${STAMP}`;
  await newRecord(page, "tourPackages", "New tour package", "Package name", name);

  // Basics: words, where it goes, what kind of trip. The link follows the name by itself.
  await page
    .getByRole("textbox", { name: "Summary" })
    .fill("Three days among tea gardens, lakes and hills.");
  await page.getByRole("textbox", { name: "Places line" }).fill("Sylhet · Srimangal");
  await pickFirst(page, page.getByRole("combobox", { name: "Destination" }));
  const countries = page.getByRole("textbox", { name: "Countries" });
  await countries.fill("Bangladesh");
  await countries.press("Enter");
  await page.getByRole("button", { name: "In Bangladesh" }).click();

  // Photos: a cover, then four more at once.
  await page.getByRole("button", { name: "Next: Photos and video" }).click();
  const cover = page.getByRole("group", { name: "Cover photo" });
  await upload(cover, [photo("cover", [20, 110, 60])], cover.getByText(/1800 × 1200 px/));
  const more = page.getByRole("group", { name: /^More photos/ });
  await upload(
    more,
    [
      photo("tea", [40, 140, 70]),
      photo("lake", [30, 90, 160]),
      photo("hill", [90, 120, 60]),
      photo("rest", [150, 120, 80]),
    ],
    more.getByRole("listitem").nth(3),
  );
  await expect(page.getByRole("list", { name: "Uploads" })).toHaveCount(0, { timeout: 90_000 });
  await expect(more.getByRole("listitem")).toHaveCount(4);

  // Three days: each new card opens ready to fill.
  const days = page.getByRole("group", { name: "Day by day" });
  for (const [title, plan] of [
    ["Dhaka to Sylhet", "Morning flight, tea garden walk in the afternoon."],
    ["Srimangal", "Lawachara forest and a seven-layer tea."],
    ["Back to Dhaka", "Ratargul swamp forest, then the evening flight."],
  ] as const) {
    await days.getByRole("button", { name: "Add day" }).click();
    const card = days.getByRole("listitem").last();
    await card.getByRole("textbox", { name: "Day title" }).fill(title);
    await card.getByRole("textbox", { name: "Plan for the day" }).fill(plan);
  }

  // Two prices; the card's "price from" is the lowest, worked out on save.
  const prices = page.getByRole("group", { name: "Price options" });
  for (const [sharing, label, detail, amount] of [
    ["Twin sharing", "Twin sharing", "Per person, two in a room", "18500"],
    ["Single room", "Single room", "Per person, own room", "24900"],
  ] as const) {
    await prices.getByRole("button", { name: "Add price" }).click();
    const card = prices.getByRole("listitem").last();
    await card.getByRole("radio", { name: sharing }).click();
    await card.getByRole("textbox", { name: "Name shown" }).fill(label);
    await card.getByRole("textbox", { name: "Detail" }).fill(detail);
    await card.getByRole("textbox", { name: "Price per person" }).fill(amount);
  }
  await page.getByRole("spinbutton", { name: "Nights" }).fill("2");

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Published. It's live on the site.").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page).not.toHaveURL(/\/new$/);

  // On the site, priced from the lowest option.
  const slug = page.url().split("/").pop() ?? "";
  await expect(async () => {
    await page.goto(`/tour-packages/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 45_000 });
  await expect(page.getByText("৳18,500").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("task 7: a product with 2 variants and stock is published", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await signIn(page);
  const name = `Office toner pack ${STAMP}`;
  await newRecord(page, "products", "New product", "Product name", name);
  await page.getByRole("textbox", { name: "Short name" }).fill(`Toner ${STAMP}`);
  await pickFirst(page, page.getByRole("combobox", { name: "Brand" }));
  await pickFirst(page, page.getByRole("combobox", { name: "Category" }));
  const description = page.getByRole("group", { name: "Description" });
  await description.getByRole("button", { name: "Add" }).click();
  await description
    .getByRole("textbox")
    .last()
    .fill("Sharp black text for everyday office printing.");

  const photos = page.getByRole("group", { name: "Photos" });
  await upload(
    photos,
    [photo("toner", [30, 30, 30], 1200, 1200)],
    photos.getByRole("listitem").first(),
  );
  await expect(page.getByRole("list", { name: "Uploads" })).toHaveCount(0, { timeout: 90_000 });

  // One option with two values; every mix becomes a row of the matrix.
  const options = page.getByRole("group", { name: /^Options/ });
  await options.getByRole("button", { name: "Add option" }).click();
  const option = options.getByRole("listitem").first();
  await option.getByRole("textbox", { name: "Option name" }).fill("Colour");
  await option.getByRole("radio", { name: "Buttons" }).click();
  const values = option.getByRole("group", { name: "Values" });
  for (const value of ["Black", "Cyan"]) {
    await values.getByRole("button", { name: "Add value" }).click();
    await values.getByRole("listitem").last().getByRole("textbox", { name: "Value" }).fill(value);
  }

  const matrix = page.getByRole("group", { name: "Variants you sell" });
  for (const [colour, price, stock] of [
    ["Black", "2150", "12"],
    ["Cyan", "2450", "5"],
  ] as const) {
    const row = matrix.getByRole("group", { name: colour });
    await row.getByRole("checkbox", { name: `Sell ${colour}` }).check();
    await row.getByRole("textbox", { name: "Price", exact: true }).fill(price);
    await row.getByRole("textbox", { name: "In stock" }).fill(stock);
  }
  // A stock code is suggested from the short name; the first row sold is shown first.
  await expect(
    matrix.getByRole("group", { name: "Black" }).getByRole("textbox", { name: "Stock code" }),
  ).toHaveValue(new RegExp(`^TONER-${STAMP}-BLACK$`));
  await matrix.getByRole("radio", { name: "Show Cyan first" }).check();

  const warranty = page.getByRole("group", { name: "Warranty" });
  await warranty.getByRole("textbox", { name: "Warranty, in short" }).fill("6 months replacement");
  await warranty.getByRole("textbox", { name: "Returns, in short" }).fill("7-day easy returns");

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Published. It's live on the site.").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page).not.toHaveURL(/\/new$/);
  // Saved as two variants with their stock, Cyan first.
  await page.reload();
  const saved = page.getByRole("group", { name: "Variants you sell" });
  await expect(
    saved.getByRole("group", { name: "Cyan" }).getByRole("textbox", { name: "In stock" }),
  ).toHaveValue("5");
  await expect(saved.getByRole("radio", { name: "Show Cyan first" })).toBeChecked();
  expect(errors).toEqual([]);
});

test("task 9: a team member is added with a photo", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await signIn(page);
  const name = `Nusrat Jahan ${STAMP}`;
  await newRecord(page, "team", "New team member", "Name", name);
  await page.getByRole("textbox", { name: "Job title" }).fill("Visa specialist");
  await page.getByRole("textbox", { name: "Department" }).fill("Visa desk");
  // Initials are made from the name; the photo goes in the same screen.
  await expect(page.getByRole("textbox", { name: "Initials" })).toHaveCount(0);
  const field = page.getByRole("group", { name: "Drop a photo here or paste one" }).first();
  await upload(
    field,
    [photo("nusrat", [200, 160, 130], 1200, 1500)],
    page.getByRole("textbox", { name: "Photo description" }),
  );
  await expect(page.getByRole("textbox", { name: "Photo description" })).toHaveValue(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Created.").first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/new$/);

  await expect(async () => {
    await page.goto("/about-us");
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 45_000 });
  expect(errors).toEqual([]);
});

test("task 11: a Sample visa country gets real fees and documents", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/content/visaCountries?q=Malaysia");
  await page
    .getByRole("table")
    .getByRole("link", { name: /Malaysia/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1, name: /Malaysia/ })).toBeVisible();
  await expect(page.getByText("Sample", { exact: true }).first()).toBeVisible();

  const types = page.getByRole("group", { name: "Visa types" });
  const first = types.getByRole("listitem").first();
  if (
    await first
      .getByRole("button", { name: /Expand$/ })
      .first()
      .isVisible()
  )
    await first
      .getByRole("button", { name: /Expand$/ })
      .first()
      .click();
  const fees = `${STAMP}`.slice(-3);
  await expect(async () => {
    await first.getByRole("textbox", { name: "Embassy fee", exact: true }).fill(`4${fees}`);
    await expect(first.getByRole("textbox", { name: "Embassy fee", exact: true })).toHaveValue(
      new RegExp(`^4,?${fees}$`),
      {
        timeout: 1_500,
      },
    );
  }).toPass({ timeout: 30_000 });
  await first.getByRole("textbox", { name: "Our service charge", exact: true }).fill("1500");
  // Malaysia has no price range yet: staff add one.
  await first.getByRole("button", { name: "Add Total price range" }).click();
  await first.getByRole("textbox", { name: "From", exact: true }).fill("6500");
  await first.getByRole("textbox", { name: /^Up to/ }).fill("8500");
  const documents = first.getByRole("group", { name: "Documents" });
  await documents.getByRole("button", { name: "Add document" }).click();
  const added = documents.getByRole("listitem").last();
  await added
    .getByRole("textbox", { name: "Document" })
    .fill(`Bank statement, last 6 months ${STAMP}`);
  await added
    .getByRole("textbox", { name: "Detail" })
    .fill("Stamped by the bank, with a balance of at least ৳1,50,000.");

  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByText("It's no longer marked as sample content.").first()).toBeVisible();
  await expect(page.getByText("Updated on the site.").first()).toBeVisible();

  await expect(async () => {
    await page.goto("/visa/malaysia");
    await expect(page.getByText(`Bank statement, last 6 months ${STAMP}`).first()).toBeAttached({
      timeout: 2_000,
    });
  }).toPass({ timeout: 45_000 });
  expect(errors).toEqual([]);
});

for (const width of [768, 1440]) {
  test(`the six new editors pass axe and ask for every choice at ${width} px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    for (const key of [
      "tourPackages",
      "products",
      "visaCountries",
      "blogPosts",
      "groupFares",
      "team",
    ]) {
      await page.goto(`/secure-admin-control/content/${key}/new`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(scroll, `${key} scrolls sideways at ${width} px`).toBeLessThanOrEqual(0);
      // Empty pickers ask for a choice; they never say a pick was not found.
      await expect(page.getByText(/^Not found:/)).toHaveCount(0);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, key).toEqual([]);
      await page.screenshot({
        path: `test-results/admin-shots/editor-${key}-${width}.png`,
        fullPage: true,
      });
    }
  });
}

import { randomFillSync } from "node:crypto";
import { deflateSync } from "node:zlib";
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectErrors } from "./errors";

/*
 * Media (D0 R3, docs/design/ADMIN.md §5.7 and §11): uploads in the library and in photo fields, the library picker,
 * crop and focal point, a gallery of photos, Replace everywhere and the delete guard. Every file is made by the test
 * (rerun-safe), and seeded records are never saved. API mode only.
 */
const API = process.env.WAAFA_API_URL ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
const STAMP = String(Date.now()).slice(-6);

/** A PNG from raw scanlines (a filter byte, then RGB, per row). */
function pngOf(width: number, height: number, raw: Buffer, level: number): Buffer {
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
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** A solid-colour PNG of the given size (a real photo is not needed to test the library). */
function png(width: number, height: number, rgb: [number, number, number]): Buffer {
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x += 1) row.set(rgb, 1 + x * 3);
  return pngOf(width, height, Buffer.concat(Array.from({ length: height }, () => row)), 9);
}

/** A PNG of random pixels: it barely compresses, so 1950 px square is about 11 MB. */
function noisePng(width: number, height: number): Buffer {
  const raw = randomFillSync(Buffer.alloc((1 + width * 3) * height));
  for (let y = 0; y < height; y += 1) raw[y * (1 + width * 3)] = 0;
  return pngOf(width, height, raw, 1);
}

/** An MP4 header the library reads (ftyp, then a 1280 x 720 track header) padded to the given size. */
function mp4(bytes: number): Buffer {
  const box = Buffer.alloc(92);
  box.writeUInt32BE(92, 0);
  box.write("tkhd", 4, "ascii");
  box.writeUInt32BE(1280 * 65536, 84);
  box.writeUInt32BE(720 * 65536, 88);
  const head = Buffer.concat([
    Buffer.from([0, 0, 0, 16]),
    Buffer.from("ftypisom", "ascii"),
    Buffer.alloc(4),
    box,
  ]);
  return Buffer.concat([head, Buffer.alloc(bytes - head.length, 7)]);
}

const photo = (name: string, rgb: [number, number, number], width = 1800, height = 1200) => ({
  name,
  mimeType: "image/png",
  buffer: png(width, height, rgb),
});

/** Clicks or keys only work once React has hydrated the page: retry the gesture until its result shows. */
async function until(gesture: () => Promise<unknown>, shown: Locator) {
  await expect(async () => {
    await gesture();
    await expect(shown).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function signIn(page: Page) {
  signIns += 1;
  // Own test addresses: the API allows 5 sign-ins per address in 15 minutes.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${200 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/**
 * Gives files to a drop zone's input and waits for their result. The zone listens once React has hydrated, so the
 * files go again only if nothing happened (an upload takes seconds; a quick retry would cancel it).
 */
async function attach(input: Locator, files: ReturnType<typeof photo>[], shown: Locator) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await input.setInputFiles(files);
    if (
      await shown.waitFor({ timeout: 20_000 }).then(
        () => true,
        () => false,
      )
    )
      return;
  }
  await expect(shown).toBeVisible();
}

/** Uploads files on the library page and waits for the list to show them. */
async function uploadToLibrary(page: Page, files: ReturnType<typeof photo>[]) {
  await page.goto(`/secure-admin-control/media?q=${STAMP}`);
  const zone = page.getByRole("group", { name: "Drop photos or videos here, or paste them" });
  await expect(zone).toBeVisible();
  await attach(zone.locator('input[type="file"]'), files, page.getByText(/files? added/).first());
  await expect(page.getByRole("list", { name: "Uploads" })).toHaveCount(0, { timeout: 90_000 });
  await page.reload();
}

/** A team member only this test sees (hidden from the site), to show a library photo somewhere. */
async function newTeamMember(page: Page, name: string) {
  await page.goto("/secure-admin-control/content/team/new");
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toBeEditable();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Initials", exact: true }).fill("MT");
  await page.getByRole("textbox", { name: "Job title", exact: true }).fill("Media tester");
  await page.getByRole("textbox", { name: "Department", exact: true }).fill("Quality");
}

test("photos uploaded in the library get their own words, and an unused one can be deleted", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await uploadToLibrary(page, [photo(`e2e-lib-${STAMP}.png`, [20, 90, 200])]);

  const tile = page.getByRole("button", { name: new RegExp(`E2e lib ${STAMP}`) }).first();
  await expect(tile).toBeVisible();
  await expect(tile).toContainText("1800 × 1200");
  await expect(tile).toContainText("Not used");

  await until(() => tile.click(), page.getByRole("dialog", { name: `E2e lib ${STAMP}` }));
  const sheet = page.getByRole("dialog", { name: `E2e lib ${STAMP}` });
  await expect(sheet.getByText("Not shown anywhere yet.")).toBeVisible();
  await sheet.getByLabel("Description").fill(`Blue test photo ${STAMP}`);
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved", { exact: true }).first()).toBeVisible();

  // A file nothing shows can go; the list no longer has it.
  await sheet.getByRole("button", { name: "Delete file" }).click();
  const confirm = page.getByRole("alertdialog", { name: "Delete this file?" });
  await confirm.getByRole("button", { name: "Delete file" }).click();
  await expect(page.getByText("File deleted").first()).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: new RegExp(`Blue test photo ${STAMP}`) }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("an 11 MB photo and a 12 MB video stream through to the library", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await signIn(page);
  // Next copies the body of requests its proxy sees and keeps only 10 MB: uploads must stream past it.
  await uploadToLibrary(page, [
    { name: `e2e-big-${STAMP}.png`, mimeType: "image/png", buffer: noisePng(1950, 1950) },
    { name: `e2e-clip-${STAMP}.mp4`, mimeType: "video/mp4", buffer: mp4(12 * 1024 * 1024) },
  ]);
  await expect(
    page.getByRole("button", { name: new RegExp(`E2e big ${STAMP}`) }).first(),
  ).toContainText("1950 × 1950");
  await expect(
    page.getByRole("button", { name: new RegExp(`E2e clip ${STAMP}`) }).first(),
  ).toContainText("12 MB");
  expect(errors).toEqual([]);
});

test("a photo chosen from the library shows where it is used, and Replace everywhere swaps it", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await signIn(page);
  await uploadToLibrary(page, [
    photo(`e2e-first-${STAMP}.png`, [200, 60, 40]),
    photo(`e2e-second-${STAMP}.png`, [40, 160, 90]),
  ]);

  // The photo field of a new team member: Choose from library, find it by its words, tick it.
  const member = `Media test ${STAMP}`;
  await newTeamMember(page, member);
  await page.getByRole("button", { name: "Choose from library" }).click();
  const picker = page.getByRole("dialog", { name: "Choose a photo" });
  await picker
    .getByRole("searchbox", { name: "Search by words or file name" })
    .fill(`first ${STAMP}`);
  await picker
    .getByRole("button", { name: new RegExp(`E2e first ${STAMP}`) })
    .first()
    .click();
  await picker.getByRole("button", { name: "Choose", exact: true }).click();
  await expect(picker).toBeHidden();
  // Drawn in the team card's frame with its minimum width; the description comes from the library.
  await expect(page.getByText("4:5, at least 600 px wide · 1800 × 1200 px")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Photo description" })).toHaveValue(
    `E2e first ${STAMP}`,
  );
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Created.").first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/new$/);

  // The library knows where the photo shows, so it can't be deleted from there.
  await page.goto(`/secure-admin-control/media?q=first-${STAMP}`);
  await page
    .getByRole("button", { name: new RegExp(`E2e first ${STAMP}`) })
    .first()
    .click();
  const sheet = page.getByRole("dialog", { name: `E2e first ${STAMP}` });
  await expect(sheet.getByRole("link", { name: new RegExp(member) })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Delete file" })).toBeDisabled();
  await expect(
    sheet.getByText("Shown in 1 place: replace it there first, then delete it."),
  ).toBeVisible();

  // Replace everywhere: the second photo takes its place.
  await sheet.getByRole("button", { name: "Choose a replacement" }).click();
  const replacing = page.getByRole("dialog", { name: "Choose a photo" });
  await replacing.getByRole("searchbox").fill(`second ${STAMP}`);
  await replacing
    .getByRole("button", { name: new RegExp(`E2e second ${STAMP}`) })
    .first()
    .click();
  await replacing.getByRole("button", { name: "Choose", exact: true }).click();
  const confirm = page.getByRole("alertdialog", { name: "Replace it in 1 place?" });
  await confirm.getByRole("button", { name: "Replace" }).click();
  await expect(page.getByText("Replaced in 1 place").first()).toBeVisible();
  await expect(sheet.getByText("Not shown anywhere yet.")).toBeVisible();

  // The member now shows the second photo, and the first can be deleted.
  await page.goto(`/secure-admin-control/media?q=second-${STAMP}`);
  await page
    .getByRole("button", { name: new RegExp(`E2e second ${STAMP}`) })
    .first()
    .click();
  await expect(
    page
      .getByRole("dialog", { name: `E2e second ${STAMP}` })
      .getByRole("link", { name: new RegExp(member) }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a photo uploaded in its field is cropped to the frame and keeps a focal point", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await signIn(page);
  await newTeamMember(page, `Crop test ${STAMP}`);

  // Upload straight into the field (the record's name becomes the first description).
  const field = page.getByRole("group", { name: "Drop a photo here or paste one" });
  await attach(
    field.locator('input[type="file"]'),
    [photo(`e2e-crop-${STAMP}.png`, [230, 170, 30])],
    page.getByText("4:5, at least 600 px wide · 1800 × 1200 px"),
  );
  await expect(page.getByRole("textbox", { name: "Photo description" })).toHaveValue(
    `Crop test ${STAMP}`,
  );

  // Crop to the 4:5 frame: saved as a new library photo, the field takes it.
  await page.getByRole("button", { name: "Crop", exact: true }).click();
  const crop = page.getByRole("dialog", { name: "Crop photo" });
  await expect(crop.getByText(/The crop is \d+ × \d+ px\./)).toBeVisible();
  await crop.getByRole("button", { name: "Save crop" }).click();
  await expect(page.getByText("Cropped photo saved").first()).toBeVisible();
  await expect(page.getByText(/4:5, at least 600 px wide · 960 × 1200 px/)).toBeVisible();

  // Focal point by keyboard: two steps left.
  await page.getByRole("button", { name: "Focal point", exact: true }).click();
  const focal = page.getByRole("dialog", { name: "Focal point" });
  const marker = focal.getByRole("button", { name: /^Focal point, 50% across/ });
  await marker.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(
    focal.getByRole("button", { name: "Focal point, 40% across and 50% down" }),
  ).toBeVisible();
  await focal.getByRole("button", { name: "Use this point" }).click();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Created.").first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/new$/);

  // Saved with the record: the point is still there after a reload.
  await page.reload();
  await page.getByRole("button", { name: "Focal point", exact: true }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Focal point" })
      .getByRole("button", { name: "Focal point, 40% across and 50% down" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a gallery takes several photos at once and any of them can become the cover", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/content/products");
  await page
    .getByRole("link", { name: /^Edit / })
    .first()
    .click();
  const gallery = page.getByRole("group", { name: "Photos", exact: true });
  await expect(gallery).toBeVisible();
  const before = await gallery.getByRole("button", { name: /^Actions for Photo / }).count();

  await gallery
    .getByRole("group", { name: /^Drop (more )?photos here/ })
    .locator('input[type="file"]')
    .setInputFiles([
      photo(`e2e-g1-${STAMP}.png`, [10, 10, 10], 1200, 1200),
      photo(`e2e-g2-${STAMP}.png`, [250, 250, 250], 1200, 1200),
    ]);
  await expect(gallery.getByRole("button", { name: /^Actions for Photo / })).toHaveCount(
    before + 2,
    {
      timeout: 45_000,
    },
  );
  // Square store frame: 1200 px is wide enough, so no warning on the new photos.
  await expect(
    gallery.getByRole("button", { name: new RegExp(`^Edit: Photo ${before + 2}\\b`) }),
  ).not.toContainText("Only");

  // The last photo becomes the cover.
  await gallery.getByRole("button", { name: `Actions for Photo ${before + 2}` }).click();
  await page.getByRole("menuitem", { name: "Make cover" }).click();
  await expect(gallery.getByText("Cover")).toHaveCount(1);
  await expect(page.getByText("Unsaved changes")).toBeVisible();

  // Seeded products stay as they were.
  await page.getByRole("button", { name: "Discard changes" }).click();
  const discard = page.getByRole("alertdialog");
  if (await discard.isVisible().catch(() => false))
    await discard.getByRole("button", { name: /Discard/ }).click();
  await expect(page.getByText("All changes saved")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`the media library passes axe at ${width} px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.goto("/secure-admin-control/media");
    await expect(page.getByRole("heading", { level: 1, name: "Media library" })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

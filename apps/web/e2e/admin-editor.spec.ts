import { randomUUID } from "node:crypto";
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectErrors } from "./errors";

/*
 * Form engine v2 (D0 R2, docs/design/ADMIN.md §7 and §9): the sectioned editor with plain labels, the sticky action
 * bar and Ctrl S, History with restore, the draft kept on this device, the unsaved-changes guard, the edit-conflict
 * dialog, Duplicate and the labelled lead facts. Uses only visible, labelled controls. API mode only.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

let signIns = 0;
const STAMP = String(Date.now()).slice(-6);

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
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${170 + signIns}` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/** Opens an FAQ: the first in the list, or one by id that no other spec edits (History tests need a clean story). */
async function openFirstFaq(page: Page, id?: string) {
  if (id) await page.goto(`/secure-admin-control/content/faqs/${id}`);
  else {
    await page.goto("/secure-admin-control/content/faqs");
    // The table names each record as a link to its editor; a phone card opens the sheet, whose Open goes there (D0 R5).
    const link = page.getByRole("table").getByRole("link").first();
    const card = page.getByRole("main").getByRole("listitem").getByRole("button").first();
    await expect(link.or(card)).toBeVisible();
    if (await link.isVisible()) await link.click();
    else {
      await card.click();
      await page.getByRole("dialog").getByRole("link", { name: "Open" }).click();
    }
  }
  await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
  // The editor is interactive once its words and widgets are hydrated.
  await expect(page.getByRole("textbox", { name: "Answer", exact: true })).toBeEditable();
}

test("a question is edited in plain words, saved with Ctrl S, and History brings the old answer back", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await signIn(page);
  // Its own question: api-mode.spec edits the first one before this file runs in CI.
  await openFirstFaq(page, "faq-change-cancel");

  // Plain labels, no ids, no JSON tab.
  for (const label of ["Category", "Question", "Answer"])
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: /json/i })).toHaveCount(0);
  await expect(page.getByLabel(/\bid\b/i)).toHaveCount(0);

  const answer = page.getByRole("textbox", { name: "Answer", exact: true });
  const original = await answer.inputValue();
  await answer.fill(`${original} Sample one ${STAMP}.`);
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await until(() => page.keyboard.press("Control+s"), page.getByText("Saved.").first());
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page
    .getByRole("textbox", { name: "Answer", exact: true })
    .fill(`${original} Sample two ${STAMP}.`);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByText("Answer edited").first()).toBeVisible();
  await expect(page.getByText("Current version", { exact: true })).toBeVisible();
  // Restore the first save (the version before the newest one).
  await page.getByRole("button", { name: "Restore this version" }).first().click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.getByText("The older version is back.")).toBeVisible();
  await page.getByRole("tab", { name: "Edit" }).click();
  await expect(page.getByRole("textbox", { name: "Answer", exact: true })).toHaveValue(
    `${original} Sample one ${STAMP}.`,
  );
  await expect(page.getByText("The older version is back.")).toBeHidden({ timeout: 10_000 });

  // Undo the very first change too: back to the answer the page had before this test.
  await page.getByRole("tab", { name: "History" }).click();
  await page.getByRole("button", { name: "Restore the version before this change" }).click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.getByText("The older version is back.")).toBeVisible();
  await page.getByRole("tab", { name: "Edit" }).click();
  await expect(page.getByRole("textbox", { name: "Answer", exact: true })).toHaveValue(original);
  expect(errors).toEqual([]);
});

test("typed work survives a reload, and leaving with unsaved changes asks first", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signIn(page);
  await openFirstFaq(page);
  const question = page.getByRole("textbox", { name: "Question", exact: true });
  const original = await question.inputValue();
  await question.fill(`${original} (draft ${STAMP})`);
  // The draft is kept on this device a moment after typing stops.
  await expect(page.getByText(/Kept on this device/)).toBeVisible({ timeout: 10_000 });

  // Leaving through the menu asks first; Stay keeps everything.
  await page
    .getByRole("link", { name: /^Dashboard/ })
    .first()
    .click();
  await expect(page.getByRole("alertdialog", { name: "Leave without saving?" })).toBeVisible();
  await page.getByRole("button", { name: "Stay" }).click();
  await expect(page.getByRole("textbox", { name: "Question", exact: true })).toHaveValue(
    `${original} (draft ${STAMP})`,
  );

  // Leave keeps the work on this device, as the dialog promises.
  await page
    .getByRole("link", { name: /^Dashboard/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
  await openFirstFaq(page);
  await expect(page.getByText(/are on this device\.$/)).toBeVisible();

  // Ignoring the offer doesn't lose it: a reload offers the draft again.
  await page.reload();
  await expect(page.getByText(/are on this device\.$/)).toBeVisible();
  await page.getByRole("button", { name: "Restore them" }).click();
  await expect(page.getByRole("textbox", { name: "Question", exact: true })).toHaveValue(
    `${original} (draft ${STAMP})`,
  );
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByRole("textbox", { name: "Question", exact: true })).toHaveValue(original);
});

test("a save after someone else's shows who saved first, and nothing is overwritten silently", async ({
  browser,
}: {
  browser: Browser;
}) => {
  test.setTimeout(150_000);
  const first = await browser.newPage();
  const second = await browser.newPage();
  await signIn(first);
  await signIn(second);
  await openFirstFaq(first);
  await openFirstFaq(second);
  const original = await first.getByRole("textbox", { name: "Answer", exact: true }).inputValue();

  await first
    .getByRole("textbox", { name: "Answer", exact: true })
    .fill(`${original} First ${STAMP}.`);
  await first.getByRole("button", { name: "Save changes" }).click();
  await expect(first.getByText("All changes saved")).toBeVisible();

  await second
    .getByRole("textbox", { name: "Answer", exact: true })
    .fill(`${original} Second ${STAMP}.`);
  await second.getByRole("button", { name: "Save changes" }).click();
  const dialog = second.getByRole("alertdialog", { name: /saved this/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Save mine over theirs" }).click();
  await expect(second.getByText("All changes saved")).toBeVisible();

  // Put the answer back for the next run.
  await second.getByRole("textbox", { name: "Answer", exact: true }).fill(original);
  await second.getByRole("button", { name: "Save changes" }).click();
  await expect(second.getByText("All changes saved")).toBeVisible();
  await first.close();
  await second.close();
});

test("a new question starts plain, misses are explained, and Duplicate makes a hidden copy", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signIn(page);
  await page.goto("/secure-admin-control/content/faqs/new");
  await expect(page.getByRole("heading", { level: 1, name: "New question" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Answer", exact: true })).toBeEditable();

  // Saving with empty fields says what to fix, with links to the fields.
  await page.getByRole("button", { name: "Create" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /fields? needs? attention/ }),
  ).toBeVisible();

  // Seven categories: a list to pick from.
  await page.getByLabel("Category").click();
  await page.getByRole("option", { name: "Visa", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Question", exact: true })
    .fill(`Sample: do you help with transit visas? ${STAMP}`);
  await page
    .getByRole("textbox", { name: "Answer", exact: true })
    .fill("Yes. Tell us your route and we will check what you need.");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
  await expect(page.getByText("Created.").first()).toBeVisible();

  await page.getByRole("button", { name: "Duplicate" }).first().click();
  await expect(page.getByText("A copy was saved as a draft.")).toBeVisible();
});

test("picking an airline fills in its name too, and the version before comes back", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await signIn(page);
  await page.goto("/secure-admin-control/content/baggageRules");
  await page.getByRole("table").getByRole("link").first().click();
  await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
  const heading = page.getByRole("heading", { level: 1 });
  const headingBefore = (await heading.innerText()).trim();
  const picker = page.getByRole("combobox", { name: "Airline" });
  const before = (await picker.innerText()).trim();
  await until(() => picker.click(), page.getByPlaceholder("Search airlines"));
  const options = page.getByRole("option");
  // The choices load when the picker opens.
  await expect(options.first()).toBeVisible();
  let chosen = "";
  for (let index = 0; index < (await options.count()); index += 1) {
    // An option shows the logo's initials, the airline's name and maybe a Sample badge: the name is the longest.
    const name =
      (await options.nth(index).innerText())
        .split("\n")
        .map((part) => part.trim())
        .sort((a, b) => b.length - a.length)[0] ?? "";
    if (name && !before.includes(name)) {
      chosen = name;
      await options.nth(index).click();
      break;
    }
  }
  expect(chosen).not.toBe("");
  await until(() => page.keyboard.press("Control+s"), page.getByText("Saved.").first());
  // The record is named after its airline: the picker filled the name in the same change.
  await expect(heading).toContainText(chosen);
  await expect(picker).toContainText(chosen);

  await page.getByRole("tab", { name: "History" }).click();
  await page.getByRole("button", { name: "Restore the version before this change" }).click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.getByText("The older version is back.")).toBeVisible();
  // Code and name come back together.
  await expect(heading).toHaveText(headingBefore);
  await page.getByRole("tab", { name: "Edit" }).click();
  await expect(picker).not.toContainText(chosen);
  expect(errors).toEqual([]);
});

test("the lead page shows the request as labelled facts, not data", async ({ page, request }) => {
  test.setTimeout(90_000);
  // Its own request: Playwright runs this file first (files go in name order), before any spec leaves a lead.
  const tail = String(Date.now()).slice(-6);
  const date = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const response = await request.post(`${API}/api/v1/public/leads`, {
    headers: {
      "x-intake-key": INTAKE_KEY,
      "x-client-ip": `10.78.0.${Number(tail) % 200}`,
      "idempotency-key": randomUUID(),
    },
    data: {
      contact: { name: `Sample Facts Person ${tail}`, phone: `+8801700${tail}` },
      payload: {
        module: "flights",
        search: {
          tripType: "one-way",
          legs: [{ from: "DAC", to: "DXB", date }],
          travellers: { adults: 2, childAges: [], infants: 0 },
          cabin: "economy",
        },
      },
      consent: true,
    },
  });
  expect(response.status()).toBe(201);
  const { reference } = (await response.json()) as { reference: string };

  await signIn(page);
  await page.goto(`/secure-admin-control/leads?q=${reference}`);
  await page.getByRole("table").getByRole("link").first().click();
  await expect(page.getByRole("heading", { name: "What they asked for" })).toBeVisible();
  await expect(page.getByText(/Dhaka \(DAC\)/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /raw|json/i })).toHaveCount(0);
  await expect(page.locator("pre")).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`the editor passes axe at ${width} px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await openFirstFaq(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });
}

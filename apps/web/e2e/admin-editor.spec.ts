import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectErrors } from "./errors";

/*
 * Form engine v2 (D0 R2, docs/design/ADMIN.md §7 and §9): the sectioned editor with plain labels, the sticky action
 * bar and Ctrl S, History with restore, the draft kept on this device, the unsaved-changes guard, the edit-conflict
 * dialog, Duplicate and the labelled lead facts. Uses only visible, labelled controls. API mode only.
 */
const API = process.env.WAAFA_API_URL ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
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

async function openFirstFaq(page: Page) {
  await page.goto("/secure-admin-control/content/faqs");
  await page
    .getByRole("link", { name: /^Edit / })
    .first()
    .click();
  await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
  // The editor is interactive once its words and widgets are hydrated.
  await expect(page.getByLabel("Answer")).toBeEditable();
}

test("a question is edited in plain words, saved with Ctrl S, and History brings the old answer back", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await signIn(page);
  await openFirstFaq(page);

  // Plain labels, no ids, no JSON tab.
  for (const label of ["Category", "Question", "Answer"])
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: /json/i })).toHaveCount(0);
  await expect(page.getByLabel(/\bid\b/i)).toHaveCount(0);

  const answer = page.getByLabel("Answer");
  const original = await answer.inputValue();
  await answer.fill(`${original} Sample one ${STAMP}.`);
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await until(() => page.keyboard.press("Control+s"), page.getByText("Saved.").first());
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.getByLabel("Answer").fill(`${original} Sample two ${STAMP}.`);
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
  await expect(page.getByLabel("Answer")).toHaveValue(`${original} Sample one ${STAMP}.`);

  // Undo the very first change too: back to the answer the page had before this test.
  await page.getByRole("tab", { name: "History" }).click();
  await page.getByRole("button", { name: "Restore the version before this change" }).click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.getByText("The older version is back.")).toBeVisible();
  await page.getByRole("tab", { name: "Edit" }).click();
  await expect(page.getByLabel("Answer")).toHaveValue(original);
  expect(errors).toEqual([]);
});

test("typed work survives a reload, and leaving with unsaved changes asks first", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signIn(page);
  await openFirstFaq(page);
  const question = page.getByLabel("Question");
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
  await expect(page.getByLabel("Question")).toHaveValue(`${original} (draft ${STAMP})`);

  // A reload offers the draft back.
  page.once("dialog", (dialog) => void dialog.accept());
  await page.reload();
  await expect(page.getByText(/are on this device\.$/)).toBeVisible();
  await page.getByRole("button", { name: "Restore them" }).click();
  await expect(page.getByLabel("Question")).toHaveValue(`${original} (draft ${STAMP})`);
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByLabel("Question")).toHaveValue(original);
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
  const original = await first.getByLabel("Answer").inputValue();

  await first.getByLabel("Answer").fill(`${original} First ${STAMP}.`);
  await first.getByRole("button", { name: "Save changes" }).click();
  await expect(first.getByText("All changes saved")).toBeVisible();

  await second.getByLabel("Answer").fill(`${original} Second ${STAMP}.`);
  await second.getByRole("button", { name: "Save changes" }).click();
  const dialog = second.getByRole("alertdialog", { name: /saved this/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Save mine over theirs" }).click();
  await expect(second.getByText("All changes saved")).toBeVisible();

  // Put the answer back for the next run.
  await second.getByLabel("Answer").fill(original);
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
  await expect(page.getByLabel("Answer")).toBeEditable();

  // Saving with empty fields says what to fix, with links to the fields.
  await page.getByRole("button", { name: "Create" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /fields? needs? attention/ }),
  ).toBeVisible();

  // Seven categories: a list to pick from.
  await page.getByLabel("Category").click();
  await page.getByRole("option", { name: "Visa", exact: true }).click();
  await page.getByLabel("Question").fill(`Sample: do you help with transit visas? ${STAMP}`);
  await page.getByLabel("Answer").fill("Yes. Tell us your route and we will check what you need.");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("tab", { name: "History" })).toBeVisible();
  await expect(page.getByText("Created.").first()).toBeVisible();

  await page.getByRole("button", { name: "Duplicate" }).first().click();
  await expect(page.getByText("A copy was saved as a draft.")).toBeVisible();
});

test("the lead page shows the request as labelled facts, not data", async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page);
  await page.goto("/secure-admin-control/leads");
  await page
    .getByRole("link", { name: /^(FLT|HTL|PKG|CTR|VSA|PRN|TRD|CNT|EMI|QTE)-/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "What they asked for" })).toBeVisible();
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

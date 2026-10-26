import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";
import { whenHydrated } from "./hydration";

/*
 * Email code sign-in and sign-up (issue 241, D301; QA cases F-01, F-02, F-03, F-20, F-36 in docs/qa/F-accounts.md).
 * API mode only: the code arrives by email, read from the Mailpit test inbox the CI job runs (MAILPIT_URL). Visible,
 * labelled controls only.
 */

const MAILPIT = process.env.MAILPIT_URL;
const STAMP = Date.now().toString().slice(-6);
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.skip(!process.env.WAAFA_API_URL || !MAILPIT, "needs the API and the Mailpit inbox");
test.use({ reducedMotion: "reduce" });

/** The 6-digit code in the newest email to the address, waiting until one newer than `after` arrives. */
async function codeFor(email: string, after: number): Promise<string> {
  let code = "";
  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
        );
        const list = (await search.json()) as {
          messages?: Array<{ ID: string; Created: string }>;
        };
        const newest = list.messages?.find((message) => Date.parse(message.Created) >= after);
        if (!newest) return "";
        const message = (await (await fetch(`${MAILPIT}/api/v1/message/${newest.ID}`)).json()) as {
          Text: string;
        };
        code = /\b(\d{6})\b/.exec(message.Text)?.[1] ?? "";
        return code;
      },
      { timeout: 30_000, message: `a sign-in email to ${email}` },
    )
    .toMatch(/^\d{6}$/);
  return code;
}

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(result.violations.map((violation) => violation.id)).toEqual([]);
}

/** Types the email and asks for a code; returns when the code step shows. */
async function askCode(page: Page, email: string): Promise<number> {
  await page.goto("/login");
  // The footer newsletter has an "Email address" box too.
  const box = page.getByRole("main").getByRole("textbox", { name: "Email address" });
  await whenHydrated(box);
  await box.fill(email);
  const sent = Date.now() - 1_000;
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByText(`We sent a 6-digit code to ${email}`)).toBeVisible();
  return sent;
}

test.describe("phone (390)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("F-02: a new address signs up with the emailed code, a name and a phone", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const email = `sample.signup.${STAMP}@example.com`;
    const sent = await askCode(page, email);
    await axe(page);
    await page
      .getByRole("textbox", { name: "Code from the email" })
      .fill(await codeFor(email, sent));
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("heading", { name: "Welcome to Waafa" })).toBeFocused();
    await page.getByRole("textbox", { name: "Full name" }).fill(`Sample Signup ${STAMP}`);
    await page.getByRole("textbox", { name: /Mobile number/ }).fill("01712-345678");
    await axe(page);
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByRole("heading", { level: 1, name: `Hello, Sample Signup ${STAMP}` }),
    ).toBeVisible();
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

    // F-20: the phone menu says My account now.
    const menu = page.getByRole("button", { name: "Open menu" });
    await whenHydrated(menu);
    await menu.click();
    await expect(page.getByRole("link", { name: "My account" }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("desktop (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("F-01, F-03: a returning address signs in; a wrong code says how many tries are left", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const email = `sample.return.${STAMP}@example.com`;
    // Sign up first, then sign out.
    let sent = await askCode(page, email);
    await page
      .getByRole("textbox", { name: "Code from the email" })
      .fill(await codeFor(email, sent));
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("textbox", { name: "Full name" }).fill(`Sample Return ${STAMP}`);
    await page.getByRole("textbox", { name: /Mobile number/ }).fill("01712-345679");
    await page.getByRole("button", { name: "Create my account" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("link", { name: "My account" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("link", { name: "Log in" }).first()).toBeVisible();

    sent = await askCode(page, email);
    const code = await codeFor(email, sent);
    await page
      .getByRole("textbox", { name: "Code from the email" })
      .fill(code === "000000" ? "111111" : "000000");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText("That code isn't right. Tries left: 4.");
    await page.getByRole("textbox", { name: "Code from the email" }).fill(code);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

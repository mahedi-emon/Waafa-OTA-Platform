import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";
import { whenHydrated } from "./hydration";

/*
 * My account sections (issue 278; QA cases F-26 to F-31 in docs/qa/F-accounts.md): wishlist from a package page,
 * saved travellers with a masked passport, delivery addresses, offer emails, an optional password, recent sign-ins and
 * "Sign out other devices". API mode only: the sign-up code is read from the Mailpit test inbox (MAILPIT_URL).
 */

const MAILPIT = process.env.MAILPIT_URL;
const STAMP = Date.now().toString().slice(-6);
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const PACKAGE = "/tour-packages/istanbul-and-cappadocia-in-a-week";
const PASSWORD = `sample-pass-${STAMP}`;

test.skip(!process.env.WAAFA_API_URL || !MAILPIT, "needs the API and the Mailpit inbox");
test.use({ reducedMotion: "reduce" });

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

/** A new account through the email code; ends on /account. */
async function signUp(page: Page, email: string, name: string) {
  await page.goto("/login");
  const box = page.getByRole("main").getByRole("textbox", { name: "Email address" });
  await whenHydrated(box);
  await box.fill(email);
  const sent = Date.now() - 1_000;
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByRole("textbox", { name: "Code from the email" }).fill(await codeFor(email, sent));
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill(name);
  await page.getByRole("textbox", { name: /Mobile number/ }).fill("01712-345670");
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

/** Password sign-in from /login; ends on /account. */
async function signInWithPassword(page: Page, email: string, password: string) {
  await page.goto("/login");
  const other = page.getByRole("button", { name: "Sign in with a password instead" });
  await whenHydrated(other);
  await other.click();
  await page.getByRole("main").getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test.describe("phone (390)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("F-26, F-27, F-28: wishlist, travellers and addresses", async ({ page }) => {
    const errors = collectErrors(page);
    await signUp(page, `sample.sections.${STAMP}@example.com`, `Sample Sections ${STAMP}`);
    await expect(page.getByRole("navigation", { name: "Sections of My account" })).toBeVisible();
    await axe(page);

    // F-26: Save on a package page, then find it in the wishlist.
    await page.goto(PACKAGE);
    const save = page.getByRole("button", { name: "Save", exact: true });
    await whenHydrated(save);
    await save.click();
    await expect(page.getByText("Saved to your wishlist.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.reload();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.goto("/account");
    const wishlist = page.getByRole("region", { name: "Your wishlist" });
    await expect(wishlist.getByRole("link", { name: /Istanbul/ })).toBeVisible();
    // F-26: remove it again.
    const remove = wishlist.getByRole("button", { name: /^Remove .* from your wishlist$/ });
    await whenHydrated(remove);
    await remove.click();
    await expect(page.getByText("Removed from your wishlist.")).toBeVisible();
    await expect(wishlist.getByText("Nothing saved yet.", { exact: false })).toBeVisible();

    // F-27: a traveller; the passport shows masked and never whole.
    const travellers = page.getByRole("region", { name: "Saved travellers" });
    await travellers.getByRole("button", { name: "Add a traveller" }).click();
    await travellers
      .getByRole("textbox", { name: "Full name as in the passport" })
      .fill("Sample Traveller");
    await travellers.getByRole("textbox", { name: "Passport number" }).fill("a01234567");
    await travellers.getByRole("button", { name: "Save traveller" }).click();
    await expect(page.getByText("Traveller saved.")).toBeVisible();
    await expect(travellers.getByText("Passport •••• 4567")).toBeVisible();
    await expect(page.getByText("A01234567")).toHaveCount(0);
    // Edit keeps the saved number when the box is left empty.
    await travellers.getByRole("button", { name: "Edit Sample Traveller" }).click();
    await travellers
      .getByRole("textbox", { name: "Full name as in the passport" })
      .fill("Sample Traveller Two");
    await travellers.getByRole("button", { name: "Save traveller" }).click();
    await expect(travellers.getByText("Sample Traveller Two")).toBeVisible();
    await expect(travellers.getByText("Passport •••• 4567")).toBeVisible();
    await travellers.getByRole("button", { name: "Remove Sample Traveller Two" }).click();
    await expect(page.getByText("Traveller removed.")).toBeVisible();

    // F-28: the first address becomes the default.
    const addresses = page.getByRole("region", { name: "Delivery addresses" });
    await addresses.getByRole("button", { name: "Add an address" }).click();
    await addresses.getByRole("textbox", { name: "Label (optional)" }).fill("Home");
    await addresses.getByRole("textbox", { name: "Name", exact: true }).fill("Sample Sections");
    await addresses.getByRole("textbox", { name: /Mobile number/ }).fill("01712-345670");
    await addresses.getByRole("combobox", { name: "Division" }).selectOption("Dhaka");
    await addresses.getByRole("textbox", { name: "District" }).fill("Dhaka");
    await addresses.getByRole("textbox", { name: "Area or thana" }).fill("Gulshan");
    await addresses.getByRole("textbox", { name: "House, road and more" }).fill("House 1, Road 2");
    await axe(page);
    await addresses.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByText("Address saved.")).toBeVisible();
    await expect(addresses.getByText("Default", { exact: true })).toBeVisible();
    await expect(addresses.getByText("House 1, Road 2, Gulshan, Dhaka, Dhaka")).toBeVisible();

    // F-28: a bad phone is refused with a message, not saved.
    await addresses.getByRole("button", { name: "Add an address" }).click();
    await addresses.getByRole("textbox", { name: "Name", exact: true }).fill("Sample Office");
    await addresses.getByRole("textbox", { name: /Mobile number/ }).fill("123");
    await addresses.getByRole("textbox", { name: "District" }).fill("Dhaka");
    await addresses.getByRole("textbox", { name: "Area or thana" }).fill("Banani");
    await addresses.getByRole("textbox", { name: "House, road and more" }).fill("House 3, Road 4");
    await addresses.getByRole("button", { name: "Save address" }).click();
    await expect(addresses.getByRole("alert")).toHaveText(
      "Check the highlighted details and try again.",
    );
    expect(errors).toEqual([]);
  });
});

test.describe("desktop (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("F-29, F-30, F-31: offers, password sign-in, sign-ins and signing out other devices", async ({
    page,
    browser,
  }) => {
    const errors = collectErrors(page);
    const email = `sample.settings.${STAMP}@example.com`;
    await signUp(page, email, `Sample Settings ${STAMP}`);
    const settings = page.getByRole("region", { name: "Settings" });

    // F-29: offer emails are off until the customer turns them on; the switch saves at once.
    const offers = settings.getByRole("switch", { name: "Offers and travel news by email" });
    await whenHydrated(offers);
    await expect(offers).not.toBeChecked();
    await offers.click();
    await expect(page.getByText("Saved.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole("region", { name: "Settings" })
        .getByRole("switch", { name: "Offers and travel news by email" }),
    ).toBeChecked();

    // F-31: a short password is refused in the form; a good one is saved.
    const box = page.getByLabel("New password");
    await whenHydrated(box);
    await box.fill("short");
    await page.getByRole("button", { name: "Set password" }).click();
    await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
    await box.fill(PASSWORD);
    await page.getByRole("button", { name: "Set password" }).click();
    await expect(page.getByText("Password saved.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Change password" })).toBeVisible();

    // F-31: a second browser signs in with the password; a wrong one says so without saying which part.
    const other = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const second = await other.newPage();
    await signInWithPassword(second, email, "not-the-password-1");
    await expect(
      second.getByText("Wrong email or password. Forgot it? Sign in with an email code."),
    ).toBeVisible();
    await second.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await second.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(second).toHaveURL(/\/account$/);

    // F-30: this device is marked; the other one signs out from here.
    await page.reload();
    await expect(page.getByText("This device")).toBeVisible();
    const signOutOthers = page.getByRole("button", { name: "Sign out other devices" });
    await whenHydrated(signOutOthers);
    await signOutOthers.click();
    await expect(page.getByText("Signed out 1 other device.")).toBeVisible();
    await second.goto("/account");
    await expect(second).toHaveURL(/\/login/);
    await other.close();

    // F-31: removing the password; the email code still works (covered by account-email.spec.ts).
    await page.getByRole("button", { name: "Remove password" }).click();
    await expect(page.getByText("Password removed. Use an email code to sign in.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Set password" })).toBeVisible();

    // A client-side move into /account from the header renders the page, not the error boundary (React 412).
    await page.goto("/");
    const myAccount = page.getByRole("banner").getByRole("link", { name: "My account" });
    await whenHydrated(myAccount);
    await myAccount.click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("navigation", { name: "Sections of My account" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

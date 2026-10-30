import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ADMIN_ROUTES, ADMIN_SCREENS } from "./adminRoutes";
import { collectErrors } from "./errors";

/*
 * Admin dark theme (issue 257): chosen from the account menu, applied at once and remembered; every admin route passes
 * axe in it (the light theme is covered by admin-screens.spec.ts); the public site stays light. API mode only.
 */
const apiMode = Boolean(process.env.WAAFA_API_URL);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.skip(!apiMode || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.use({ reducedMotion: "reduce" });

test("Dark from the account menu applies at once, is remembered and every admin route passes axe in it", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.211" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();

  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await background();
  await page.getByRole("button", { name: /^My account: / }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator('[data-admin-theme="dark"]')).toHaveCount(1);
  await expect.poll(background).not.toBe(light);
  expect((await page.context().cookies()).find((c) => c.name === "waafa_admin_theme")?.value).toBe(
    "dark",
  );

  // Every route is checked before failing, so one run lists every contrast miss.
  const misses: string[] = [];
  for (const route of [...ADMIN_SCREENS.map((screen) => screen.path), ...ADMIN_ROUTES]) {
    await page.goto(route);
    await expect(page.locator('[data-admin-theme="dark"]'), route).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 }).first(), route).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    for (const violation of axe.violations)
      for (const node of violation.nodes)
        misses.push(`${route} ${violation.id}: ${node.target.join(" ")}`);
  }
  expect(misses, "axe in the dark theme").toEqual([]);
  await page.screenshot({ path: "test-results/admin-shots/dark-dashboard-1440.png" });

  // The public site never takes the admin theme.
  await page.goto("/");
  expect(await background()).toBe(light);

  // Back to light for the tests that follow.
  await page.goto("/secure-admin-control");
  await page.getByRole("button", { name: /^My account: / }).click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(page.locator('[data-admin-theme="light"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

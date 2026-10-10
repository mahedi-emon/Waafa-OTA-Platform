import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Admin screens at every width (CLAUDE.md Quality gates): no horizontal scroll, no console errors, axe clean at 390 and
 * 1440, and a full-page screenshot per width for the design review (uploaded by the API-mode CI job). API mode only.
 */
const apiMode = Boolean(process.env.WAAFA_API_URL);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";
const WIDTHS = [320, 390, 768, 1024, 1440] as const;
const AXE_WIDTHS = new Set<number>([390, 1440]);
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SCREENS = [
  { name: "dashboard", path: "/admin" },
  { name: "leads", path: "/admin/leads" },
  { name: "orders", path: "/admin/orders" },
  { name: "feedback", path: "/admin/feedback" },
  { name: "content", path: "/admin/content" },
  { name: "content-faqs", path: "/admin/content/faqs" },
  { name: "settings-contact", path: "/admin/content/contactSettings" },
  { name: "users", path: "/admin/users" },
] as const;

test.skip(!apiMode || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

test("the sign-in page holds every width and passes axe", async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/sign-in");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `no horizontal scroll at ${width}`).toBeLessThanOrEqual(0);
    await page.screenshot({
      path: `test-results/admin-shots/sign-in-${width}.png`,
      fullPage: true,
    });
    if (AXE_WIDTHS.has(width)) {
      const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(axe.violations, `axe at ${width}`).toEqual([]);
    }
  }
});

test("signed-in admin screens hold every width, stay error-free and pass axe", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();

  for (const screen of SCREENS) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(screen.path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${screen.name} has no horizontal scroll at ${width}`).toBeLessThanOrEqual(
        0,
      );
      await page.screenshot({
        path: `test-results/admin-shots/${screen.name}-${width}.png`,
        fullPage: true,
      });
      if (AXE_WIDTHS.has(width)) {
        const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        expect(
          axe.violations.map(
            (violation) => `${violation.id}: ${violation.nodes[0]?.target.join(" ")}`,
          ),
          `${screen.name} axe at ${width}`,
        ).toEqual([]);
      }
    }
  }
  expect(errors).toEqual([]);
});

import { expect, test } from "@playwright/test";
import { whenHydrated } from "./hydration";

/*
 * Words typed before the page finishes loading stay (issue 259): on a slow phone a visitor can type into the request
 * form before React hydrates it; controlled fields were reset to empty at hydration and the request could not go on.
 * Scripts are held back here so the typing always happens first.
 */
test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

test("a request form keeps what was typed before it came alive", async ({ page }) => {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/chunks/**/*.js", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/hotels", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Full name").fill("Sample Karim Ahmed");
  await page.getByLabel("Mobile number").fill("01812-345678");
  release();
  await whenHydrated(page.getByLabel("Full name"));
  await expect(page.getByLabel("Full name")).toHaveValue("Sample Karim Ahmed");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Check your stay" })).toBeVisible();
});

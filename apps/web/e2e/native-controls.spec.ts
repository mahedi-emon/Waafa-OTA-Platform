import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Native form controls behind the shadcn API (issue 236, D293): radio groups move and select with the arrow keys and
 * keep one tab stop, tabs follow the WAI-ARIA pattern (arrow keys, Home, End, linked panel), checkboxes and switches
 * toggle with Space.
 */
test.use({ reducedMotion: "reduce" });

test.describe("at 390", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("destination chips move with the arrow keys", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const section = page.getByRole("region", { name: "Find a trip that fits you" });
    const all = section.getByRole("radio", { name: "All" });
    await expect(all).toBeChecked();
    await all.focus();
    await page.keyboard.press("ArrowRight");
    const second = section.getByRole("radio").nth(1);
    await expect(second).toBeChecked();
    await expect(second).toBeFocused();
    await expect(all).not.toBeChecked();
    expect(errors).toEqual([]);
  });

  test("visa type tabs follow the tabs pattern", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/visa/thailand");
    const tabs = page.getByRole("tab");
    // The tabs stream in with the visa record: wait for them before counting (count() does not wait).
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.count()).toBeGreaterThan(1);
    const first = tabs.first();
    await expect(first).toHaveAttribute("aria-selected", "true");
    await expect(first).toHaveAttribute("tabindex", "0");
    await expect(tabs.nth(1)).toHaveAttribute("tabindex", "-1");

    await first.focus();
    await page.keyboard.press("ArrowRight");
    const second = tabs.nth(1);
    await expect(second).toBeFocused();
    await expect(second).toHaveAttribute("aria-selected", "true");
    const panelId = await second.getAttribute("aria-controls");
    await expect(page.locator(`[id="${panelId}"]`)).toBeVisible();
    await expect(page.locator(`[id="${panelId}"]`)).toHaveAttribute(
      "aria-labelledby",
      (await second.getAttribute("id")) ?? "",
    );

    await page.keyboard.press("Home");
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
    expect(errors).toEqual([]);
  });
});

test.describe("at 1440", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("trip type radios keep one tab stop and move with the arrow keys", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const trip = page.getByRole("radiogroup", { name: "Trip type" });
    const checked = trip.getByRole("radio", { checked: true });
    await expect(checked).toHaveCount(1);
    await checked.focus();
    await page.keyboard.press("ArrowRight");
    await expect(trip.getByRole("radio", { checked: true })).toHaveCount(1);
    await expect(trip.getByRole("radio", { checked: true })).toBeFocused();
    expect(errors).toEqual([]);
  });

  test("preferences checkboxes and switch toggle with Space", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/flights");
    const rail = page.getByRole("complementary", { name: "Your preferences" });
    const box = rail.getByRole("checkbox").first();
    await box.focus();
    await page.keyboard.press("Space");
    await expect(box).toBeChecked();
    await page.keyboard.press("Space");
    await expect(box).not.toBeChecked();
    const toggle = rail.getByRole("switch").first();
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toBeChecked();
    expect(errors).toEqual([]);
  });
});

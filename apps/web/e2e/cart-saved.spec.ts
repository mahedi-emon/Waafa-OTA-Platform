import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";
import { whenHydrated } from "./hydration";

/* Save for later in the cart (issue 246): a line moves to "Saved for later" and back, on a phone and a laptop. */

async function addPowerBank(page: Page) {
  await page.goto("/shop/p/voltaro-power-bank-22-5w");
  const add = page.getByRole("button", { name: "Add to cart" }).first();
  await whenHydrated(add);
  await add.click();
  await page.goto("/shop/cart");
}

for (const width of [390, 1440]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 844 : 900 } });

    test("a cart line is saved for later and moved back", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = collectErrors(page);
      await addPowerBank(page);
      const save = page.getByRole("button", { name: /^Save for later: Voltaro Power Bank/ });
      await whenHydrated(save);
      await save.click();

      const saved = page.getByRole("region", { name: /Saved for later/ });
      await expect(saved).toBeVisible();
      await expect(saved.getByText(/Voltaro Power Bank/)).toBeVisible();
      // The cart is empty now, and still offers the saved line.
      await expect(page.getByRole("button", { name: /^Save for later: Voltaro/ })).toHaveCount(0);
      const axe = await new AxeBuilder({ page }).include("main").analyze();
      expect(axe.violations).toEqual([]);

      await saved.getByRole("button", { name: /^Move to cart: Voltaro Power Bank/ }).click();
      await expect(page.getByRole("region", { name: /Saved for later/ })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Save for later: Voltaro/ })).toBeVisible();
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(scroll).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  });
}

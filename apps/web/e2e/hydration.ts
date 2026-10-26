import { expect, type Locator } from "@playwright/test";

/**
 * Waits until React has hydrated this element, so its handlers are live (issue 276). React puts its props on each DOM
 * node it hydrates (`__reactProps$…`); a click or a file given before that is lost. This waits for that condition
 * once, instead of repeating the gesture until something happens.
 */
export async function whenHydrated(target: Locator, timeout = 30_000): Promise<void> {
  await expect(target).toBeAttached({ timeout });
  await expect
    .poll(
      () =>
        target.evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith("__reactProps$")),
        ),
      { timeout, message: "the element is hydrated" },
    )
    .toBe(true);
}

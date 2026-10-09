import type { Page } from "@playwright/test";

/**
 * Collects console errors, page errors and failed responses for a test.
 *
 * Links to routes that later issues build (A7 to A16) are prefetched by Next.js and return 404 for now. Those RSC
 * prefetches are expected; every other 404 (pages, images, scripts, styles) counts as an error. Remove the prefetch
 * allowance in A22, when every linked route exists.
 */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (/Failed to load resource: the server responded with a status of 404/.test(message.text())) {
      return;
    }
    errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() !== 404) return;
    const request = response.request();
    const prefetch = request.headers()["rsc"] === "1" || response.url().includes("_rsc=");
    if (!prefetch) errors.push(`404 ${response.url()}`);
  });
  return errors;
}

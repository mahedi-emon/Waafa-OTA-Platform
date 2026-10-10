import type { Page } from "@playwright/test";

/**
 * Collects console errors, page errors and failed responses for a test. Every linked route exists since A16 and the
 * branded 404 catches the rest, so any 404 (page, prefetch, image, script, style) now counts as an error.
 */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // The response listener below reports 404s with their URL; skip the duplicate console line.
    if (/Failed to load resource: the server responded with a status of 404/.test(message.text())) {
      return;
    }
    errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() === 404) errors.push(`404 ${response.url()}`);
  });
  return errors;
}

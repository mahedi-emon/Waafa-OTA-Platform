import type { Page } from "@playwright/test";

/**
 * WebKit words a router prefetch cancelled by a navigation as "… ?_rsc=… due to access control checks." (as a console
 * line or an unhandled rejection). It is the router's own same-origin request being aborted, not a failure (issue 259).
 */
function abortedPrefetch(text: string): boolean {
  return /\?_rsc=\S+ due to access control checks\.$/.test(text);
}

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
    if (abortedPrefetch(message.text())) return;
    errors.push(message.text());
  });
  page.on("pageerror", (error) => {
    if (abortedPrefetch(error.message)) return;
    errors.push(error.message);
  });
  page.on("response", (response) => {
    if (response.status() === 404) errors.push(`404 ${response.url()}`);
  });
  return errors;
}

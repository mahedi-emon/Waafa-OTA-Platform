/** The meta tag the site layout writes with the Turnstile site key from Admin › Integrations (issues 284 and 295). */
export const TURNSTILE_META = "waafa-turnstile";

/**
 * The site key, read from the page when a form first needs it; undefined while Turnstile is off. A meta tag instead
 * of a React provider keeps the key out of every page's script (the 200 KB budget, issue 295).
 */
export function readTurnstileSiteKey(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return (
    document.querySelector<HTMLMetaElement>(`meta[name="${TURNSTILE_META}"]`)?.content.trim() ||
    undefined
  );
}

/**
 * The /styleguide page exists in development and in builds made with STYLEGUIDE=1 (CI's e2e build).
 * Production builds leave it out, so it returns 404 on the live site.
 */
export function isStyleguideEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.STYLEGUIDE === "1";
}

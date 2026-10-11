/**
 * The browser-side email check for small forms (newsletter) without loading zod (#39). Same pattern as zod's
 * `z.email()`; the server still validates with the shared schema.
 */
const EMAIL =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

export function looksLikeEmail(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value);
}

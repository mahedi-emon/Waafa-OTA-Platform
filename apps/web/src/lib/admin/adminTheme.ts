/**
 * The admin's colour theme (issue 257): light (the default, as before), dark, or whatever the device prefers. Kept in
 * a cookie so the frame renders in the right theme with no flash; the public site is always light.
 */
export const ADMIN_THEMES = ["light", "dark", "system"] as const;
export type AdminTheme = (typeof ADMIN_THEMES)[number];
export const ADMIN_THEME_COOKIE = "waafa_admin_theme";

export function parseAdminTheme(value: string | undefined): AdminTheme {
  return ADMIN_THEMES.find((theme) => theme === value) ?? "light";
}

/** The cookie line that remembers the choice for a year on this browser. */
export function adminThemeCookie(theme: AdminTheme): string {
  return `${ADMIN_THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

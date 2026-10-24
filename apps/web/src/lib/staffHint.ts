/*
 * Hints for the public site's staff tools (D0 R7): plain, readable cookies that say "a staff member uses this
 * browser" and "a preview is on". They grant nothing (the admin session stays in httpOnly cookies); they only let the
 * public pages load the staff tools for staff, so visitors never download them.
 */

/** Set at sign-in, removed at sign-out. */
export const STAFF_HINT_COOKIE = "waafa_staff";

/** Set while Preview of unpublished changes is on (with Next.js draft mode). */
export const PREVIEW_HINT_COOKIE = "waafa_preview";

/** True when the browser's cookies carry either hint. */
export function hasStaffHint(cookieHeader: string): boolean {
  return /(?:^|;\s*)waafa_(?:staff|preview)=1(?:;|$)/.test(cookieHeader);
}

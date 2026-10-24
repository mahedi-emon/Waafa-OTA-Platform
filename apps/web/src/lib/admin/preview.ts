import { isAdminPath } from "./tokens";

const BASE = "https://preview.invalid";

/**
 * Where Preview of unpublished changes may open (D0 R7): a page of this site, never the admin, an API route or
 * another site (no open redirects). Anything else opens the home page.
 */
export function previewPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 512 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  ) {
    return "/";
  }
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return "/";
  }
  if (url.origin !== BASE || isAdminPath(url.pathname) || /^\/api(?:\/|$)/.test(url.pathname)) {
    return "/";
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Turns the preview on and opens the page (staff only: the route checks the session). */
export function previewHref(path: string): string {
  return `/secure-admin-control/preview?path=${encodeURIComponent(path)}`;
}

/** Turns the preview off and stays on the page. */
export function exitPreviewHref(path: string): string {
  return `/api/preview/exit?path=${encodeURIComponent(path)}`;
}

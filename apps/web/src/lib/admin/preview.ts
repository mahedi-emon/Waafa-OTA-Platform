import { isAdminPath } from "./tokens";

const BASE = "https://preview.invalid";

/**
 * Where Preview of unpublished changes may open (D0 R7): a page of this site, never the admin, an API route or
 * another site (no open redirects). The path is checked again after the URL parser has collapsed it, so dot
 * segments can't turn it into "//other.site". Anything else opens the home page.
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
  const path = url.pathname;
  if (
    url.origin !== BASE ||
    path.startsWith("//") ||
    isAdminPath(path) ||
    /^\/api(?:\/|$)/.test(path)
  ) {
    return "/";
  }
  return `${path}${url.search}${url.hash}`;
}

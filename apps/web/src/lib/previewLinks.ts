/*
 * The addresses that turn Preview of unpublished changes on and off (D0 R7). Plain string builders with no imports,
 * so the public layout's Exit preview link adds nothing else to visitors' JavaScript; the routes check the path.
 */

/** Turns the preview on and opens the page (staff only: the route checks the session). */
export function previewHref(path: string): string {
  return `/secure-admin-control/preview?path=${encodeURIComponent(path)}`;
}

/** Turns the preview off and stays on the page. */
export function exitPreviewHref(path: string): string {
  return `/api/preview/exit?path=${encodeURIComponent(path)}`;
}

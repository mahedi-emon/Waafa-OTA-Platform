/**
 * Whether a nav link points at the current section: Home only on "/", every other link on its route and below
 * (so "/shop/c/printers-and-supplies" keeps Waafas World active).
 */
export function isActivePath(pathname: string | null, href?: string): boolean {
  if (pathname === null) return false;
  if (!href) return false;
  const path = href.split(/[?#]/)[0] ?? href;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

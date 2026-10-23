/**
 * Photo hosts the site's image optimiser may fetch from (next.config `images.remotePatterns`): the free-licence
 * libraries the media rules name (CLAUDE.md). Any other photo is uploaded to the library instead.
 */
export const PHOTO_HOSTS = ["images.unsplash.com", "images.pexels.com"] as const;

const sitePath = (value: string) => /^\/(?!\/)\S*$/.test(value);

const httpsUrl = (value: string): URL | null => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

/** A photo address the public pages can show: a path on this site, or an https address on Unsplash or Pexels. */
export function isLinkablePhoto(address: string): boolean {
  const value = address.trim();
  if (sitePath(value)) return true;
  const url = httpsUrl(value);
  return url !== null && (PHOTO_HOSTS as readonly string[]).includes(url.hostname);
}

/** A video address the public pages can play: a path on this site or any https address (CSP media-src https:). */
export function isLinkableVideo(address: string): boolean {
  const value = address.trim();
  return sitePath(value) || httpsUrl(value) !== null;
}

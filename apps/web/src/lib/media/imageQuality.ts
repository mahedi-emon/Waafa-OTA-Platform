/**
 * next/image qualities (issue 185), also the allow-list in next.config.ts. Photos at 65 are about 28% smaller than at
 * 75 and look the same; the logo keeps 90 so its edges and letters stay sharp.
 */
export const PHOTO_QUALITY = 65;
export const LOGO_QUALITY = 90;

/** The width share previews use: Facebook, WhatsApp, LinkedIn and X all show 1200 px wide images well. */
export const SHARE_IMAGE_WIDTH = 1200;

/**
 * A site photo ("/media/…" or an upload under "/uploads/…") through the image optimiser at the share width, so link
 * previews get a resized file (a JPEG for crawlers that do not ask for WebP or AVIF) instead of the full-size
 * original; WhatsApp shows no picture for images over about 300 KB. Other URLs are returned as they are.
 */
export function shareImageSrc(src: string): string {
  if (!src.startsWith("/") || src.startsWith("//") || src.startsWith("/_next/")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${SHARE_IMAGE_WIDTH}&q=${PHOTO_QUALITY}`;
}

export type ShareImage = { url: string; alt: string; width?: number; height?: number };

/**
 * A share image through the image optimiser at 1200 px (issue 185), its declared size scaled to match: link previews
 * load a small file instead of the full-size photo or upload.
 */
export function sharePreview(image: ShareImage): ShareImage {
  const url = shareImageSrc(image.url);
  const { width, height } = image;
  if (url === image.url || !width || !height || width <= SHARE_IMAGE_WIDTH)
    return { ...image, url };
  return {
    ...image,
    url,
    width: SHARE_IMAGE_WIDTH,
    height: Math.round((height * SHARE_IMAGE_WIDTH) / width),
  };
}

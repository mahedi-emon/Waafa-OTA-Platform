import type { PhotoFrame } from "./blueprints/types";

/** "16:9" → 1.78; "free" (the photo keeps its own shape) → null. */
export function ratioOf(aspect: PhotoFrame["aspect"]): number | null {
  if (aspect === "free") return null;
  const [width, height] = aspect.split(":").map(Number);
  return width && height && Number.isFinite(width / height) ? width / height : null;
}

/**
 * The CSS aspect-ratio a photo is drawn in while editing: the frame's, else the photo's own shape, else 4 / 3 until
 * a photo is chosen.
 */
export function frameRatioCss(
  frame: PhotoFrame | undefined,
  size?: { width?: number | undefined; height?: number | undefined },
): string {
  if (frame && frame.aspect !== "free") return frame.aspect.replace(":", " / ");
  if (size?.width && size.height) return `${size.width} / ${size.height}`;
  return "4 / 3";
}

/**
 * A first alt text for a new photo: the record's title when it has one ("Bali 5 days" for a package cover), else
 * the file's name made readable; staff improve it afterwards.
 */
export function suggestAlt(title: string | undefined, fromName: string): string {
  const clean = (title ?? "").replace(/\s+/g, " ").trim();
  const alt = clean.length >= 3 ? clean : fromName;
  return alt.length >= 3 ? alt.slice(0, 200) : "Photo";
}

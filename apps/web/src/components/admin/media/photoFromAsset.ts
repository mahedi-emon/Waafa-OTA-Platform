import type { FocalPoint, MediaAsset } from "@waafa/shared";

/** A photo as records store it (ImageSchema). */
export type StoredPhoto = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  credit?: string;
  creditUrl?: string;
  focal?: FocalPoint;
};

/** Keeps only the parts a field's schema has (some photo slots have no credit) and drops empty ones. */
export function onlyParts(photo: StoredPhoto, parts: ReadonlySet<string>): StoredPhoto {
  return Object.fromEntries(
    Object.entries(photo).filter(([key, part]) => parts.has(key) && part !== undefined),
  ) as StoredPhoto;
}

/** A library file as a field's photo: its address, description, measured size and credit. */
export function photoFromAsset(asset: MediaAsset, parts: ReadonlySet<string>): StoredPhoto {
  return onlyParts(
    {
      src: asset.url,
      alt: asset.alt,
      width: asset.width,
      height: asset.height,
      ...(asset.credit ? { credit: asset.credit } : {}),
      ...(asset.creditUrl ? { creditUrl: asset.creditUrl } : {}),
    },
    parts,
  );
}

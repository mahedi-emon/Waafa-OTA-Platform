"use server";

import {
  MediaCropInputSchema,
  MediaIdSchema,
  MediaUpdateInputSchema,
  type MediaAsset,
  type MediaCropInput,
  type MediaReplaceResult,
} from "@waafa/shared";
import { adminWrite, type AdminResult } from "./adminApi";

const invalid = (detail: string): AdminResult<never> => ({
  ok: false,
  problem: { status: 422, title: "Validation failed", detail },
});
/** Editors keep their work on screen when the session ends, so a 401 comes back instead of a redirect (D201). */
const KEEP = { signedOut: "problem" } as const;

/** A library file's alt text and photo credit (issue 109, D0 R3). */
export async function updateMedia(
  id: string,
  input: { alt: string; credit?: string; creditUrl?: string },
): Promise<AdminResult<MediaAsset>> {
  if (!MediaIdSchema.safeParse(id).success) return invalid("Unknown file");
  const parsed = MediaUpdateInputSchema.safeParse(input);
  if (!parsed.success) return invalid("Describe the photo in a few words");
  return adminWrite<MediaAsset>(`/admin/media/${id}`, "PATCH", parsed.data, KEEP);
}

/** Deletes a library file nothing shows; a file still shown somewhere comes back as a 409 "inUse". */
export async function removeMedia(id: string): Promise<AdminResult<null>> {
  if (!MediaIdSchema.safeParse(id).success) return invalid("Unknown file");
  return adminWrite<null>(`/admin/media/${id}`, "DELETE", undefined, KEEP);
}

/** Saves a crop of a library photo as a new photo (D0 R3). */
export async function cropMedia(
  id: string,
  area: MediaCropInput,
): Promise<AdminResult<MediaAsset>> {
  if (!MediaIdSchema.safeParse(id).success) return invalid("Unknown file");
  const parsed = MediaCropInputSchema.safeParse(area);
  if (!parsed.success) return invalid("Choose a part of the photo to keep");
  return adminWrite<MediaAsset>(`/admin/media/${id}/crop`, "POST", parsed.data, KEEP);
}

/** Shows another library file wherever this one is shown (D0 R3). */
export async function replaceMedia(
  id: string,
  withId: string,
): Promise<AdminResult<MediaReplaceResult>> {
  if (!MediaIdSchema.safeParse(id).success || !MediaIdSchema.safeParse(withId).success)
    return invalid("Unknown file");
  return adminWrite<MediaReplaceResult>(
    `/admin/media/${id}/replace`,
    "POST",
    { with: withId },
    KEEP,
  );
}

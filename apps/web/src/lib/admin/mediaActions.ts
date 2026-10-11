"use server";

import { z } from "zod";
import { adminWrite, type AdminResult } from "./adminApi";

const ID = /^[a-z0-9]{8,40}$/;
const AltSchema = z.string().trim().min(3).max(200);

const invalid = (detail: string): AdminResult<never> => ({
  ok: false,
  problem: { status: 422, title: "Validation failed", detail },
});

/** Renames a library photo's alt text (issue 109). */
export async function updateMediaAlt(id: string, alt: string): Promise<AdminResult<unknown>> {
  const parsed = AltSchema.safeParse(alt);
  if (!ID.test(id)) return invalid("Unknown photo");
  if (!parsed.success) return invalid("Describe the photo in a few words");
  return adminWrite(`/admin/media/${id}`, "PATCH", { alt: parsed.data });
}

/** Deletes a library photo and its file (issue 109). */
export async function removeMedia(id: string): Promise<AdminResult<null>> {
  if (!ID.test(id)) return invalid("Unknown photo");
  return adminWrite<null>(`/admin/media/${id}`, "DELETE");
}

"use server";

import { adminWrite } from "./adminApi";
import type { ActionResult } from "./leadActions";

/** Puts a failed email back in the queue, or removes it for good (issue 238); the API writes the audit entry. */
export async function decideFailedJob(
  id: string,
  action: "retry" | "discard",
): Promise<ActionResult> {
  if (!/^[A-Za-z0-9:_-]{1,80}$/.test(id)) {
    return { ok: false, problem: { status: 422, title: "Validation failed" } };
  }
  const result = await adminWrite(
    `/admin/status/failed/${encodeURIComponent(id)}/${action}`,
    "POST",
  );
  return result.ok ? { ok: true } : result;
}

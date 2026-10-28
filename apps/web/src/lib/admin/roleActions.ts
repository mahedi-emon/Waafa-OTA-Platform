"use server";

import { CustomRoleInputSchema, type CustomRoleInput } from "@waafa/shared";
import { adminWrite } from "./adminApi";
import type { ActionResult } from "./leadActions";

const isId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id);

/** A new or changed custom role (issue 244); Super Admin only, checked here and by the API. */
export async function saveCustomRole(
  id: string | null,
  input: CustomRoleInput,
): Promise<ActionResult> {
  const parsed = CustomRoleInputSchema.safeParse(input);
  if (!parsed.success || (id !== null && !isId(id)))
    return { ok: false, problem: { status: 422, title: "Validation failed" } };
  const result = id
    ? await adminWrite(`/admin/roles/${id}`, "PATCH", parsed.data)
    : await adminWrite("/admin/roles", "POST", parsed.data);
  return result.ok ? { ok: true } : result;
}

export async function deleteCustomRole(id: string): Promise<ActionResult> {
  if (!isId(id)) return { ok: false, problem: { status: 404, title: "Not found" } };
  const result = await adminWrite(`/admin/roles/${id}`, "DELETE");
  return result.ok ? { ok: true } : result;
}

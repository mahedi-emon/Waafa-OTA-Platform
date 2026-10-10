"use server";

import {
  LeadBulkInputSchema,
  LeadNoteInputSchema,
  LeadUpdateInputSchema,
  type LeadBulkInput,
  type LeadNoteInput,
  type LeadUpdateInput,
} from "@waafa/shared";
import { adminWrite, type AdminProblem } from "./adminApi";

export type ActionResult = { ok: true } | { ok: false; problem: AdminProblem };

const invalid = (fields: Array<{ path: string; message: string }>): ActionResult => ({
  ok: false,
  problem: { status: 422, title: "Validation failed", fields },
});

const issues = (error: { issues: Array<{ path: PropertyKey[]; message: string }> }) =>
  error.issues.map((issue) => ({ path: issue.path.map(String).join("."), message: issue.message }));

/** Status, priority and assignee (FR-ADM-LEAD rules are checked here and again by the API). */
export async function updateLead(id: string, input: LeadUpdateInput): Promise<ActionResult> {
  const parsed = LeadUpdateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(issues(parsed.error));
  const result = await adminWrite(`/admin/leads/${encodeURIComponent(id)}`, "PATCH", parsed.data);
  return result.ok ? { ok: true } : result;
}

export async function addLeadNote(id: string, input: LeadNoteInput): Promise<ActionResult> {
  const parsed = LeadNoteInputSchema.safeParse(input);
  if (!parsed.success) return invalid(issues(parsed.error));
  const result = await adminWrite(
    `/admin/leads/${encodeURIComponent(id)}/activities`,
    "POST",
    parsed.data,
  );
  return result.ok ? { ok: true } : result;
}

export async function bulkUpdateLeads(
  input: LeadBulkInput,
): Promise<ActionResult & { changed?: number }> {
  const parsed = LeadBulkInputSchema.safeParse(input);
  if (!parsed.success) return invalid(issues(parsed.error));
  const result = await adminWrite<{ changed: number }>("/admin/leads/bulk", "POST", parsed.data);
  return result.ok ? { ok: true, changed: result.data.changed } : result;
}

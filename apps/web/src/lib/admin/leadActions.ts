"use server";

import {
  LeadActionInputSchema,
  LeadBulkInputSchema,
  LeadNoteInputSchema,
  LeadUpdateInputSchema,
  VisaProgressInputSchema,
  type LeadActionInput,
  type LeadBulkInput,
  type LeadNoteInput,
  type LeadUpdateInput,
  type VisaProgressInput,
} from "@waafa/shared";
import { adminWrite, type AdminProblem } from "./adminApi";

export type ActionResult = { ok: true } | { ok: false; problem: AdminProblem };

const invalid = (fields: Array<{ path: string; message: string }>): ActionResult => ({
  ok: false,
  problem: { status: 422, title: "Validation failed", fields },
});

const issues = (error: { issues: Array<{ path: PropertyKey[]; message: string }> }) =>
  error.issues.map((issue) => ({ path: issue.path.map(String).join("."), message: issue.message }));

/** Priority, assignee and a booked lead's corrected amount (checked here and again by the API). */
export async function updateLead(id: string, input: LeadUpdateInput): Promise<ActionResult> {
  const parsed = LeadUpdateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(issues(parsed.error));
  const result = await adminWrite(`/admin/leads/${encodeURIComponent(id)}`, "PATCH", parsed.data);
  return result.ok ? { ok: true } : result;
}

/** One step on a lead (contact, quote, convert, close…): the status follows (D0 R4). */
export async function leadAction(id: string, input: LeadActionInput): Promise<ActionResult> {
  const parsed = LeadActionInputSchema.safeParse(input);
  if (!parsed.success) return invalid(issues(parsed.error));
  const result = await adminWrite(
    `/admin/leads/${encodeURIComponent(id)}/actions`,
    "POST",
    parsed.data,
  );
  return result.ok ? { ok: true } : result;
}

/** A visa application's checklist, submission and outcome (D0 R4). */
export async function visaProgress(id: string, input: VisaProgressInput): Promise<ActionResult> {
  const parsed = VisaProgressInputSchema.safeParse(input);
  if (!parsed.success) return invalid(issues(parsed.error));
  const result = await adminWrite(
    `/admin/leads/${encodeURIComponent(id)}/visa`,
    "POST",
    parsed.data,
  );
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
): Promise<ActionResult & { changed?: number; skipped?: string[] }> {
  const parsed = LeadBulkInputSchema.safeParse(input);
  if (!parsed.success) return invalid(issues(parsed.error));
  const result = await adminWrite<{ changed: number; skipped: string[] }>(
    "/admin/leads/bulk",
    "POST",
    parsed.data,
  );
  return result.ok
    ? { ok: true, changed: result.data.changed, skipped: result.data.skipped }
    : result;
}

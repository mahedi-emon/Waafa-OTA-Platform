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
import { getTranslations } from "next-intl/server";
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

type BulkResult = { ok: boolean; changed?: number; message?: string };

/** The bulk bar's words for a lead step: the count, and the booked leads it left alone (D0 R5). */
async function bulkWords(
  result: Awaited<ReturnType<typeof bulkUpdateLeads>>,
  done: "bulkDone" | "bulkSpamDone",
): Promise<BulkResult> {
  if (!result.ok) return { ok: false };
  const t = await getTranslations("Admin.leads");
  const count = result.changed ?? 0;
  const skipped = result.skipped ?? [];
  return {
    ok: true,
    changed: count,
    message: [
      t(done, { count }),
      ...(skipped.length > 0 ? [t("bulkSkipped", { references: skipped.join(", ") })] : []),
    ].join(" "),
  };
}

/** The table's Assign step: `choice` is a staff id, or "none" to leave the leads unassigned. */
export async function assignLeads(ids: string[], choice?: string): Promise<BulkResult> {
  if (!choice) return { ok: false };
  return bulkWords(
    await bulkUpdateLeads({ ids, assigneeId: choice === "none" ? null : choice }),
    "bulkDone",
  );
}

/** The table's Mark as spam step (booked leads are skipped by the API). */
export async function markLeadsSpam(ids: string[]): Promise<BulkResult> {
  return bulkWords(await bulkUpdateLeads({ ids, markSpam: true }), "bulkSpamDone");
}

/** A refund made in the gateway's or bank's own panel, written on the order (issue 251). */
export async function recordRefund(
  orderId: string,
  input: { amount: number; reference: string; note?: string },
): Promise<ActionResult> {
  if (!/^[a-z0-9]{10,40}$/.test(orderId))
    return { ok: false, problem: { status: 404, title: "Unknown" } };
  const result = await adminWrite(`/admin/orders/${orderId}/refunds`, "POST", input);
  return result.ok ? { ok: true } : result;
}

"use server";

import {
  FeedbackModerationInputSchema,
  OrderActionInputSchema,
  OrderUpdateInputSchema,
  PasswordChangeInputSchema,
  PasswordSetInputSchema,
  PaymentProofActionInputSchema,
  StaffCreateInputSchema,
  StaffUpdateInputSchema,
  type FeedbackModerationInput,
  type OrderActionInput,
  type OrderUpdateInput,
  type PaymentProofActionInput,
  type StaffCreateInput,
  type StaffUpdateInput,
} from "@waafa/shared";
import type { z } from "zod";
import { adminWrite } from "./adminApi";
import type { ActionResult } from "./leadActions";

function invalid(error: z.ZodError): ActionResult {
  return {
    ok: false,
    problem: {
      status: 422,
      title: "Validation failed",
      fields: error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    },
  };
}

async function write(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<ActionResult> {
  const result = await adminWrite(path, method, body);
  return result.ok ? { ok: true } : result;
}

const at = (id: string) => encodeURIComponent(id);

/** A note on the order's history. */
export async function updateOrder(id: string, input: OrderUpdateInput): Promise<ActionResult> {
  const parsed = OrderUpdateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/orders/${at(id)}`, "PATCH", parsed.data);
}

/** One step on an order (confirm, pack, ship, deliver, cancel, return): the status follows (D0 R4). */
export async function orderAction(id: string, input: OrderActionInput): Promise<ActionResult> {
  const parsed = OrderActionInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/orders/${at(id)}/actions`, "POST", parsed.data);
}

export async function moderateFeedback(
  id: string,
  input: FeedbackModerationInput,
): Promise<ActionResult> {
  const parsed = FeedbackModerationInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/feedback/${at(id)}`, "PATCH", parsed.data);
}

/**
 * The feedback table's bulk step (D0 R5): one moderation per item, so each keeps its own audit row; an item the API
 * refuses (approval without consent to publish) is counted out, never forced.
 */
export async function moderateFeedbackMany(
  status: FeedbackModerationInput["status"],
  ids: string[],
): Promise<{ ok: boolean; changed?: number }> {
  if (ids.length === 0 || ids.length > 100) return { ok: false };
  let changed = 0;
  for (const id of ids) {
    const result = await moderateFeedback(id, { status });
    if (result.ok) changed += 1;
  }
  return { ok: changed > 0, changed };
}

/** Verify (the order becomes paid and confirmed) or Reject with a reason (D0 R4). */
export async function proofAction(
  id: string,
  input: PaymentProofActionInput,
): Promise<ActionResult> {
  const parsed = PaymentProofActionInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/payment-proofs/${at(id)}/actions`, "POST", parsed.data);
}

export async function removeSubscriber(id: string): Promise<ActionResult> {
  return write(`/admin/subscribers/${at(id)}`, "DELETE");
}

export async function createStaff(input: StaffCreateInput): Promise<ActionResult> {
  const parsed = StaffCreateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write("/admin/users", "POST", parsed.data);
}

export async function updateStaff(id: string, input: StaffUpdateInput): Promise<ActionResult> {
  const parsed = StaffUpdateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/users/${at(id)}`, "PATCH", parsed.data);
}

export async function resetStaffPassword(id: string, password: string): Promise<ActionResult> {
  const parsed = PasswordSetInputSchema.safeParse({ password });
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/users/${at(id)}/password`, "POST", parsed.data);
}

export async function changeOwnPassword(current: string, next: string): Promise<ActionResult> {
  const parsed = PasswordChangeInputSchema.safeParse({ current, next });
  if (!parsed.success) return invalid(parsed.error);
  return write("/admin/me/password", "POST", parsed.data);
}

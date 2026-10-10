"use server";

import {
  FeedbackModerationInputSchema,
  OrderUpdateInputSchema,
  PasswordChangeInputSchema,
  PasswordSetInputSchema,
  PaymentProofReviewInputSchema,
  StaffCreateInputSchema,
  StaffUpdateInputSchema,
  type FeedbackModerationInput,
  type OrderUpdateInput,
  type PaymentProofReviewInput,
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

export async function updateOrder(id: string, input: OrderUpdateInput): Promise<ActionResult> {
  const parsed = OrderUpdateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/orders/${at(id)}`, "PATCH", parsed.data);
}

export async function moderateFeedback(
  id: string,
  input: FeedbackModerationInput,
): Promise<ActionResult> {
  const parsed = FeedbackModerationInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/feedback/${at(id)}`, "PATCH", parsed.data);
}

export async function reviewProof(
  id: string,
  input: PaymentProofReviewInput,
): Promise<ActionResult> {
  const parsed = PaymentProofReviewInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return write(`/admin/payment-proofs/${at(id)}`, "PATCH", parsed.data);
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

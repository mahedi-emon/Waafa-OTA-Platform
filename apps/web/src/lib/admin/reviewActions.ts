"use server";

import {
  QuestionAnswerSchema,
  ReviewDecisionSchema,
  type QuestionAnswer,
  type ReviewDecision,
} from "@waafa/shared";
import { adminWrite } from "./adminApi";
import type { ActionResult } from "./leadActions";

const isId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id);
const invalid: ActionResult = { ok: false, problem: { status: 422, title: "Validation failed" } };

/** Approve or reject a review, with an optional reply (issue 245); audited by the API. */
export async function decideReview(id: string, input: ReviewDecision): Promise<ActionResult> {
  const parsed = ReviewDecisionSchema.safeParse(input);
  if (!isId(id) || !parsed.success) return invalid;
  const result = await adminWrite(`/admin/reviews/${id}/decide`, "POST", parsed.data);
  return result.ok ? { ok: true } : result;
}

/** Publish an answer to a product question, or hide it. */
export async function answerQuestion(id: string, input: QuestionAnswer): Promise<ActionResult> {
  const parsed = QuestionAnswerSchema.safeParse(input);
  if (!isId(id) || !parsed.success) return invalid;
  const result = await adminWrite(`/admin/reviews/questions/${id}`, "POST", parsed.data);
  return result.ok ? { ok: true } : result;
}

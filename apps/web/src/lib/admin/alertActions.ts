"use server";

import {
  ReminderInputSchema,
  ReminderUpdateInputSchema,
  type ReminderInput,
  type ReminderList,
  type ReminderUpdateInput,
} from "@waafa/shared";
import { adminWrite } from "./adminApi";
import type { ActionResult } from "./leadActions";

const invalid = (error: { issues: Array<{ path: PropertyKey[]; message: string }> }) => ({
  ok: false as const,
  problem: {
    status: 422,
    title: "Validation failed",
    fields: error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  },
});

const isId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id);

/** Marks the bell's personal alerts read (issue 243): all of them, or the ones listed. */
export async function markAlertsRead(ids: string[] | "all"): Promise<ActionResult> {
  const body = ids === "all" ? { all: true } : { ids: ids.filter(isId).slice(0, 100) };
  const result = await adminWrite("/admin/alerts/read", "POST", body, { signedOut: "problem" });
  return result.ok ? { ok: true } : result;
}

/** A new reminder for the signed-in person (checked here and again by the API). */
export async function createReminder(
  input: ReminderInput,
): Promise<ActionResult | { ok: true; data: ReminderList }> {
  const parsed = ReminderInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await adminWrite<ReminderList>("/admin/reminders", "POST", parsed.data, {
    signedOut: "problem",
  });
  return result;
}

/** Done, or a new time (snooze). */
export async function updateReminder(
  id: string,
  input: ReminderUpdateInput,
): Promise<ActionResult> {
  if (!isId(id)) return { ok: false, problem: { status: 404, title: "Not found" } };
  const parsed = ReminderUpdateInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await adminWrite(`/admin/reminders/${id}`, "PATCH", parsed.data, {
    signedOut: "problem",
  });
  return result.ok ? { ok: true } : result;
}

export async function deleteReminder(id: string): Promise<ActionResult> {
  if (!isId(id)) return { ok: false, problem: { status: 404, title: "Not found" } };
  const result = await adminWrite(`/admin/reminders/${id}`, "DELETE", undefined, {
    signedOut: "problem",
  });
  return result.ok ? { ok: true } : result;
}

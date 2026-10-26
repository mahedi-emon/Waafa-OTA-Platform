"use server";

import { z } from "zod";
import { adminWrite } from "./adminApi";
import type { ActionResult } from "./leadActions";

/*
 * Admin › Customers › account (issue 241): turn an account off or on, sign it out everywhere, attach a request or an
 * order by its reference. The API checks the role (Admin for the first three) and writes the audit log.
 */

const IdSchema = z.string().min(1).max(64);
const AttachSchema = z
  .object({ kind: z.enum(["lead", "order"]), reference: z.string().trim().min(3).max(40) })
  .strict();

const at = (id: string) => encodeURIComponent(id);
const refuse = (): ActionResult => ({
  ok: false,
  problem: { status: 422, title: "Validation failed", fields: [] },
});

async function post(path: string, body?: unknown): Promise<ActionResult> {
  const result = await adminWrite(path, "POST", body ?? {});
  return result.ok ? { ok: true } : result;
}

export async function disableAccount(id: string, reason?: string): Promise<ActionResult> {
  if (!IdSchema.safeParse(id).success) return refuse();
  const trimmed = reason?.trim().slice(0, 300);
  return post(`/admin/customers/accounts/${at(id)}/disable`, trimmed ? { reason: trimmed } : {});
}

export async function enableAccount(id: string): Promise<ActionResult> {
  if (!IdSchema.safeParse(id).success) return refuse();
  return post(`/admin/customers/accounts/${at(id)}/enable`);
}

export async function signOutEverywhere(id: string): Promise<ActionResult> {
  if (!IdSchema.safeParse(id).success) return refuse();
  return post(`/admin/customers/accounts/${at(id)}/sign-out-everywhere`);
}

export async function attachToAccount(
  id: string,
  input: { kind: "lead" | "order"; reference: string },
): Promise<ActionResult> {
  const parsed = AttachSchema.safeParse(input);
  if (!IdSchema.safeParse(id).success || !parsed.success) return refuse();
  return post(`/admin/customers/accounts/${at(id)}/attach`, parsed.data);
}

"use server";

import { adminWrite } from "./adminApi";
import type { ActionResult } from "./leadActions";

const PHONE = /^\+\d{8,15}$/;
const at = (phone: string) => encodeURIComponent(phone);
const bad: ActionResult = { ok: false, problem: { status: 422, title: "Validation failed" } };

/** Tags on a customer (issue 244); the API trims them and drops repeats. */
export async function saveCustomerTags(phone: string, tags: string[]): Promise<ActionResult> {
  if (!PHONE.test(phone) || tags.length > 12 || tags.some((tag) => tag.length > 30)) return bad;
  const result = await adminWrite(`/admin/customers/${at(phone)}/tags`, "PATCH", { tags });
  return result.ok ? { ok: true } : result;
}

export async function addCustomerNote(phone: string, body: string): Promise<ActionResult> {
  if (!PHONE.test(phone) || !body.trim() || body.length > 2000) return bad;
  const result = await adminWrite(`/admin/customers/${at(phone)}/notes`, "POST", {
    body: body.trim(),
  });
  return result.ok ? { ok: true } : result;
}

/** Merges `other` into `into` (Admin and Super Admin; the API checks again and audits it). */
export async function mergeCustomer(other: string, into: string): Promise<ActionResult> {
  if (!PHONE.test(other) || !PHONE.test(into)) return bad;
  const result = await adminWrite(`/admin/customers/${at(other)}/merge`, "POST", { into });
  return result.ok ? { ok: true } : result;
}

export async function unmergeCustomer(phone: string): Promise<ActionResult> {
  if (!PHONE.test(phone)) return bad;
  const result = await adminWrite(`/admin/customers/${at(phone)}/unmerge`, "POST");
  return result.ok ? { ok: true } : result;
}

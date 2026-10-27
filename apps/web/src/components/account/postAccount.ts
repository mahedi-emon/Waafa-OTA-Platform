"use client";

export type AccountAnswer = {
  ok: boolean;
  error?: string;
  fields?: string[];
  [key: string]: unknown;
};

/** One My account change through /api/account/sections (issue 278). */
export async function postAccount(op: string, data?: unknown, id?: string): Promise<AccountAnswer> {
  try {
    const response = await fetch("/api/account/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op, ...(id ? { id } : {}), ...(data === undefined ? {} : { data }) }),
    });
    const json = (await response.json().catch(() => ({}))) as AccountAnswer;
    if (response.status === 429) return { ok: false, error: "busy" };
    if (!response.ok) return { ok: false, error: "unavailable" };
    return json;
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export type AccountErrors = {
  signedOut: string;
  invalid: string;
  unavailable: string;
  busy: string;
};

/** The words for a refused change; `full` is the section's own "list is full" message. */
export function accountError(answer: AccountAnswer, errors: AccountErrors, full?: string): string {
  if (answer.error === "signed-out") return errors.signedOut;
  if (answer.error === "invalid") return errors.invalid;
  if (answer.error === "busy") return errors.busy;
  if (answer.error === "full" && full) return full;
  return errors.unavailable;
}

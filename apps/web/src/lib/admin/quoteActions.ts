"use server";

import {
  QuoteChannelSchema,
  QuoteInputSchema,
  type QuoteChannel,
  type QuoteView,
} from "@waafa/shared";
import { adminWrite, type AdminResult } from "./adminApi";

const ID = /^[a-z0-9]{10,40}$/;

const refused = (fields: Array<{ path: string; message: string }> = []) =>
  ({ ok: false, problem: { status: 422, title: "Validation failed", fields } }) as const;

function parsed(input: unknown) {
  const result = QuoteInputSchema.safeParse(input);
  return result.success
    ? { ok: true as const, data: result.data }
    : refused(
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
}

/** Writes a new quote on a lead (issue 298); the API checks access and audits it. */
export async function createQuote(leadId: string, input: unknown): Promise<AdminResult<QuoteView>> {
  const quote = parsed(input);
  if (!ID.test(leadId)) return refused();
  if (!quote.ok) return quote;
  return adminWrite<QuoteView>(`/admin/leads/${leadId}/quotes`, "POST", quote.data);
}

export async function updateQuote(id: string, input: unknown): Promise<AdminResult<QuoteView>> {
  const quote = parsed(input);
  if (!ID.test(id)) return refused();
  if (!quote.ok) return quote;
  return adminWrite<QuoteView>(`/admin/quotes/${id}`, "PATCH", quote.data);
}

/** Emails the link, or records that it went on WhatsApp; the lead moves to Quoted. */
export async function sendQuote(
  id: string,
  channel: QuoteChannel,
): Promise<AdminResult<QuoteView>> {
  if (!ID.test(id) || !QuoteChannelSchema.safeParse(channel).success) return refused();
  return adminWrite<QuoteView>(`/admin/quotes/${id}/send`, "POST", { channel });
}

export async function withdrawQuote(id: string): Promise<AdminResult<QuoteView>> {
  if (!ID.test(id)) return refused();
  return adminWrite<QuoteView>(`/admin/quotes/${id}/withdraw`, "POST", {});
}

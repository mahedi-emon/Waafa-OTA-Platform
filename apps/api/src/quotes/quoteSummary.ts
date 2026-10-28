import {
  isQuoteExpired,
  type QuoteOption,
  type QuoteStatus,
  type QuoteSummary,
} from "@waafa/shared";
import type { Quote } from "../generated/prisma/client";

export const optionsOf = (row: Pick<Quote, "options">) => row.options as unknown as QuoteOption[];
export const dateOf = (value: Date) => value.toISOString().slice(0, 10);

/** The quote in the lead's Quotes card. */
export function quoteSummary(row: Quote, today: string): QuoteSummary {
  const options = optionsOf(row);
  const accepted = options.find((option) => option.id === row.acceptedOption) ?? null;
  const validUntil = dateOf(row.validUntil);
  return {
    id: row.id,
    reference: row.reference,
    status: row.status as QuoteStatus,
    expired: isQuoteExpired(row.status as QuoteStatus, validUntil, today),
    validUntil,
    options: options.length,
    lowest: Math.min(...options.map((option) => option.price)),
    accepted: accepted ? { title: accepted.title, price: accepted.price } : null,
  };
}

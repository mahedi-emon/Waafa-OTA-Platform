import type { QuoteStatus } from "@waafa/shared";

/** A quote's chip (issue 298): Expired overlays an open quote past its last day; the word always says the state. */
export function quoteBadge(
  status: QuoteStatus,
  expired: boolean,
): { state: QuoteStatus | "expired"; variant: "neutral" | "brand" | "success" | "warning" } {
  if (expired) return { state: "expired", variant: "warning" };
  const variant = {
    draft: "neutral",
    sent: "brand",
    accepted: "success",
    withdrawn: "neutral",
  } as const;
  return { state: status, variant: variant[status] };
}

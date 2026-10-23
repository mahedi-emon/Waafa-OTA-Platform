/*
 * Order status (D0 R4, ADMIN.md §8.4) and payment proofs (§8.5): every step is an action with what it needs (a
 * courier and tracking number to ship, a reason to cancel), so the status can't jump or go back by mistake. Stored
 * values keep their meaning ("processing" reads "Packing", D191). No zod here.
 */

export type OrderStatusValue =
  "placed" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";

export type OrderAction =
  /** Payment proof verified, or "Confirmed on call" for cash on delivery. */
  | { type: "confirm"; by: "proof" | "call" }
  /** Invoice or packing slip printed, or Start packing. */
  | { type: "startPacking" }
  | { type: "ship"; courier: string; trackingNumber: string }
  | { type: "deliver" }
  | { type: "cancel"; reason: string }
  | { type: "return"; reason: string };

export type OrderMove =
  | { ok: true; status: OrderStatusValue; restock: boolean }
  | { ok: false; reason: "order" | "courier" | "reason" | "finished" };

const FINISHED = new Set<OrderStatusValue>(["delivered", "cancelled", "returned"]);

export function isFinishedOrder(status: string): boolean {
  return FINISHED.has(status as OrderStatusValue);
}

/**
 * The status after an action, or why it can't apply: steps go forward one at a time (Packing may also start from
 * Placed for cash on delivery confirmed on the phone); a cancelled or returned order puts its items back in stock.
 */
export function nextOrderStatus(current: string, action: OrderAction): OrderMove {
  const from = current as OrderStatusValue;
  if (FINISHED.has(from) && action.type !== "return") return { ok: false, reason: "finished" };
  switch (action.type) {
    case "confirm":
      return from === "placed"
        ? { ok: true, status: "confirmed", restock: false }
        : { ok: false, reason: "order" };
    case "startPacking":
      return from === "confirmed"
        ? { ok: true, status: "processing", restock: false }
        : { ok: false, reason: "order" };
    case "ship":
      if (from !== "processing" && from !== "confirmed") return { ok: false, reason: "order" };
      if (action.courier.trim().length < 2 || action.trackingNumber.trim().length < 3)
        return { ok: false, reason: "courier" };
      return { ok: true, status: "shipped", restock: false };
    case "deliver":
      return from === "shipped"
        ? { ok: true, status: "delivered", restock: false }
        : { ok: false, reason: "order" };
    case "cancel":
      if (from === "shipped") return { ok: false, reason: "order" };
      if (action.reason.trim().length < 3) return { ok: false, reason: "reason" };
      return { ok: true, status: "cancelled", restock: true };
    case "return":
      if (from !== "shipped" && from !== "delivered") return { ok: false, reason: "order" };
      if (action.reason.trim().length < 3) return { ok: false, reason: "reason" };
      return { ok: true, status: "returned", restock: true };
  }
}

export type ProofStatusValue = "received" | "matched" | "verified" | "rejected";

/**
 * A proof matches an order when the reference names it and the amount covers the order's total (customers round
 * up; less than the total is never a match).
 */
export function proofMatches(
  proof: { reference: string; amount: number },
  order: { reference: string; total: number },
): boolean {
  const clean = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "");
  return clean(proof.reference) === clean(order.reference) && proof.amount >= order.total;
}

export type ProofAction = { type: "verify" } | { type: "reject"; reason: string };

export type ProofMove =
  { ok: true; status: ProofStatusValue } | { ok: false; reason: "reason" | "decided" };

export function nextProofStatus(current: string, action: ProofAction): ProofMove {
  if (current === "verified" || current === "rejected") return { ok: false, reason: "decided" };
  if (action.type === "verify") return { ok: true, status: "verified" };
  if (action.reason.trim().length < 3) return { ok: false, reason: "reason" };
  return { ok: true, status: "rejected" };
}

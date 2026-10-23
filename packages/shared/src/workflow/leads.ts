/*
 * Lead status (D0 R4, ADMIN.md §8.2): staff act on a lead (call, WhatsApp, log a quote, convert, close) and the
 * status follows. Stored values keep their meaning ("pending" reads "Waiting for customer", D191). No zod here.
 */

export type LeadStatusValue =
  "new" | "pending" | "in-progress" | "quoted" | "booked" | "cancelled" | "lost" | "spam";

export type ContactChannel = "call" | "whatsapp" | "email" | "note";

export type LeadAction =
  /** Any contact counts as the first reply (sets "first response"); a note on a closed lead changes nothing. */
  | { type: "contact"; channel: ContactChannel }
  /** Log quote or Send quote. */
  | { type: "quote" }
  | { type: "askDocuments" }
  | { type: "askPayment" }
  /** The customer answered: a lead waiting for them is back in progress. */
  | { type: "customerReplied" }
  /** Convert to booking: the booked amount in taka (VAT included) is required. */
  | { type: "convert"; amount: number }
  | { type: "close"; outcome: "lost" | "cancelled"; reason: string }
  | { type: "markSpam" }
  | { type: "reopen"; reason: string };

export type LeadMove =
  | { ok: true; status: LeadStatusValue; firstResponse: boolean; closed: boolean }
  | { ok: false; reason: "closed" | "open" | "amount" | "reason" | "booked" };

const CLOSED = new Set<LeadStatusValue>(["booked", "cancelled", "lost", "spam"]);

export function isClosedLead(status: string): boolean {
  return CLOSED.has(status as LeadStatusValue);
}

const open = (status: LeadStatusValue, firstResponse = false): LeadMove => ({
  ok: true,
  status,
  firstResponse,
  closed: CLOSED.has(status),
});

/**
 * The status after an action, or why it can't apply: a closed lead only takes notes and Reopen, a booking needs its
 * amount, closing and reopening need a reason, a booked lead is never spam.
 */
export function nextLeadStatus(
  current: string,
  action: LeadAction,
  context: { firstResponseAt?: string | null | undefined } = {},
): LeadMove {
  const from = (current as LeadStatusValue) ?? "new";
  const closed = CLOSED.has(from);
  const firstReply = !context.firstResponseAt;
  switch (action.type) {
    case "contact":
      if (closed) return open(from);
      if (from === "new" || from === "pending") return open("in-progress", firstReply);
      return open(from, firstReply);
    case "quote":
      if (closed) return { ok: false, reason: "closed" };
      return open("quoted", firstReply);
    case "askDocuments":
    case "askPayment":
      if (closed) return { ok: false, reason: "closed" };
      return open("pending", firstReply);
    case "customerReplied":
      if (from === "pending") return open("in-progress");
      return open(from);
    case "convert":
      if (closed) return { ok: false, reason: "closed" };
      if (!Number.isInteger(action.amount) || action.amount <= 0)
        return { ok: false, reason: "amount" };
      return open("booked", firstReply);
    case "close":
      if (closed) return { ok: false, reason: "closed" };
      if (action.reason.trim().length < 3) return { ok: false, reason: "reason" };
      return open(action.outcome);
    case "markSpam":
      if (from === "booked") return { ok: false, reason: "booked" };
      return open("spam");
    case "reopen":
      if (!closed) return { ok: false, reason: "open" };
      if (action.reason.trim().length < 3) return { ok: false, reason: "reason" };
      return open("in-progress");
  }
}

/** New, no reply yet, and older than the reply target: the manager is alerted and the lead is marked Overdue. */
export function isOverdueLead(
  lead: { status: string; firstResponseAt?: string | null; createdAt: string },
  slaMinutes: number,
  now: Date = new Date(),
): boolean {
  if (lead.status !== "new" || lead.firstResponseAt) return false;
  const created = Date.parse(lead.createdAt);
  return !Number.isNaN(created) && now.getTime() - created > slaMinutes * 60_000;
}

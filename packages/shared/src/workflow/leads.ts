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

/** The board's columns (D0 R6): the open stages, Booked, and Closed for lost and cancelled leads. Spam stays off it. */
export type LeadBoardColumn = "new" | "in-progress" | "quoted" | "pending" | "booked" | "closed";

export const LEAD_BOARD_COLUMNS: LeadBoardColumn[] = [
  "new",
  "in-progress",
  "quoted",
  "pending",
  "booked",
  "closed",
];

/** The column a lead sits in, or null for spam (never on the board). */
export function boardColumnOf(status: string): LeadBoardColumn | null {
  switch (status) {
    case "new":
    case "in-progress":
    case "quoted":
    case "pending":
    case "booked":
      return status;
    case "lost":
    case "cancelled":
      return "closed";
    default:
      return null;
  }
}

/**
 * What a board move asks for (D0 R6, ADMIN.md §5.5): the same step and inputs as the lead page. `contact` asks how
 * the customer was reached, `ask` whether it waits for documents or payment, `quote` an optional amount, `convert`
 * the booked amount, `close` the outcome and reason, `reopen` a reason; `customerReplied` needs nothing.
 */
export type LeadBoardStep =
  "contact" | "customerReplied" | "quote" | "ask" | "convert" | "close" | "reopen";

export type LeadBoardMove =
  | { ok: true; step: LeadBoardStep }
  /** same: dropped where it was (nothing to do); the rest are said in plain words. */
  | { ok: false; reason: "same" | "backToNew" | "reopenFirst" | "quotedBack" | "notOnBoard" };

export function leadStepForMove(status: string, to: LeadBoardColumn): LeadBoardMove {
  const from = boardColumnOf(status);
  if (from === null) return { ok: false, reason: "notOnBoard" };
  if (from === to) return { ok: false, reason: "same" };
  if (to === "new") return { ok: false, reason: "backToNew" };
  // Booked, lost and cancelled leads come back only through Reopen, which lands in progress.
  if (from === "booked" || from === "closed")
    return to === "in-progress"
      ? { ok: true, step: "reopen" }
      : { ok: false, reason: "reopenFirst" };
  switch (to) {
    case "in-progress":
      if (from === "new") return { ok: true, step: "contact" };
      if (from === "pending") return { ok: true, step: "customerReplied" };
      return { ok: false, reason: "quotedBack" };
    case "quoted":
      return { ok: true, step: "quote" };
    case "pending":
      return { ok: true, step: "ask" };
    case "booked":
      return { ok: true, step: "convert" };
    case "closed":
      return { ok: true, step: "close" };
  }
}

/**
 * The reply timer on a new lead (D0 R6): minutes left before the reply target, or minutes past it. Null once
 * someone has replied or the lead has moved on. Rendered on the client so it counts in the browser's minute.
 */
export function replyTimer(
  lead: { status: string; firstResponseAt?: string | null; createdAt: string },
  slaMinutes: number,
  now: Date = new Date(),
): { overdue: false; minutesLeft: number } | { overdue: true; minutesOver: number } | null {
  if (lead.status !== "new" || lead.firstResponseAt) return null;
  const created = Date.parse(lead.createdAt);
  if (Number.isNaN(created)) return null;
  // The same line as isOverdueLead: overdue once the target has passed, by at least a minute.
  const past = now.getTime() - created - slaMinutes * 60_000;
  return past > 0
    ? { overdue: true, minutesOver: Math.max(1, Math.floor(past / 60_000)) }
    : { overdue: false, minutesLeft: Math.ceil(-past / 60_000) };
}

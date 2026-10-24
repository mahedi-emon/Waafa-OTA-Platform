import { describe, expect, it } from "vitest";
import {
  boardColumnOf,
  isClosedLead,
  isOverdueLead,
  LEAD_BOARD_COLUMNS,
  leadStepForMove,
  nextLeadStatus,
  replyTimer,
} from "./leads";

describe("lead status from actions (D0 R4)", () => {
  it("moves a new lead to In progress on the first contact and stamps the first response", () => {
    expect(nextLeadStatus("new", { type: "contact", channel: "call" })).toEqual({
      ok: true,
      status: "in-progress",
      firstResponse: true,
      closed: false,
    });
    expect(
      nextLeadStatus(
        "new",
        { type: "contact", channel: "whatsapp" },
        { firstResponseAt: "2026-10-23T04:00:00.000Z" },
      ),
    ).toMatchObject({ status: "in-progress", firstResponse: false });
  });

  it("waits for the customer after asking for documents or payment, and resumes when they reply", () => {
    expect(nextLeadStatus("in-progress", { type: "askDocuments" })).toMatchObject({
      status: "pending",
    });
    expect(nextLeadStatus("quoted", { type: "askPayment" })).toMatchObject({ status: "pending" });
    expect(nextLeadStatus("pending", { type: "customerReplied" })).toMatchObject({
      status: "in-progress",
    });
    expect(nextLeadStatus("quoted", { type: "customerReplied" })).toMatchObject({
      status: "quoted",
    });
  });

  it("needs the booked amount to convert and a reason to close or reopen", () => {
    expect(nextLeadStatus("quoted", { type: "convert", amount: 146480 })).toEqual({
      ok: true,
      status: "booked",
      firstResponse: true,
      closed: true,
    });
    expect(nextLeadStatus("quoted", { type: "convert", amount: 0 })).toEqual({
      ok: false,
      reason: "amount",
    });
    expect(nextLeadStatus("quoted", { type: "convert", amount: 99.5 })).toEqual({
      ok: false,
      reason: "amount",
    });
    expect(nextLeadStatus("in-progress", { type: "close", outcome: "lost", reason: "" })).toEqual({
      ok: false,
      reason: "reason",
    });
    expect(
      nextLeadStatus("in-progress", {
        type: "close",
        outcome: "lost",
        reason: "Chose another agent",
      }),
    ).toMatchObject({ ok: true, status: "lost", closed: true });
    expect(nextLeadStatus("lost", { type: "reopen", reason: "ok" })).toEqual({
      ok: false,
      reason: "reason",
    });
    expect(nextLeadStatus("lost", { type: "reopen", reason: "Called back" })).toMatchObject({
      ok: true,
      status: "in-progress",
      closed: false,
    });
  });

  it("keeps a closed lead closed: notes only, no quotes or bookings until it is reopened", () => {
    expect(nextLeadStatus("booked", { type: "contact", channel: "note" })).toMatchObject({
      ok: true,
      status: "booked",
    });
    expect(nextLeadStatus("cancelled", { type: "quote" })).toEqual({ ok: false, reason: "closed" });
    expect(nextLeadStatus("spam", { type: "convert", amount: 5000 })).toEqual({
      ok: false,
      reason: "closed",
    });
    expect(nextLeadStatus("in-progress", { type: "reopen", reason: "Called back" })).toEqual({
      ok: false,
      reason: "open",
    });
  });

  it("never marks a booked lead as spam", () => {
    expect(nextLeadStatus("booked", { type: "markSpam" })).toEqual({ ok: false, reason: "booked" });
    expect(nextLeadStatus("new", { type: "markSpam" })).toMatchObject({ ok: true, status: "spam" });
  });

  it("knows the closed statuses", () => {
    expect(["booked", "cancelled", "lost", "spam"].every(isClosedLead)).toBe(true);
    expect(["new", "pending", "in-progress", "quoted"].some(isClosedLead)).toBe(false);
  });
});

describe("overdue leads (D0 R4)", () => {
  const createdAt = "2026-10-23T04:00:00.000Z";

  it("is overdue when new, unanswered and older than the reply target", () => {
    expect(
      isOverdueLead({ status: "new", createdAt }, 30, new Date("2026-10-23T04:31:00.000Z")),
    ).toBe(true);
    expect(
      isOverdueLead({ status: "new", createdAt }, 30, new Date("2026-10-23T04:29:00.000Z")),
    ).toBe(false);
  });

  it("is never overdue once someone replied or the lead moved on", () => {
    const late = new Date("2026-10-23T09:00:00.000Z");
    expect(isOverdueLead({ status: "new", createdAt, firstResponseAt: createdAt }, 30, late)).toBe(
      false,
    );
    expect(isOverdueLead({ status: "in-progress", createdAt }, 30, late)).toBe(false);
  });
});

describe("board moves ask for the lead page's steps (D0 R6)", () => {
  it("puts every lead but spam in a column", () => {
    expect(boardColumnOf("pending")).toBe("pending");
    expect(boardColumnOf("lost")).toBe("closed");
    expect(boardColumnOf("cancelled")).toBe("closed");
    expect(boardColumnOf("spam")).toBeNull();
  });

  it("asks for a contact, a quote, a wait, a booking or a close from open stages", () => {
    expect(leadStepForMove("new", "in-progress")).toEqual({ ok: true, step: "contact" });
    expect(leadStepForMove("pending", "in-progress")).toEqual({
      ok: true,
      step: "customerReplied",
    });
    expect(leadStepForMove("new", "quoted")).toEqual({ ok: true, step: "quote" });
    expect(leadStepForMove("quoted", "pending")).toEqual({ ok: true, step: "ask" });
    expect(leadStepForMove("in-progress", "booked")).toEqual({ ok: true, step: "convert" });
    expect(leadStepForMove("pending", "closed")).toEqual({ ok: true, step: "close" });
  });

  it("brings booked and closed leads back only through Reopen", () => {
    expect(leadStepForMove("booked", "in-progress")).toEqual({ ok: true, step: "reopen" });
    expect(leadStepForMove("lost", "in-progress")).toEqual({ ok: true, step: "reopen" });
    expect(leadStepForMove("cancelled", "quoted")).toEqual({ ok: false, reason: "reopenFirst" });
    expect(leadStepForMove("booked", "closed")).toEqual({ ok: false, reason: "reopenFirst" });
  });

  it("refuses moves the rules don't have, and ignores a drop in the same column", () => {
    expect(leadStepForMove("quoted", "new")).toEqual({ ok: false, reason: "backToNew" });
    expect(leadStepForMove("quoted", "in-progress")).toEqual({ ok: false, reason: "quotedBack" });
    expect(leadStepForMove("quoted", "quoted")).toEqual({ ok: false, reason: "same" });
    expect(leadStepForMove("lost", "closed")).toEqual({ ok: false, reason: "same" });
    expect(leadStepForMove("spam", "in-progress")).toEqual({ ok: false, reason: "notOnBoard" });
  });

  it("never offers a step the status rules would refuse", () => {
    const steps = {
      contact: { type: "contact", channel: "call" },
      customerReplied: { type: "customerReplied" },
      quote: { type: "quote" },
      ask: { type: "askDocuments" },
      convert: { type: "convert", amount: 5000 },
      close: { type: "close", outcome: "lost", reason: "Booked elsewhere" },
      reopen: { type: "reopen", reason: "They called back" },
    } as const;
    for (const status of ["new", "in-progress", "quoted", "pending", "booked", "lost", "cancelled"])
      for (const to of LEAD_BOARD_COLUMNS) {
        const move = leadStepForMove(status, to);
        if (!move.ok) continue;
        const next = nextLeadStatus(status, steps[move.step]);
        expect(next.ok, `${status} → ${to}`).toBe(true);
        if (next.ok) expect(boardColumnOf(next.status), `${status} → ${to}`).toBe(to);
      }
  });
});

describe("reply timer (D0 R6)", () => {
  const createdAt = "2026-10-23T04:00:00.000Z";
  const at = (iso: string) => new Date(iso);

  it("counts down to the reply target, then counts the minutes past it", () => {
    expect(replyTimer({ status: "new", createdAt }, 30, at("2026-10-23T04:12:00.000Z"))).toEqual({
      overdue: false,
      minutesLeft: 18,
    });
    expect(replyTimer({ status: "new", createdAt }, 30, at("2026-10-23T04:29:30.000Z"))).toEqual({
      overdue: false,
      minutesLeft: 1,
    });
    expect(replyTimer({ status: "new", createdAt }, 30, at("2026-10-23T04:30:20.000Z"))).toEqual({
      overdue: true,
      minutesOver: 1,
    });
    expect(replyTimer({ status: "new", createdAt }, 30, at("2026-10-23T05:45:00.000Z"))).toEqual({
      overdue: true,
      minutesOver: 75,
    });
  });

  it("agrees with the overdue mark, and stops once someone replied", () => {
    const now = at("2026-10-23T04:31:00.000Z");
    expect(replyTimer({ status: "new", createdAt }, 30, now)?.overdue).toBe(
      isOverdueLead({ status: "new", createdAt }, 30, now),
    );
    expect(
      replyTimer({ status: "new", createdAt, firstResponseAt: createdAt }, 30, now),
    ).toBeNull();
    expect(replyTimer({ status: "quoted", createdAt }, 30, now)).toBeNull();
  });
});

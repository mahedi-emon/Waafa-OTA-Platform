import { describe, expect, it } from "vitest";
import { isClosedLead, isOverdueLead, nextLeadStatus } from "./leads";

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

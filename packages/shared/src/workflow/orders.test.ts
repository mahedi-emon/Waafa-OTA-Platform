import { describe, expect, it } from "vitest";
import { isFinishedOrder, nextOrderStatus, nextProofStatus, proofMatches } from "./orders";

describe("order status from actions (D0 R4)", () => {
  it("goes forward one step at a time", () => {
    expect(nextOrderStatus("placed", { type: "confirm", by: "proof" })).toEqual({
      ok: true,
      status: "confirmed",
      restock: false,
    });
    expect(nextOrderStatus("confirmed", { type: "startPacking" })).toMatchObject({
      status: "processing",
    });
    expect(
      nextOrderStatus("processing", {
        type: "ship",
        courier: "Pathao",
        trackingNumber: "PA123456",
      }),
    ).toMatchObject({ status: "shipped" });
    expect(nextOrderStatus("shipped", { type: "deliver" })).toMatchObject({ status: "delivered" });
  });

  it("refuses skipped or backward steps", () => {
    expect(nextOrderStatus("placed", { type: "deliver" })).toEqual({ ok: false, reason: "order" });
    expect(nextOrderStatus("placed", { type: "startPacking" })).toEqual({
      ok: false,
      reason: "order",
    });
    expect(nextOrderStatus("shipped", { type: "confirm", by: "call" })).toEqual({
      ok: false,
      reason: "order",
    });
  });

  it("needs a courier and tracking number to ship", () => {
    expect(
      nextOrderStatus("processing", { type: "ship", courier: "", trackingNumber: "PA123456" }),
    ).toEqual({ ok: false, reason: "courier" });
    expect(
      nextOrderStatus("confirmed", { type: "ship", courier: "Steadfast", trackingNumber: " 1 " }),
    ).toEqual({ ok: false, reason: "courier" });
  });

  it("cancels before shipping and returns after, both with a reason, and puts the items back", () => {
    expect(nextOrderStatus("confirmed", { type: "cancel", reason: "Customer asked" })).toEqual({
      ok: true,
      status: "cancelled",
      restock: true,
    });
    expect(nextOrderStatus("confirmed", { type: "cancel", reason: "" })).toEqual({
      ok: false,
      reason: "reason",
    });
    expect(nextOrderStatus("shipped", { type: "cancel", reason: "Customer asked" })).toEqual({
      ok: false,
      reason: "order",
    });
    expect(nextOrderStatus("delivered", { type: "return", reason: "Wrong model" })).toEqual({
      ok: true,
      status: "returned",
      restock: true,
    });
    expect(nextOrderStatus("processing", { type: "return", reason: "Wrong model" })).toEqual({
      ok: false,
      reason: "order",
    });
  });

  it("changes nothing on a finished order", () => {
    expect(nextOrderStatus("cancelled", { type: "confirm", by: "call" })).toEqual({
      ok: false,
      reason: "finished",
    });
    expect(nextOrderStatus("returned", { type: "return", reason: "Twice" })).toEqual({
      ok: false,
      reason: "order",
    });
    expect(["delivered", "cancelled", "returned"].every(isFinishedOrder)).toBe(true);
    expect(isFinishedOrder("shipped")).toBe(false);
  });
});

describe("payment proofs (D0 R4)", () => {
  const order = { reference: "WW-24031", total: 4850 };

  it("matches on the order reference and an amount that covers the total", () => {
    expect(proofMatches({ reference: " ww-24031 ", amount: 4850 }, order)).toBe(true);
    expect(proofMatches({ reference: "WW-24031", amount: 4900 }, order)).toBe(true);
    expect(proofMatches({ reference: "WW-24031", amount: 4849 }, order)).toBe(false);
    expect(proofMatches({ reference: "WW-24032", amount: 4850 }, order)).toBe(false);
  });

  it("is verified or rejected once, and a rejection needs a reason", () => {
    expect(nextProofStatus("matched", { type: "verify" })).toEqual({
      ok: true,
      status: "verified",
    });
    expect(nextProofStatus("received", { type: "reject", reason: "no" })).toEqual({
      ok: false,
      reason: "reason",
    });
    expect(nextProofStatus("received", { type: "reject", reason: "Amount is short" })).toEqual({
      ok: true,
      status: "rejected",
    });
    expect(nextProofStatus("verified", { type: "reject", reason: "Changed my mind" })).toEqual({
      ok: false,
      reason: "decided",
    });
  });
});

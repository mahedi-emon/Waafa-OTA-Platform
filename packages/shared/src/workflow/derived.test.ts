import { describe, expect, it } from "vitest";
import {
  couponStatus,
  groupFareStatus,
  productStockStatus,
  staffStatus,
  stockStatus,
  visaStage,
  windowStatus,
} from "./derived";

const now = new Date("2026-10-23T10:00:00+06:00");

describe("group fare status (D0 R4)", () => {
  const fare = { expiresAt: "2026-10-30T18:00:00+06:00", departDate: "2026-11-05" };

  it("counts seats: open, a few left at 3 or fewer, sold out at 0", () => {
    expect(groupFareStatus({ ...fare, seatsLeft: 12 }, now)).toBe("open");
    expect(groupFareStatus({ ...fare, seatsLeft: 3 }, now)).toBe("fewSeats");
    expect(groupFareStatus({ ...fare, seatsLeft: 0 }, now)).toBe("soldOut");
    expect(groupFareStatus(fare, now)).toBe("open");
  });

  it("expires after the booking deadline or once the departure day is over in Dhaka", () => {
    expect(groupFareStatus({ ...fare, expiresAt: "2026-10-23T09:59:00+06:00" }, now)).toBe(
      "expired",
    );
    expect(groupFareStatus({ ...fare, departDate: "2026-10-23" }, now)).toBe("open");
    expect(groupFareStatus({ ...fare, departDate: "2026-10-22" }, now)).toBe("expired");
  });
});

describe("coupon status (D0 R4)", () => {
  const coupon = { enabled: true, startsAt: "2026-10-01T00:00:00+06:00" };

  it("is active inside its dates, scheduled before, expired after", () => {
    expect(couponStatus(coupon, 0, now)).toBe("active");
    expect(couponStatus({ ...coupon, startsAt: "2026-10-24T00:00:00+06:00" }, 0, now)).toBe(
      "scheduled",
    );
    expect(couponStatus({ ...coupon, endsAt: "2026-10-23T09:00:00+06:00" }, 0, now)).toBe(
      "expired",
    );
  });

  it("is used up at its limit and off when switched off", () => {
    expect(couponStatus({ ...coupon, maxUses: 50 }, 49, now)).toBe("active");
    expect(couponStatus({ ...coupon, maxUses: 50 }, 50, now)).toBe("usedUp");
    expect(couponStatus({ ...coupon, enabled: false }, 0, now)).toBe("off");
  });
});

describe("window, stock and staff statuses (D0 R4)", () => {
  it("shows a banner, deal or announcement only inside its window", () => {
    expect(windowStatus({}, now)).toBe("live");
    expect(windowStatus({ startsAt: "2026-10-24T00:00:00+06:00" }, now)).toBe("scheduled");
    expect(windowStatus({ endsAt: "2026-10-23T10:00:00+06:00" }, now)).toBe("ended");
    expect(
      windowStatus(
        { startsAt: "2026-10-20T00:00:00+06:00", endsAt: "2026-10-31T23:59:00+06:00" },
        now,
      ),
    ).toBe("live");
  });

  it("reads stock against the low-stock threshold", () => {
    expect(stockStatus(0, 5)).toBe("outOfStock");
    expect(stockStatus(-2, 5)).toBe("outOfStock");
    expect(stockStatus(5, 5)).toBe("lowStock");
    expect(stockStatus(6, 5)).toBe("inStock");
  });

  it("reads a product across its variants, pre-orders never out", () => {
    const variant = (stock: number, preOrder = false) => ({ stock, lowStockAt: 3, preOrder });
    expect(productStockStatus([variant(12), variant(8)])).toBe("inStock");
    expect(productStockStatus([variant(12), variant(2)])).toBe("lowStock");
    expect(productStockStatus([variant(12), variant(0)])).toBe("lowStock");
    expect(productStockStatus([variant(0), variant(0)])).toBe("outOfStock");
    expect(productStockStatus([variant(0, true)])).toBe("inStock");
    expect(productStockStatus([])).toBe("outOfStock");
  });

  it("keeps staff Invited until the first sign-in", () => {
    expect(staffStatus({ status: "active" })).toBe("invited");
    expect(staffStatus({ status: "active", lastLoginAt: "2026-10-22T04:00:00.000Z" })).toBe(
      "active",
    );
    expect(
      staffStatus({ status: "active", lastLoginAt: "2026-10-22T04:00:00.000Z", locked: true }),
    ).toBe("locked");
    expect(staffStatus({ status: "deactivated", locked: true })).toBe("deactivated");
  });
});

describe("visa application stage (D0 R4)", () => {
  const documents = [
    { required: true, received: true },
    { required: true, received: false },
    { required: false, received: false },
  ];

  it("waits for every required document, then is ready to submit", () => {
    expect(visaStage({ documents })).toEqual({
      stage: "documentsPending",
      received: 1,
      required: 2,
    });
    expect(
      visaStage({ documents: documents.map((document) => ({ ...document, received: true })) }),
    ).toMatchObject({ stage: "readyToSubmit", received: 2, required: 2 });
  });

  it("follows the outcome steps after submission", () => {
    const submitted = { documents, submittedAt: "2026-10-20T04:00:00.000Z" };
    expect(visaStage(submitted).stage).toBe("submitted");
    expect(visaStage({ ...submitted, outcome: "approved" }).stage).toBe("approved");
    expect(visaStage({ ...submitted, outcome: "rejected" }).stage).toBe("rejected");
    expect(
      visaStage({
        ...submitted,
        outcome: "approved",
        passportReturnedAt: "2026-10-22T04:00:00.000Z",
      }).stage,
    ).toBe("passportReturned");
    expect(visaStage({ ...submitted, cancelled: true }).stage).toBe("cancelled");
  });
});

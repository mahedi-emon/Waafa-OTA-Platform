/*
 * Statuses that follow from dates, limits and quantities (D0 R4, ADMIN.md §8.6): nobody sets them, they are read
 * from the record each time. No zod here.
 */

const time = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : at;
};

/** Group fares: Sold out at 0 seats, Expired after the booking deadline or the departure day. */
export type GroupFareState = "open" | "fewSeats" | "soldOut" | "expired";

export function groupFareStatus(
  fare: { seatsLeft?: number | undefined; expiresAt: string; departDate: string },
  now: Date = new Date(),
): GroupFareState {
  const at = now.getTime();
  const deadline = time(fare.expiresAt);
  // A departure day is over at the end of that day in Dhaka (UTC+6).
  const departs = time(`${fare.departDate}T23:59:59+06:00`);
  if ((deadline !== null && deadline <= at) || (departs !== null && departs < at)) return "expired";
  if (fare.seatsLeft !== undefined && fare.seatsLeft <= 0) return "soldOut";
  if (fare.seatsLeft !== undefined && fare.seatsLeft <= 3) return "fewSeats";
  return "open";
}

/** Coupons: Off, Scheduled, Active, Used up (uses reached the limit), Expired. */
export type CouponState = "off" | "scheduled" | "active" | "usedUp" | "expired";

export function couponStatus(
  coupon: {
    enabled: boolean;
    startsAt: string;
    endsAt?: string | undefined;
    maxUses?: number | undefined;
  },
  uses: number,
  now: Date = new Date(),
): CouponState {
  const at = now.getTime();
  const ends = time(coupon.endsAt);
  if (ends !== null && ends <= at) return "expired";
  if (!coupon.enabled) return "off";
  const starts = time(coupon.startsAt);
  if (starts !== null && starts > at) return "scheduled";
  if (coupon.maxUses !== undefined && uses >= coupon.maxUses) return "usedUp";
  return "active";
}

/** Banners, deals and announcements: Scheduled, Live or Ended from their start and end. */
export type WindowState = "scheduled" | "live" | "ended";

export function windowStatus(
  record: { startsAt?: string | null | undefined; endsAt?: string | null | undefined },
  now: Date = new Date(),
): WindowState {
  const at = now.getTime();
  const starts = time(record.startsAt);
  const ends = time(record.endsAt);
  if (ends !== null && ends <= at) return "ended";
  if (starts !== null && starts > at) return "scheduled";
  return "live";
}

/** Products: In stock, Low stock (the threshold in Settings, a variant may set its own), Out of stock. */
export type StockState = "inStock" | "lowStock" | "outOfStock";

export function stockStatus(quantity: number, threshold: number): StockState {
  if (quantity <= 0) return "outOfStock";
  if (quantity <= threshold) return "lowStock";
  return "inStock";
}

/**
 * A product across its variants: Out of stock when no variant can be sold, Low stock when any variant is low or out
 * (pre-order variants never run out), else In stock.
 */
export function productStockStatus(
  variants: ReadonlyArray<{ stock: number; lowStockAt: number; preOrder?: boolean | undefined }>,
): StockState {
  if (!variants.some((variant) => variant.preOrder || variant.stock > 0)) return "outOfStock";
  const short = variants.some(
    (variant) => !variant.preOrder && stockStatus(variant.stock, variant.lowStockAt) !== "inStock",
  );
  return short ? "lowStock" : "inStock";
}

/** Staff accounts: Invited until the first sign-in, then Active; Deactivated by an action; Locked while sign-in is. */
export type StaffState = "invited" | "active" | "deactivated" | "locked";

export function staffStatus(user: {
  status: string;
  lastLoginAt?: string | null | undefined;
  locked?: boolean | undefined;
}): StaffState {
  if (user.status === "deactivated") return "deactivated";
  if (user.locked) return "locked";
  if (!user.lastLoginAt) return "invited";
  return "active";
}

/** Visa applications: the stage comes from the documents checklist and the outcome steps (ADMIN.md §8.3). */
export type VisaStage =
  | "documentsPending"
  | "readyToSubmit"
  | "submitted"
  | "approved"
  | "rejected"
  | "passportReturned"
  | "cancelled";

export type VisaProgressFacts = {
  documents: Array<{ required: boolean; received: boolean }>;
  submittedAt?: string | null | undefined;
  outcome?: "approved" | "rejected" | null | undefined;
  passportReturnedAt?: string | null | undefined;
  cancelled?: boolean | undefined;
};

export function visaStage(application: VisaProgressFacts): {
  stage: VisaStage;
  received: number;
  required: number;
} {
  const required = application.documents.filter((document) => document.required);
  const received = required.filter((document) => document.received).length;
  const counts = { received, required: required.length };
  if (application.cancelled) return { stage: "cancelled", ...counts };
  if (application.passportReturnedAt) return { stage: "passportReturned", ...counts };
  if (application.outcome === "approved") return { stage: "approved", ...counts };
  if (application.outcome === "rejected") return { stage: "rejected", ...counts };
  if (application.submittedAt) return { stage: "submitted", ...counts };
  if (received >= required.length) return { stage: "readyToSubmit", ...counts };
  return { stage: "documentsPending", ...counts };
}

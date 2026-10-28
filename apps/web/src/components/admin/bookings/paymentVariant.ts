import type { PaymentStatus } from "@waafa/shared";

/** Payment chip colours for bookings (issue 242): the words always say the state, colour only repeats it. */
export const PAYMENT_VARIANT: Record<PaymentStatus, "danger" | "warning" | "success" | "neutral"> =
  {
    unpaid: "danger",
    partial: "warning",
    paid: "success",
    refunded: "neutral",
  };

"use server";

import { BookingUpdateInputSchema, type BookingView } from "@waafa/shared";
import { adminWrite, type AdminResult } from "./adminApi";

/** Saves a booking's PNR, tickets, payments and notes (issue 242); the API checks access and writes the audit log. */
export async function updateBooking(id: string, input: unknown): Promise<AdminResult<BookingView>> {
  const parsed = BookingUpdateInputSchema.safeParse(input);
  if (!/^[a-z0-9]{10,40}$/.test(id) || !parsed.success) {
    return {
      ok: false,
      problem: {
        status: 422,
        title: "Validation failed",
        fields: parsed.success
          ? []
          : parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
      },
    };
  }
  return adminWrite<BookingView>(`/admin/bookings/${id}`, "PATCH", parsed.data);
}

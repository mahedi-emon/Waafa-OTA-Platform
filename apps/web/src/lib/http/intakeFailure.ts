import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/data/api/apiClient";

/**
 * The reply when a submission could not be stored: the API's own rate limit stays a 429 (the form says "too many
 * tries"), everything else is a 503 the form offers to retry with the same idempotency key.
 */
export function intakeFailure(error: unknown) {
  if (error instanceof ApiError && error.status === 429) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  return NextResponse.json({ error: "unavailable" }, { status: 503 });
}

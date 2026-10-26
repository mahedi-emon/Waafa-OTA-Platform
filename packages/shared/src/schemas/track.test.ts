import { describe, expect, it } from "vitest";
import { TrackInputSchema, TrackResultSchema } from "./track";

describe("/track contracts (issue 240)", () => {
  it("upper-cases the reference and needs both fields", () => {
    expect(
      TrackInputSchema.parse({ reference: " flt-261027-0001 ", phone: "01712345678" }),
    ).toEqual({
      reference: "FLT-261027-0001",
      phone: "01712345678",
    });
    expect(TrackInputSchema.safeParse({ reference: "FLT", phone: "01712345678" }).success).toBe(
      false,
    );
    expect(TrackInputSchema.safeParse({ reference: "FLT-261027-0001" }).success).toBe(false);
  });

  it("describes a request with its steps only, and refuses personal fields", () => {
    const request = {
      kind: "request",
      reference: "VSA-261027-0001",
      module: "visa",
      status: "in-progress",
      createdAt: "2026-10-27T10:00:00+06:00",
      respondedAt: null,
      closedAt: null,
      visa: {
        stage: "submitted",
        received: 4,
        required: 4,
        submittedOn: "2026-10-28",
        passportReturnedOn: null,
      },
    };
    expect(TrackResultSchema.safeParse(request).success).toBe(true);
    expect(TrackResultSchema.safeParse({ ...request, name: "Rahim" }).success).toBe(false);
    expect(TrackResultSchema.safeParse({ ...request, kind: "lead" }).success).toBe(false);
  });
});

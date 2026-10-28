import { describe, expect, it } from "vitest";
import { parseLiveEvent } from "./liveEvents";

describe("parseLiveEvent (issue 243)", () => {
  it("reads a lead event from the stream", () => {
    const event = parseLiveEvent(
      JSON.stringify({
        type: "lead",
        title: "Sample Traveller · FLT-261101-0001",
        detail: "DAC → DXB",
        href: "/secure-admin-control/leads/abc",
        at: "2026-11-01T10:00:00+06:00",
      }),
    );
    expect(event).toMatchObject({ type: "lead", href: "/secure-admin-control/leads/abc" });
  });

  it("drops unknown kinds, links outside the admin and broken data", () => {
    expect(
      parseLiveEvent(JSON.stringify({ type: "x", title: "a", href: "/secure-admin-control" })),
    ).toBeNull();
    expect(
      parseLiveEvent(JSON.stringify({ type: "lead", title: "a", href: "https://evil.example/" })),
    ).toBeNull();
    expect(parseLiveEvent("{not json")).toBeNull();
  });
});

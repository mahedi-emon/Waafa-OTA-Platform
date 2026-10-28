import { describe, expect, it } from "vitest";
import { quoteBadge } from "./quoteBadge";

describe("quoteBadge (issue 298)", () => {
  it("says Expired over an open quote past its day, and the status otherwise", () => {
    expect(quoteBadge("sent", true)).toEqual({ state: "expired", variant: "warning" });
    expect(quoteBadge("sent", false)).toEqual({ state: "sent", variant: "brand" });
    expect(quoteBadge("accepted", false)).toEqual({ state: "accepted", variant: "success" });
    expect(quoteBadge("draft", false).variant).toBe("neutral");
  });
});

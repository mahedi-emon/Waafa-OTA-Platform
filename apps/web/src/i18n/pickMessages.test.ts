import { describe, expect, it } from "vitest";
import { pickMessages } from "./pickMessages";

describe("pickMessages", () => {
  const messages = { Common: { a: "A" }, Search: { b: "B" }, Footer: { c: "C" } };

  it("keeps only the requested namespaces", () => {
    expect(pickMessages(messages, ["Search"])).toEqual({ Search: { b: "B" } });
    expect(pickMessages(messages, ["Common", "Footer"])).toEqual({
      Common: { a: "A" },
      Footer: { c: "C" },
    });
  });

  it("ignores namespaces that do not exist", () => {
    expect(pickMessages(messages, ["Missing"])).toEqual({});
  });
});

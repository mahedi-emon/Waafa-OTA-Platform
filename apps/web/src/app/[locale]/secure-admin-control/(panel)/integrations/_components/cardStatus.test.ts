import { describe, expect, it } from "vitest";
import { cardStatus } from "./cardStatus";

const at = "2026-10-28T10:05:00+06:00";

describe("cardStatus (issue 284)", () => {
  it("says Off, No keys saved, Not tested, Connected or Failing with the error and Dhaka time", () => {
    expect(cardStatus({ isActive: false }, { health: { ok: true, message: "", at } })).toEqual({
      kind: "off",
    });
    expect(cardStatus({ isActive: true }, undefined)).toEqual({ kind: "notConnected" });
    expect(cardStatus({ isActive: true }, { health: null })).toEqual({ kind: "notTested" });
    expect(cardStatus({ isActive: true }, { health: { ok: true, message: "ok", at } })).toEqual({
      kind: "connected",
    });
    expect(
      cardStatus(
        { isActive: true },
        { health: { ok: false, message: "Telegram does not know this bot token", at } },
      ),
    ).toEqual({
      kind: "failing",
      message: "Telegram does not know this bot token",
      at: "28 Oct 2026, 10:05",
    });
  });
});

import { describe, expect, it } from "vitest";
import { pasteIntoLines } from "./lines";

describe("pasteIntoLines", () => {
  it("makes one row per pasted line, in place of the row pasted into", () => {
    expect(
      pasteIntoLines(["Flights", "", "Visa"], 1, 0, 0, "Hotel\r\nTransfers\n\n  Tours  \n"),
    ).toEqual(["Flights", "Hotel", "Transfers", "Tours", "Visa"]);
  });

  it("keeps the words around the cursor on the first and last rows", () => {
    expect(pasteIntoLines(["Meals: "], 0, 7, 7, "breakfast\ndinner")).toEqual([
      "Meals: breakfast",
      "dinner",
    ]);
    expect(pasteIntoLines([" (on request)"], 0, 0, 0, "Hotel\nTransfers")).toEqual([
      "Hotel",
      "Transfers (on request)",
    ]);
    expect(pasteIntoLines(["Breakfast and dinner"], 0, 10, 20, "lunch\nsnacks")).toEqual([
      "Breakfast lunch",
      "snacks",
    ]);
  });

  it("leaves a one-line paste to the browser", () => {
    expect(pasteIntoLines(["Flights"], 0, 7, 7, " and hotel")).toBeNull();
    expect(pasteIntoLines(["Flights"], 0, 7, 7, "\nHotel\n")).toBeNull();
  });
});

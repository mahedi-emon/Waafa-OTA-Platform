import { describe, expect, it } from "vitest";
import { conversionPercent, todayCards, weekChange } from "./todayQueue";

describe("dashboard queue and KPIs", () => {
  it("shows a card for each count this person gets, in working order, zero included", () => {
    const cards = todayCards({ proofsToVerify: 0, newLeads: 3, sampleLeft: 12 });
    expect(cards.map((card) => [card.key, card.count])).toEqual([
      ["newLeads", 3],
      ["proofsToVerify", 0],
      ["sampleLeft", 12],
    ]);
    expect(cards[0]?.href).toBe("/secure-admin-control/leads?status=new");
    expect(todayCards({})).toEqual([]);
  });

  it("says how a week compares with the week before, and the booking rate", () => {
    expect(weekChange(9, 5)).toEqual({ direction: "up", by: 4 });
    expect(weekChange(2, 6)).toEqual({ direction: "down", by: 4 });
    expect(weekChange(0, 0)).toEqual({ direction: "same", by: 0 });
    expect(conversionPercent(3, 8)).toBe(38);
    expect(conversionPercent(1, 0)).toBe(0);
  });
});

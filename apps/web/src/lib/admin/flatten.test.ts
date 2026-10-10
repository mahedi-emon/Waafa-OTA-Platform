import { describe, expect, it } from "vitest";
import { flattenForDisplay } from "./flatten";

describe("flattenForDisplay", () => {
  it("turns a flight request into readable rows", () => {
    const rows = flattenForDisplay({
      module: "flights",
      search: {
        tripType: "one-way",
        legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
        travellers: { adults: 2, childAges: [5, 9], infants: 0 },
        directOnly: false,
      },
      notes: "",
    });
    expect(rows).toEqual([
      { label: "Search › Trip type", value: "one-way" },
      { label: "Search › Legs › 1 › From", value: "DAC" },
      { label: "Search › Legs › 1 › To", value: "DXB" },
      { label: "Search › Legs › 1 › Date", value: "14 Nov 2026" },
      { label: "Search › Travellers › Adults", value: "2" },
      { label: "Search › Travellers › Child ages", value: "5, 9" },
      { label: "Search › Travellers › Infants", value: "0" },
      { label: "Search › Direct only", value: "No" },
    ]);
  });
});

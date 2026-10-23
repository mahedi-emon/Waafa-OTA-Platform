import { describe, expect, it } from "vitest";
import { csvCell, rowsToCsv } from "./csv";

describe("list CSV (D0 R5)", () => {
  it("quotes cells and defuses formulas", () => {
    expect(csvCell('Bali "5 days"')).toBe('"Bali ""5 days"""');
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
  });

  it("writes the rows in the words the list shows", () => {
    const csv = rowsToCsv(
      [
        {
          id: "bali",
          title: "Bali temples",
          chips: [{ family: "record", name: "live", label: "Live" }],
          facts: { price: { text: "৳64,900", kind: "money" } },
        },
      ],
      [
        { key: "name", label: "Package" },
        { key: "status", label: "Status" },
        { key: "price", label: "Price from" },
      ],
    );
    expect(csv).toBe('"Package","Status","Price from"\r\n"Bali temples","Live","৳64,900"');
  });
});

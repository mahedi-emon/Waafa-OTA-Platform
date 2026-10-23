import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "../common/csv";
import { mergeCustomers, sortCustomers } from "./customers.service";
import { dhakaDay, median, topProducts } from "./reports.service";

describe("reports (#111)", () => {
  it("takes the median of first-response times", () => {
    expect(median([])).toBeNull();
    expect(median([30])).toBe(30);
    expect(median([5, 50, 10])).toBe(10);
    expect(median([4, 10, 8, 2])).toBe(6);
  });

  it("counts days in Asia/Dhaka, not UTC", () => {
    expect(dhakaDay(new Date("2026-10-11T18:30:00Z"))).toBe("2026-10-12");
    expect(dhakaDay(new Date("2026-10-11T17:59:00Z"))).toBe("2026-10-11");
  });

  it("ranks best sellers by revenue from order snapshots", () => {
    const top = topProducts([
      { items: [{ title: "Toner 83A", sku: "T83A", quantity: 2, lineTotal: 9000 }] },
      {
        items: [
          { title: "Toner 83A", sku: "T83A", quantity: 1, lineTotal: 4500 },
          { title: "A4 paper", sku: "A4", quantity: 10, lineTotal: 5000 },
        ],
      },
      { items: "broken" },
    ]);
    expect(top).toEqual([
      { title: "Toner 83A", sku: "T83A", units: 3, revenue: 13500 },
      { title: "A4 paper", sku: "A4", units: 10, revenue: 5000 },
    ]);
  });

  it("quotes cells and neutralises spreadsheet formulas", () => {
    expect(csvCell('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell("+8801712345678")).toBe(`"'+8801712345678"`);
    expect(csvCell(null)).toBe('""');
    expect(toCsv(["A", "B"], [[1, "x"]])).toBe('"A","B"\r\n"1","x"');
  });
});

describe("customers (#111)", () => {
  it("merges leads and orders by phone, newest activity first", () => {
    const rows = mergeCustomers(
      [
        { phone: "+8801711111111", count: 2, last: new Date("2026-10-01T10:00:00Z") },
        { phone: "+8801722222222", count: 1, last: new Date("2026-10-05T10:00:00Z") },
      ],
      [{ phone: "+8801711111111", count: 1, spent: 4500, last: new Date("2026-10-09T10:00:00Z") }],
    );
    expect(rows.map((row) => [row.phone, row.leads, row.orders, row.spent])).toEqual([
      ["+8801711111111", 2, 1, 4500],
      ["+8801722222222", 1, 0, 0],
    ]);
  });

  it("sorts customers by what the table asks for (D0 R5)", () => {
    const at = (day: number) => new Date(Date.UTC(2026, 9, day));
    const groups = [
      { phone: "+8801700000001", leads: 1, orders: 3, spent: 900, last: at(2) },
      { phone: "+8801700000002", leads: 2, orders: 1, spent: 4500, last: at(5) },
      { phone: "+8801700000003", leads: 0, orders: 1, spent: 0, last: at(1) },
    ];
    const phones = (sort: Parameters<typeof sortCustomers>[1]) =>
      sortCustomers(groups, sort).map((row) => row.phone.slice(-1));
    expect(phones(undefined)).toEqual(["1", "2", "3"]);
    expect(phones("spent.desc")).toEqual(["2", "1", "3"]);
    expect(phones("orders.asc")).toEqual(["2", "3", "1"]);
    expect(phones("last.asc")).toEqual(["3", "1", "2"]);
  });
});

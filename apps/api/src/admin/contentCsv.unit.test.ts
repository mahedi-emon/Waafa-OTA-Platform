import { loadFixtures } from "@waafa/fixtures";
import type { CsvImportKey, GroupFare, Product } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "../common/csv";
import { csvColumns, csvRows, planCsvImport, type CsvContext } from "./contentCsv";

const fixtures = loadFixtures();

function context(key: CsvImportKey): CsvContext {
  const records =
    key === "products"
      ? fixtures.products.map((product) => [product.slug, product] as const)
      : key === "groupFares"
        ? fixtures.groupFares.map((fare) => [fare.id, fare] as const)
        : fixtures.compatibleModels.map((model) => [model.id, model] as const);
  return {
    records: new Map<string, unknown>(records),
    compatibleModelIds: new Set(fixtures.compatibleModels.map((model) => model.id)),
  };
}

const exported = (key: CsvImportKey) => {
  const records = [...context(key).records.values()];
  return toCsv(csvColumns(key), csvRows(key, records));
};

/** The file as a table, with one cell of one line changed. */
function edited(key: CsvImportKey, line: number, column: string, value: string) {
  const table = parseCsv(exported(key));
  const index = table[0]!.indexOf(column);
  table[line - 1]![index] = value;
  return table;
}

const rowsOf = (key: CsvImportKey, table: string[][]) =>
  planCsvImport(key, table, context(key)).items.flatMap((item) => item.rows);

describe("parseCsv (issue 248)", () => {
  it("reads what Excel saves: BOM, CRLF or LF, quoted commas, quotes and line breaks", () => {
    const text = '﻿id,name\r\n"a1","Dhaka, Bangladesh"\n"a2","He said ""hi""\r\nnext line"\r\n\r\n';
    expect(parseCsv(text)).toEqual([
      ["id", "name"],
      ["a1", "Dhaka, Bangladesh"],
      ["a2", 'He said "hi"\r\nnext line'],
    ]);
  });

  it("reads a neutralised formula back as it was written", () => {
    expect(parseCsv(toCsv(["note"], [["=SUM(A1)"], ["-2 seats"], ["plain"]]))).toEqual([
      ["note"],
      ["=SUM(A1)"],
      ["-2 seats"],
      ["plain"],
    ]);
  });
});

describe("CSV import plan (issue 248)", () => {
  it.each(["products", "groupFares", "compatibleModels"] as const)(
    "round-trips the %s export: every line unchanged",
    (key) => {
      const rows = rowsOf(key, parseCsv(exported(key)));
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.filter((row) => row.action !== "unchanged")).toEqual([]);
    },
  );

  it("reads columns in any order and lists the ones it doesn't know", () => {
    const table = parseCsv(exported("compatibleModels"));
    const reordered = table.map((row) => [...row].reverse().concat(["x"]));
    reordered[0]![reordered[0]!.length - 1] = "colour";
    const plan = planCsvImport("compatibleModels", reordered, context("compatibleModels"));
    expect(plan.ignoredColumns).toEqual(["colour"]);
    expect(plan.items.every((item) => item.rows.every((row) => row.action === "unchanged"))).toBe(
      true,
    );
  });

  it("names the changed columns of a product's variant and keeps everything else", () => {
    const product = fixtures.products[0]!;
    const variant = product.variants[0]!;
    const table = edited("products", 2, "price", String(variant.price + 100));
    const plan = planCsvImport("products", table, context("products"));
    const item = plan.items.find((found) => found.id === product.slug)!;
    expect(item.rows[0]).toMatchObject({ action: "update", changes: ["price"], problems: [] });
    const record = item.record as Product;
    expect(record.variants[0]!.price).toBe(variant.price + 100);
    expect(record.images).toEqual(product.images);
    expect(record.description).toEqual(product.description);
  });

  it("explains bad lines in plain words, with the line and the column", () => {
    const product = fixtures.products[0]!;
    const price = edited("products", 2, "price", "twelve");
    expect(rowsOf("products", price)[0]).toMatchObject({
      line: 2,
      action: "error",
      problems: [{ column: "price", message: '"twelve" is not a whole number' }],
    });
    const mrp = edited("products", 2, "mrp", "1");
    expect(rowsOf("products", mrp)[0]!.problems).toEqual([
      { column: "mrp", message: "MRP can't be lower than the price" },
    ]);
    const unknown = edited("products", 2, "product", "a-new-product");
    expect(rowsOf("products", unknown).find((row) => row.line === 2)!.problems[0]!.message).toMatch(
      /Add new products in the editor first: they need photos/,
    );
    const variant = edited("products", 2, "variant", "no-such-variant");
    expect(
      rowsOf("products", variant).find((row) => row.id === product.slug && row.line === 2)!
        .problems[0]!.message,
    ).toMatch(/Add new variants in the editor/);
    const model = edited("products", 2, "compatible_models", "no-such-model");
    expect(rowsOf("products", model)[0]!.problems[0]).toEqual({
      column: "compatible_models",
      message: 'No printer model with the id "no-such-model" in Compatible models',
    });
  });

  it("creates new group fares and models, never deletes, refuses a repeated id", () => {
    const fare = fixtures.groupFares[0]!;
    const table = parseCsv(exported("groupFares"));
    const copy = [...table[1]!];
    copy[0] = "gf-new-import";
    const plan = planCsvImport("groupFares", [table[0]!, copy], context("groupFares"));
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]!.rows[0]).toMatchObject({ action: "create", problems: [] });
    expect((plan.items[0]!.record as GroupFare).airline.code).toBe(fare.airline.code);

    const twice = planCsvImport(
      "groupFares",
      [table[0]!, table[1]!, table[1]!],
      context("groupFares"),
    );
    expect(twice.items[0]!.rows[1]).toMatchObject({
      action: "error",
      problems: [{ column: "id", message: "The same id as line 2" }],
    });

    const badDate = edited("groupFares", 2, "depart_date", "14/11/2026");
    expect(rowsOf("groupFares", badDate)[0]!.action).toBe("error");
    const noModel = edited("compatibleModels", 2, "model", "");
    expect(rowsOf("compatibleModels", noModel)[0]!.problems[0]).toEqual({
      column: "model",
      message: "Can't be empty",
    });
  });

  it("refuses a file without the columns, without rows or with too many", () => {
    expect(
      planCsvImport("products", [["product", "title"]], context("products")).fileProblems[0],
    ).toMatch(/^Missing columns: short_title, .*Start from the exported file$/);
    expect(planCsvImport("compatibleModels", [], context("compatibleModels")).fileProblems).toEqual(
      ["The file is empty"],
    );
    const header = [...csvColumns("compatibleModels")];
    expect(
      planCsvImport("compatibleModels", [header], context("compatibleModels")).fileProblems,
    ).toEqual(["The file has no rows under the header"]);
    const many = [
      header,
      ...Array.from({ length: 2001 }, (_, index) => [`m${index}`, "HP", "M1", ""]),
    ];
    expect(
      planCsvImport("compatibleModels", many, context("compatibleModels")).fileProblems[0],
    ).toMatch(/2001 rows; import up to 2000/);
  });
});

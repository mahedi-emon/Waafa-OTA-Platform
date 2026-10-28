import {
  CompatibleModelSchema,
  CSV_IMPORT_MAX_ROWS,
  GroupFareSchema,
  ProductSchema,
  type CompatibleModel,
  type CsvImportKey,
  type CsvImportRow,
  type GroupFare,
  type Product,
} from "@waafa/shared";
import type { ZodError, ZodType } from "zod";

type Problem = CsvImportRow["problems"][number];
type Cells = Record<string, string>;

/** A file line as the import reads it: its number in the file (the header is line 1) and its cells by column. */
export type CsvLine = { line: number; cells: Cells };

/** What one record would become: its rows in the file, the record to save, or the problems on each row. */
export type CsvPlanItem = {
  id: string;
  /** The saved record's address (docId) when it exists. */
  existingId: string | null;
  record: unknown;
  rows: CsvImportRow[];
};

export type CsvPlan = { fileProblems: string[]; ignoredColumns: string[]; items: CsvPlanItem[] };

/** Everything the import reads besides the file: the saved records by address, and ids other lists know. */
export type CsvContext = { records: Map<string, unknown>; compatibleModelIds: Set<string> };

const LIST = " | ";
const splitList = (value: string) =>
  value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

/** Field paths (as zod reports them) to the column that holds them, for plain-word row problems. */
type PathColumns = Array<[RegExp, string]>;

/** Zod's built-in words in plain English; the schemas' own messages ("MRP can't be lower…") pass through. */
function plainMessage(issue: ZodError["issues"][number]): string {
  if (issue.code === "too_small" && issue.origin === "string")
    return Number(issue.minimum) <= 1 ? "Can't be empty" : `At least ${issue.minimum} characters`;
  if (issue.code === "too_big" && issue.origin === "string")
    return `Up to ${issue.maximum} characters`;
  if (issue.code === "too_small" && issue.origin === "number") return `At least ${issue.minimum}`;
  if (issue.code === "too_big" && issue.origin === "number") return `At most ${issue.maximum}`;
  if (issue.code === "invalid_value") return `Write one of: ${issue.values.join(", ")}`;
  if (issue.code === "invalid_format")
    return "Not in the expected format: copy the format from the exported file";
  return issue.message;
}

function zodProblems(error: ZodError, columns: PathColumns, fallback: string): Problem[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    const column = columns.find(([pattern]) => pattern.test(path))?.[1] ?? fallback;
    return { column, message: plainMessage(issue) };
  });
}

/** A cell as a whole number (taka, stock, stops), or a problem. Empty is `undefined` when optional. */
function wholeNumber(
  cells: Cells,
  column: string,
  problems: Problem[],
  optional = false,
): number | undefined {
  const raw = (cells[column] ?? "").replace(/[৳,\s]/g, "");
  if (raw === "") {
    if (!optional) problems.push({ column, message: "Enter a number" });
    return undefined;
  }
  if (!/^\d+$/.test(raw)) {
    problems.push({ column, message: `"${cells[column]}" is not a whole number` });
    return undefined;
  }
  return Number(raw);
}

function yesNo(cells: Cells, column: string, problems: Problem[]): boolean | undefined {
  const raw = (cells[column] ?? "").trim().toLowerCase();
  if (["yes", "true", "1"].includes(raw)) return true;
  if (["no", "false", "0"].includes(raw)) return false;
  problems.push({ column, message: 'Write "yes" or "no"' });
  return undefined;
}

const text = (cells: Cells, column: string) => (cells[column] ?? "").trim();
const yesNoCell = (value: boolean) => (value ? "yes" : "no");

/** `value` without the keys whose value is undefined (optional fields left empty in the file). */
function withoutEmpty<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

/** The columns of a file and how a record turns into rows and rows back into a record. */
type Spec<T> = {
  columns: readonly string[];
  /** The record's rows (one for most lists; one per variant for products). */
  rows(record: T): string[][];
  /** The id a row belongs to (the record's address). */
  idOf(cells: Cells): string;
  /** The record the rows describe, merged into the saved one (fields the file has no column for stay). */
  build(
    lines: CsvLine[],
    existing: T | undefined,
    context: CsvContext,
  ): { record?: unknown; problems: Map<number, Problem[]> };
  schema: ZodType;
  paths: PathColumns;
  /** The row of a schema problem's path (products: the variant's line); else the first line. */
  lineOf?(path: string, lines: CsvLine[], record: unknown): number | undefined;
};

const compatibleModels: Spec<CompatibleModel> = {
  columns: ["id", "brand", "model", "part_codes"],
  rows: (model) => [[model.id, model.brand, model.model, model.partCodes.join(LIST)]],
  idOf: (cells) => text(cells, "id"),
  build(lines, existing) {
    const cells = lines[0]!.cells;
    return {
      record: {
        ...existing,
        id: text(cells, "id"),
        brand: text(cells, "brand"),
        model: text(cells, "model"),
        partCodes: splitList(cells.part_codes ?? ""),
      },
      problems: new Map(),
    };
  },
  schema: CompatibleModelSchema,
  paths: [
    [/^id/, "id"],
    [/^brand/, "brand"],
    [/^model/, "model"],
    [/^partCodes/, "part_codes"],
  ],
};

const groupFares: Spec<GroupFare> = {
  columns: [
    "id",
    "airline_code",
    "airline_name",
    "cabin",
    "baggage",
    "trip_type",
    "from_iata",
    "from_city",
    "to_iata",
    "to_city",
    "stops",
    "depart_date",
    "return_date",
    "seats_left",
    "fare_per_adult",
    "expires_at",
    "notes",
  ],
  rows: (fare) => [
    [
      fare.id,
      fare.airline.code,
      fare.airline.name,
      fare.cabin,
      fare.baggage,
      fare.tripType,
      fare.from.iata,
      fare.from.city,
      fare.to.iata,
      fare.to.city,
      String(fare.stops),
      fare.departDate,
      fare.returnDate ?? "",
      fare.seatsLeft === undefined ? "" : String(fare.seatsLeft),
      String(fare.farePerAdult),
      fare.expiresAt,
      fare.notes ?? "",
    ],
  ],
  idOf: (cells) => text(cells, "id"),
  build(lines, existing) {
    const { line, cells } = lines[0]!;
    const problems: Problem[] = [];
    const code = text(cells, "airline_code").toUpperCase();
    // A known airline keeps its logo and strip position when only its name changes.
    const airline =
      existing && existing.airline.code === code
        ? { ...existing.airline, name: text(cells, "airline_name") }
        : { code, name: text(cells, "airline_name") };
    const record = withoutEmpty({
      ...existing,
      id: text(cells, "id"),
      airline,
      cabin: text(cells, "cabin"),
      baggage: text(cells, "baggage"),
      tripType: text(cells, "trip_type"),
      from: { iata: text(cells, "from_iata").toUpperCase(), city: text(cells, "from_city") },
      to: { iata: text(cells, "to_iata").toUpperCase(), city: text(cells, "to_city") },
      stops: wholeNumber(cells, "stops", problems),
      departDate: text(cells, "depart_date"),
      returnDate: text(cells, "return_date") || undefined,
      seatsLeft: wholeNumber(cells, "seats_left", problems, true),
      farePerAdult: wholeNumber(cells, "fare_per_adult", problems),
      expiresAt: text(cells, "expires_at"),
      notes: text(cells, "notes") || undefined,
      // Only the seed writes Sample content: a fare added by import is the team's own.
      sample: existing?.sample ?? false,
    });
    return { record, problems: new Map([[line, problems]]) };
  },
  schema: GroupFareSchema,
  paths: [
    [/^id/, "id"],
    [/^airline\.code/, "airline_code"],
    [/^airline\.name/, "airline_name"],
    [/^cabin/, "cabin"],
    [/^baggage/, "baggage"],
    [/^tripType/, "trip_type"],
    [/^from\.iata/, "from_iata"],
    [/^from\.city/, "from_city"],
    [/^to\.iata/, "to_iata"],
    [/^to\.city/, "to_city"],
    [/^stops/, "stops"],
    [/^departDate/, "depart_date"],
    [/^returnDate/, "return_date"],
    [/^seatsLeft/, "seats_left"],
    [/^farePerAdult/, "fare_per_adult"],
    [/^expiresAt/, "expires_at"],
    [/^notes/, "notes"],
  ],
};

/** The product-level columns: every row of a product repeats them and they must agree. */
const PRODUCT_COLUMNS = [
  "title",
  "short_title",
  "show_price",
  "cod_eligible",
  "compatible_models",
] as const;

const products: Spec<Product> = {
  columns: [
    "product",
    ...PRODUCT_COLUMNS,
    "variant",
    "sku",
    "price",
    "mrp",
    "stock",
    "low_stock_at",
    "pre_order",
  ],
  rows: (product) =>
    product.variants.map((variant) => [
      product.slug,
      product.title,
      product.shortTitle,
      yesNoCell(product.showPrice),
      yesNoCell(product.codEligible),
      product.compatibleModelIds.join(LIST),
      variant.id,
      variant.sku,
      String(variant.price),
      variant.mrp === undefined ? "" : String(variant.mrp),
      String(variant.stock),
      String(variant.lowStockAt),
      yesNoCell(variant.preOrder),
    ]),
  idOf: (cells) => text(cells, "product"),
  build(lines, existing, context) {
    const problems = new Map<number, Problem[]>(lines.map(({ line }) => [line, []]));
    const at = (line: number) => problems.get(line)!;
    if (!existing) {
      for (const { line } of lines)
        at(line).push({
          column: "product",
          message:
            "No product at this address. Add new products in the editor first: they need photos",
        });
      return { problems };
    }
    const first = lines[0]!;
    for (const { line, cells } of lines.slice(1)) {
      for (const column of PRODUCT_COLUMNS) {
        if (text(cells, column) !== text(first.cells, column))
          at(line).push({
            column,
            message: `Differs from line ${first.line} of the same product: write the same value on every line`,
          });
      }
    }
    const models = splitList(first.cells.compatible_models ?? "");
    for (const model of models) {
      if (!context.compatibleModelIds.has(model))
        at(first.line).push({
          column: "compatible_models",
          message: `No printer model with the id "${model}" in Compatible models`,
        });
    }
    const seen = new Map<string, number>();
    const byVariant = new Map<string, Cells>();
    for (const { line, cells } of lines) {
      const variantId = text(cells, "variant");
      const earlier = seen.get(variantId);
      if (earlier !== undefined) {
        at(line).push({ column: "variant", message: `The same variant as line ${earlier}` });
        continue;
      }
      seen.set(variantId, line);
      if (!existing.variants.some((variant) => variant.id === variantId)) {
        at(line).push({
          column: "variant",
          message: "No variant with this id in the product. Add new variants in the editor",
        });
        continue;
      }
      byVariant.set(variantId, cells);
    }
    const lineOfVariant = new Map([...seen.entries()]);
    const variants = existing.variants.map((variant) => {
      const cells = byVariant.get(variant.id);
      if (!cells) return variant;
      const rowProblems = at(lineOfVariant.get(variant.id)!);
      return withoutEmpty({
        ...variant,
        sku: text(cells, "sku"),
        price: wholeNumber(cells, "price", rowProblems),
        mrp: wholeNumber(cells, "mrp", rowProblems, true),
        stock: wholeNumber(cells, "stock", rowProblems),
        lowStockAt: wholeNumber(cells, "low_stock_at", rowProblems),
        preOrder: yesNo(cells, "pre_order", rowProblems),
      });
    });
    const firstProblems = at(first.line);
    const record = {
      ...existing,
      title: text(first.cells, "title"),
      shortTitle: text(first.cells, "short_title"),
      showPrice: yesNo(first.cells, "show_price", firstProblems),
      codEligible: yesNo(first.cells, "cod_eligible", firstProblems),
      compatibleModelIds: models,
      variants,
    };
    return { record, problems };
  },
  schema: ProductSchema,
  paths: [
    [/^title/, "title"],
    [/^shortTitle/, "short_title"],
    [/^compatibleModelIds/, "compatible_models"],
    [/^variants\.\d+\.sku/, "sku"],
    [/^variants\.\d+\.price/, "price"],
    [/^variants\.\d+\.mrp/, "mrp"],
    [/^variants\.\d+\.stock/, "stock"],
    [/^variants\.\d+\.lowStockAt/, "low_stock_at"],
    [/^variants$/, "sku"],
  ],
  lineOf(path, lines, record) {
    const match = /^variants\.(\d+)/.exec(path);
    if (!match) return undefined;
    const variant = (record as Product).variants[Number(match[1])];
    return lines.find(({ cells }) => text(cells, "variant") === variant?.id)?.line;
  },
};

const SPECS = { products, groupFares, compatibleModels } as const satisfies Record<
  CsvImportKey,
  Spec<never>
>;

/** The header row of a list's file. */
export const csvColumns = (key: CsvImportKey): readonly string[] => SPECS[key].columns;

/** The saved records as the file's rows (the export). */
export function csvRows(key: CsvImportKey, records: unknown[]): string[][] {
  const spec = SPECS[key] as Spec<unknown>;
  return records.flatMap((record) => spec.rows(record));
}

/** Two records the same once both are read by the schema (defaults filled, key order ignored). */
function sameRecord(schema: ZodType, a: unknown, b: unknown): boolean {
  const left = schema.safeParse(a);
  const right = schema.safeParse(b);
  if (!left.success || !right.success) return false;
  const canonical = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([, entry]) => entry !== undefined)
              .sort(([x], [y]) => x.localeCompare(y))
              .map(([name, entry]) => [name, canonical(entry)]),
          )
        : value;
  return JSON.stringify(canonical(left.data)) === JSON.stringify(canonical(right.data));
}

/**
 * Reads a file against a list (issue 248): the header must name every column (in any order); rows are grouped by
 * record, merged into the saved record, checked by the list's schema, and each line says what would happen to it.
 * The import never deletes: records missing from the file stay as they are.
 */
export function planCsvImport(key: CsvImportKey, table: string[][], context: CsvContext): CsvPlan {
  const spec = SPECS[key] as Spec<unknown>;
  const [header = [], ...body] = table;
  const names = header.map((name) => name.trim().toLowerCase());
  const missing = spec.columns.filter((column) => !names.includes(column));
  const ignoredColumns = names.filter((name) => name && !spec.columns.includes(name));
  const fileProblems: string[] = [];
  if (header.length === 0) fileProblems.push("The file is empty");
  else if (missing.length > 0)
    fileProblems.push(
      `Missing ${missing.length === 1 ? "column" : "columns"}: ${missing.join(", ")}. Start from the exported file`,
    );
  if (body.length > CSV_IMPORT_MAX_ROWS)
    fileProblems.push(
      `The file has ${body.length} rows; import up to ${CSV_IMPORT_MAX_ROWS} at a time`,
    );
  if (body.length === 0 && header.length > 0)
    fileProblems.push("The file has no rows under the header");
  if (fileProblems.length > 0) return { fileProblems, ignoredColumns, items: [] };

  const lines: CsvLine[] = body.map((cells, index) => ({
    line: index + 2,
    cells: Object.fromEntries(
      spec.columns.map((column) => [column, cells[names.indexOf(column)] ?? ""]),
    ),
  }));
  const groups = new Map<string, CsvLine[]>();
  for (const line of lines) {
    const id = spec.idOf(line.cells);
    groups.set(id, [...(groups.get(id) ?? []), line]);
  }

  const items: CsvPlanItem[] = [];
  for (const [id, group] of groups) {
    const existing = id ? context.records.get(id) : undefined;
    const exported = existing === undefined ? [] : spec.rows(existing);
    const rowOf = ({ line, cells }: CsvLine): CsvImportRow => {
      // A line's changes: the columns that differ from the saved record's row for the same item.
      const match =
        key === "products"
          ? exported.find((row) => row[spec.columns.indexOf("variant")] === text(cells, "variant"))
          : exported[0];
      const changes = match
        ? spec.columns.filter(
            (column, index) => text(cells, column) !== (match[index] ?? "").trim(),
          )
        : [];
      return {
        line,
        id,
        action: existing === undefined ? "create" : changes.length ? "update" : "unchanged",
        changes,
        problems: [],
      };
    };
    const rows = group.map(rowOf);
    const problemsAt = (line: number) => rows.find((row) => row.line === line)!.problems;
    if (!id) {
      for (const row of rows)
        row.problems.push({ column: spec.columns[0]!, message: "Enter the id" });
    } else if (key !== "products" && group.length > 1) {
      for (const row of rows.slice(1))
        row.problems.push({ column: "id", message: `The same id as line ${group[0]!.line}` });
    }
    let record: unknown;
    if (rows.every((row) => row.problems.length === 0)) {
      const built = spec.build(group, existing as never, context);
      for (const [line, found] of built.problems) problemsAt(line).push(...found);
      record = built.record;
      if (record !== undefined && rows.every((row) => row.problems.length === 0)) {
        const parsed = spec.schema.safeParse(record);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            const path = issue.path.join(".");
            const line = spec.lineOf?.(path, group, record) ?? group[0]!.line;
            problemsAt(line).push(
              ...zodProblems({ issues: [issue] } as ZodError, spec.paths, spec.columns[0]!),
            );
          }
        } else if (existing !== undefined && sameRecord(spec.schema, existing, record)) {
          for (const row of rows) {
            row.action = "unchanged";
            row.changes = [];
          }
        }
      }
    }
    for (const row of rows) if (row.problems.length > 0) row.action = "error";
    items.push({ id, existingId: existing === undefined ? null : id, record, rows });
  }
  return { fileProblems, ignoredColumns, items };
}

import { z } from "zod";

/** The lists staff can export and import as CSV (issue 248, FR-CAT-05). */
export const CSV_IMPORT_KEYS = ["products", "groupFares", "compatibleModels"] as const;
export const CsvImportKeySchema = z.enum(CSV_IMPORT_KEYS);

/** Rows a file may hold, and its length (the API takes JSON bodies up to 1 MB; quotes are escaped in JSON). */
export const CSV_IMPORT_MAX_ROWS = 2000;
export const CSV_IMPORT_MAX_CHARS = 600_000;

export const ContentImportInputSchema = z
  .object({
    csv: z
      .string()
      .min(1, "Choose a CSV file")
      .max(CSV_IMPORT_MAX_CHARS, "The file is too big: import up to 2,000 rows at a time"),
  })
  .strict();

export const CsvRowProblemSchema = z.object({ column: z.string(), message: z.string() }).strict();

/** One line of the file in the preview: what the import would do with it, or why it can't. */
export const CsvImportRowSchema = z
  .object({
    line: z.number().int().positive(),
    id: z.string(),
    action: z.enum(["create", "update", "unchanged", "error"]),
    /** The columns whose value differs from the saved record. */
    changes: z.array(z.string()),
    problems: z.array(CsvRowProblemSchema),
  })
  .strict();

export const ContentImportReportSchema = z
  .object({
    key: CsvImportKeySchema,
    /** Problems with the whole file (a missing column, too many rows). */
    fileProblems: z.array(z.string()),
    /** Columns the import doesn't know; their values are not read. */
    ignoredColumns: z.array(z.string()),
    rows: z.array(CsvImportRowSchema),
    summary: z
      .object({
        create: z.number().int(),
        update: z.number().int(),
        unchanged: z.number().int(),
        error: z.number().int(),
      })
      .strict(),
    /** True after an import saved the file; false for a preview. */
    applied: z.boolean(),
  })
  .strict();

export type CsvImportKey = z.infer<typeof CsvImportKeySchema>;
export type ContentImportInput = z.infer<typeof ContentImportInputSchema>;
export type CsvImportRow = z.infer<typeof CsvImportRowSchema>;
export type ContentImportReport = z.infer<typeof ContentImportReportSchema>;

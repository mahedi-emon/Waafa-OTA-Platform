import { Inject, Injectable } from "@nestjs/common";
import type { ContentImportReport, CsvImportKey } from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { parseCsv, toCsv } from "../common/csv";
import { ProblemException } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";
import { assertContentAccess } from "./access";
import { AdminContentService, sortByRecordOrder } from "./content-admin.service";
import { csvColumns, csvRows, planCsvImport, type CsvPlan } from "./contentCsv";

/**
 * CSV export and import for products, group fares and compatible models (issue 248, FR-CAT-05). The export is the
 * import's template; a preview says what each line would do; the import saves through the normal save (rules,
 * History, audit, cache) and refuses the whole file while any line has a problem. It never deletes.
 */
@Injectable()
export class ContentImportService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AdminContentService) private readonly content: AdminContentService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private async records(key: CsvImportKey) {
    return sortByRecordOrder(
      key,
      await this.prisma.contentDocument.findMany({
        where: { collection: key },
        orderBy: [{ position: "asc" }, { docId: "asc" }],
      }),
    );
  }

  async exportCsv(staff: StaffPrincipal, key: CsvImportKey): Promise<string> {
    assertContentAccess(staff, key);
    const rows = await this.records(key);
    return toCsv(
      csvColumns(key),
      csvRows(
        key,
        rows.map((row) => row.data),
      ),
    );
  }

  private async plan(key: CsvImportKey, csv: string): Promise<CsvPlan> {
    const [rows, models] = await Promise.all([
      this.records(key),
      key === "products"
        ? this.prisma.contentDocument.findMany({
            where: { collection: "compatibleModels" },
            select: { docId: true },
          })
        : Promise.resolve([]),
    ]);
    return planCsvImport(key, parseCsv(csv), {
      records: new Map(rows.map((row) => [row.docId, row.data])),
      compatibleModelIds: new Set(models.map((model) => model.docId)),
    });
  }

  private report(key: CsvImportKey, plan: CsvPlan, applied: boolean): ContentImportReport {
    const rows = plan.items.flatMap((item) => item.rows).sort((a, b) => a.line - b.line);
    const count = (action: (typeof rows)[number]["action"]) =>
      rows.filter((row) => row.action === action).length;
    return {
      key,
      fileProblems: plan.fileProblems,
      ignoredColumns: plan.ignoredColumns,
      rows,
      summary: {
        create: count("create"),
        update: count("update"),
        unchanged: count("unchanged"),
        error: count("error"),
      },
      applied,
    };
  }

  async preview(staff: StaffPrincipal, key: CsvImportKey, csv: string) {
    assertContentAccess(staff, key);
    return this.report(key, await this.plan(key, csv), false);
  }

  async apply(staff: StaffPrincipal, key: CsvImportKey, csv: string) {
    assertContentAccess(staff, key);
    const plan = await this.plan(key, csv);
    const preview = this.report(key, plan, false);
    if (plan.fileProblems.length > 0 || preview.summary.error > 0)
      throw new ProblemException(
        422,
        "The file has problems",
        "Nothing was imported. Fix the lines the preview lists and try again",
        undefined,
        "import-problems",
        { report: preview },
      );
    let created = 0;
    let updated = 0;
    for (const item of plan.items) {
      // A product with one changed variant line is an update, whatever its other lines say.
      const actions = new Set(item.rows.map((row) => row.action));
      const action = actions.has("create")
        ? "create"
        : actions.has("update")
          ? "update"
          : "unchanged";
      if (action === "create") {
        await this.content.create(staff, key, item.record, { audit: "content.import" });
        created += 1;
      } else if (action === "update" && item.existingId) {
        await this.content.update(staff, key, item.existingId, item.record, undefined, {
          audit: "content.import",
        });
        updated += 1;
      }
    }
    await this.audit.record({
      actor: staff,
      action: "content.import.file",
      entity: key,
      entityId: "csv",
      after: { created, updated, unchanged: preview.summary.unchanged },
    });
    return { ...preview, applied: true };
  }
}

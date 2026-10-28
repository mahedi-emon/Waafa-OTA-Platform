import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Patch,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { CSV_BOM } from "../common/csv";
import { XLSX_TYPE } from "../common/xlsx";
import { parseInput, problems } from "../common/problem";
import { AuditService } from "../audit/audit.service";
import { CustomerProfilesService } from "./customerProfiles.service";
import { AdminCustomerAccountsService } from "./customerAccounts.service";
import { AdminCustomersService } from "./customers.service";
import { AdminReportsService, type ReportDataset } from "./reports.service";

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const RangeSchema = z.object({ from: Day, to: Day }).strict();
const DATASETS: readonly ReportDataset[] = ["leads", "orders", "feedback", "subscribers"];
const AccountQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(),
  })
  .strict();
const ReasonSchema = z.object({ reason: z.string().trim().max(300).optional() }).strict();
const AttachSchema = z
  .object({
    kind: z.enum(["lead", "order"]),
    reference: z.string().trim().min(3).max(40),
  })
  .strict();
const TagsSchema = z.object({ tags: z.array(z.string().trim().min(1).max(30)).max(12) }).strict();
const NoteSchema = z.object({ body: z.string().trim().min(1).max(2000) }).strict();
const MergeSchema = z
  .object({ into: z.string().regex(/^\+880\d{10}$/, "A Bangladesh mobile number") })
  .strict();

const CustomerQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    pageSize: z.coerce
      .number()
      .int()
      .refine((size) => [25, 50, 100].includes(size))
      .optional(),
    tag: z.string().trim().min(1).max(30).optional(),
    sort: z
      .enum(["last.asc", "last.desc", "spent.asc", "spent.desc", "orders.asc", "orders.desc"])
      .optional(),
  })
  .strict();
const PHONE = /^\+\d{8,15}$/;

/** A customer phone from the address, or a 404. */
function phoneParam(value: string): string {
  const decoded = decodeURIComponent(value);
  if (!PHONE.test(decoded)) throw problems.notFound();
  return decoded;
}

/** Reports (#111): managers and accounts see the summary and download CSVs in a date range. */
@Controller("admin/reports")
@UseGuards(StaffGuard)
@Roles("admin", "accounts", "shop-manager", "travel-sales", "visa-officer")
export class AdminReportsController {
  constructor(@Inject(AdminReportsService) private readonly reports: AdminReportsService) {}

  @Get()
  summary(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.reports.summary(staff, parseInput(RangeSchema, query));
  }

  @Get(":dataset")
  async csv(
    @Staff() staff: StaffPrincipal,
    @Param("dataset") dataset: string,
    @Query() query: unknown,
    @Res() reply: FastifyReply,
  ) {
    // "leads", "leads.csv" or "leads.xlsx": the same rows as CSV or as an Excel workbook (D0 R9).
    const excel = dataset.endsWith(".xlsx");
    const name = dataset.replace(/\.(csv|xlsx)$/, "") as ReportDataset;
    if (!DATASETS.includes(name)) throw problems.notFound();
    const range = parseInput(RangeSchema, query);
    const file = `waafa-${name}-${range.from}-to-${range.to}.${excel ? "xlsx" : "csv"}`;
    reply
      .header("content-type", excel ? XLSX_TYPE : "text/csv; charset=utf-8")
      .header("content-disposition", `attachment; filename="${file}"`)
      .header("cache-control", "no-store");
    return excel
      ? reply.send(await this.reports.xlsx(staff, name, range))
      : reply.send(`${CSV_BOM}${await this.reports.csv(staff, name, range)}`);
  }
}

/** Customers (#111): one row per phone across leads and orders, and a profile with their history. */
@Controller("admin/customers")
@UseGuards(StaffGuard)
@Roles("admin", "accounts", "shop-manager", "travel-sales", "visa-officer")
export class AdminCustomersController {
  constructor(
    @Inject(AdminCustomersService) private readonly customers: AdminCustomersService,
    @Inject(AdminCustomerAccountsService) private readonly accounts: AdminCustomerAccountsService,
    @Inject(CustomerProfilesService) private readonly profiles: CustomerProfilesService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Every customer this person may see, as CSV (issue 244). */
  @Get("export.csv")
  async exportCsv(
    @Staff() staff: StaffPrincipal,
    @Query() query: unknown,
    @Res() reply: FastifyReply,
  ) {
    const { q, tag } = parseInput(CustomerQuerySchema, query);
    const csv = await this.customers.csv(staff, { ...(q ? { q } : {}), ...(tag ? { tag } : {}) });
    await this.auditExport(staff);
    reply
      .header("content-type", "text/csv; charset=utf-8")
      .header("content-disposition", 'attachment; filename="waafa-customers.csv"')
      .header("cache-control", "no-store")
      .send(CSV_BOM + csv);
  }

  private async auditExport(staff: StaffPrincipal) {
    await this.audit.record({
      actor: staff,
      action: "customer.export",
      entity: "customer",
      entityId: "all",
    });
  }

  @Get()
  list(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.customers.list(staff, parseInput(CustomerQuerySchema, query));
  }

  /** Customer accounts (issue 241): verified, sign-in method, last sign-in, turned off or not. */
  @Get("accounts")
  accountList(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.accounts.list(staff, parseInput(AccountQuerySchema, query));
  }

  @Get("accounts/:id")
  accountDetail(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    return this.accounts.detail(staff, id);
  }

  @Post("accounts/:id/disable")
  @HttpCode(200)
  @Roles("admin")
  disable(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    const { reason } = parseInput(ReasonSchema, body ?? {});
    return this.accounts.disable(staff, id, reason);
  }

  @Post("accounts/:id/enable")
  @HttpCode(200)
  @Roles("admin")
  enable(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    return this.accounts.enable(staff, id);
  }

  @Post("accounts/:id/sign-out-everywhere")
  @HttpCode(200)
  @Roles("admin")
  signOutEverywhere(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    return this.accounts.signOutEverywhere(staff, id);
  }

  @Post("accounts/:id/attach")
  @HttpCode(200)
  attach(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    return this.accounts.attach(staff, id, parseInput(AttachSchema, body));
  }

  @Get(":phone")
  async detail(@Staff() staff: StaffPrincipal, @Param("phone") phone: string) {
    const decoded = phoneParam(phone);
    const profile = await this.customers.detail(staff, decoded);
    if (profile.mergedInto) return profile;
    return {
      ...profile,
      account: await this.accounts.forProfile(staff, decoded, profile.email ?? null),
    };
  }

  /** Tags on a customer (issue 244): short words staff choose, up to 12. */
  @Patch(":phone/tags")
  async tags(@Staff() staff: StaffPrincipal, @Param("phone") phone: string, @Body() body: unknown) {
    const decoded = phoneParam(phone);
    await this.customers.detail(staff, decoded);
    return { tags: await this.profiles.setTags(staff, decoded, parseInput(TagsSchema, body).tags) };
  }

  @Post(":phone/notes")
  async note(@Staff() staff: StaffPrincipal, @Param("phone") phone: string, @Body() body: unknown) {
    const decoded = phoneParam(phone);
    await this.customers.detail(staff, decoded);
    await this.profiles.addNote(staff, decoded, parseInput(NoteSchema, body).body);
    return this.customers.detail(staff, decoded);
  }

  /** Merge a duplicate number into this customer's (issue 244); Admin and Super Admin, audited. */
  @Post(":phone/merge")
  @HttpCode(200)
  @Roles("admin")
  async merge(
    @Staff() staff: StaffPrincipal,
    @Param("phone") phone: string,
    @Body() body: unknown,
  ) {
    const decoded = phoneParam(phone);
    const { into } = parseInput(MergeSchema, body);
    await Promise.all([this.customers.detail(staff, decoded), this.customers.detail(staff, into)]);
    await this.profiles.merge(staff, decoded, into);
    return this.customers.detail(staff, into);
  }

  @Post(":phone/unmerge")
  @HttpCode(200)
  @Roles("admin")
  async unmerge(@Staff() staff: StaffPrincipal, @Param("phone") phone: string) {
    const decoded = phoneParam(phone);
    await this.profiles.unmerge(staff, decoded);
    return this.customers.detail(staff, decoded);
  }
}

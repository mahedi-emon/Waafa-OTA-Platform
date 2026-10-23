import { Controller, Get, Inject, Param, Query, Res, UseGuards } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { CSV_BOM } from "../common/csv";
import { parseInput, problems } from "../common/problem";
import { AdminCustomersService } from "./customers.service";
import { AdminReportsService, type ReportDataset } from "./reports.service";

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const RangeSchema = z.object({ from: Day, to: Day }).strict();
const DATASETS: readonly ReportDataset[] = ["leads", "orders", "feedback", "subscribers"];
const CustomerQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    pageSize: z.coerce
      .number()
      .int()
      .refine((size) => [25, 50, 100].includes(size))
      .optional(),
    sort: z
      .enum(["last.asc", "last.desc", "spent.asc", "spent.desc", "orders.asc", "orders.desc"])
      .optional(),
  })
  .strict();
const PHONE = /^\+\d{8,15}$/;

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
    const name = dataset.replace(/\.csv$/, "") as ReportDataset;
    if (!DATASETS.includes(name)) throw problems.notFound();
    const range = parseInput(RangeSchema, query);
    const body = await this.reports.csv(staff, name, range);
    return reply
      .header("content-type", "text/csv; charset=utf-8")
      .header(
        "content-disposition",
        `attachment; filename="waafa-${name}-${range.from}-to-${range.to}.csv"`,
      )
      .header("cache-control", "no-store")
      .send(`${CSV_BOM}${body}`);
  }
}

/** Customers (#111): one row per phone across leads and orders, and a profile with their history. */
@Controller("admin/customers")
@UseGuards(StaffGuard)
@Roles("admin", "accounts", "shop-manager", "travel-sales", "visa-officer")
export class AdminCustomersController {
  constructor(@Inject(AdminCustomersService) private readonly customers: AdminCustomersService) {}

  @Get()
  list(@Staff() staff: StaffPrincipal, @Query() query: unknown) {
    return this.customers.list(staff, parseInput(CustomerQuerySchema, query));
  }

  @Get(":phone")
  detail(@Staff() staff: StaffPrincipal, @Param("phone") phone: string) {
    const decoded = decodeURIComponent(phone);
    if (!PHONE.test(decoded)) throw problems.notFound();
    return this.customers.detail(staff, decoded);
  }
}

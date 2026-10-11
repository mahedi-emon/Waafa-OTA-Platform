import { Inject, Injectable } from "@nestjs/common";
import { toDhakaIsoString } from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import { toCsv } from "../common/csv";
import { problems } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";
import { dhakaDate, leadModulesFor } from "./access";

const NOT_SOLD = ["cancelled", "returned"];
const DAY = 24 * 60 * 60_000;
/** A report covers at most a year, so one request never scans everything. */
const MAX_DAYS = 366;
const CSV_LIMIT = 10_000;

export type ReportRange = { from: string; to: string };
export type ReportDataset = "leads" | "orders" | "feedback" | "subscribers";

type OrderItemLike = { title?: unknown; sku?: unknown; quantity?: unknown; lineTotal?: unknown };

/** "2026-10-12" in Asia/Dhaka for a timestamp. */
export function dhakaDay(date: Date): string {
  return new Date(date.getTime() + 6 * 60 * 60_000).toISOString().slice(0, 10);
}

/** The middle value of a list of numbers, or null when empty. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] ?? null)
    : Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

/** Units and revenue per product from order item snapshots, best sellers first. */
export function topProducts(orders: Array<{ items: unknown }>, take = 8) {
  const totals = new Map<string, { title: string; sku: string; units: number; revenue: number }>();
  for (const order of orders) {
    if (!Array.isArray(order.items)) continue;
    for (const raw of order.items as OrderItemLike[]) {
      const title = typeof raw.title === "string" ? raw.title : "";
      const sku = typeof raw.sku === "string" ? raw.sku : title;
      if (!sku) continue;
      const entry = totals.get(sku) ?? { title, sku, units: 0, revenue: 0 };
      entry.units += typeof raw.quantity === "number" ? raw.quantity : 0;
      entry.revenue += typeof raw.lineTotal === "number" ? raw.lineTotal : 0;
      totals.set(sku, entry);
    }
  }
  return [...totals.values()]
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, take);
}

/**
 * Reports (#111): what happened in a date range (Asia/Dhaka days, both ends included) for the modules this person
 * works on: leads by module and status, won rate, median first response, orders and revenue, best sellers,
 * feedback, sign-ups and a day-by-day series; and the same records as CSV.
 */
@Injectable()
export class AdminReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private window(range: ReportRange) {
    const start = dhakaDate(range.from);
    const end = dhakaDate(range.to, true);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw problems.badRequest("Choose a start date before the end date", "range");
    }
    if ((end.getTime() - start.getTime()) / DAY > MAX_DAYS) {
      throw problems.badRequest("A report covers at most one year", "range");
    }
    return { start, end };
  }

  private canSeeOrders(staff: StaffPrincipal) {
    return staff.roles.some((role) =>
      ["super-admin", "admin", "shop-manager", "accounts"].includes(role),
    );
  }

  async summary(staff: StaffPrincipal, range: ReportRange) {
    const { start, end } = this.window(range);
    const modules = leadModulesFor(staff);
    const leadWhere = { module: { in: modules }, createdAt: { gte: start, lt: end } };
    const orders = this.canSeeOrders(staff);
    const [leads, orderRows, feedback, signUps] = await Promise.all([
      this.prisma.lead.findMany({
        where: leadWhere,
        select: { module: true, status: true, createdAt: true, firstResponseAt: true },
      }),
      orders
        ? this.prisma.order.findMany({
            where: { createdAt: { gte: start, lt: end } },
            select: { status: true, total: true, items: true, createdAt: true },
          })
        : Promise.resolve([]),
      this.prisma.feedback.groupBy({
        by: ["status"],
        where: { createdAt: { gte: start, lt: end } },
        _count: { _all: true },
      }),
      this.prisma.subscriber.count({ where: { createdAt: { gte: start, lt: end } } }),
    ]);

    const count = <T extends string>(values: T[]) => {
      const map = new Map<T, number>();
      for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
      return [...map.entries()]
        .map(([key, total]) => ({ key, count: total }))
        .sort((a, b) => b.count - a.count);
    };
    const responses = leads
      .filter((lead) => lead.firstResponseAt)
      .map((lead) =>
        Math.round(((lead.firstResponseAt?.getTime() ?? 0) - lead.createdAt.getTime()) / 60_000),
      );
    const won = leads.filter((lead) => lead.status === "booked").length;
    const sold = orderRows.filter((order) => !NOT_SOLD.includes(order.status));

    const days: Array<{ day: string; leads: number; orders: number; revenue: number }> = [];
    for (let at = start.getTime(); at < end.getTime(); at += DAY) {
      days.push({ day: dhakaDay(new Date(at)), leads: 0, orders: 0, revenue: 0 });
    }
    const byDay = new Map(days.map((entry) => [entry.day, entry]));
    for (const lead of leads) {
      const entry = byDay.get(dhakaDay(lead.createdAt));
      if (entry) entry.leads += 1;
    }
    for (const order of sold) {
      const entry = byDay.get(dhakaDay(order.createdAt));
      if (entry) {
        entry.orders += 1;
        entry.revenue += order.total;
      }
    }

    return {
      range: { from: range.from, to: range.to },
      generatedAt: toDhakaIsoString(new Date()),
      leads: {
        total: leads.length,
        won,
        wonRate: leads.length === 0 ? 0 : Math.round((won / leads.length) * 1000) / 10,
        medianFirstResponseMinutes: median(responses),
        byModule: count(leads.map((lead) => lead.module)).map(({ key, count: total }) => ({
          module: key,
          count: total,
        })),
        byStatus: count(leads.map((lead) => lead.status)).map(({ key, count: total }) => ({
          status: key,
          count: total,
        })),
      },
      orders: orders
        ? {
            total: orderRows.length,
            sold: sold.length,
            revenue: sold.reduce((sum, order) => sum + order.total, 0),
            averageOrder:
              sold.length === 0
                ? 0
                : Math.round(sold.reduce((sum, order) => sum + order.total, 0) / sold.length),
            byStatus: count(orderRows.map((order) => order.status)).map(
              ({ key, count: total }) => ({
                status: key,
                count: total,
              }),
            ),
            topProducts: topProducts(sold),
          }
        : null,
      feedback: feedback.map((row) => ({ status: row.status, count: row._count._all })),
      signUps,
      days,
    };
  }

  async csv(staff: StaffPrincipal, dataset: ReportDataset, range: ReportRange): Promise<string> {
    const { start, end } = this.window(range);
    const created = { createdAt: { gte: start, lt: end } };
    switch (dataset) {
      case "leads": {
        const rows = await this.prisma.lead.findMany({
          where: { ...created, module: { in: leadModulesFor(staff) } },
          orderBy: { createdAt: "asc" },
          take: CSV_LIMIT,
        });
        return toCsv(
          [
            "Reference",
            "Module",
            "Status",
            "Name",
            "Phone",
            "Email",
            "Summary",
            "Travel date",
            "Travellers",
            "Amount (BDT)",
            "Created",
            "First response",
          ],
          rows.map((row) => [
            row.reference,
            row.module,
            row.status,
            row.name,
            row.phone,
            row.email,
            row.summary,
            row.travelDate,
            row.travellers,
            row.amount,
            toDhakaIsoString(row.createdAt),
            row.firstResponseAt ? toDhakaIsoString(row.firstResponseAt) : "",
          ]),
        );
      }
      case "orders": {
        if (!this.canSeeOrders(staff)) throw problems.forbidden();
        const rows = await this.prisma.order.findMany({
          where: created,
          orderBy: { createdAt: "asc" },
          take: CSV_LIMIT,
        });
        return toCsv(
          [
            "Reference",
            "Status",
            "Name",
            "Phone",
            "Email",
            "Items",
            "Subtotal (BDT)",
            "Discount (BDT)",
            "Delivery (BDT)",
            "Total (BDT)",
            "Payment verified",
            "Pick-up",
            "Created",
          ],
          rows.map((row) => [
            row.reference,
            row.status,
            row.name,
            row.phone,
            row.email,
            Array.isArray(row.items)
              ? (row.items as OrderItemLike[])
                  .map((item) => `${String(item.quantity ?? "")} × ${String(item.title ?? "")}`)
                  .join("; ")
              : "",
            row.subtotal,
            row.discount,
            row.delivery,
            row.total,
            row.paymentVerified ? "yes" : "no",
            row.pickup ? "yes" : "no",
            toDhakaIsoString(row.createdAt),
          ]),
        );
      }
      case "feedback": {
        const rows = await this.prisma.feedback.findMany({
          where: created,
          orderBy: { createdAt: "asc" },
          take: CSV_LIMIT,
        });
        return toCsv(
          [
            "Name",
            "Phone",
            "Service",
            "Reference",
            "Rating",
            "Comment",
            "Consent to publish",
            "Status",
            "Created",
          ],
          rows.map((row) => [
            row.name,
            row.phone,
            row.service,
            row.reference,
            row.rating,
            row.comment,
            row.consentToPublish ? "yes" : "no",
            row.status,
            toDhakaIsoString(row.createdAt),
          ]),
        );
      }
      case "subscribers": {
        const rows = await this.prisma.subscriber.findMany({
          where: created,
          orderBy: { createdAt: "asc" },
          take: CSV_LIMIT,
        });
        return toCsv(
          ["Email", "Source", "Signed up", "Unsubscribed"],
          rows.map((row) => [
            row.email,
            row.source,
            toDhakaIsoString(row.createdAt),
            row.unsubscribedAt ? toDhakaIsoString(row.unsubscribedAt) : "",
          ]),
        );
      }
    }
  }
}

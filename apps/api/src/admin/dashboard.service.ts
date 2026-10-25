import { Inject, Injectable } from "@nestjs/common";
import { toDhakaIsoString } from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import { ContentService } from "../content/content.service";
import { PrismaService } from "../prisma/prisma.service";
import { canSeeOrders, dhakaStart, leadModulesFor } from "./access";
import { dhakaDay } from "./reports.service";

const DAY = 24 * 60 * 60_000;
/** Days in the KPI sparklines and the leads-by-day chart; two weeks back give "vs last week". */
const SERIES_DAYS = 14;

const CLOSED = ["booked", "cancelled", "lost", "spam"];
const NOT_SOLD = ["cancelled", "returned"];

/**
 * Dashboard (PRD §13): KPI cards, leads by module and status, top searched routes and the latest activity, for the
 * modules this person works on.
 */
@Injectable()
export class AdminDashboardService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ContentService) private readonly content: ContentService,
  ) {}

  async summary(staff: StaffPrincipal, now = new Date()) {
    const modules = leadModulesFor(staff);
    const today = dhakaStart(now, "day");
    const month = dhakaStart(now, "month");
    let sla = 30;
    try {
      sla = (await this.content.setting("leadFormSettings")).slaMinutes;
    } catch {
      // keep the PRD default
    }
    const scope = { module: { in: modules } };
    const seriesStart = new Date(today.getTime() - (SERIES_DAYS - 1) * DAY);
    const [
      newToday,
      open,
      overdue,
      bookedThisMonth,
      byModule,
      byStatus,
      ordersToday,
      ordersOpen,
      revenue,
      feedbackPending,
      proofsPending,
      topRoutes,
      activity,
      recentLeads,
      recentOrders,
      oldestNew,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { ...scope, createdAt: { gte: today } } }),
      this.prisma.lead.count({ where: { ...scope, status: { notIn: CLOSED } } }),
      this.prisma.lead.count({
        where: {
          ...scope,
          status: "new",
          createdAt: { lt: new Date(now.getTime() - sla * 60_000) },
        },
      }),
      this.prisma.lead.count({ where: { ...scope, status: "booked", closedAt: { gte: month } } }),
      this.prisma.lead.groupBy({
        by: ["module"],
        where: { ...scope, createdAt: { gte: month } },
        _count: { _all: true },
      }),
      this.prisma.lead.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.count({
        where: { status: { in: ["placed", "confirmed", "processing", "shipped"] } },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: month }, status: { notIn: NOT_SOLD } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.feedback.count({ where: { status: "pending" } }),
      this.prisma.paymentProof.count({ where: { status: "received" } }),
      this.prisma.searchLog.groupBy({
        by: ["module", "summary"],
        where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60_000) } },
        _count: { _all: true },
        orderBy: { _count: { summary: "desc" } },
        take: 8,
      }),
      this.prisma.leadActivity.findMany({
        where: { lead: scope },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { lead: { select: { id: true, reference: true } } },
      }),
      // The last 14 days of leads (and bookings closed in them) for sparklines, the chart and week-on-week words.
      this.prisma.lead.findMany({
        where: {
          ...scope,
          OR: [{ createdAt: { gte: seriesStart } }, { closedAt: { gte: seriesStart } }],
        },
        select: { createdAt: true, status: true, closedAt: true, amount: true },
      }),
      canSeeOrders(staff)
        ? this.prisma.order.findMany({
            where: { createdAt: { gte: seriesStart }, status: { notIn: NOT_SOLD } },
            select: { createdAt: true, total: true },
          })
        : Promise.resolve(null),
      // The longest wait for a first reply, for the New leads card's timer.
      this.prisma.lead.findFirst({
        where: { ...scope, status: "new" },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);
    const days = Array.from({ length: SERIES_DAYS }, (_, index) =>
      dhakaDay(new Date(today.getTime() - (SERIES_DAYS - 1 - index) * DAY)),
    );
    const series = new Map(
      days.map((day) => [day, { day, leads: 0, booked: 0, bookedValue: 0, orders: 0, revenue: 0 }]),
    );
    for (const lead of recentLeads) {
      const created = series.get(dhakaDay(lead.createdAt));
      if (created) created.leads += 1;
      if (lead.status === "booked" && lead.closedAt) {
        const closed = series.get(dhakaDay(lead.closedAt));
        if (closed) {
          closed.booked += 1;
          closed.bookedValue += lead.amount ?? 0;
        }
      }
    }
    for (const order of recentOrders ?? []) {
      const day = series.get(dhakaDay(order.createdAt));
      if (day) {
        day.orders += 1;
        day.revenue += order.total;
      }
    }
    const points = [...series.values()];
    const week = (pick: (point: (typeof points)[number]) => number, from: number, to: number) =>
      points.slice(from, to).reduce((sum, point) => sum + pick(point), 0);
    const weeks = Object.fromEntries(
      (["leads", "booked", "bookedValue", "orders", "revenue"] as const).map((key) => [
        key,
        {
          thisWeek: week((point) => point[key], 7, 14),
          lastWeek: week((point) => point[key], 0, 7),
        },
      ]),
    ) as Record<
      "leads" | "booked" | "bookedValue" | "orders" | "revenue",
      { thisWeek: number; lastWeek: number }
    >;
    return {
      generatedAt: toDhakaIsoString(now),
      slaMinutes: sla,
      oldestNewAt: oldestNew ? toDhakaIsoString(oldestNew.createdAt) : null,
      series: recentOrders ? points : points.map(({ orders: _o, revenue: _r, ...rest }) => rest),
      weeks: recentOrders
        ? weeks
        : { leads: weeks.leads, booked: weeks.booked, bookedValue: weeks.bookedValue },
      leads: {
        newToday,
        open,
        overdue,
        bookedThisMonth,
        byModule: byModule.map((row) => ({ module: row.module, count: row._count._all })),
        byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      },
      orders: {
        today: ordersToday,
        open: ordersOpen,
        thisMonth: revenue._count._all,
        revenueThisMonth: revenue._sum.total ?? 0,
      },
      feedbackPending,
      proofsPending,
      topRoutes: topRoutes.map((row) => ({
        module: row.module,
        summary: row.summary,
        count: row._count._all,
      })),
      activity: activity.map((item) => ({
        id: item.id,
        leadId: item.lead.id,
        reference: item.lead.reference,
        type: item.type,
        body: item.body,
        actor: item.actorName,
        createdAt: toDhakaIsoString(item.createdAt),
      })),
    };
  }
}

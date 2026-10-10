import { Inject, Injectable } from "@nestjs/common";
import { toDhakaIsoString } from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import { ContentService } from "../content/content.service";
import { PrismaService } from "../prisma/prisma.service";
import { dhakaStart, leadModulesFor } from "./access";

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
    ]);
    return {
      generatedAt: toDhakaIsoString(now),
      slaMinutes: sla,
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

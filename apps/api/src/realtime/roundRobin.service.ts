import { Inject, Injectable } from "@nestjs/common";
import { getOfficeStatus, leadModulesForRoles, type LeadModule, type Role } from "@waafa/shared";
import { ContentService } from "../content/content.service";
import { PrismaService } from "../prisma/prisma.service";
import { StaffAlertsService } from "./alerts.service";
import { adminHref } from "./liveBus";

/** One lock for every hand-out, so two leads arriving together go to two people. */
const LOCK = 243_001;
/** After-hours leads older than this are left for a person to pick up. */
const CATCH_UP_DAYS = 7;

/**
 * Round-robin (issue 243): a new lead goes to the active staff member who has waited longest among those with
 * "Takes new leads" on and a role that opens its service. Only during office hours (Settings › Contact, Asia/Dhaka);
 * a lead that arrives after hours waits and is handed out by the minute job at opening. A lead that was ever assigned
 * (by hand or in turn) is never handed out again, so unassigning one on purpose sticks.
 */
@Injectable()
export class RoundRobinService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(StaffAlertsService) private readonly alerts: StaffAlertsService,
  ) {}

  private async officeOpen(now: Date): Promise<boolean> {
    try {
      const contact = await this.content.setting("contactSettings");
      return getOfficeStatus(contact.officeHours, now).open;
    } catch {
      return false;
    }
  }

  /** Hands one lead to the next person in turn; the id of that person, or null when it stays where it is. */
  async assign(leadId: string, now = new Date()): Promise<string | null> {
    if (!(await this.officeOpen(now))) return null;
    let push: () => void = () => undefined;
    const assigned = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK})`;
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          reference: true,
          module: true,
          status: true,
          name: true,
          summary: true,
          assigneeId: true,
          activities: { where: { type: "assign" }, select: { id: true }, take: 1 },
        },
      });
      if (!lead || lead.status !== "new" || lead.assigneeId || lead.activities.length > 0)
        return null;
      const people = await tx.staffUser.findMany({
        where: { status: "active", takesLeads: true },
        orderBy: [{ lastLeadAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
        select: { id: true, name: true, roles: true },
      });
      const next = people.find((person) =>
        leadModulesForRoles(person.roles as Role[]).includes(lead.module as LeadModule),
      );
      if (!next) return null;
      await tx.lead.update({ where: { id: lead.id }, data: { assigneeId: next.id } });
      await tx.staffUser.update({ where: { id: next.id }, data: { lastLeadAt: now } });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "assign",
          body: `Assigned to ${next.name} in turn`,
          actorName: "Round-robin",
          createdAt: now,
        },
      });
      await tx.auditLog.create({
        data: {
          actorName: "Round-robin",
          action: "lead.assign",
          entity: "lead",
          entityId: lead.reference,
          after: { assigneeId: next.id, by: "round-robin" },
          at: now,
        },
      });
      push = await this.alerts.create(
        [
          {
            staffId: next.id,
            kind: "assigned",
            title: `New lead for you: ${lead.reference}`,
            detail: `${lead.name} · ${lead.summary}`.slice(0, 300),
            href: adminHref(`/leads/${lead.id}`),
          },
        ],
        tx,
        now,
      );
      return next.id;
    });
    push();
    return assigned;
  }

  /** The minute job (issue 243): at and after opening, hands out the new leads that arrived while the office was shut. */
  async catchUp(now = new Date()): Promise<number> {
    if (!(await this.officeOpen(now))) return 0;
    const anyone = await this.prisma.staffUser.count({
      where: { status: "active", takesLeads: true },
    });
    if (anyone === 0) return 0;
    const waiting = await this.prisma.lead.findMany({
      where: {
        status: "new",
        assigneeId: null,
        createdAt: { gte: new Date(now.getTime() - CATCH_UP_DAYS * 86_400_000) },
        activities: { none: { type: "assign" } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: { id: true },
    });
    let handed = 0;
    for (const lead of waiting) {
      if (await this.assign(lead.id, now)) handed += 1;
    }
    return handed;
  }
}

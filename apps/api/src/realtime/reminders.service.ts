import { Inject, Injectable } from "@nestjs/common";
import {
  toDhakaDateString,
  toDhakaIsoString,
  type ReminderInput,
  type ReminderList,
  type ReminderUpdateInput,
  type ReminderView,
} from "@waafa/shared";
import { assertLeadAccess } from "../admin/access";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";
import { StaffAlertsService } from "./alerts.service";
import { adminHref } from "./liveBus";

/** A reminder may be set at most a minute in the past (a slow click), never for an hour that is gone. */
const PAST_GRACE_MS = 60_000;

type Row = {
  id: string;
  note: string;
  dueAt: Date;
  leadId: string | null;
};

/**
 * Reminders (issue 243): each person's own follow-ups, mostly on leads. Listed on the dashboard and the lead page;
 * the minute job turns each one into a bell alert once when it falls due. Nobody sees or changes another person's.
 */
@Injectable()
export class RemindersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StaffAlertsService) private readonly alerts: StaffAlertsService,
  ) {}

  private async views(rows: Row[], now: Date): Promise<ReminderView[]> {
    const ids = [...new Set(rows.map((row) => row.leadId).filter((id): id is string => !!id))];
    const leads = ids.length
      ? await this.prisma.lead.findMany({
          where: { id: { in: ids } },
          select: { id: true, reference: true, name: true },
        })
      : [];
    const byId = new Map(leads.map((lead) => [lead.id, lead]));
    const today = toDhakaDateString(now);
    return rows.map((row) => ({
      id: row.id,
      note: row.note,
      dueAt: toDhakaIsoString(row.dueAt),
      when:
        row.dueAt.getTime() <= now.getTime()
          ? "overdue"
          : toDhakaDateString(row.dueAt) === today
            ? "today"
            : "later",
      lead: row.leadId ? (byId.get(row.leadId) ?? null) : null,
    }));
  }

  /** This person's open reminders, soonest first (on one lead when `leadId` is given). */
  async list(staff: StaffPrincipal, leadId?: string, now = new Date()): Promise<ReminderList> {
    const rows = await this.prisma.reminder.findMany({
      where: { staffId: staff.id, doneAt: null, ...(leadId ? { leadId } : {}) },
      orderBy: { dueAt: "asc" },
      take: 100,
      select: { id: true, note: true, dueAt: true, leadId: true },
    });
    return { items: await this.views(rows, now) };
  }

  async create(staff: StaffPrincipal, input: ReminderInput, now = new Date()) {
    const dueAt = new Date(input.dueAt);
    if (dueAt.getTime() < now.getTime() - PAST_GRACE_MS)
      throw problems.badRequest("Pick a time that has not passed yet");
    if (input.leadId) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: input.leadId },
        select: { module: true },
      });
      if (!lead) throw problems.notFound();
      assertLeadAccess(staff, lead.module);
    }
    await this.prisma.reminder.create({
      data: { staffId: staff.id, leadId: input.leadId ?? null, note: input.note, dueAt },
    });
    return this.list(staff, input.leadId, now);
  }

  async update(staff: StaffPrincipal, id: string, input: ReminderUpdateInput, now = new Date()) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, staffId: staff.id, doneAt: null },
    });
    if (!reminder) throw problems.notFound();
    if (input.done) {
      await this.prisma.reminder.update({ where: { id }, data: { doneAt: now } });
    } else if (input.dueAt) {
      const dueAt = new Date(input.dueAt);
      if (dueAt.getTime() < now.getTime() - PAST_GRACE_MS)
        throw problems.badRequest("Pick a time that has not passed yet");
      // A new time alerts again when it comes.
      await this.prisma.reminder.update({ where: { id }, data: { dueAt, alertedAt: null } });
    }
    return this.list(staff, undefined, now);
  }

  async remove(staff: StaffPrincipal, id: string, now = new Date()) {
    const { count } = await this.prisma.reminder.deleteMany({ where: { id, staffId: staff.id } });
    if (count === 0) throw problems.notFound();
    return this.list(staff, undefined, now);
  }

  /** The minute job: each reminder that fell due becomes one alert for its person. */
  async alertDue(now = new Date()): Promise<number> {
    const due = await this.prisma.reminder.findMany({
      where: { doneAt: null, alertedAt: null, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
      take: 200,
      select: { id: true, staffId: true, note: true, leadId: true },
    });
    if (due.length === 0) return 0;
    const leadIds = [...new Set(due.map((row) => row.leadId).filter((id): id is string => !!id))];
    const leads = new Map(
      (
        await this.prisma.lead.findMany({
          where: { id: { in: leadIds } },
          select: { id: true, reference: true, name: true },
        })
      ).map((lead) => [lead.id, lead]),
    );
    let sent = 0;
    for (const reminder of due) {
      // Claim it first, so two API processes never alert twice.
      const { count } = await this.prisma.reminder.updateMany({
        where: { id: reminder.id, alertedAt: null },
        data: { alertedAt: now },
      });
      if (count === 0) continue;
      const lead = reminder.leadId ? leads.get(reminder.leadId) : undefined;
      await this.alerts.create(
        [
          {
            staffId: reminder.staffId,
            kind: "reminder",
            title: lead ? `Reminder: ${lead.reference} · ${lead.name}` : "Reminder",
            detail: reminder.note,
            href: adminHref(lead ? `/leads/${lead.id}` : "/"),
          },
        ],
        undefined,
        now,
      );
      sent += 1;
    }
    return sent;
  }
}

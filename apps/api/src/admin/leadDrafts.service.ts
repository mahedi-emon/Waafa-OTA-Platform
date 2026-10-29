import { Inject, Injectable } from "@nestjs/common";
import {
  INCOMPLETE_AFTER_MINUTES,
  INCOMPLETE_KEEP_DAYS,
  toDhakaIsoString,
  type LeadDraftAction,
  type LeadDraftListQuery,
  type LeadModule,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ENV, type Env } from "../config/env";
import type { Prisma } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { leadModulesFor } from "./access";

const MINUTE = 60_000;
const DAY = 86_400_000;
/** The reminder goes only while the request is fresh: never to someone who started two days ago. */
const REMIND_WITHIN_MS = 2 * DAY;

/** The service in the reminder's words ("Finish your hotel request"). */
const SERVICE_WORDS: Record<LeadModule, string> = {
  flights: "flight",
  hotels: "hotel",
  packages: "tour package",
  "plan-trip": "trip plan",
  visa: "visa",
  printing: "printing",
  trading: "trading",
  contact: "contact",
  emi: "EMI",
  bulk: "bulk order",
};

/**
 * Incomplete requests (FR-FLT-08, issue 250): visitors who finished step 1 with their OK to be called but never sent
 * the request. Staff see them after 30 minutes, call and mark them contacted or set them aside; the visitor gets at
 * most one reminder email; everything is forgotten after 30 days.
 */
@Injectable()
export class LeadDraftsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Requests left unfinished long enough to count as Incomplete, not yet handled. */
  private openWhere(now: Date): Prisma.LeadDraftWhereInput {
    return {
      completedAt: null,
      outcome: null,
      createdAt: {
        lte: new Date(now.getTime() - INCOMPLETE_AFTER_MINUTES * MINUTE),
        gte: new Date(now.getTime() - INCOMPLETE_KEEP_DAYS * DAY),
      },
    };
  }

  async list(staff: StaffPrincipal, query: LeadDraftListQuery, now = new Date()) {
    const modules = leadModulesFor(staff);
    const where: Prisma.LeadDraftWhereInput = {
      module: { in: modules },
      ...(query.view === "open"
        ? this.openWhere(now)
        : { outcome: { not: null }, completedAt: null }),
    };
    const [total, rows] = await Promise.all([
      this.prisma.leadDraft.count({ where }),
      this.prisma.leadDraft.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => ({
        id: row.id,
        module: row.module,
        name: row.name,
        phone: row.phone,
        email: row.email,
        page: row.page,
        createdAt: toDhakaIsoString(row.createdAt),
        outcome: row.outcome,
        outcomeBy: row.outcomeBy,
        reminderSent: row.reminderSentAt !== null,
      })),
    };
  }

  /** How many Incomplete requests wait for this person (the Leads tab's count). */
  async countOpen(staff: StaffPrincipal, now = new Date()): Promise<number> {
    return this.prisma.leadDraft.count({
      where: { module: { in: leadModulesFor(staff) }, ...this.openWhere(now) },
    });
  }

  async act(staff: StaffPrincipal, id: string, action: LeadDraftAction, now = new Date()) {
    const row = await this.prisma.leadDraft.findUnique({ where: { id } });
    if (!row || !leadModulesFor(staff).includes(row.module as LeadModule))
      throw problems.notFound("Request not found");
    if (row.completedAt) throw problems.conflict("The visitor sent the full request", "completed");
    const updated = await this.prisma.leadDraft.update({
      where: { id },
      data: { outcome: action.type, outcomeAt: now, outcomeBy: staff.name },
    });
    await this.audit.record({
      actor: staff,
      action: `lead-draft.${action.type}`,
      entity: "LeadDraft",
      entityId: id,
      before: { outcome: row.outcome },
      after: { outcome: updated.outcome },
    });
    return { id, outcome: updated.outcome };
  }

  /**
   * The minute job: one reminder email to each visitor who left a fresh request unfinished and gave an address, then
   * old requests are forgotten. Returns how many reminders went.
   */
  async remindAndPurge(now = new Date()): Promise<number> {
    const due = await this.prisma.leadDraft.findMany({
      where: {
        ...this.openWhere(now),
        createdAt: {
          lte: new Date(now.getTime() - INCOMPLETE_AFTER_MINUTES * MINUTE),
          gte: new Date(now.getTime() - REMIND_WITHIN_MS),
        },
        email: { not: null },
        reminderSentAt: null,
      },
      take: 50,
    });
    const origin = this.env.WEB_ORIGINS[0] ?? "https://waafasworld.com";
    let sent = 0;
    for (const row of due) {
      // Claimed first, so two servers never send the same reminder.
      const claimed = await this.prisma.leadDraft.updateMany({
        where: { id: row.id, reminderSentAt: null },
        data: { reminderSentAt: now },
      });
      if (claimed.count === 0 || !row.email) continue;
      void this.notifications.notify("lead-incomplete-customer", row.email, {
        name: row.name,
        service: SERVICE_WORDS[row.module as LeadModule] ?? "travel",
        link: new URL(row.page, origin).toString(),
      });
      sent += 1;
    }
    await this.prisma.leadDraft.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - INCOMPLETE_KEEP_DAYS * DAY) } },
    });
    return sent;
  }
}

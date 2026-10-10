import { Inject, Injectable } from "@nestjs/common";
import {
  toDhakaIsoString,
  type LeadBulkInput,
  type LeadListQuery,
  type LeadNoteInput,
  type LeadStatus,
  type LeadUpdateInput,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { assertLeadAccess, dhakaDate, leadModulesFor } from "./access";

const CLOSED: LeadStatus[] = ["booked", "cancelled", "lost", "spam"];

type LeadWithPeople = Prisma.LeadGetPayload<{ include: { activities: true } }>;

/**
 * Leads for the admin (FR-ADM-LEAD): list with saved views, filters and search; detail with the timeline; status,
 * priority and assignee changes with the PRD rules; notes, calls and messages; bulk assign. Every change writes a
 * timeline entry and the audit log in the same transaction.
 */
@Injectable()
export class AdminLeadsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
  ) {}

  private async slaMinutes(): Promise<number> {
    try {
      return (await this.content.setting("leadFormSettings")).slaMinutes;
    } catch {
      return 30;
    }
  }

  private async staffNames(ids: Array<string | null | undefined>): Promise<Map<string, string>> {
    const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (wanted.length === 0) return new Map();
    const people = await this.prisma.staffUser.findMany({
      where: { id: { in: wanted } },
      select: { id: true, name: true },
    });
    return new Map(people.map((person) => [person.id, person.name]));
  }

  async list(staff: StaffPrincipal, query: LeadListQuery, now = new Date()) {
    const modules = leadModulesFor(staff);
    const sla = await this.slaMinutes();
    const where: Prisma.LeadWhereInput = {
      module: query.module
        ? { in: modules.includes(query.module) ? [query.module] : [] }
        : { in: modules },
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    };
    if (query.view === "open") where.status = query.status ?? { notIn: CLOSED };
    if (query.view === "mine") where.assigneeId = staff.id;
    if (query.view === "unassigned") where.assigneeId = null;
    if (query.view === "overdue") {
      where.status = "new";
      where.createdAt = { lt: new Date(now.getTime() - sla * 60_000) };
    }
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {
        ...(typeof where.createdAt === "object" ? where.createdAt : {}),
        ...(query.createdFrom ? { gte: dhakaDate(query.createdFrom) } : {}),
        ...(query.createdTo ? { lt: dhakaDate(query.createdTo, true) } : {}),
      };
    }
    if (query.q) {
      const q = query.q.trim();
      const digits = q.replace(/\D/g, "");
      where.OR = [
        { reference: { contains: q.toUpperCase() } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-10) } }] : []),
      ];
    }
    const [total, rows] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const names = await this.staffNames(rows.map((row) => row.assigneeId));
    const duplicates = await this.prisma.lead.findMany({
      where: {
        id: { in: rows.map((row) => row.duplicateOfId).filter((id): id is string => Boolean(id)) },
      },
      select: { id: true, reference: true },
    });
    const duplicateRefs = new Map(duplicates.map((item) => [item.id, item.reference]));
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      slaMinutes: sla,
      items: rows.map((row) => {
        const ageMinutes = Math.floor((now.getTime() - row.createdAt.getTime()) / 60_000);
        return {
          id: row.id,
          reference: row.reference,
          module: row.module,
          status: row.status,
          priority: row.priority,
          name: row.name,
          phone: row.phone,
          email: row.email,
          summary: row.summary,
          travelDate: row.travelDate,
          travellers: row.travellers,
          assignee: row.assigneeId
            ? { id: row.assigneeId, name: names.get(row.assigneeId) ?? "Former staff" }
            : null,
          source: (row.source as { channel?: string }).channel ?? "web",
          duplicateOf: row.duplicateOfId ? (duplicateRefs.get(row.duplicateOfId) ?? null) : null,
          createdAt: toDhakaIsoString(row.createdAt),
          ageMinutes,
          overdue: row.status === "new" && ageMinutes > sla,
        };
      }),
    };
  }

  private async load(staff: StaffPrincipal, id: string): Promise<LeadWithPeople> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: "asc" } } },
    });
    if (!lead) throw problems.notFound("Lead not found");
    assertLeadAccess(staff, lead.module);
    return lead;
  }

  async detail(staff: StaffPrincipal, id: string) {
    const lead = await this.load(staff, id);
    const [names, original, repeats] = await Promise.all([
      this.staffNames([lead.assigneeId]),
      lead.duplicateOfId
        ? this.prisma.lead.findUnique({
            where: { id: lead.duplicateOfId },
            select: { id: true, reference: true },
          })
        : null,
      this.prisma.lead.findMany({
        where: { duplicateOfId: lead.id },
        select: { id: true, reference: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return {
      id: lead.id,
      reference: lead.reference,
      module: lead.module,
      status: lead.status,
      priority: lead.priority,
      contact: lead.contact,
      payload: lead.payload,
      source: lead.source,
      summary: lead.summary,
      travelDate: lead.travelDate,
      travellers: lead.travellers,
      amount: lead.amount,
      reason: lead.reason,
      assignee: lead.assigneeId
        ? { id: lead.assigneeId, name: names.get(lead.assigneeId) ?? "Former staff" }
        : null,
      duplicateOf: original,
      repeats,
      firstResponseAt: lead.firstResponseAt ? toDhakaIsoString(lead.firstResponseAt) : null,
      closedAt: lead.closedAt ? toDhakaIsoString(lead.closedAt) : null,
      createdAt: toDhakaIsoString(lead.createdAt),
      activities: lead.activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        body: activity.body,
        actor: activity.actorName,
        createdAt: toDhakaIsoString(activity.createdAt),
      })),
    };
  }

  async update(staff: StaffPrincipal, id: string, input: LeadUpdateInput, now = new Date()) {
    const lead = await this.load(staff, id);
    if (input.assigneeId) {
      const assignee = await this.prisma.staffUser.findUnique({ where: { id: input.assigneeId } });
      if (!assignee || assignee.status !== "active")
        throw problems.badRequest("Pick an active staff member");
    }
    const data: Prisma.LeadUpdateInput = {};
    const notes: Array<{ type: string; body: string }> = [];
    if (input.status && input.status !== lead.status) {
      data.status = input.status;
      if (!lead.firstResponseAt) data.firstResponseAt = now;
      data.closedAt = CLOSED.includes(input.status) ? now : null;
      if (input.status === "booked") data.amount = input.amount ?? null;
      if (input.status === "cancelled" || input.status === "lost")
        data.reason = input.reason ?? null;
      notes.push({
        type: "status",
        body: `Status ${lead.status} → ${input.status}${input.amount !== undefined && input.status === "booked" ? ` (৳${input.amount})` : ""}${input.reason ? `: ${input.reason}` : ""}`,
      });
    } else if (input.amount !== undefined && lead.status === "booked") {
      data.amount = input.amount;
      notes.push({ type: "status", body: `Booked amount changed to ৳${input.amount}` });
    }
    if (input.priority && input.priority !== lead.priority) {
      data.priority = input.priority;
      notes.push({ type: "note", body: `Priority ${lead.priority} → ${input.priority}` });
    }
    if (input.assigneeId !== undefined && input.assigneeId !== lead.assigneeId) {
      data.assigneeId = input.assigneeId;
      const names = await this.staffNames([input.assigneeId]);
      notes.push({
        type: "assign",
        body: input.assigneeId
          ? `Assigned to ${names.get(input.assigneeId) ?? "staff"}`
          : "Unassigned",
      });
    }
    if (notes.length === 0) return this.detail(staff, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data });
      // One millisecond apart, so the timeline keeps the order of the changes.
      for (const [index, note] of notes.entries()) {
        await tx.leadActivity.create({
          data: {
            leadId: id,
            type: note.type,
            body: note.body,
            actorId: staff.id,
            actorName: staff.name,
            createdAt: new Date(now.getTime() + index),
          },
        });
      }
      await this.audit.record(
        {
          actor: staff,
          action: "lead.update",
          entity: "lead",
          entityId: lead.reference,
          before: {
            status: lead.status,
            priority: lead.priority,
            assigneeId: lead.assigneeId,
            amount: lead.amount,
          },
          after: input,
          ...(input.reason ? { reason: input.reason } : {}),
        },
        tx,
      );
    });
    return this.detail(staff, id);
  }

  async addNote(staff: StaffPrincipal, id: string, input: LeadNoteInput, now = new Date()) {
    const lead = await this.load(staff, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.leadActivity.create({
        data: {
          leadId: id,
          type: input.type,
          body: input.body,
          actorId: staff.id,
          actorName: staff.name,
          createdAt: now,
        },
      });
      // A call, email or WhatsApp message is a first response too.
      if (!lead.firstResponseAt && input.type !== "note") {
        await tx.lead.update({ where: { id }, data: { firstResponseAt: now } });
      }
    });
    return this.detail(staff, id);
  }

  async bulk(staff: StaffPrincipal, input: LeadBulkInput, now = new Date()) {
    const modules = leadModulesFor(staff);
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: input.ids }, module: { in: modules } },
    });
    let changed = 0;
    for (const lead of leads) {
      await this.update(
        staff,
        lead.id,
        {
          ...(input.status ? { status: input.status } : {}),
          ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        },
        now,
      );
      changed += 1;
    }
    return { changed };
  }

  /** CSV export of the current filter (FR-ADM-LEAD), up to 5,000 rows. */
  async csv(staff: StaffPrincipal, query: LeadListQuery): Promise<string> {
    const page = await this.list(staff, { ...query, page: 1, pageSize: 100 });
    const rows = [...page.items];
    for (let next = 2; rows.length < Math.min(page.total, 5_000); next += 1) {
      const more = await this.list(staff, { ...query, page: next, pageSize: 100 });
      if (more.items.length === 0) break;
      rows.push(...more.items);
    }
    const cell = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      // Neutralise spreadsheet formulas and quote every cell.
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const header = [
      "Reference",
      "Module",
      "Status",
      "Priority",
      "Name",
      "Phone",
      "Email",
      "Summary",
      "Travel date",
      "Travellers",
      "Assignee",
      "Source",
      "Created",
    ];
    const lines = rows.map((row) =>
      [
        row.reference,
        row.module,
        row.status,
        row.priority,
        row.name,
        row.phone,
        row.email,
        row.summary,
        row.travelDate,
        row.travellers,
        row.assignee?.name,
        row.source,
        row.createdAt,
      ]
        .map(cell)
        .join(","),
    );
    return [header.map(cell).join(","), ...lines].join("\r\n");
  }
}

import { Inject, Injectable } from "@nestjs/common";
import {
  formatDate,
  formatTaka,
  isOverdueLead,
  nextLeadStatus,
  toDhakaDateString,
  toDhakaIsoString,
  visaStage,
  type VisaStage,
  type LeadActionInput,
  type LeadBulkInput,
  type LeadListQuery,
  type LeadNoteInput,
  type LeadStatus,
  type LeadUpdateInput,
  type VisaApplicationListQuery,
  type VisaProgressInput,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import { NotificationService } from "../notifications/notification.service";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";
import { assertLeadAccess, canSeeOrders, dhakaDate, leadModulesFor } from "./access";
import { AdminBookingsService } from "./bookings.service";
import { quoteSummary } from "../quotes/quoteSummary";
import { checklistOf, progressOf, visaFacts } from "../common/visaProgress";

const CLOSED: LeadStatus[] = ["booked", "cancelled", "lost", "spam"];

type LeadWithPeople = Prisma.LeadGetPayload<{ include: { activities: true } }>;

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

/** Why a step can't apply, in plain words with the next step. */
const LEAD_REFUSALS = {
  closed: "This lead is closed: reopen it first",
  open: "This lead is still open",
  amount: "Enter the booked amount in taka",
  reason: "Say why in a few words",
  booked: "A booked lead can't be marked as spam",
} as const;

/** Status words for the timeline (the stored values stay as they are, D191). */
/** How the customer's email names each visa stage worth telling them about (FR-VISA-04). */
const VISA_STAGE_WORDS: Partial<Record<VisaStage, string>> = {
  readyToSubmit: "complete: we have every document",
  submitted: "submitted to the embassy",
  approved: "approved",
  rejected: "not approved this time",
  passportReturned: "closed: your passport is back with you",
};

const STATUS_WORDS: Record<string, string> = {
  new: "New",
  "in-progress": "In progress",
  quoted: "Quoted",
  pending: "Waiting for customer",
  booked: "Booked",
  lost: "Lost",
  cancelled: "Cancelled",
  spam: "Spam",
};

const CONTACT_WORDS = {
  call: "Called the customer",
  whatsapp: "Replied on WhatsApp",
  email: "Emailed the customer",
  note: "Contacted the customer",
} as const;

/** The timeline entry a step writes, with the status it moved to when it moved. */
function activityFor(
  input: LeadActionInput,
  movedTo: string | null,
): { type: string; body: string } {
  const moved = movedTo ? ` · Moved to ${STATUS_WORDS[movedTo] ?? movedTo}` : "";
  const withNote = (words: string, note?: string) => (note ? `${words}: ${note}` : words);
  switch (input.type) {
    case "contact":
      return { type: input.channel, body: `${input.note ?? CONTACT_WORDS[input.channel]}${moved}` };
    case "quote":
      return {
        type: "quote",
        body: `${withNote(`Quote logged${input.amount ? ` (${formatTaka(input.amount)})` : ""}`, input.note)}${moved}`,
      };
    case "askDocuments":
      return { type: "status", body: `${withNote("Asked for documents", input.note)}${moved}` };
    case "askPayment":
      return { type: "status", body: `${withNote("Asked for payment", input.note)}${moved}` };
    case "customerReplied":
      return { type: "status", body: `The customer replied${moved}` };
    case "convert":
      return { type: "converted", body: `Converted to a booking: ${formatTaka(input.amount)}` };
    case "close":
      return {
        type: "status",
        body: `Closed as ${input.outcome === "lost" ? "Lost" : "Cancelled"}: ${input.reason}`,
      };
    case "markSpam":
      return { type: "status", body: "Marked as spam" };
    case "reopen":
      return { type: "status", body: `Reopened: ${input.reason}` };
  }
}

const VISA_STAGES = [
  "documentsPending",
  "readyToSubmit",
  "submitted",
  "approved",
  "rejected",
  "passportReturned",
  "cancelled",
] as const;

/** The search box: a reference, a name, an email or the last digits of a phone number. */
function searchLeads(words: string): Prisma.LeadWhereInput[] {
  const q = words.trim();
  const digits = q.replace(/\D/g, "");
  return [
    { reference: { contains: q.toUpperCase() } },
    { name: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
    ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-10) } }] : []),
  ];
}

/** Today's date in Asia/Dhaka. */
const todayInDhaka = (now: Date) =>
  new Date(now.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);

/**
 * Leads for the admin (FR-ADM-LEAD): list with saved views, filters and search; detail with the timeline; steps
 * that move the status with the shared rules (D0 R4); priority and assignee; notes, calls and messages; bulk assign
 * and spam; the visa checklist. Every change writes a timeline entry and the audit log in the same transaction.
 */
@Injectable()
export class AdminLeadsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
    @Inject(AdminBookingsService) private readonly bookings: AdminBookingsService,
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
    if (query.view === "closed")
      where.status =
        query.status === "lost" || query.status === "cancelled"
          ? query.status
          : { in: ["lost", "cancelled"] };
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {
        ...(typeof where.createdAt === "object" ? where.createdAt : {}),
        ...(query.createdFrom ? { gte: dhakaDate(query.createdFrom) } : {}),
        ...(query.createdTo ? { lt: dhakaDate(query.createdTo, true) } : {}),
      };
    }
    if (query.q) where.OR = searchLeads(query.q);
    const [total, rows, open] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: query.sort === "created.asc" ? "asc" : "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      // Open leads per module this person works on, when the page shows the module tabs (D0 R6).
      query.counts === "1"
        ? this.prisma.lead.groupBy({
            by: ["module"],
            where: { module: { in: modules }, status: { notIn: CLOSED } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);
    const openBy = new Map(open.map((group) => [group.module, group._count._all]));
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
      // Empty unless asked for (counts=1): the tabs show the modules this person works on.
      modules:
        query.counts === "1"
          ? modules.map((module) => ({ module, open: openBy.get(module) ?? 0 }))
          : [],
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

  async detail(staff: StaffPrincipal, id: string, now = new Date()) {
    const lead = await this.load(staff, id);
    // The customer card (D0 R6): other requests and orders from the same phone, as far as this role may see.
    const sameLead = {
      phone: lead.phone,
      id: { not: lead.id },
      module: { in: leadModulesFor(staff) },
    };
    const orders = canSeeOrders(staff);
    const [otherLeads, leadCount, otherOrders, orderCount] = await Promise.all([
      this.prisma.lead.findMany({
        where: sameLead,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          reference: true,
          module: true,
          status: true,
          summary: true,
          createdAt: true,
        },
      }),
      this.prisma.lead.count({ where: sameLead }),
      orders
        ? this.prisma.order.findMany({
            where: { phone: lead.phone },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, reference: true, status: true, total: true, createdAt: true },
          })
        : Promise.resolve([]),
      orders ? this.prisma.order.count({ where: { phone: lead.phone } }) : Promise.resolve(0),
    ]);
    const [names, original, repeats, sla, checklist] = await Promise.all([
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
      this.slaMinutes(),
      lead.module === "visa" ? this.visaChecklist(lead) : Promise.resolve(null),
    ]);
    const progress = progressOf(lead.progress);
    const visa = checklist
      ? (() => {
          const facts = visaFacts(checklist, progress, lead.status);
          const { stage, received, required } = visaStage(facts);
          return {
            stage,
            received,
            required,
            checklist: checklist.map((item) => ({
              item,
              received: (progress.received ?? []).includes(item),
            })),
            ...(progress.submittedOn ? { submittedOn: progress.submittedOn } : {}),
            ...(progress.submissionReference
              ? { submissionReference: progress.submissionReference }
              : {}),
            ...(progress.outcome ? { outcome: progress.outcome } : {}),
            ...(progress.decidedOn ? { decidedOn: progress.decidedOn } : {}),
            ...(progress.passportReturnedOn
              ? { passportReturnedOn: progress.passportReturnedOn }
              : {}),
          };
        })()
      : null;
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
      // The booking made when it was converted (issue 242), for the link on the lead page.
      booking: await this.prisma.booking.findUnique({
        where: { leadId: lead.id },
        select: { id: true, reference: true, status: true, paymentStatus: true },
      }),
      // Its quotes, newest first (issue 298), for the Quotes card and the amount to convert with.
      quotes: (
        await this.prisma.quote.findMany({
          where: { leadId: lead.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      ).map((row) => quoteSummary(row, toDhakaDateString(now))),
      reason: lead.reason,
      assignee: lead.assigneeId
        ? { id: lead.assigneeId, name: names.get(lead.assigneeId) ?? "Former staff" }
        : null,
      duplicateOf: original,
      repeats,
      slaMinutes: sla,
      overdue: isOverdueLead(
        {
          status: lead.status,
          firstResponseAt: lead.firstResponseAt?.toISOString() ?? null,
          createdAt: lead.createdAt.toISOString(),
        },
        sla,
        now,
      ),
      visa,
      customer: {
        phone: lead.phone,
        leadCount,
        leads: otherLeads.map((item) => ({ ...item, createdAt: toDhakaIsoString(item.createdAt) })),
        orderCount,
        // Null when this role doesn't see orders, so the card says nothing about them.
        orders: orders
          ? otherOrders.map((item) => ({ ...item, createdAt: toDhakaIsoString(item.createdAt) }))
          : null,
      },
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

  /** Priority, assignee and a booked lead's corrected amount; the status only moves through `act` (D0 R4). */
  async update(staff: StaffPrincipal, id: string, input: LeadUpdateInput, now = new Date()) {
    const lead = await this.load(staff, id);
    if (input.assigneeId) {
      const assignee = await this.prisma.staffUser.findUnique({ where: { id: input.assigneeId } });
      if (!assignee || assignee.status !== "active")
        throw problems.badRequest("Pick an active staff member");
    }
    const data: Prisma.LeadUpdateInput = {};
    const notes: Array<{ type: string; body: string }> = [];
    if (input.amount !== undefined) {
      if (lead.status !== "booked")
        throw problems.conflict("Only a booked lead has an amount to correct", "notBooked");
      if (input.amount !== lead.amount) {
        data.amount = input.amount;
        notes.push({
          type: "status",
          body: `Booked amount changed to ${formatTaka(input.amount)}`,
        });
      }
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
      // A corrected booked amount is the booking's amount too (issue 242).
      if (typeof data.amount === "number")
        await this.bookings.fromLead(tx, staff, lead, data.amount, now);
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
          before: { priority: lead.priority, assigneeId: lead.assigneeId, amount: lead.amount },
          after: input,
        },
        tx,
      );
    });
    return this.detail(staff, id);
  }

  /**
   * One step on a lead (D0 R4, ADMIN.md §8.2): the status follows from the step with the shared rules, the first
   * contact stamps the first response, a booking takes its seats off a group fare, and the timeline and the audit
   * log record it in the same transaction.
   */
  async act(staff: StaffPrincipal, id: string, input: LeadActionInput, now = new Date()) {
    const lead = await this.load(staff, id);
    const move = nextLeadStatus(lead.status, input, {
      firstResponseAt: lead.firstResponseAt?.toISOString() ?? null,
    });
    if (!move.ok) throw problems.conflict(LEAD_REFUSALS[move.reason], move.reason);
    const moved = move.status !== lead.status;
    const data: Prisma.LeadUpdateInput = {};
    if (moved) {
      data.status = move.status;
      data.closedAt = move.closed ? now : null;
    }
    if (move.firstResponse) data.firstResponseAt = now;
    if (input.type === "convert") data.amount = input.amount;
    if (input.type === "close") data.reason = input.reason;
    if (input.type === "reopen") data.reason = null;
    const entry = activityFor(input, moved ? move.status : null);
    let seats = false;
    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) await tx.lead.update({ where: { id }, data });
      await tx.leadActivity.create({
        data: {
          leadId: id,
          type: entry.type,
          body: entry.body,
          actorId: staff.id,
          actorName: staff.name,
          createdAt: now,
        },
      });
      if (input.type === "convert") {
        seats = await this.takeSeats(tx, staff, lead);
        // The booking record (issue 242): PNR, tickets and payments are added on it afterwards.
        await this.bookings.fromLead(tx, staff, lead, input.amount, now);
      }
      await this.audit.record(
        {
          actor: staff,
          action: `lead.${input.type}`,
          entity: "lead",
          entityId: lead.reference,
          before: { status: lead.status },
          after: { status: move.status, ...input },
          ...("reason" in input ? { reason: input.reason } : {}),
        },
        tx,
      );
    });
    if (seats) {
      this.content.invalidate();
      this.revalidate.request(["groupFares"]);
    }
    return this.detail(staff, id);
  }

  /** A booked group-fare lead takes its travellers off the fare's seats (D224), never below none. */
  private async takeSeats(
    tx: Prisma.TransactionClient,
    staff: StaffPrincipal,
    lead: LeadWithPeople,
  ): Promise<boolean> {
    const fareId = (lead.payload as { groupFareId?: unknown } | null)?.groupFareId;
    if (typeof fareId !== "string") return false;
    const fare = await tx.contentDocument.findUnique({
      where: { collection_docId: { collection: "groupFares", docId: fareId } },
    });
    const data = fare?.data as Record<string, unknown> | undefined;
    if (!fare || !data || typeof data.seatsLeft !== "number") return false;
    const taken = Math.max(1, lead.travellers ?? 1);
    const after = { ...data, seatsLeft: Math.max(0, data.seatsLeft - taken) };
    await tx.contentDocument.update({
      where: { collection_docId: { collection: "groupFares", docId: fareId } },
      data: { data: json(after), version: { increment: 1 }, updatedBy: staff.name },
    });
    await this.audit.record(
      {
        actor: staff,
        action: "content.update",
        entity: "groupFares",
        entityId: fareId,
        before: data,
        after,
        reason: `${taken} ${taken === 1 ? "seat" : "seats"} booked on ${lead.reference}`,
      },
      tx,
    );
    return true;
  }

  /**
   * A visa application's checklist, submission and outcome (D0 R4, D225, ADMIN.md §8.3): stored on the visa lead,
   * the stage derived from it. Submitting needs every document; an outcome needs the submission.
   */
  async visa(staff: StaffPrincipal, id: string, input: VisaProgressInput, now = new Date()) {
    const lead = await this.load(staff, id);
    if (lead.module !== "visa")
      throw problems.badRequest("Only visa requests have a documents checklist");
    if (["cancelled", "lost", "spam"].includes(lead.status))
      throw problems.conflict("This application is closed: reopen it first", "closed");
    const checklist = await this.visaChecklist(lead);
    const progress = progressOf(lead.progress);
    const stage = visaStage(visaFacts(checklist, progress, lead.status)).stage;
    let body: string;
    switch (input.type) {
      case "document": {
        if (!checklist.includes(input.item))
          throw problems.badRequest("Pick a document from the checklist");
        if (progress.submittedOn)
          throw problems.conflict("The application is already submitted", "submitted");
        const received = new Set(progress.received ?? []);
        if (input.received) received.add(input.item);
        else received.delete(input.item);
        progress.received = checklist.filter((item) => received.has(item));
        body = input.received ? `${input.item}: received` : `${input.item}: not received yet`;
        break;
      }
      case "submit":
        if (stage !== "readyToSubmit")
          throw problems.conflict(
            "Mark every document as received before submitting the application",
            "documents",
          );
        progress.submittedOn = input.on;
        progress.submissionReference = input.submissionReference;
        body = `Submitted to the embassy on ${formatDate(input.on)} (reference ${input.submissionReference})`;
        break;
      case "outcome":
        if (stage !== "submitted")
          throw problems.conflict("Enter the submission before the outcome", "notSubmitted");
        progress.outcome = input.outcome;
        progress.decidedOn = todayInDhaka(now);
        body = input.outcome === "approved" ? "Visa approved" : "Visa rejected";
        break;
      case "passportReturned":
        if (stage !== "approved" && stage !== "rejected")
          throw problems.conflict("Enter the outcome before returning the passport", "noOutcome");
        progress.passportReturnedOn = input.on;
        body = `Passport returned on ${formatDate(input.on)}`;
        break;
    }
    // Working a new application is the first reply: it moves to In progress. A lead waiting for the customer moves only
    // when a document arrives (they replied); unticking or an outcome never moves it (D0 R6).
    const moved =
      lead.status === "new" ||
      (lead.status === "pending" && input.type === "document" && input.received)
        ? "in-progress"
        : null;
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id },
        data: {
          progress: json(progress),
          ...(lead.firstResponseAt ? {} : { firstResponseAt: now }),
          ...(moved ? { status: moved } : {}),
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: id,
          type: "visa",
          body: moved ? `${body} · Moved to ${STATUS_WORDS[moved] ?? moved}` : body,
          actorId: staff.id,
          actorName: staff.name,
          createdAt: now,
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "lead.visa",
          entity: "lead",
          entityId: lead.reference,
          before: { progress: lead.progress, status: lead.status },
          after: { progress, status: moved ?? lead.status },
        },
        tx,
      );
    });
    // The customer hears about every step forward (FR-VISA-04); a document unticked back to pending sends nothing.
    const next = visaStage(visaFacts(checklist, progress, moved ?? lead.status)).stage;
    const words = VISA_STAGE_WORDS[next];
    if (next !== stage && words) {
      const payload = lead.payload as { countryName?: unknown } | null;
      void this.notifications.notify("visa-status-customer", lead.email ?? undefined, {
        name: lead.name,
        reference: lead.reference,
        country: typeof payload?.countryName === "string" ? payload.countryName : "",
        status: words,
      });
    }
    return this.detail(staff, id);
  }

  /** The checklist titles of the lead's country and visa type, from Visa countries. */
  private async visaChecklist(lead: LeadWithPeople): Promise<string[]> {
    const payload = lead.payload as { countrySlug?: unknown; visaType?: unknown } | null;
    if (typeof payload?.countrySlug !== "string") return [];
    const country = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: "visaCountries", docId: payload.countrySlug } },
      select: { data: true },
    });
    return checklistOf(country?.data, payload.visaType);
  }

  /**
   * Visa applications (D0 R6, ADMIN.md §8.3): visa leads with the stage their checklist gives, newest first. The
   * stage comes from each country's checklist, so the stage filter and its counts are worked out here.
   */
  async visaApplications(staff: StaffPrincipal, query: VisaApplicationListQuery, now = new Date()) {
    assertLeadAccess(staff, "visa");
    // A spam request was never an application.
    const where: Prisma.LeadWhereInput = { module: "visa", status: { not: "spam" } };
    if (query.view === "open") where.status = { notIn: CLOSED };
    if (query.view === "mine") where.assigneeId = staff.id;
    if (query.view === "unassigned") where.assigneeId = null;
    if (query.q) where.OR = searchLeads(query.q);
    // The newest 2,000 applications, only the columns the list needs (the stage is worked out per row below).
    const [rows, sla] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: query.sort === "created.asc" ? "asc" : "desc" },
        take: 2_000,
        select: {
          id: true,
          reference: true,
          status: true,
          name: true,
          phone: true,
          summary: true,
          travelDate: true,
          assigneeId: true,
          payload: true,
          progress: true,
          firstResponseAt: true,
          createdAt: true,
        },
      }),
      this.slaMinutes(),
    ]);
    // Only the countries these applications name.
    const slugs = [
      ...new Set(
        rows.flatMap((row) => {
          const slug = (row.payload as { countrySlug?: unknown } | null)?.countrySlug;
          return typeof slug === "string" ? [slug] : [];
        }),
      ),
    ];
    const countries = await this.prisma.contentDocument.findMany({
      where: { collection: "visaCountries", docId: { in: slugs } },
      select: { docId: true, data: true },
    });
    const countryBy = new Map(countries.map((country) => [country.docId, country.data]));
    const applications = rows.map((row) => {
      const payload = row.payload as { countrySlug?: unknown; visaType?: unknown } | null;
      const country =
        typeof payload?.countrySlug === "string" ? countryBy.get(payload.countrySlug) : undefined;
      const progress = progressOf(row.progress);
      const checklist = checklistOf(country, payload?.visaType);
      return {
        row,
        progress,
        country: (country as { name?: unknown } | undefined)?.name,
        ...visaStage(visaFacts(checklist, progress, row.status)),
      };
    });
    const stages = Object.fromEntries(
      VISA_STAGES.map((stage) => [
        stage,
        applications.filter((application) => application.stage === stage).length,
      ]),
    );
    const matching = query.stage
      ? applications.filter((application) => application.stage === query.stage)
      : applications;
    const page = matching.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    const names = await this.staffNames(page.map((application) => application.row.assigneeId));
    return {
      total: matching.length,
      page: query.page,
      pageSize: query.pageSize,
      slaMinutes: sla,
      stages,
      items: page.map(({ row, progress, country, stage, received, required }) => {
        const ageMinutes = Math.floor((now.getTime() - row.createdAt.getTime()) / 60_000);
        return {
          id: row.id,
          reference: row.reference,
          status: row.status,
          name: row.name,
          phone: row.phone,
          summary: row.summary,
          country: typeof country === "string" ? country : null,
          travelDate: row.travelDate,
          assignee: row.assigneeId
            ? { id: row.assigneeId, name: names.get(row.assigneeId) ?? "Former staff" }
            : null,
          stage,
          received,
          required,
          submittedOn: progress.submittedOn ?? null,
          createdAt: toDhakaIsoString(row.createdAt),
          ageMinutes,
          overdue: row.status === "new" && !row.firstResponseAt && ageMinutes > sla,
        };
      }),
    };
  }

  /**
   * A timeline entry. A call, email or WhatsApp entry is a contact with the customer, so it moves the lead like the
   * contact buttons do (D220); an internal note changes nothing else.
   */
  async addNote(staff: StaffPrincipal, id: string, input: LeadNoteInput, now = new Date()) {
    if (input.type !== "note") {
      return this.act(staff, id, { type: "contact", channel: input.type, note: input.body }, now);
    }
    await this.load(staff, id);
    await this.prisma.leadActivity.create({
      data: {
        leadId: id,
        type: "note",
        body: input.body,
        actorId: staff.id,
        actorName: staff.name,
        createdAt: now,
      },
    });
    return this.detail(staff, id);
  }

  async bulk(staff: StaffPrincipal, input: LeadBulkInput, now = new Date()) {
    const modules = leadModulesFor(staff);
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: input.ids }, module: { in: modules } },
    });
    let changed = 0;
    const skipped: string[] = [];
    for (const lead of leads) {
      if (input.assigneeId !== undefined) {
        await this.update(staff, lead.id, { assigneeId: input.assigneeId }, now);
      }
      if (input.markSpam) {
        // A booked lead is never spam: it is skipped and named in the answer.
        if (!nextLeadStatus(lead.status, { type: "markSpam" }).ok) {
          skipped.push(lead.reference);
          continue;
        }
        if (lead.status !== "spam") await this.act(staff, lead.id, { type: "markSpam" }, now);
      }
      changed += 1;
    }
    return { changed, skipped };
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

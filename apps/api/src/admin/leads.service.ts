import { Inject, Injectable } from "@nestjs/common";
import {
  formatDate,
  formatTaka,
  isOverdueLead,
  nextLeadStatus,
  toDhakaIsoString,
  visaStage,
  type LeadActionInput,
  type LeadBulkInput,
  type LeadListQuery,
  type LeadNoteInput,
  type LeadStatus,
  type LeadUpdateInput,
  type VisaProgressFacts,
  type VisaProgressInput,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";
import { assertLeadAccess, dhakaDate, leadModulesFor } from "./access";

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

/** What a visa lead stores about its application (D225). */
type VisaProgress = {
  received?: string[];
  submittedOn?: string;
  submissionReference?: string;
  outcome?: "approved" | "rejected";
  decidedOn?: string;
  passportReturnedOn?: string;
};

function progressOf(value: unknown): VisaProgress {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as VisaProgress) }
    : {};
}

/** The facts `visaStage` reads, from the checklist, the stored progress and the lead's status. */
function visaFacts(checklist: string[], progress: VisaProgress, status: string): VisaProgressFacts {
  const received = new Set(progress.received ?? []);
  return {
    documents: checklist.map((item) => ({ required: true, received: received.has(item) })),
    submittedAt: progress.submittedOn ?? null,
    outcome: progress.outcome ?? null,
    passportReturnedAt: progress.passportReturnedOn ?? null,
    cancelled: status === "cancelled" || status === "lost",
  };
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
        orderBy: { createdAt: query.sort === "created.asc" ? "asc" : "desc" },
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

  async detail(staff: StaffPrincipal, id: string, now = new Date()) {
    const lead = await this.load(staff, id);
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
      if (input.type === "convert") seats = await this.takeSeats(tx, staff, lead);
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
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id },
        data: {
          progress: json(progress),
          ...(lead.firstResponseAt ? {} : { firstResponseAt: now }),
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: id,
          type: "visa",
          body,
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
          before: { progress: lead.progress },
          after: { progress },
        },
        tx,
      );
    });
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
    const types = (
      country?.data as { types?: Array<{ type?: unknown; checklist?: unknown }> } | null
    )?.types;
    const type = types?.find((item) => item.type === payload.visaType) ?? types?.[0];
    const items = Array.isArray(type?.checklist)
      ? (type.checklist as Array<{ title?: unknown }>)
      : [];
    return items.flatMap((item) => (typeof item.title === "string" ? [item.title] : []));
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

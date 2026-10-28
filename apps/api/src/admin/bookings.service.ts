import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  ALL_LEAD_MODULES,
  paymentStatusOf,
  toDhakaIsoString,
  type BookingStatus,
  type BookingUpdateInput,
  type BookingView,
  type LeadModule,
  type PaymentStatus,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { ProblemException, problems } from "../common/problem";
import { nextReference } from "../common/references";
import type { Booking, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { leadModulesFor } from "./access";

type BookingRow = Booking & { lead: { reference: string; name: string; phone: string } };

const PAGE = 50;

/** Accounts follow every booking's payments; everyone else sees the bookings of the leads they may open. */
export function bookingModulesFor(staff: StaffPrincipal): LeadModule[] {
  if (staff.roles.includes("accounts")) return [...ALL_LEAD_MODULES];
  return leadModulesFor(staff);
}

export function bookingView(row: BookingRow): BookingView {
  return {
    id: row.id,
    reference: row.reference,
    leadId: row.leadId,
    leadReference: row.lead.reference,
    module: row.module,
    customerName: row.lead.name,
    customerPhone: row.lead.phone,
    status: row.status as BookingStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    amount: row.amount,
    paid: row.paid,
    due: Math.max(0, row.amount - row.paid),
    pnr: row.pnr,
    tickets: row.tickets,
    supplier: row.supplier,
    travelDate: row.travelDate ? row.travelDate.toISOString().slice(0, 10) : null,
    notes: row.notes,
    createdAt: toDhakaIsoString(row.createdAt),
    updatedAt: toDhakaIsoString(row.updatedAt),
    updatedBy: row.updatedBy,
  };
}

/**
 * Bookings (issue 242): one per converted lead, made in the same transaction as the conversion and kept when the
 * lead is reopened. Staff record the PNR, ticket numbers, what was paid and the travel date; every change is audited.
 */
@Injectable()
export class AdminBookingsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** The booking for a lead that was just converted: new, or the amount corrected on a second conversion. */
  async fromLead(
    tx: Prisma.TransactionClient,
    staff: StaffPrincipal,
    lead: { id: string; module: string; travelDate: string | null },
    amount: number,
    now: Date,
  ): Promise<void> {
    const existing = await tx.booking.findUnique({ where: { leadId: lead.id } });
    if (existing) {
      await tx.booking.update({
        where: { id: existing.id },
        data: {
          amount,
          status: existing.status === "cancelled" ? "confirmed" : existing.status,
          paymentStatus: paymentStatusOf(
            amount,
            existing.paid,
            existing.paymentStatus === "refunded",
          ),
          updatedBy: staff.name,
        },
      });
      return;
    }
    const travel = /^\d{4}-\d{2}-\d{2}$/.test(lead.travelDate ?? "")
      ? new Date(`${lead.travelDate}T00:00:00Z`)
      : null;
    await tx.booking.create({
      data: {
        reference: await nextReference(tx, "BKG", now),
        leadId: lead.id,
        module: lead.module,
        amount,
        ...(travel ? { travelDate: travel } : {}),
        createdBy: staff.name,
        updatedBy: staff.name,
        createdAt: now,
      },
    });
  }

  async list(
    staff: StaffPrincipal,
    query: { status?: BookingStatus; payment?: PaymentStatus; q?: string; page?: number },
  ): Promise<{ items: BookingView[]; total: number; page: number; pages: number }> {
    const q = query.q?.trim();
    const where: Prisma.BookingWhereInput = {
      module: { in: bookingModulesFor(staff) },
      ...(query.status ? { status: query.status } : {}),
      ...(query.payment ? { paymentStatus: query.payment } : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: "insensitive" } },
              { pnr: { contains: q, mode: "insensitive" } },
              { tickets: { has: q.toUpperCase() } },
              { lead: { reference: { contains: q, mode: "insensitive" } } },
              { lead: { name: { contains: q, mode: "insensitive" } } },
              { lead: { phone: { contains: q.replace(/[^\d+]/g, "") || q } } },
            ],
          }
        : {}),
    };
    const page = Math.max(1, query.page ?? 1);
    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: { lead: { select: { reference: true, name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE,
        take: PAGE,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      items: rows.map(bookingView),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / PAGE)),
    };
  }

  async get(staff: StaffPrincipal, id: string): Promise<BookingView> {
    return bookingView(await this.load(staff, id));
  }

  async update(staff: StaffPrincipal, id: string, input: BookingUpdateInput): Promise<BookingView> {
    const before = await this.load(staff, id);
    const amount = input.amount ?? before.amount;
    const paid = input.paid ?? before.paid;
    if (paid > amount && input.refunded !== true)
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Validation failed",
        "Paid can't be more than the amount",
        [{ path: "paid", message: "Paid can't be more than the amount" }],
      );
    const refunded = input.refunded ?? before.paymentStatus === "refunded";
    const data: Prisma.BookingUpdateInput = {
      amount,
      paid,
      paymentStatus: paymentStatusOf(amount, paid, refunded),
      updatedBy: staff.name,
      ...(input.status ? { status: input.status } : {}),
      ...(input.pnr !== undefined ? { pnr: input.pnr } : {}),
      ...(input.tickets ? { tickets: [...new Set(input.tickets)] } : {}),
      ...(input.supplier !== undefined ? { supplier: input.supplier || null } : {}),
      ...(input.travelDate !== undefined
        ? { travelDate: input.travelDate ? new Date(`${input.travelDate}T00:00:00Z`) : null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
    };
    const after = await this.prisma.$transaction(async (tx) => {
      const row = await tx.booking.update({
        where: { id },
        data,
        include: { lead: { select: { reference: true, name: true, phone: true } } },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "booking.update",
          entity: "booking",
          entityId: before.reference,
          before: bookingView(before),
          after: bookingView(row),
        },
        tx,
      );
      return row;
    });
    return bookingView(after);
  }

  /** Whether this person may see the booking's files (the same rule as the booking). */
  async assertAccess(staff: StaffPrincipal, id: string): Promise<void> {
    await this.load(staff, id);
  }

  private async load(staff: StaffPrincipal, id: string): Promise<BookingRow> {
    const row = await this.prisma.booking.findUnique({
      where: { id },
      include: { lead: { select: { reference: true, name: true, phone: true } } },
    });
    if (!row || !bookingModulesFor(staff).includes(row.module as LeadModule))
      throw problems.notFound("Booking not found");
    return row;
  }
}

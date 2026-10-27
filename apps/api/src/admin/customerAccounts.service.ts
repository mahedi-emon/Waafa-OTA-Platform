import { Inject, Injectable } from "@nestjs/common";
import type { StaffPrincipal } from "../auth/principal";
import { AuditService } from "../audit/audit.service";
import { problems } from "../common/problem";
import { toDhakaIsoString } from "@waafa/shared";
import { PrismaService } from "../prisma/prisma.service";
import { assertLeadAccess, canSeeOrders, leadModulesFor } from "./access";

const PAGE_SIZE = 25;

type AccountRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerifiedAt: Date | null;
  signInMethod: string | null;
  lastSignInAt: Date | null;
  disabledAt: Date | null;
  createdAt: Date;
  _count: { leads: number; orders: number };
};

function accountView(row: AccountRow, orders: boolean) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    verified: row.emailVerifiedAt !== null,
    signInMethod: row.signInMethod,
    lastSignInAt: row.lastSignInAt ? toDhakaIsoString(row.lastSignInAt) : null,
    disabled: row.disabledAt !== null,
    createdAt: toDhakaIsoString(row.createdAt),
    requests: row._count.leads,
    orders: orders ? row._count.orders : null,
  };
}

const ACCOUNT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  emailVerifiedAt: true,
  signInMethod: true,
  lastSignInAt: true,
  disabledAt: true,
  createdAt: true,
  _count: { select: { leads: true, orders: true } },
} as const;

/**
 * Customer accounts in Admin › Customers (issue 241): who has an account, whether the email is verified, how they
 * sign in and when they last did; staff can turn an account off (every session ends), sign it out everywhere, and
 * attach a request or order by hand. Every change is in the audit log.
 */
@Injectable()
export class AdminCustomerAccountsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(staff: StaffPrincipal, query: { q?: string; page?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const q = query.q?.trim();
    const digits = q?.replace(/\D/g, "") ?? "";
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: [{ lastSignInAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: ACCOUNT_SELECT,
      }),
      this.prisma.customer.count({ where }),
    ]);
    const orders = canSeeOrders(staff);
    return { items: rows.map((row) => accountView(row, orders)), total, page, pageSize: PAGE_SIZE };
  }

  /** The account a phone's customer profile belongs to, if any (by the account's phone or the profile's email). */
  async forProfile(staff: StaffPrincipal, phone: string, email: string | null) {
    const row = await this.prisma.customer.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email: email.toLowerCase() }] : [])] },
      select: ACCOUNT_SELECT,
    });
    return row ? accountView(row, canSeeOrders(staff)) : null;
  }

  /** One account with the requests and orders on it (newest first). */
  async detail(staff: StaffPrincipal, id: string) {
    const row = await this.prisma.customer.findUnique({ where: { id }, select: ACCOUNT_SELECT });
    if (!row) throw problems.notFound("No customer account");
    const orders = canSeeOrders(staff);
    const [leads, orderRows, sessions] = await Promise.all([
      this.prisma.lead.findMany({
        where: { customerId: id, module: { in: leadModulesFor(staff) } },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          reference: true,
          module: true,
          status: true,
          summary: true,
          createdAt: true,
        },
      }),
      orders
        ? this.prisma.order.findMany({
            where: { customerId: id },
            orderBy: { createdAt: "desc" },
            take: 100,
            select: { id: true, reference: true, status: true, total: true, createdAt: true },
          })
        : Promise.resolve([]),
      this.prisma.customerSession.count({
        where: { customerId: id, revokedAt: null, expiresAt: { gt: new Date() } },
      }),
    ]);
    return {
      account: accountView(row, orders),
      openSessions: sessions,
      leads: leads.map((lead) => ({ ...lead, createdAt: toDhakaIsoString(lead.createdAt) })),
      orders: orders
        ? orderRows.map((order) => ({ ...order, createdAt: toDhakaIsoString(order.createdAt) }))
        : null,
    };
  }

  private async find(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw problems.notFound("No customer account");
    return customer;
  }

  /** Turns the account off: no sign-in, every session ends. Their requests and orders stay. */
  async disable(staff: StaffPrincipal, id: string, reason?: string) {
    const customer = await this.find(id);
    if (customer.disabledAt) return { ok: true };
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data: { disabledAt: now } });
      await tx.customerSession.updateMany({
        where: { customerId: id, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "customer.disable",
          entity: "customer",
          entityId: id,
          before: { email: customer.email, disabled: false },
          after: { email: customer.email, disabled: true },
          ...(reason ? { reason } : {}),
        },
        tx,
      );
    });
    return { ok: true };
  }

  async enable(staff: StaffPrincipal, id: string) {
    const customer = await this.find(id);
    if (!customer.disabledAt) return { ok: true };
    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data: { disabledAt: null } });
      await this.audit.record(
        {
          actor: staff,
          action: "customer.enable",
          entity: "customer",
          entityId: id,
          before: { email: customer.email, disabled: true },
          after: { email: customer.email, disabled: false },
        },
        tx,
      );
    });
    return { ok: true };
  }

  /** Ends every session; the customer signs in again with a new code or Google. */
  async signOutEverywhere(staff: StaffPrincipal, id: string) {
    const customer = await this.find(id);
    const now = new Date();
    const ended = await this.prisma.$transaction(async (tx) => {
      const result = await tx.customerSession.updateMany({
        where: { customerId: id, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "customer.sign-out-everywhere",
          entity: "customer",
          entityId: id,
          after: { email: customer.email, sessionsEnded: result.count },
        },
        tx,
      );
      return result.count;
    });
    return { ok: true, sessionsEnded: ended };
  }

  /** Puts a request or an order on this account by its reference (staff checked the person is the same). */
  async attach(
    staff: StaffPrincipal,
    id: string,
    input: { kind: "lead" | "order"; reference: string },
  ) {
    const customer = await this.find(id);
    const reference = input.reference.trim().toUpperCase();
    await this.prisma.$transaction(async (tx) => {
      if (input.kind === "lead") {
        const lead = await tx.lead.findUnique({ where: { reference } });
        if (!lead) throw problems.notFound("No request with this reference");
        assertLeadAccess(staff, lead.module);
        await tx.lead.update({ where: { id: lead.id }, data: { customerId: id } });
        await this.audit.record(
          {
            actor: staff,
            action: "customer.attach",
            entity: "customer",
            entityId: id,
            before: { email: customer.email, record: lead.reference, customerId: lead.customerId },
            after: { email: customer.email, record: lead.reference, customerId: id },
          },
          tx,
        );
        return;
      }
      if (!canSeeOrders(staff)) throw problems.forbidden();
      const order = await tx.order.findUnique({ where: { reference } });
      if (!order) throw problems.notFound("No order with this reference");
      await tx.order.update({ where: { id: order.id }, data: { customerId: id } });
      await this.audit.record(
        {
          actor: staff,
          action: "customer.attach",
          entity: "order",
          entityId: order.id,
          before: { customerId: order.customerId },
          after: { customerId: id },
        },
        tx,
      );
    });
    return { ok: true };
  }
}

import { Inject, Injectable } from "@nestjs/common";
import { toDhakaIsoString } from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";
import { leadModulesFor } from "./access";

const NOT_SOLD = ["cancelled", "returned"];
const PAGE_SIZE = 50;

export type CustomerRow = {
  phone: string;
  name: string;
  email: string | null;
  leads: number;
  orders: number;
  spent: number;
  lastActivityAt: string;
};

type Group = { phone: string; leads: number; orders: number; spent: number; last: Date };

/** Merges per-phone lead and order counts into one row per customer, newest activity first. */
export function mergeCustomers(
  leadGroups: Array<{ phone: string; count: number; last: Date | null }>,
  orderGroups: Array<{ phone: string; count: number; spent: number; last: Date | null }>,
): Group[] {
  const map = new Map<string, Group>();
  const entry = (phone: string) => {
    const existing = map.get(phone);
    if (existing) return existing;
    const created: Group = { phone, leads: 0, orders: 0, spent: 0, last: new Date(0) };
    map.set(phone, created);
    return created;
  };
  for (const group of leadGroups) {
    const row = entry(group.phone);
    row.leads += group.count;
    if (group.last && group.last > row.last) row.last = group.last;
  }
  for (const group of orderGroups) {
    const row = entry(group.phone);
    row.orders += group.count;
    row.spent += group.spent;
    if (group.last && group.last > row.last) row.last = group.last;
  }
  return [...map.values()].sort((a, b) => b.last.getTime() - a.last.getTime());
}

export type CustomerSort = `${"last" | "spent" | "orders"}.${"asc" | "desc"}`;

/** The table's sort (D0 R5); the newest activity first when none is asked for. */
export function sortCustomers(groups: Group[], sort: CustomerSort | undefined): Group[] {
  if (!sort) return groups;
  const [field, dir] = sort.split(".") as ["last" | "spent" | "orders", "asc" | "desc"];
  const sign = dir === "asc" ? 1 : -1;
  const value = (group: Group) => (field === "last" ? group.last.getTime() : group[field]);
  return [...groups].sort((a, b) => sign * (value(a) - value(b)) || a.phone.localeCompare(b.phone));
}

/**
 * Customers (#111): one row per phone number across leads and Waafas World orders, for the modules this person
 * works on; orders only for store and accounts roles. Customer accounts arrive in Phase D, so the phone is the key.
 */
@Injectable()
export class AdminCustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private canSeeOrders(staff: StaffPrincipal) {
    return staff.roles.some((role) =>
      ["super-admin", "admin", "shop-manager", "accounts"].includes(role),
    );
  }

  async list(
    staff: StaffPrincipal,
    query: { q?: string; page?: number; pageSize?: number; sort?: CustomerSort },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? PAGE_SIZE;
    const q = query.q?.trim();
    const digits = q?.replace(/\D/g, "") ?? "";
    const match = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
          ],
        }
      : {};
    const orders = this.canSeeOrders(staff);
    const [leadGroups, orderGroups] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ["phone"],
        where: { module: { in: leadModulesFor(staff) }, ...match },
        _count: { _all: true },
        _max: { createdAt: true },
      }),
      orders
        ? this.prisma.order.groupBy({
            by: ["phone"],
            where: match,
            _count: { _all: true },
            _max: { createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    const soldTotals = orders
      ? await this.prisma.order.groupBy({
          by: ["phone"],
          where: { ...match, status: { notIn: NOT_SOLD } },
          _sum: { total: true },
        })
      : [];
    const spentBy = new Map(soldTotals.map((row) => [row.phone, row._sum.total ?? 0]));
    const merged = mergeCustomers(
      leadGroups.map((row) => ({
        phone: row.phone,
        count: row._count._all,
        last: row._max.createdAt,
      })),
      orderGroups.map((row) => ({
        phone: row.phone,
        count: row._count._all,
        spent: spentBy.get(row.phone) ?? 0,
        last: row._max.createdAt,
      })),
    );
    const slice = sortCustomers(merged, query.sort).slice((page - 1) * pageSize, page * pageSize);
    const phones = slice.map((row) => row.phone);
    const [leadNames, orderNames] = await Promise.all([
      this.prisma.lead.findMany({
        where: { phone: { in: phones }, module: { in: leadModulesFor(staff) } },
        orderBy: { createdAt: "desc" },
        distinct: ["phone"],
        select: { phone: true, name: true, email: true, createdAt: true },
      }),
      orders
        ? this.prisma.order.findMany({
            where: { phone: { in: phones } },
            orderBy: { createdAt: "desc" },
            distinct: ["phone"],
            select: { phone: true, name: true, email: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    const latest = new Map<string, { name: string; email: string | null; at: Date }>();
    for (const row of [...leadNames, ...orderNames]) {
      const current = latest.get(row.phone);
      if (!current || row.createdAt > current.at) {
        latest.set(row.phone, { name: row.name, email: row.email, at: row.createdAt });
      }
    }
    const items: CustomerRow[] = slice.map((row) => ({
      phone: row.phone,
      name: latest.get(row.phone)?.name ?? "",
      email: latest.get(row.phone)?.email ?? null,
      leads: row.leads,
      orders: row.orders,
      spent: row.spent,
      lastActivityAt: toDhakaIsoString(row.last),
    }));
    return { items, total: merged.length, page, pageSize };
  }

  async detail(staff: StaffPrincipal, phone: string) {
    const orders = this.canSeeOrders(staff);
    const [leads, orderRows] = await Promise.all([
      this.prisma.lead.findMany({
        where: { phone, module: { in: leadModulesFor(staff) } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          reference: true,
          module: true,
          status: true,
          name: true,
          email: true,
          summary: true,
          createdAt: true,
        },
      }),
      orders
        ? this.prisma.order.findMany({
            where: { phone },
            orderBy: { createdAt: "desc" },
            take: 200,
            select: {
              id: true,
              reference: true,
              status: true,
              name: true,
              email: true,
              total: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);
    if (leads.length === 0 && orderRows.length === 0)
      throw problems.notFound("No customer with this phone");
    const newest = [...leads, ...orderRows].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
    return {
      phone,
      name: newest?.name ?? "",
      email: [...leads, ...orderRows].find((row) => row.email)?.email ?? null,
      spent: orderRows
        .filter((row) => !NOT_SOLD.includes(row.status))
        .reduce((sum, row) => sum + row.total, 0),
      leads: leads.map((row) => ({
        id: row.id,
        reference: row.reference,
        module: row.module,
        status: row.status,
        summary: row.summary,
        createdAt: toDhakaIsoString(row.createdAt),
      })),
      orders: orders
        ? orderRows.map((row) => ({
            id: row.id,
            reference: row.reference,
            status: row.status,
            total: row.total,
            createdAt: toDhakaIsoString(row.createdAt),
          }))
        : null,
    };
  }
}

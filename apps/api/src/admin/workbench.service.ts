import { Inject, Injectable } from "@nestjs/common";
import {
  CONTENT_KEYS,
  CONTENT_MODEL,
  type AdminSearchHit,
  type AdminSearchResult,
  type CollectionKey,
  type InboxCountKey,
  type InboxItem,
  type InboxSummary,
  hasAnyRole,
  isManagerRole,
  type Role,
} from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import { photoOf } from "../common/photo";
import { ContentService } from "../content/content.service";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { canEditContent, leadModulesFor } from "./access";

const DAY = 24 * 60 * 60_000;
const OPEN_VISA = ["new", "pending", "in-progress", "quoted"];

const isManager = (staff: StaffPrincipal) => isManagerRole(staff.roles);
const hasAny = (staff: StaffPrincipal, ...roles: Role[]) => hasAnyRole(staff.roles, ...roles);
/** Shop managers can open payment proofs but only Accounts verifies them, so only they get the queue. */
const verifiesProofs = (staff: StaffPrincipal) => hasAny(staff, "accounts");

/** `%` and `_` typed by staff are plain characters, not wildcards. */
function likePattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}

/**
 * The admin's workbench (D0 R1): what waits for this person (sidebar badges, the notification bell, the dashboard's
 * Today queue) and the Ctrl+K record search. Everything is scoped to the roles and lead modules of the caller.
 */
@Injectable()
export class AdminWorkbenchService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ContentService) private readonly content: ContentService,
  ) {}

  private async slaMinutes(): Promise<number> {
    try {
      return (await this.content.setting("leadFormSettings")).slaMinutes;
    } catch {
      return 30;
    }
  }

  async inbox(staff: StaffPrincipal, now = new Date()): Promise<InboxSummary> {
    const modules = leadModulesFor(staff);
    const counts: Partial<Record<InboxCountKey, number>> = {};
    const jobs: Array<Promise<void>> = [];
    const count = (key: InboxCountKey, work: Promise<number>) =>
      jobs.push(work.then((value) => void (counts[key] = value)));

    if (modules.length > 0) {
      const sla = await this.slaMinutes();
      count(
        "newLeads",
        this.prisma.lead.count({ where: { module: { in: modules }, status: "new" } }),
      );
      count(
        "overdueLeads",
        this.prisma.lead.count({
          where: {
            module: { in: modules },
            status: "new",
            createdAt: { lt: new Date(now.getTime() - sla * 60_000) },
          },
        }),
      );
    }
    if (modules.includes("visa"))
      count(
        "visaWaiting",
        this.prisma.lead.count({ where: { module: "visa", status: { in: OPEN_VISA } } }),
      );
    if (hasAny(staff, "shop-manager", "accounts"))
      count("ordersToConfirm", this.prisma.order.count({ where: { status: "placed" } }));
    if (verifiesProofs(staff))
      count("proofsToVerify", this.prisma.paymentProof.count({ where: { status: "received" } }));
    if (hasAny(staff, "content-editor"))
      count("feedbackToReview", this.prisma.feedback.count({ where: { status: "pending" } }));
    if (hasAny(staff, "shop-manager"))
      count(
        "lowStock",
        this.content
          .collection("products")
          .then(
            (products) =>
              products.filter((product) =>
                product.variants.some((variant) => variant.stock <= variant.lowStockAt),
              ).length,
          ),
      );
    if (hasAny(staff, "travel-sales"))
      count(
        "groupFaresEnding",
        this.content.collection("groupFares").then(
          (fares) =>
            fares.filter((fare) => {
              const ends = new Date(fare.expiresAt).getTime();
              return ends > now.getTime() && ends <= now.getTime() + 7 * DAY;
            }).length,
        ),
      );
    if (isManager(staff))
      count(
        "sampleLeft",
        this.prisma.$queryRaw<Array<{ total: bigint }>>`
          SELECT count(*)::bigint AS total FROM "ContentDocument" WHERE data->'sample' = 'true'::jsonb`.then(
          (rows) => Number(rows[0]?.total ?? 0),
        ),
      );

    const recent: InboxItem[] = [];
    if (modules.length > 0)
      jobs.push(
        this.prisma.lead
          .findMany({
            where: { module: { in: modules }, status: "new" },
            orderBy: { createdAt: "desc" },
            take: 15,
            select: { id: true, reference: true, name: true, summary: true, createdAt: true },
          })
          .then((rows) => {
            for (const row of rows)
              recent.push({
                kind: "lead",
                id: row.id,
                title: row.name,
                detail: `${row.reference} · ${row.summary}`.slice(0, 160),
                at: row.createdAt.toISOString(),
              });
          }),
      );
    if (hasAny(staff, "shop-manager", "accounts"))
      jobs.push(
        this.prisma.order
          .findMany({
            where: { status: "placed" },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, reference: true, name: true, total: true, createdAt: true },
          })
          .then((rows) => {
            for (const row of rows)
              recent.push({
                kind: "order",
                id: row.id,
                title: row.name,
                detail: row.reference,
                at: row.createdAt.toISOString(),
              });
          }),
      );
    if (verifiesProofs(staff))
      jobs.push(
        this.prisma.paymentProof
          .findMany({
            where: { status: "received" },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, reference: true, name: true, createdAt: true },
          })
          .then((rows) => {
            for (const row of rows)
              recent.push({
                kind: "proof",
                id: row.id,
                title: row.name,
                detail: row.reference,
                at: row.createdAt.toISOString(),
              });
          }),
      );

    await Promise.all(jobs);
    recent.sort((a, b) => b.at.localeCompare(a.at));
    return { counts, recent: recent.slice(0, 30), at: now.toISOString() };
  }

  async search(staff: StaffPrincipal, query: string): Promise<AdminSearchResult> {
    const pattern = likePattern(query);
    const digits = query.replace(/\D/g, "");
    const phonePattern = digits.length >= 4 ? likePattern(digits) : null;
    const modules = leadModulesFor(staff);
    const seesOrders = hasAny(staff, "shop-manager", "accounts");
    const hits: AdminSearchHit[] = [];
    const jobs: Array<Promise<void>> = [];

    if (modules.length > 0)
      jobs.push(
        this.prisma.lead
          .findMany({
            where: {
              module: { in: modules },
              OR: [
                { reference: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
              ],
            },
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { id: true, reference: true, name: true, summary: true },
          })
          .then((rows) => {
            for (const row of rows)
              hits.push({
                kind: "lead",
                id: row.id,
                title: row.name,
                detail: `${row.reference} · ${row.summary}`.slice(0, 160),
              });
          }),
      );
    if (seesOrders)
      jobs.push(
        this.prisma.order
          .findMany({
            where: {
              OR: [
                { reference: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
              ],
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, reference: true, name: true },
          })
          .then((rows) => {
            for (const row of rows)
              hits.push({ kind: "order", id: row.id, title: row.name, detail: row.reference });
          }),
      );
    // Customers come from the same places the customer profile reads: leads of this person's modules, and orders
    // only for the roles that work on orders.
    const people: Prisma.Sql[] = [];
    if (phonePattern && modules.length > 0)
      people.push(
        Prisma.sql`SELECT phone, name, "createdAt" FROM "Lead" WHERE phone LIKE ${phonePattern} AND module = ANY(${modules})`,
      );
    if (phonePattern && seesOrders)
      people.push(
        Prisma.sql`SELECT phone, name, "createdAt" FROM "Order" WHERE phone LIKE ${phonePattern}`,
      );
    if (people.length > 0)
      jobs.push(
        this.prisma.$queryRaw<Array<{ phone: string; name: string }>>`
          SELECT DISTINCT ON (phone) phone, name FROM (${Prisma.join(people, " UNION ALL ")}) people
          ORDER BY phone, "createdAt" DESC LIMIT 4`.then((rows) => {
          for (const row of rows)
            hits.push({ kind: "customer", id: row.phone, title: row.name, detail: row.phone });
        }),
      );

    const keys = CONTENT_KEYS.filter(
      (key): key is CollectionKey =>
        CONTENT_MODEL[key].kind === "collection" && canEditContent(staff, key),
    );
    if (keys.length > 0)
      jobs.push(
        this.prisma.$queryRaw<
          Array<{ collection: string; docId: string; data: Record<string, unknown> }>
        >`
          SELECT collection, "docId", data FROM "ContentDocument"
          WHERE collection = ANY(${keys})
            AND (data->>'title' ILIKE ${pattern} OR data->>'name' ILIKE ${pattern}
              OR data->>'question' ILIKE ${pattern} OR data->>'city' ILIKE ${pattern}
              OR data->>'model' ILIKE ${pattern} OR data->>'code' ILIKE ${pattern})
          ORDER BY "updatedAt" DESC LIMIT 8`.then((rows) => {
          for (const row of rows) {
            const model = CONTENT_MODEL[row.collection as CollectionKey];
            const title = row.data[model.titleField];
            const image = photoOf(row.data);
            hits.push({
              kind: "record",
              id: row.docId,
              title: (typeof title === "string" && title.trim() ? title : row.docId).slice(0, 160),
              contentKey: row.collection,
              ...(image ? { image } : {}),
            });
          }
        }),
      );

    await Promise.all(jobs);
    return { hits: hits.slice(0, 40) };
  }
}

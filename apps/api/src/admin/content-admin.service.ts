import { Inject, Injectable } from "@nestjs/common";
import {
  canCopy,
  CONTENT_KEYS,
  CONTENT_MODEL,
  contentRecordId,
  formatDate,
  formatTime,
  hasPublishWorkflow,
  hasRecordOrder,
  isContentKey,
  isPickerKey,
  parseContent,
  type CollectionKey,
  type ContentAction,
  type ContentKey,
  type TrashListQuery,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { photoOf } from "../common/photo";
import { problems, validationProblem } from "../common/problem";
import { ContentService } from "../content/content.service";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";
import { assertContentAccess, canEditContent } from "./access";
import { clearRedirectFrom, recordMove } from "./redirects";
import { TRASH_DAYS } from "./scheduler.service";
import { withWorkflow } from "./workflow";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

/** Audit actions that save a whole record; their `after` is a version that can be restored. */
const RECORD_ACTIONS = [
  "content.create",
  "content.update",
  "content.restore",
  "content.duplicate",
  "content.untrash",
];
const BORN_ACTIONS = new Set(["content.create", "content.duplicate"]);
const RESTORABLE_ACTIONS = [...RECORD_ACTIONS, "settings.update", "settings.restore"];
const HISTORY_LIMIT = 60;
/** Record fields other records point at (a package's destination slug, an airline's code, a category's level). */
const OPTION_VALUE_FIELDS = ["id", "slug", "code", "key", "iata", "level", "destinationSlug"];

/** What the audit log keeps about a button, in plain words (History and the audit log show it). */
function stepReason(step: ContentAction["type"] | null, record: unknown): { reason?: string } {
  const at = (record as { publishAt?: unknown } | null)?.publishAt;
  switch (step) {
    case "publish":
      return { reason: "Published" };
    case "schedule":
      return typeof at === "string"
        ? { reason: `Scheduled to go live on ${formatDate(at)}, ${formatTime(at)}` }
        : {};
    case "unpublish":
      return { reason: "Unpublished" };
    case "archive":
      return { reason: "Archived" };
    case "restore":
      return { reason: "Restored from the archive" };
    default:
      return {};
  }
}

const orderOf = (data: unknown): number | undefined => {
  const value = (data as { order?: unknown } | null)?.order;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

/** Lists the site sorts by `order` show in that order in the admin too, so both always agree (#205). */
function sortByRecordOrder<T extends { data: unknown; position: number }>(
  key: ContentKey,
  rows: T[],
): T[] {
  if (!hasRecordOrder(key)) return rows;
  return [...rows].sort(
    (a, b) =>
      (orderOf(a.data) ?? Number.MAX_SAFE_INTEGER) - (orderOf(b.data) ?? Number.MAX_SAFE_INTEGER) ||
      a.position - b.position,
  );
}

/** `text` with `tail` at the end, the start cut so the whole fits in `max` characters. */
const fit = (text: string, tail: string, max: number) =>
  `${text.slice(0, Math.max(1, max - tail.length)).replace(/-+$/, "")}${tail}`;

/**
 * A copied product gets its own variant ids and SKUs, and its default variant follows: orders and deals point at a
 * variant by its id alone, so a copy sharing them would take the live product's orders (D0 R2 review).
 */
function renewVariants(data: Record<string, unknown>, suffix: string, taken: Set<string>): void {
  const variants = Array.isArray(data.variants)
    ? (data.variants as Array<Record<string, unknown>>)
    : [];
  const renamed = new Map<string, string>();
  for (const variant of variants) {
    if (typeof variant.id !== "string") continue;
    let next = fit(variant.id, suffix, 64);
    for (let n = 2; taken.has(next); n += 1) next = fit(variant.id, `${suffix}-${n}`, 64);
    taken.add(next);
    renamed.set(variant.id, next);
    variant.id = next;
    if (typeof variant.sku === "string") variant.sku = fit(variant.sku, suffix.toUpperCase(), 40);
  }
  if (typeof data.defaultVariantId === "string")
    data.defaultVariantId = renamed.get(data.defaultVariantId) ?? data.defaultVariantId;
}

/**
 * Live booking needs a provider, a health check, online payment and a Super Admin with a typed confirmation (FR-GS-03,
 * FR-GS-04, Phase E). Until then no save may unlock Live or turn a module Live; lock reasons stay editable (#72).
 */
function assertLiveStaysLocked(value: unknown): void {
  const modules = Array.isArray(value)
    ? (value as Array<{ mode?: string; liveLocked?: boolean }>)
    : [];
  if (modules.some((item) => item.mode === "live" || item.liveLocked === false)) {
    throw problems.conflict(
      "Live booking stays locked until a provider and online payment are connected",
      "live-locked",
    );
  }
}

/**
 * Generic content editing over CONTENT_MODEL (D125): every settings key and every collection can be listed, read,
 * created, updated, reordered and deleted, validated with its shared schema, with optimistic versions, the audit log,
 * a fresh public snapshot and a signed revalidation call to the web.
 */
@Injectable()
export class AdminContentService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
  ) {}

  key(value: string): ContentKey {
    if (!isContentKey(value)) throw problems.notFound(`Unknown content "${value}"`);
    return value;
  }

  collectionKey(value: string): CollectionKey {
    const key = this.key(value);
    if (CONTENT_MODEL[key].kind !== "collection")
      throw problems.badRequest(`"${key}" is a setting, not a list`);
    return key as CollectionKey;
  }

  settingKey(value: string): ContentKey {
    const key = this.key(value);
    if (CONTENT_MODEL[key].kind !== "singleton")
      throw problems.badRequest(`"${key}" is a list; open one of its records`);
    return key;
  }

  private changed(key: ContentKey): void {
    this.content.invalidate();
    this.revalidate.request([key]);
  }

  /** The content areas this person may edit, with record counts. */
  async overview(staff: StaffPrincipal) {
    const counts = await this.prisma.contentDocument.groupBy({
      by: ["collection"],
      _count: { _all: true },
    });
    const byKey = new Map(counts.map((row) => [row.collection, row._count._all]));
    return CONTENT_KEYS.filter((key) => canEditContent(staff, key)).map((key) => {
      const entry = CONTENT_MODEL[key];
      return {
        key,
        kind: entry.kind,
        group: entry.group,
        ...(entry.kind === "collection"
          ? { idField: entry.idField, titleField: entry.titleField, count: byKey.get(key) ?? 0 }
          : {}),
      };
    });
  }

  async read(staff: StaffPrincipal, key: ContentKey) {
    assertContentAccess(staff, key);
    const entry = CONTENT_MODEL[key];
    if (entry.kind === "singleton") {
      const row = await this.prisma.setting.findUnique({ where: { key } });
      if (!row) throw problems.notFound(`"${key}" is not set`);
      return {
        key,
        kind: "singleton",
        value: row.value,
        version: row.version,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      };
    }
    const rows = sortByRecordOrder(
      key,
      await this.prisma.contentDocument.findMany({
        where: { collection: key },
        orderBy: [{ position: "asc" }, { docId: "asc" }],
      }),
    );
    // Coupons show Used up from their orders (D223).
    const uses = key === "coupons" ? await this.couponUses() : null;
    return {
      key,
      kind: "collection",
      idField: entry.idField,
      titleField: entry.titleField,
      items: rows.map((row) => ({
        id: row.docId,
        title: String((row.data as Record<string, unknown>)[entry.titleField] ?? row.docId),
        position: row.position,
        version: row.version,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
        data: row.data,
        ...(uses ? { uses: uses.get(row.docId) ?? 0 } : {}),
      })),
    };
  }

  /** Orders that used each coupon code, cancelled ones not counted. */
  private async couponUses(): Promise<Map<string, number>> {
    const rows = await this.prisma.order.groupBy({
      by: ["couponCode"],
      where: { couponCode: { not: null }, status: { not: "cancelled" } },
      _count: { _all: true },
    });
    return new Map(
      rows.flatMap((row) => (row.couponCode ? [[row.couponCode, row._count._all] as const] : [])),
    );
  }

  async readOne(staff: StaffPrincipal, key: CollectionKey, id: string) {
    assertContentAccess(staff, key);
    const row = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: id } },
    });
    if (!row) throw problems.notFound("Record not found");
    return {
      id: row.docId,
      position: row.position,
      version: row.version,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
      data: row.data,
    };
  }

  private validate(key: ContentKey, data: unknown) {
    const parsed = parseContent(key, data);
    if (!parsed.success) throw validationProblem(parsed.error);
    return parsed.data as unknown;
  }

  async writeSetting(
    staff: StaffPrincipal,
    key: ContentKey,
    data: unknown,
    version?: number,
    action = "settings.update",
  ) {
    assertContentAccess(staff, key);
    if (CONTENT_MODEL[key].kind !== "singleton")
      throw problems.badRequest(`"${key}" is a list; edit its records`);
    const value = this.validate(key, data);
    if (key === "bookingModes") assertLiveStaysLocked(value);
    const before = await this.prisma.setting.findUnique({ where: { key } });
    await this.prisma.$transaction(async (tx) => {
      if (before) {
        const updated = await tx.setting.updateMany({
          where: { key, ...(version ? { version } : {}) },
          data: { value: json(value), version: { increment: 1 }, updatedBy: staff.name },
        });
        if (updated.count === 0)
          throw problems.stale({
            version: before.version,
            updatedBy: before.updatedBy,
            updatedAt: before.updatedAt.toISOString(),
          });
      } else {
        await tx.setting.create({ data: { key, value: json(value), updatedBy: staff.name } });
      }
      await this.audit.record(
        {
          actor: staff,
          action,
          entity: key,
          entityId: key,
          before: before?.value,
          after: value,
        },
        tx,
      );
    });
    this.changed(key);
    return this.read(staff, key);
  }

  async create(
    staff: StaffPrincipal,
    key: CollectionKey,
    data: unknown,
    options: { audit?: string; button?: ContentAction } = {},
    now = new Date(),
  ) {
    assertContentAccess(staff, key);
    const { record, step } = withWorkflow(
      key,
      this.validate(key, data),
      undefined,
      options.button,
      now,
    );
    // Only the seed writes Sample content: anything staff create is their own.
    if (record && typeof record === "object" && (record as { sample?: unknown }).sample === true)
      (record as { sample: boolean }).sample = false;
    const id = contentRecordId(key, record);
    await this.assertInnerIdFree(key, record);
    const last = await this.prisma.contentDocument.findFirst({
      where: { collection: key },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    // A new record goes to the end of a list the site sorts by order; staff never type it (#205).
    if (hasRecordOrder(key) && record && typeof record === "object") {
      const rows = await this.prisma.contentDocument.findMany({
        where: { collection: key },
        select: { data: true },
      });
      const highest = Math.max(-1, ...rows.map((row) => orderOf(row.data) ?? -1));
      (record as { order: number }).order = highest + 1;
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.contentDocument.create({
          data: {
            collection: key,
            docId: id,
            data: json(record),
            position: (last?.position ?? -1) + 1,
            updatedBy: staff.name,
          },
        });
        // A real record lives at this address now: an old redirect from it would hide it.
        await clearRedirectFrom(tx, key, id);
        await this.audit.record(
          {
            actor: staff,
            action: options.audit ?? "content.create",
            entity: key,
            entityId: id,
            after: record,
            ...stepReason(step, record),
          },
          tx,
        );
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw problems.conflict(
          `A record with ${CONTENT_MODEL[key].idField} "${id}" already exists`,
          "exists",
        );
      }
      throw error;
    }
    this.changed(key);
    return { ...(await this.readOne(staff, key, id)), sampleCleared: false };
  }

  /**
   * Saves a record; a new id (for example a new slug) moves it, keeping its place in the list, and a live record's
   * old address redirects to the new one (D218). The status follows the button, never the data (D216); the first
   * staff save of a Sample record makes it the team's own (`sampleCleared`, which the editor can undo).
   */
  async update(
    staff: StaffPrincipal,
    key: CollectionKey,
    id: string,
    data: unknown,
    version?: number,
    options: { audit?: string; button?: ContentAction; keepSample?: boolean } = {},
    now = new Date(),
  ) {
    assertContentAccess(staff, key);
    const validated = this.validate(key, data);
    const before = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: id } },
    });
    if (!before) throw problems.notFound("Record not found");
    const { record, step } = withWorkflow(key, validated, before.data, options.button, now);
    const nextId = contentRecordId(key, record);
    await this.assertInnerIdFree(key, record, id);
    // The list owns the order: a save (or a restore of an old version) never moves the record (#205).
    const kept = hasRecordOrder(key) ? orderOf(before.data) : undefined;
    if (kept !== undefined && record && typeof record === "object")
      (record as { order: number }).order = kept;
    const wasSample = (before.data as { sample?: unknown } | null)?.sample === true;
    const sampleCleared =
      wasSample && !options.keepSample && record !== null && typeof record === "object";
    if (sampleCleared) (record as { sample: boolean }).sample = false;
    const current = {
      version: before.version,
      updatedBy: before.updatedBy,
      updatedAt: before.updatedAt.toISOString(),
    };
    if (version && before.version !== version) throw problems.stale(current);
    const wasLive =
      !hasPublishWorkflow(key) ||
      (before.data as { status?: unknown } | null)?.status === "published";
    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.contentDocument.updateMany({
          where: { collection: key, docId: id, version: before.version },
          data: {
            docId: nextId,
            data: json(record),
            version: { increment: 1 },
            updatedBy: staff.name,
          },
        });
        if (updated.count === 0) throw problems.stale(current);
        if (nextId !== id && wasLive) await recordMove(tx, key, id, nextId);
        else if (nextId !== id) await clearRedirectFrom(tx, key, nextId);
        await this.audit.record(
          {
            actor: staff,
            action: options.audit ?? "content.update",
            entity: key,
            entityId: nextId,
            before: before.data,
            after: record,
            ...stepReason(step, record),
          },
          tx,
        );
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw problems.conflict(
          `A record with ${CONTENT_MODEL[key].idField} "${nextId}" already exists`,
          "exists",
        );
      }
      throw error;
    }
    this.changed(key);
    return { ...(await this.readOne(staff, key, nextId)), sampleCleared };
  }

  /** Delete moves the record to Trash (D217): gone from the site at once, restorable for 30 days. */
  async remove(staff: StaffPrincipal, key: CollectionKey, id: string) {
    assertContentAccess(staff, key);
    const before = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: id } },
    });
    if (!before) throw problems.notFound("Record not found");
    const item = await this.prisma.$transaction(async (tx) => {
      const trashed = await tx.trashItem.create({
        data: {
          collection: key,
          docId: id,
          data: json(before.data),
          position: before.position,
          version: before.version,
          deletedBy: staff.name,
        },
      });
      await tx.contentDocument.delete({
        where: { collection_docId: { collection: key, docId: id } },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "content.delete",
          entity: key,
          entityId: id,
          before: before.data,
          after: { trash: trashed.id },
        },
        tx,
      );
      return trashed;
    });
    this.changed(key);
    return { trashId: item.id };
  }

  /** Trash, newest first: only the lists this person may edit (ADMIN.md §9). */
  async trash(staff: StaffPrincipal, query: TrashListQuery) {
    const keys = CONTENT_KEYS.filter(
      (key) => CONTENT_MODEL[key].kind === "collection" && canEditContent(staff, key),
    );
    const where = { collection: { in: keys } };
    const [total, rows] = await Promise.all([
      this.prisma.trashItem.count({ where }),
      this.prisma.trashItem.findMany({
        where,
        orderBy: { deletedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => {
        const entry = CONTENT_MODEL[row.collection as CollectionKey];
        const data = row.data as Record<string, unknown>;
        return {
          id: row.id,
          collection: row.collection,
          title: String(data[entry.kind === "collection" ? entry.titleField : "id"] ?? row.docId),
          deletedAt: row.deletedAt.toISOString(),
          deletedBy: row.deletedBy,
          purgeAt: new Date(row.deletedAt.getTime() + TRASH_DAYS * 86_400_000).toISOString(),
        };
      }),
    };
  }

  /**
   * Puts a record back from Trash as it was (live again if it was live), at the end of its list. Its address must
   * still be free; the record must still fit today's form.
   */
  async untrash(staff: StaffPrincipal, trashId: string) {
    const item = await this.prisma.trashItem.findUnique({ where: { id: trashId } });
    if (!item || !isContentKey(item.collection))
      throw problems.notFound("This record is no longer in Trash");
    const key = this.collectionKey(item.collection);
    assertContentAccess(staff, key);
    const parsed = parseContent(key, item.data);
    if (!parsed.success)
      throw problems.conflict(
        "This record no longer fits its form, so it can't be restored. Ask a Super Admin to restore it in Advanced",
        "invalid",
      );
    const record = parsed.data as Record<string, unknown>;
    const taken = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: item.docId } },
      select: { docId: true },
    });
    if (taken)
      throw problems.conflict(
        "Another record uses this link now. Change that record's link first, then restore this one",
        "exists",
      );
    await this.assertInnerIdFree(key, record);
    const rows = await this.prisma.contentDocument.findMany({
      where: { collection: key },
      select: { data: true, position: true },
    });
    if (hasRecordOrder(key)) {
      record.order = Math.max(-1, ...rows.map((row) => orderOf(row.data) ?? -1)) + 1;
    }
    const position = Math.max(-1, ...rows.map((row) => row.position)) + 1;
    await this.prisma.$transaction(async (tx) => {
      await tx.contentDocument.create({
        data: {
          collection: key,
          docId: item.docId,
          data: json(record),
          position,
          version: item.version + 1,
          updatedBy: staff.name,
        },
      });
      await tx.trashItem.delete({ where: { id: item.id } });
      await clearRedirectFrom(tx, key, item.docId);
      await this.audit.record(
        {
          actor: staff,
          action: "content.untrash",
          entity: key,
          entityId: item.docId,
          after: record,
          reason: "Restored from Trash",
        },
        tx,
      );
    });
    this.changed(key);
    return { collection: key, id: item.docId };
  }

  /** Deletes a record in Trash for good (Super Admin only, checked by the route). */
  async purge(staff: StaffPrincipal, trashId: string) {
    const item = await this.prisma.trashItem.findUnique({ where: { id: trashId } });
    if (!item) throw problems.notFound("This record is no longer in Trash");
    await this.prisma.$transaction(async (tx) => {
      await tx.trashItem.delete({ where: { id: item.id } });
      await this.audit.record(
        {
          actor: staff,
          action: "trash.delete",
          entity: item.collection,
          entityId: item.docId,
          before: item.data,
          reason: "Deleted for good from Trash",
        },
        tx,
      );
    });
  }

  /** The record's id inside an audit snapshot, if the snapshot is a record. */
  private idIn(key: CollectionKey, value: unknown): string | undefined {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const id = (value as Record<string, unknown>)[CONTENT_MODEL[key].idField];
    return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
  }

  /**
   * Where a record's audit entries live. A slug change moves a record to a new id, so its history is a chain of
   * (id, time window) segments, newest first; a later record that reuses an old id never mixes in.
   */
  private async segments(key: ContentKey, id: string): Promise<Prisma.AuditLogWhereInput[]> {
    if (CONTENT_MODEL[key].kind !== "collection") return [{ entityId: key }];
    const collection = key as CollectionKey;
    const segments: Prisma.AuditLogWhereInput[] = [];
    let current = id;
    let until: Date | undefined;
    for (let step = 0; step < 8; step += 1) {
      const window = until ? { lt: until } : {};
      const rows = await this.prisma.auditLog.findMany({
        where: { entity: key, entityId: current, action: { in: RECORD_ACTIONS }, at: window },
        orderBy: { at: "desc" },
        select: { at: true, action: true, before: true },
      });
      // The newest moment the record arrived under this id: created, copied, or renamed from another id.
      const arrival = rows.find((row) => {
        const prior = this.idIn(collection, row.before);
        return BORN_ACTIONS.has(row.action) || (prior !== undefined && prior !== current);
      });
      segments.push({
        entityId: current,
        at: { ...window, ...(arrival ? { gte: arrival.at } : {}) },
      });
      const prior = arrival ? this.idIn(collection, arrival.before) : undefined;
      if (!arrival || !prior || prior === current) break;
      current = prior;
      until = arrival.at;
    }
    return segments;
  }

  /** History of a record or a setting (D0 R2): every saved change from the audit log, newest first. */
  async history(staff: StaffPrincipal, key: ContentKey, id: string) {
    assertContentAccess(staff, key);
    const rows = await this.prisma.auditLog.findMany({
      where: { entity: key, action: { in: RESTORABLE_ACTIONS }, OR: await this.segments(key, id) },
      orderBy: [{ at: "desc" }, { id: "desc" }],
      take: HISTORY_LIMIT,
    });
    return {
      entries: rows.map((row) => ({
        id: row.id,
        at: row.at.toISOString(),
        actorName: row.actorName,
        action: row.action,
        ...(row.before === null ? {} : { before: row.before }),
        ...(row.after === null ? {} : { after: row.after }),
      })),
    };
  }

  /** Makes a record or a setting look like it did after one of its history entries, audited as a restore. */
  async restore(
    staff: StaffPrincipal,
    key: ContentKey,
    id: string,
    auditId: string,
    version?: number,
    side: "before" | "after" = "after",
  ) {
    assertContentAccess(staff, key);
    const entry = await this.prisma.auditLog.findFirst({
      where: {
        id: auditId,
        entity: key,
        action: { in: RESTORABLE_ACTIONS },
        OR: await this.segments(key, id),
      },
    });
    // "before" undoes a change: the version it replaced (the only way back past the first saved change).
    const data = side === "before" ? entry?.before : entry?.after;
    if (!entry || data === null || data === undefined)
      throw problems.notFound("That version is not available");
    if (CONTENT_MODEL[key].kind === "singleton")
      return this.writeSetting(staff, key, data, version, "settings.restore");
    const collection = key as CollectionKey;
    if (!this.idIn(collection, data)) throw problems.notFound("That version is not available");
    // A restored version brings back its words and photos; the status stays as it is today (D216).
    return this.update(staff, collection, id, data, version, { audit: "content.restore" });
  }

  /** A copy with "(copy)" in its title and a free id, saved as a hidden draft and never Sample. */
  async duplicate(staff: StaffPrincipal, key: CollectionKey, id: string) {
    assertContentAccess(staff, key);
    if (!canCopy(key))
      throw problems.conflict(
        "Records of this list are fixed places or codes and can't be copied",
        "noCopy",
      );
    const row = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: id } },
    });
    if (!row) throw problems.notFound("Record not found");
    const { idField, titleField } = CONTENT_MODEL[key];
    const data = structuredClone(row.data) as Record<string, unknown>;
    const taken = new Set(
      (
        await this.prisma.contentDocument.findMany({
          where: { collection: key },
          select: { docId: true },
        })
      ).map((doc) => doc.docId),
    );
    // Ids hold 64 characters and slugs 120: a long one is cut so the suffix always fits.
    const base = String(data[idField] ?? id);
    const named = (tail: string) => fit(base, tail, idField === "id" ? 64 : 120);
    let suffix = "-copy";
    for (let n = 2; taken.has(named(suffix)); n += 1) suffix = `-copy-${n}`;
    data[idField] = named(suffix);
    if (idField !== "id" && typeof data.id === "string") data.id = fit(data.id, suffix, 64);
    if (titleField !== idField && typeof data[titleField] === "string") {
      const title = data[titleField] as string;
      data[titleField] = `${title} (copy)`;
      // A title at its longest keeps its words; the hidden copy's own link tells the two apart.
      if (!parseContent(key, data).success) data[titleField] = title;
    }
    if (typeof data.sample === "boolean") data.sample = false;
    for (const flag of ["visible", "isActive", "enabled"])
      if (typeof data[flag] === "boolean") data[flag] = false;
    if (typeof data.status === "string" && parseContent(key, { ...data, status: "draft" }).success)
      data.status = "draft";
    if (key === "products") renewVariants(data, suffix, await this.variantIdsInUse());
    return this.create(staff, key, data, { audit: "content.duplicate" });
  }

  /** Every variant id the store uses, so a copy's new ones are free. */
  private async variantIdsInUse(): Promise<Set<string>> {
    const rows = await this.prisma.contentDocument.findMany({
      where: { collection: "products" },
      select: { data: true },
    });
    const ids = new Set<string>();
    for (const row of rows) {
      const variants = (row.data as { variants?: Array<{ id?: unknown }> }).variants ?? [];
      for (const variant of variants) if (typeof variant.id === "string") ids.add(variant.id);
    }
    return ids;
  }

  /**
   * Lists keyed by a slug or code also give each record an inner id that other records point at (a deal's product,
   * a cart line); two records must never share it.
   */
  private async assertInnerIdFree(key: CollectionKey, record: unknown, exceptDocId = "") {
    if (CONTENT_MODEL[key].idField === "id") return;
    const inner = (record as { id?: unknown } | null)?.id;
    if (typeof inner !== "string" || !inner) return;
    const clash = await this.prisma.$queryRaw<Array<{ docId: string }>>`
      SELECT "docId" FROM "ContentDocument"
      WHERE "collection" = ${key} AND "data"->>'id' = ${inner} AND "docId" <> ${exceptDocId}
      LIMIT 1`;
    if (clash.length > 0)
      throw problems.conflict(`Another record already uses the id "${inner}"`, "exists");
  }

  /**
   * Choices for reference pickers: titles, photos and the values records point at. Lists other editors pick from
   * are open to any staff member; any other list's choices need edit access to it.
   */
  async options(staff: StaffPrincipal, key: CollectionKey, query?: string) {
    if (!isPickerKey(key)) assertContentAccess(staff, key);
    const { titleField } = CONTENT_MODEL[key];
    const rows = sortByRecordOrder(
      key,
      await this.prisma.contentDocument.findMany({
        where: { collection: key },
        orderBy: [{ position: "asc" }, { docId: "asc" }],
        select: { docId: true, data: true, position: true },
      }),
    );
    const needle = query?.trim().toLowerCase() ?? "";
    const items = rows.map((row) => {
      const data = row.data as Record<string, unknown>;
      const values: Record<string, string> = {};
      for (const field of OPTION_VALUE_FIELDS) {
        const value = data[field];
        if (typeof value === "string" || typeof value === "number") values[field] = String(value);
      }
      const image = photoOf(data);
      return {
        id: row.docId,
        title: String(data[titleField] ?? row.docId),
        ...(image ? { image } : {}),
        sample: data.sample === true,
        ...(typeof data.status === "string" ? { status: data.status } : {}),
        values,
      };
    });
    return {
      items: needle
        ? items.filter((item) => `${item.title} ${item.id}`.toLowerCase().includes(needle))
        : items,
    };
  }

  /** New list order (home sections, menus, FAQs…): ids in the order they should appear. */
  async reorder(staff: StaffPrincipal, key: CollectionKey, ids: string[]) {
    assertContentAccess(staff, key);
    const rows = await this.prisma.contentDocument.findMany({
      where: { collection: key },
      select: { docId: true, data: true },
    });
    const known = new Map(rows.map((row) => [row.docId, row.data]));
    if (ids.length !== known.size || ids.some((id) => !known.has(id))) {
      throw problems.badRequest("Send every record id of the list exactly once");
    }
    const ordered = hasRecordOrder(key);
    await this.prisma.$transaction(async (tx) => {
      for (const [position, id] of ids.entries()) {
        // The site sorts these lists by each record's order, so the new place is written there too (#205).
        const data = known.get(id);
        const moved = ordered && orderOf(data) !== position;
        await tx.contentDocument.update({
          where: { collection_docId: { collection: key, docId: id } },
          data: {
            position,
            updatedBy: staff.name,
            ...(moved
              ? { data: json({ ...(data as Record<string, unknown>), order: position }) }
              : {}),
          },
        });
      }
      await this.audit.record(
        { actor: staff, action: "content.reorder", entity: key, entityId: key, after: ids },
        tx,
      );
    });
    this.changed(key);
    return this.read(staff, key);
  }
}

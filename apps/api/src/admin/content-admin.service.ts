import { Inject, Injectable } from "@nestjs/common";
import {
  CONTENT_KEYS,
  CONTENT_MODEL,
  contentRecordId,
  isContentKey,
  parseContent,
  type CollectionKey,
  type ContentKey,
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

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

/** Audit actions that save a whole record; their `after` is a version that can be restored. */
const RECORD_ACTIONS = ["content.create", "content.update", "content.restore", "content.duplicate"];
const BORN_ACTIONS = new Set(["content.create", "content.duplicate"]);
const RESTORABLE_ACTIONS = [...RECORD_ACTIONS, "settings.update", "settings.restore"];
const HISTORY_LIMIT = 60;
/** Record fields other records point at (a package's destination slug, an airline's code). */
const OPTION_VALUE_FIELDS = ["id", "slug", "code", "key", "iata"];

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
    const rows = await this.prisma.contentDocument.findMany({
      where: { collection: key },
      orderBy: [{ position: "asc" }, { docId: "asc" }],
    });
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
      })),
    };
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
    action = "content.create",
  ) {
    assertContentAccess(staff, key);
    const record = this.validate(key, data);
    const id = contentRecordId(key, record);
    const last = await this.prisma.contentDocument.findFirst({
      where: { collection: key },
      orderBy: { position: "desc" },
      select: { position: true },
    });
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
        await this.audit.record(
          { actor: staff, action, entity: key, entityId: id, after: record },
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
    return this.readOne(staff, key, id);
  }

  /** Saves a record; a new id (for example a new slug) moves it, keeping its place in the list. */
  async update(
    staff: StaffPrincipal,
    key: CollectionKey,
    id: string,
    data: unknown,
    version?: number,
    action = "content.update",
  ) {
    assertContentAccess(staff, key);
    const record = this.validate(key, data);
    const nextId = contentRecordId(key, record);
    const before = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: id } },
    });
    if (!before) throw problems.notFound("Record not found");
    const current = {
      version: before.version,
      updatedBy: before.updatedBy,
      updatedAt: before.updatedAt.toISOString(),
    };
    if (version && before.version !== version) throw problems.stale(current);
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
        await this.audit.record(
          {
            actor: staff,
            action,
            entity: key,
            entityId: nextId,
            before: before.data,
            after: record,
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
    return this.readOne(staff, key, nextId);
  }

  async remove(staff: StaffPrincipal, key: CollectionKey, id: string) {
    assertContentAccess(staff, key);
    const before = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: id } },
    });
    if (!before) throw problems.notFound("Record not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.contentDocument.delete({
        where: { collection_docId: { collection: key, docId: id } },
      });
      await this.audit.record(
        { actor: staff, action: "content.delete", entity: key, entityId: id, before: before.data },
        tx,
      );
    });
    this.changed(key);
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
    if (!entry || entry.after === null) throw problems.notFound("That version is not available");
    if (CONTENT_MODEL[key].kind === "singleton")
      return this.writeSetting(staff, key, entry.after, version, "settings.restore");
    const collection = key as CollectionKey;
    if (!this.idIn(collection, entry.after))
      throw problems.notFound("That version is not available");
    return this.update(staff, collection, id, entry.after, version, "content.restore");
  }

  /** A copy with "(copy)" in its title and a free id, saved as a hidden draft and never Sample. */
  async duplicate(staff: StaffPrincipal, key: CollectionKey, id: string) {
    assertContentAccess(staff, key);
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
    const base = String(data[idField] ?? id);
    let suffix = "-copy";
    for (let n = 2; taken.has(`${base}${suffix}`); n += 1) suffix = `-copy-${n}`;
    data[idField] = `${base}${suffix}`;
    if (idField !== "id" && typeof data.id === "string") data.id = `${data.id}${suffix}`;
    if (titleField !== idField && typeof data[titleField] === "string")
      data[titleField] = `${data[titleField] as string} (copy)`;
    if (typeof data.sample === "boolean") data.sample = false;
    for (const flag of ["visible", "isActive", "enabled"])
      if (typeof data[flag] === "boolean") data[flag] = false;
    if (typeof data.status === "string" && parseContent(key, { ...data, status: "draft" }).success)
      data.status = "draft";
    return this.create(staff, key, data, "content.duplicate");
  }

  /** Choices for reference pickers: titles, photos and the values records point at (any staff may read them). */
  async options(key: CollectionKey, query?: string) {
    const { titleField } = CONTENT_MODEL[key];
    const rows = await this.prisma.contentDocument.findMany({
      where: { collection: key },
      orderBy: [{ position: "asc" }, { docId: "asc" }],
      select: { docId: true, data: true },
    });
    const needle = query?.trim().toLowerCase() ?? "";
    const items = rows.map((row) => {
      const data = row.data as Record<string, unknown>;
      const values: Record<string, string> = {};
      for (const field of OPTION_VALUE_FIELDS)
        if (typeof data[field] === "string") values[field] = data[field] as string;
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
      select: { docId: true },
    });
    const known = new Set(rows.map((row) => row.docId));
    if (ids.length !== known.size || ids.some((id) => !known.has(id))) {
      throw problems.badRequest("Send every record id of the list exactly once");
    }
    await this.prisma.$transaction(async (tx) => {
      for (const [position, id] of ids.entries()) {
        await tx.contentDocument.update({
          where: { collection_docId: { collection: key, docId: id } },
          data: { position, updatedBy: staff.name },
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

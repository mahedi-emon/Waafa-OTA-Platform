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
import { problems, validationProblem } from "../common/problem";
import { ContentService } from "../content/content.service";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";
import { assertContentAccess, canEditContent } from "./access";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

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
      data: row.data,
    };
  }

  private validate(key: ContentKey, data: unknown) {
    const parsed = parseContent(key, data);
    if (!parsed.success) throw validationProblem(parsed.error);
    return parsed.data as unknown;
  }

  async writeSetting(staff: StaffPrincipal, key: ContentKey, data: unknown, version?: number) {
    assertContentAccess(staff, key);
    if (CONTENT_MODEL[key].kind !== "singleton")
      throw problems.badRequest(`"${key}" is a list; edit its records`);
    const value = this.validate(key, data);
    const before = await this.prisma.setting.findUnique({ where: { key } });
    await this.prisma.$transaction(async (tx) => {
      if (before) {
        const updated = await tx.setting.updateMany({
          where: { key, ...(version ? { version } : {}) },
          data: { value: json(value), version: { increment: 1 }, updatedBy: staff.name },
        });
        if (updated.count === 0)
          throw problems.conflict("Someone else saved this first; reload to see it", "stale");
      } else {
        await tx.setting.create({ data: { key, value: json(value), updatedBy: staff.name } });
      }
      await this.audit.record(
        {
          actor: staff,
          action: "settings.update",
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

  async create(staff: StaffPrincipal, key: CollectionKey, data: unknown) {
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
          { actor: staff, action: "content.create", entity: key, entityId: id, after: record },
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
  ) {
    assertContentAccess(staff, key);
    const record = this.validate(key, data);
    const nextId = contentRecordId(key, record);
    const before = await this.prisma.contentDocument.findUnique({
      where: { collection_docId: { collection: key, docId: id } },
    });
    if (!before) throw problems.notFound("Record not found");
    if (version && before.version !== version) {
      throw problems.conflict("Someone else saved this first; reload to see it", "stale");
    }
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
        if (updated.count === 0)
          throw problems.conflict("Someone else saved this first; reload to see it", "stale");
        await this.audit.record(
          {
            actor: staff,
            action: "content.update",
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

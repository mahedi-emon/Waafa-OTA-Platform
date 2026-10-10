import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import {
  CONTENT_KEYS,
  CONTENT_MODEL,
  type CollectionKey,
  type ContentRecord,
  type ContentValue,
  type SingletonKey,
} from "@waafa/shared";
import { PrismaService } from "../prisma/prisma.service";

/** Keys the web's repositories expect in the snapshot that are not public content: always empty there. */
const PRIVATE_KEYS = [
  "orders",
  "leads",
  "searchLogs",
  "staffUsers",
  "auditLog",
  "visaApplications",
  "paymentProofs",
] as const;

export type Snapshot = { etag: string; body: Record<string, unknown> };

/**
 * Admin-managed content and settings (D125). The public snapshot holds every content key the site renders, under the
 * same names the fixture repositories read, plus approved feedback with consent (never contact details). It is
 * cached in memory and rebuilt after any content write.
 */
@Injectable()
export class ContentService {
  private cached: Snapshot | null = null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Drop the cached snapshot after a write. */
  invalidate(): void {
    this.cached = null;
  }

  async snapshot(): Promise<Snapshot> {
    if (this.cached) return this.cached;
    const [settings, documents, feedback] = await Promise.all([
      this.prisma.setting.findMany(),
      this.prisma.contentDocument.findMany({
        orderBy: [{ collection: "asc" }, { position: "asc" }, { docId: "asc" }],
      }),
      this.prisma.feedback.findMany({
        where: { status: "approved", consentToPublish: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);
    const body: Record<string, unknown> = {};
    for (const key of CONTENT_KEYS) {
      if (CONTENT_MODEL[key].kind === "collection") body[key] = [];
    }
    for (const setting of settings) body[setting.key] = setting.value;
    for (const document of documents) {
      const list = body[document.collection];
      if (Array.isArray(list)) list.push(document.data);
    }
    body.feedback = feedback.map((item) => ({
      id: item.id,
      name: item.name,
      // The public wall never shows contact details; the record shape needs the field.
      contact: "private",
      service: item.service,
      ...(item.rating ? { rating: item.rating } : {}),
      comment: item.comment,
      consentToPublish: true,
      status: "approved",
      submittedAt: item.createdAt.toISOString(),
      sample: false,
    }));
    for (const key of PRIVATE_KEYS) body[key] = [];
    const etag = `"${createHash("sha1").update(JSON.stringify(body)).digest("hex")}"`;
    this.cached = { etag, body };
    return this.cached;
  }

  async collection<K extends CollectionKey>(key: K): Promise<Array<ContentRecord<K>>> {
    const rows = await this.prisma.contentDocument.findMany({
      where: { collection: key },
      orderBy: [{ position: "asc" }, { docId: "asc" }],
    });
    return rows.map((row) => row.data as ContentRecord<K>);
  }

  async setting<K extends SingletonKey>(key: K): Promise<ContentValue<K>> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (!row) throw new Error(`Setting "${key}" is missing: run the seed`);
    return row.value as ContentValue<K>;
  }
}

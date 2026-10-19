import { Inject, Injectable } from "@nestjs/common";
import {
  mediaKindOf,
  mediaPathOf,
  type CollectionKey,
  type ContentKey,
  type MediaReplaceResult,
  type MediaUse,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import type { MediaAsset } from "../generated/prisma/client";
import { MediaService } from "../media/media.service";
import { PrismaService } from "../prisma/prisma.service";
import { AdminContentService } from "./content-admin.service";

/**
 * A copy of a record or setting value with every address of one library file swapped for another; an image object
 * that shows it also takes the new file's width and height.
 */
export function swapMedia(value: unknown, fromPath: string, to: MediaAsset): unknown {
  const url = `/uploads/${to.path}`;
  if (typeof value === "string") return mediaPathOf(value) === fromPath ? url : value;
  if (Array.isArray(value)) return value.map((item) => swapMedia(item, fromPath, to));
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(record)) next[key] = swapMedia(item, fromPath, to);
  const showsIt = typeof record.src === "string" && mediaPathOf(record.src) === fromPath;
  if (showsIt && to.width > 0 && to.height > 0) {
    if (typeof record.width === "number") next.width = to.width;
    if (typeof record.height === "number") next.height = to.height;
  }
  return next;
}

/**
 * "Replace everywhere" (D0 R3, ADMIN.md §5.7): shows another library file wherever one is shown, through the normal
 * saves, so every change is validated, versioned, audited and refreshes the site. Records the person may not edit
 * are listed back, untouched.
 */
@Injectable()
export class MediaReplaceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MediaService) private readonly media: MediaService,
    @Inject(AdminContentService) private readonly content: AdminContentService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async replace(staff: StaffPrincipal, id: string, withId: string): Promise<MediaReplaceResult> {
    if (id === withId) throw problems.badRequest("Choose a different file");
    const [from, to] = await Promise.all([
      this.prisma.mediaAsset.findUnique({ where: { id } }),
      this.prisma.mediaAsset.findUnique({ where: { id: withId } }),
    ]);
    if (!from || !to) throw problems.notFound("This file is not in the library");
    if (mediaKindOf(from.mime) !== mediaKindOf(to.mime))
      throw problems.badRequest("Replace a photo with a photo, and a video with a video");

    const groups = new Map<string, MediaUse[]>();
    for (const use of (await this.media.usageIndex()).get(from.path) ?? []) {
      const at = `${use.area}:${use.key}:${use.recordId ?? ""}`;
      groups.set(at, [...(groups.get(at) ?? []), use]);
    }
    let replaced = 0;
    const failed: string[] = [];
    for (const group of groups.values()) {
      const first = group[0];
      if (!first) continue;
      try {
        if (first.area === "setting") {
          const current = await this.prisma.setting.findUnique({ where: { key: first.key } });
          if (!current) continue;
          await this.content.writeSetting(
            staff,
            first.key as ContentKey,
            swapMedia(current.value, from.path, to),
            current.version,
          );
        } else if (first.recordId) {
          const current = await this.prisma.contentDocument.findUnique({
            where: { collection_docId: { collection: first.key, docId: first.recordId } },
          });
          if (!current) continue;
          await this.content.update(
            staff,
            first.key as CollectionKey,
            first.recordId,
            swapMedia(current.data, from.path, to),
            current.version,
          );
        }
        replaced += group.length;
      } catch {
        failed.push(first.title);
      }
    }
    await this.audit.record({
      actor: staff,
      action: "media.replace",
      entity: "media",
      entityId: from.id,
      before: { path: from.path },
      after: { path: to.path, replaced, failed },
    });
    return { replaced, failed };
  }
}

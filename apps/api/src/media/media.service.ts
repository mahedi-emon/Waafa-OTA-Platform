import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import sharp, { type OutputInfo } from "sharp";
import {
  CONTENT_MODEL,
  isContentKey,
  MEDIA_FILE_PATH,
  mediaKindOf,
  mediaPathOf,
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  toDhakaIsoString,
  VIDEO_MAX_BYTES,
  VIDEO_TYPES,
  type MediaAsset as MediaView,
  type MediaCropInput,
  type MediaUse,
  type PhotoType,
  type VideoType,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { ENV, type Env } from "../config/env";
import { ProblemException, problems } from "../common/problem";
import type { MediaAsset } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Photo types the library accepts; every upload is re-encoded to WebP. */
export const MEDIA_TYPES = PHOTO_TYPES;
export const MEDIA_MAX_BYTES = PHOTO_MAX_BYTES;
/** Longest side after re-encoding: sharp on every screen up to 1440 px at 1.75x. */
const MAX_SIDE = 2560;
/** "2026/10/<cuid>.webp", ".mp4" or ".webm" */
export const MEDIA_PATH = MEDIA_FILE_PATH;
const PAGE_SIZE = 48;

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

const view = (row: MediaAsset, uses: number): MediaView => ({
  id: row.id,
  url: `/uploads/${row.path}`,
  path: row.path,
  kind: mediaKindOf(row.mime),
  mime: row.mime,
  alt: row.alt,
  credit: row.credit,
  creditUrl: row.creditUrl,
  width: row.width,
  height: row.height,
  bytes: row.bytes,
  originalName: row.originalName,
  uploadedBy: row.uploadedBy,
  createdAt: toDhakaIsoString(row.createdAt),
  uses,
});

/** The first bytes of each accepted type: the declared content type must match the file itself. */
export function sniffImage(buffer: unknown): PhotoType | null {
  if (!Buffer.isBuffer(buffer) || buffer.byteLength < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  if (buffer.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(buffer.toString("ascii", 8, 12)))
    return "image/avif";
  return null;
}

/** MP4 ("ftyp" box first, not an AVIF photo) or WebM (EBML header) by the file's own bytes. */
export function sniffVideo(buffer: unknown): VideoType | null {
  if (!Buffer.isBuffer(buffer) || buffer.byteLength < 12) return null;
  if (buffer.toString("ascii", 4, 8) === "ftyp" && !/avi[fs]/.test(buffer.toString("ascii", 8, 12)))
    return "video/mp4";
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3)
    return "video/webm";
  return null;
}

/**
 * Width and height of an MP4's first video track, read from its "tkhd" box (16.16 fixed point), or zero when the
 * file doesn't say. Enough for the library's sizes; videos are never re-encoded.
 */
export function mp4Size(buffer: Buffer): { width: number; height: number } {
  for (let at = buffer.indexOf("tkhd"); at > 3; at = buffer.indexOf("tkhd", at + 4)) {
    const version = buffer[at + 4];
    // Width and height are the last 8 bytes of the box: after flags, times, ids, volume and the 36-byte matrix.
    const offset = at + 4 + (version === 1 ? 88 : 76);
    if (offset + 8 > buffer.byteLength) break;
    const width = buffer.readUInt32BE(offset) >>> 16;
    const height = buffer.readUInt32BE(offset + 4) >>> 16;
    if (width > 0 && height > 0) return { width, height };
  }
  return { width: 0, height: 0 };
}

/**
 * Auto-rotate, scale to at most 2560 px, re-encode to WebP and drop all metadata (sharp keeps none unless asked).
 * An unreadable file becomes a 422.
 */
export async function optimisePhoto(body: Buffer): Promise<{ data: Buffer; info: OutputInfo }> {
  try {
    return await sharp(body, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ProblemException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "Unreadable photo",
      "This file could not be read as a photo",
    );
  }
}

/** Every string inside a JSON value with its dotted path ("gallery.2.src"). */
function* stringsOf(value: unknown, at: string[] = []): Generator<[string, string]> {
  if (typeof value === "string") yield [at.join("."), value];
  else if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) yield* stringsOf(item, [...at, String(index)]);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) yield* stringsOf(item, [...at, key]);
  }
}

/** Where each library file is shown: records and settings, by file path. */
export type UsageIndex = Map<string, MediaUse[]>;

/**
 * Media library (#109, D0 R3): photos and videos staff upload for pages, packages, products and the team. Photos are
 * checked by their bytes, auto-rotated, scaled to at most 2560 px, re-encoded to WebP and stripped of metadata
 * (camera, GPS); videos are checked by their bytes and kept as they arrive. A file shown anywhere can't be deleted.
 */
@Injectable()
export class MediaService {
  private readonly root: string;

  constructor(
    @Inject(ENV) env: Env,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {
    this.root = path.resolve(env.MEDIA_DIR);
  }

  /** Which records and settings show each library file (one pass over the content). */
  async usageIndex(): Promise<UsageIndex> {
    const [documents, settings] = await Promise.all([
      this.prisma.contentDocument.findMany({
        select: { collection: true, docId: true, data: true },
      }),
      this.prisma.setting.findMany({ select: { key: true, value: true } }),
    ]);
    const index: UsageIndex = new Map();
    const add = (file: string, use: MediaUse) => {
      const list = index.get(file) ?? [];
      list.push(use);
      index.set(file, list);
    };
    for (const document of documents) {
      const data = document.data as Record<string, unknown>;
      const key = document.collection;
      const entry = isContentKey(key) ? CONTENT_MODEL[key] : undefined;
      const titleField = entry?.kind === "collection" ? entry.titleField : undefined;
      const title = String((titleField && data[titleField]) ?? document.docId);
      for (const [field, text] of stringsOf(data)) {
        const file = mediaPathOf(text);
        if (file) add(file, { area: "content", key, recordId: document.docId, title, field });
      }
    }
    for (const setting of settings) {
      for (const [field, text] of stringsOf(setting.value)) {
        const file = mediaPathOf(text);
        if (file)
          add(file, {
            area: "setting",
            key: setting.key,
            recordId: null,
            title: setting.key,
            field,
          });
      }
    }
    return index;
  }

  async list(query: {
    q?: string;
    page?: number;
    kind?: "photo" | "video";
    unused?: "true" | "false";
  }) {
    const page = Math.max(1, query.page ?? 1);
    const where = {
      ...(query.q
        ? {
            OR: [
              { alt: { contains: query.q, mode: "insensitive" as const } },
              { originalName: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(query.kind ? { mime: { startsWith: query.kind === "video" ? "video/" : "image/" } } : {}),
    };
    const usage = await this.usageIndex();
    if (query.unused === "true") {
      // The library is small (hundreds of files): filter by use in memory, then page.
      const rows = (
        await this.prisma.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" } })
      ).filter((row) => !usage.has(row.path));
      return {
        items: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((row) => view(row, 0)),
        total: rows.length,
        page,
        pageSize: PAGE_SIZE,
      };
    }
    const [rows, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return {
      items: rows.map((row) => view(row, usage.get(row.path)?.length ?? 0)),
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  async get(id: string): Promise<MediaView> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!row) throw problems.notFound("This file is not in the library");
    const usage = await this.usageIndex();
    return view(row, usage.get(row.path)?.length ?? 0);
  }

  async usage(id: string): Promise<{ items: MediaUse[] }> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!row) throw problems.notFound("This file is not in the library");
    return { items: (await this.usageIndex()).get(row.path) ?? [] };
  }

  /** Stores a new file under "YYYY/MM/<id>.<extension>" and records it (the id names the file). */
  private async store(
    staff: StaffPrincipal,
    data: Buffer,
    extension: "webp" | "mp4" | "webm",
    record: {
      alt: string;
      width: number;
      height: number;
      mime: string;
      originalName?: string | undefined;
      credit?: string | null | undefined;
      creditUrl?: string | null | undefined;
    },
    action: string,
    now: Date,
  ): Promise<MediaView> {
    const created = await this.prisma.mediaAsset.create({
      data: {
        // Placeholder until the id is known; replaced in the same request below.
        path: `pending/${now.getTime()}-${Math.random().toString(36).slice(2)}`,
        alt: record.alt,
        width: record.width,
        height: record.height,
        bytes: data.byteLength,
        mime: record.mime,
        originalName: record.originalName ?? null,
        uploadedBy: staff.name,
        credit: record.credit ?? null,
        creditUrl: record.creditUrl ?? null,
      },
    });
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const relative = `${year}/${month}/${created.id}.${extension}`;
    try {
      await mkdir(path.join(this.root, year, month), { recursive: true });
      // codeql[js/http-to-file-access] Saving staff uploads is the point: type checked by its bytes, named by its id.
      await writeFile(path.join(this.root, relative), data, { flag: "wx" });
    } catch (error) {
      await this.prisma.mediaAsset.delete({ where: { id: created.id } });
      throw error;
    }
    const row = await this.prisma.mediaAsset.update({
      where: { id: created.id },
      data: { path: relative },
    });
    await this.audit.record({
      actor: staff,
      action,
      entity: "media",
      entityId: row.id,
      after: {
        path: relative,
        alt: row.alt,
        width: row.width,
        height: row.height,
        bytes: row.bytes,
      },
    });
    return view(row, 0);
  }

  async upload(
    staff: StaffPrincipal,
    body: unknown,
    declared: unknown,
    meta: { alt: string; originalName?: string; credit?: string },
    now = new Date(),
  ): Promise<MediaView> {
    if (!Buffer.isBuffer(body) || typeof declared !== "string" || body.byteLength === 0) {
      throw problems.badRequest("Choose a photo to upload");
    }
    if (body.byteLength > MEDIA_MAX_BYTES) {
      throw new ProblemException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        "Too large",
        "Photos can be up to 12 MB",
      );
    }
    const actual = sniffImage(body);
    if (!actual || actual !== declared) {
      throw new ProblemException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "Unsupported file",
        "Upload a JPEG, PNG, WebP or AVIF photo",
      );
    }
    const output = await optimisePhoto(body);
    return this.store(
      staff,
      output.data,
      "webp",
      {
        alt: meta.alt,
        width: output.info.width,
        height: output.info.height,
        mime: "image/webp",
        originalName: meta.originalName,
        credit: meta.credit,
      },
      "media.upload",
      now,
    );
  }

  /** An MP4 or WebM up to 50 MB, kept as it arrives (D0 R3). */
  async uploadVideo(
    staff: StaffPrincipal,
    body: unknown,
    declared: unknown,
    meta: { alt: string; originalName?: string; credit?: string },
    now = new Date(),
  ): Promise<MediaView> {
    if (!Buffer.isBuffer(body) || typeof declared !== "string" || body.byteLength === 0) {
      throw problems.badRequest("Choose a video to upload");
    }
    if (body.byteLength > VIDEO_MAX_BYTES) {
      throw new ProblemException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        "Too large",
        "Videos can be up to 50 MB",
      );
    }
    const actual = sniffVideo(body);
    if (!actual || actual !== declared || !(VIDEO_TYPES as readonly string[]).includes(actual)) {
      throw new ProblemException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "Unsupported file",
        "Upload an MP4 or WebM video",
      );
    }
    const size = actual === "video/mp4" ? mp4Size(body) : { width: 0, height: 0 };
    return this.store(
      staff,
      body,
      actual === "video/mp4" ? "mp4" : "webm",
      {
        alt: meta.alt,
        ...size,
        mime: actual,
        originalName: meta.originalName,
        credit: meta.credit,
      },
      "media.upload",
      now,
    );
  }

  /** Saves a crop of a library photo as a new photo, keeping its words and credit (the original stays). */
  async crop(staff: StaffPrincipal, id: string, area: MediaCropInput, now = new Date()) {
    const source = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!source) throw problems.notFound("This photo is not in the library");
    if (mediaKindOf(source.mime) !== "photo" || !MEDIA_PATH.test(source.path))
      throw problems.badRequest("Only photos can be cropped");
    if (area.x + area.width > source.width || area.y + area.height > source.height)
      throw problems.badRequest("The crop goes past the edge of the photo");
    const file = await readFile(path.join(this.root, source.path));
    let output: { data: Buffer; info: OutputInfo };
    try {
      output = await sharp(file)
        .extract({ left: area.x, top: area.y, width: area.width, height: area.height })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw problems.badRequest("This photo could not be cropped");
    }
    return this.store(
      staff,
      output.data,
      "webp",
      {
        alt: source.alt,
        width: output.info.width,
        height: output.info.height,
        mime: "image/webp",
        originalName: source.originalName ?? undefined,
        credit: source.credit,
        creditUrl: source.creditUrl,
      },
      "media.crop",
      now,
    );
  }

  async update(
    staff: StaffPrincipal,
    id: string,
    input: { alt: string; credit?: string | undefined; creditUrl?: string | undefined },
  ): Promise<MediaView> {
    const existing = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) throw problems.notFound("This file is not in the library");
    const row = await this.prisma.mediaAsset.update({
      where: { id },
      data: { alt: input.alt, credit: input.credit ?? null, creditUrl: input.creditUrl ?? null },
    });
    await this.audit.record({
      actor: staff,
      action: "media.update",
      entity: "media",
      entityId: id,
      before: { alt: existing.alt, credit: existing.credit, creditUrl: existing.creditUrl },
      after: { alt: row.alt, credit: row.credit, creditUrl: row.creditUrl },
    });
    const usage = await this.usageIndex();
    return view(row, usage.get(row.path)?.length ?? 0);
  }

  /** Deletes the record and the file, but never a file a record or setting still shows (D0 R3). */
  async remove(staff: StaffPrincipal, id: string) {
    const existing = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) throw problems.notFound("This file is not in the library");
    const uses = (await this.usageIndex()).get(existing.path)?.length ?? 0;
    if (uses > 0)
      throw problems.conflict(
        `This file is shown in ${uses} place${uses === 1 ? "" : "s"}; replace it there first`,
        "inUse",
      );
    await this.prisma.mediaAsset.delete({ where: { id } });
    if (MEDIA_PATH.test(existing.path)) {
      await rm(path.join(this.root, existing.path), { force: true });
    }
    await this.audit.record({
      actor: staff,
      action: "media.remove",
      entity: "media",
      entityId: id,
      before: { path: existing.path, alt: existing.alt },
    });
  }

  /**
   * A stored file for /uploads/<path>, or null; the path pattern keeps reads inside the media folder. `range` gives
   * the bytes of a "Range: bytes=start-end" request (videos seek with it).
   */
  async open(relative: unknown, range?: { start: number; end: number }) {
    if (typeof relative !== "string" || !MEDIA_PATH.test(relative)) return null;
    const file = path.resolve(this.root, relative);
    // Belt and braces: the resolved file must stay inside the media folder.
    if (!file.startsWith(this.root + path.sep)) return null;
    try {
      const info = await stat(file);
      if (!info.isFile()) return null;
      const extension = relative.slice(relative.lastIndexOf(".") + 1);
      const type = CONTENT_TYPES[extension] ?? "application/octet-stream";
      if (range) {
        const end = Math.min(range.end, info.size - 1);
        if (range.start > end) return { type, size: info.size, unsatisfiable: true as const };
        return {
          type,
          size: info.size,
          range: { start: range.start, end },
          stream: createReadStream(file, { start: range.start, end }),
        };
      }
      return { type, size: info.size, stream: createReadStream(file) };
    } catch {
      return null;
    }
  }
}

import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import sharp, { type OutputInfo } from "sharp";
import { toDhakaIsoString } from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { ENV, type Env } from "../config/env";
import { ProblemException, problems } from "../common/problem";
import type { MediaAsset } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Photo types the library accepts; every upload is re-encoded to WebP. */
export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MEDIA_MAX_BYTES = 12 * 1024 * 1024;
/** Longest side after re-encoding: sharp on every screen up to 1440 px at 1.75x. */
const MAX_SIDE = 2560;
/** "2026/10/<cuid>.webp" */
export const MEDIA_PATH = /^\d{4}\/\d{2}\/[a-z0-9]{8,40}\.webp$/;

export type MediaView = {
  id: string;
  url: string;
  path: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  originalName: string | null;
  uploadedBy: string | null;
  createdAt: string;
};

const view = (row: MediaAsset): MediaView => ({
  id: row.id,
  url: `/uploads/${row.path}`,
  path: row.path,
  alt: row.alt,
  width: row.width,
  height: row.height,
  bytes: row.bytes,
  originalName: row.originalName,
  uploadedBy: row.uploadedBy,
  createdAt: toDhakaIsoString(row.createdAt),
});

/** The first bytes of each accepted type: the declared content type must match the file itself. */
export function sniffImage(buffer: Buffer): (typeof MEDIA_TYPES)[number] | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  if (buffer.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(buffer.toString("ascii", 8, 12)))
    return "image/avif";
  return null;
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

/**
 * Media library (#109): photos the Super Admin, admins and editors upload for pages, packages, products and the team.
 * Every file is checked by its bytes, auto-rotated, scaled to at most 2560 px, re-encoded to WebP and stripped of
 * metadata (camera, GPS) before it is stored; the original is never kept.
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

  async list(query: { q?: string; page?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = 48;
    const where = query.q
      ? {
          OR: [
            { alt: { contains: query.q, mode: "insensitive" as const } },
            { originalName: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return { items: rows.map(view), total, page, pageSize };
  }

  async upload(
    staff: StaffPrincipal,
    body: Buffer,
    declared: string,
    meta: { alt: string; originalName?: string },
    now = new Date(),
  ): Promise<MediaView> {
    if (body.length === 0) throw problems.badRequest("Choose a photo to upload");
    if (body.length > MEDIA_MAX_BYTES) {
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
    const created = await this.prisma.mediaAsset.create({
      data: {
        // Placeholder until the id is known; replaced in the same request below.
        path: `pending/${now.getTime()}-${Math.random().toString(36).slice(2)}`,
        alt: meta.alt,
        width: output.info.width,
        height: output.info.height,
        bytes: output.data.length,
        mime: "image/webp",
        originalName: meta.originalName ?? null,
        uploadedBy: staff.name,
      },
    });
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const relative = `${year}/${month}/${created.id}.webp`;
    try {
      await mkdir(path.join(this.root, year, month), { recursive: true });
      await writeFile(path.join(this.root, relative), output.data, { flag: "wx" });
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
      action: "media.upload",
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
    return view(row);
  }

  async updateAlt(staff: StaffPrincipal, id: string, alt: string): Promise<MediaView> {
    const existing = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) throw problems.notFound("This photo is not in the library");
    const row = await this.prisma.mediaAsset.update({ where: { id }, data: { alt } });
    await this.audit.record({
      actor: staff,
      action: "media.update",
      entity: "media",
      entityId: id,
      before: { alt: existing.alt },
      after: { alt },
    });
    return view(row);
  }

  /** Deletes the record and the file. Pages that still use the URL show their fallback until edited. */
  async remove(staff: StaffPrincipal, id: string) {
    const existing = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) throw problems.notFound("This photo is not in the library");
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

  /** A stored file for /uploads/<path>, or null; the path pattern keeps reads inside the media folder. */
  async open(relative: string) {
    if (!MEDIA_PATH.test(relative)) return null;
    const file = path.join(this.root, relative);
    try {
      const info = await stat(file);
      if (!info.isFile()) return null;
      return { stream: createReadStream(file), size: info.size };
    } catch {
      return null;
    }
  }
}

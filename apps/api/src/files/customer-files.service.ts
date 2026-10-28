import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createReadStream, type ReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, statfs, writeFile } from "node:fs/promises";
import path from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import {
  CUSTOMER_FILE_LINK_MS,
  CUSTOMER_FILE_MAX_BYTES,
  CUSTOMER_FILE_MIN_FREE_BYTES,
  CUSTOMER_FILE_PENDING_MS,
  CUSTOMER_FILE_PENDING_PER_VISITOR_BYTES,
  CUSTOMER_FILE_PENDING_TOTAL_BYTES,
  VISA_DOCUMENT_RETENTION_MS,
  isStorageKey,
  sniffCustomerFile,
  type CustomerFileLink,
  type CustomerFileOwner,
  type CustomerFileType,
  type CustomerFileUploaded,
  type CustomerFileUploadQuery,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { assertLeadAccess, canSeeOrders } from "../admin/access";
import { ENV, type Env } from "../config/env";
import { ProblemException, problems } from "../common/problem";
import type { Prisma } from "../generated/prisma/client";
import { bookingModulesFor } from "../admin/bookings.service";
import { PrismaService } from "../prisma/prisma.service";

const EXTENSION: Record<CustomerFileType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

/** A file reference as forms send it: the storage key, and the type the form says it is. */
export type FileRef = { storageKey?: string | undefined; fileName: string; mimeType?: string };

export type ClaimResult = { claimed: number; missing: string[] };

export type CustomerFileRow = {
  storageKey: string;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: string;
  /** For staff (issue 235): off (no scanner), pending, clean or infected. */
  scan: "off" | "pending" | "clean" | "infected";
  /** attached, or deleted once its retention ended (the row stays so staff know why it is gone). */
  status: string;
  createdAt: string;
  deletedAt: string | null;
};

export type OpenedFile = {
  stream: ReadStream;
  size: number;
  mimeType: string;
  fileName: string;
};

/** Roles that may open files of each owner type, beside Super Admin (PRD §4; matches the admin screens). */
const OWNER_ROLES: Record<Exclude<CustomerFileOwner, "lead" | "order" | "booking">, string[]> = {
  "payment-proof": ["admin", "accounts", "shop-manager"],
  feedback: ["admin", "content-editor"],
};

/**
 * Customer files (issue 232, FR-VISA-03 and FR-VISA-05). Uploads land on the private volume (PRIVATE_FILES_DIR, never
 * served by nginx) as pending rows; a lead, order, payment proof or feedback claims them in its own transaction. Staff
 * open a file only through a signed link that lasts ten minutes; issuing and using a link are both audited. The minute
 * job deletes unclaimed uploads after a day and visa documents 90 days after their application closes.
 */
@Injectable()
export class CustomerFilesService {
  private readonly root: string;
  private readonly linkKey: Buffer;
  private readonly production: boolean;
  /** CLAMAV_URL is set: staff open a file only once the worker found it clean (issue 235). */
  private readonly scanning: boolean;
  private mounted: boolean | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ENV) env: Env,
  ) {
    this.root = path.resolve(env.PRIVATE_FILES_DIR);
    this.production = env.NODE_ENV === "production";
    this.scanning = Boolean(env.CLAMAV_URL);
    // A key of its own, derived from the API secret, so a link can't be mistaken for a session token.
    this.linkKey = createHmac("sha256", env.JWT_SECRET).update("waafa:customer-file-link").digest();
  }

  /** Stores an upload as a pending file and returns the claim the form sends back. */
  async store(
    bytes: Buffer,
    declaredType: string,
    query: CustomerFileUploadQuery,
    uploaderIp: string,
    now = new Date(),
  ): Promise<CustomerFileUploaded> {
    if (bytes.length === 0) throw problems.badRequest("The file is empty", "file-empty");
    if (bytes.length > CUSTOMER_FILE_MAX_BYTES) {
      throw new ProblemException(
        413,
        "Too large",
        "Files can be up to 5 MB",
        undefined,
        "file-size",
      );
    }
    if (!(await this.storageReady())) {
      throw new ProblemException(
        503,
        "Uploads paused",
        "Files can't be received right now; send the form and we will ask for them",
        undefined,
        "storage",
      );
    }
    await this.assertRoom(bytes.length, uploaderIp, now);
    const mimeType = sniffCustomerFile(bytes);
    if (!mimeType || mimeType !== declaredType) {
      throw new ProblemException(
        415,
        "Unsupported file",
        "Send a JPG, PNG or PDF file",
        undefined,
        "file-type",
      );
    }
    const storageKey = `cf_${randomBytes(24).toString("base64url")}`;
    const id = randomBytes(16).toString("hex");
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const relative = `${year}/${month}/${id}.${EXTENSION[mimeType]}`;
    await mkdir(path.join(this.root, year, month), { recursive: true, mode: 0o700 });
    // codeql[js/http-to-file-access] Storing customer files is the point: type checked by its bytes, size and quota capped, named by a random id on the private volume.
    await writeFile(path.join(this.root, relative), bytes, { flag: "wx", mode: 0o600 });
    try {
      await this.prisma.customerFile.create({
        data: {
          storageKey,
          kind: query.kind,
          fileName: query.name,
          mimeType,
          sizeBytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          path: relative,
          uploaderIp: uploaderIp.slice(0, 64),
          createdAt: now,
          deleteAfter: new Date(now.getTime() + CUSTOMER_FILE_PENDING_MS),
        },
      });
    } catch (error) {
      await rm(path.join(this.root, relative), { force: true });
      throw error;
    }
    return { storageKey, fileName: query.name, mimeType, sizeBytes: bytes.length };
  }

  /**
   * Claims the pending files a record names, inside the record's transaction. A key that is unknown, expired or
   * already claimed is reported by file name and never fails the record (a lead is never lost over a file).
   */
  async claim(
    tx: Prisma.TransactionClient,
    refs: readonly FileRef[],
    owner: CustomerFileOwner,
    ownerId: string,
    now = new Date(),
  ): Promise<ClaimResult> {
    const wanted = refs.filter((ref) => isStorageKey(ref.storageKey));
    const missingWithoutKey = refs.filter((ref) => !isStorageKey(ref.storageKey));
    if (wanted.length === 0) {
      return { claimed: 0, missing: missingWithoutKey.map((ref) => ref.fileName) };
    }
    const keys = wanted.map((ref) => ref.storageKey as string);
    const pending = await tx.customerFile.findMany({
      where: { storageKey: { in: keys }, status: "pending" },
      select: { id: true, storageKey: true, mimeType: true },
    });
    const byKey = new Map(pending.map((file) => [file.storageKey, file]));
    // A file is claimed only as the type the form says it is (a PDF can't become a feedback "photo").
    const fileOf = (ref: FileRef) => {
      const file = byKey.get(ref.storageKey as string);
      return file && (!ref.mimeType || ref.mimeType === file.mimeType) ? file : undefined;
    };
    const eligible = [
      ...new Set(wanted.map((ref) => fileOf(ref)?.id).filter((id): id is string => Boolean(id))),
    ];
    let claimed = new Set<string>();
    if (eligible.length > 0) {
      const result = await tx.customerFile.updateMany({
        where: { id: { in: eligible }, status: "pending" },
        data: {
          status: "attached",
          ownerType: owner,
          ownerId,
          attachedAt: now,
          deleteAfter: null,
        },
      });
      claimed = new Set(eligible);
      if (result.count !== eligible.length) {
        // Another form claimed some of them at the same moment: count only the ones this record got.
        const mine = await tx.customerFile.findMany({
          where: { id: { in: eligible }, ownerType: owner, ownerId, status: "attached" },
          select: { id: true },
        });
        claimed = new Set(mine.map((file) => file.id));
      }
    }
    return {
      claimed: claimed.size,
      missing: [
        ...missingWithoutKey.map((ref) => ref.fileName),
        ...wanted
          .filter((ref) => {
            const file = fileOf(ref);
            return !file || !claimed.has(file.id);
          })
          .map((ref) => ref.fileName),
      ],
    };
  }

  /** The files a record holds, for staff who may see that record. */
  async list(
    staff: StaffPrincipal,
    owner: CustomerFileOwner,
    ownerId: string,
  ): Promise<CustomerFileRow[]> {
    await this.assertOwnerAccess(staff, owner, ownerId);
    const rows = await this.prisma.customerFile.findMany({
      where: { ownerType: owner, ownerId, status: { in: ["attached", "deleted"] } },
      orderBy: { createdAt: "asc" },
      select: {
        storageKey: true,
        kind: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        scanStatus: true,
        status: true,
        createdAt: true,
        deletedAt: true,
      },
    });
    return rows.map((row) => ({
      ...row,
      scan:
        row.scanStatus === "infected"
          ? "infected"
          : row.scanStatus === "clean"
            ? "clean"
            : this.scanning
              ? "pending"
              : "off",
      createdAt: row.createdAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() ?? null,
    }));
  }

  /** A signed link for one file (ten minutes), audited. */
  async link(
    staff: StaffPrincipal,
    storageKey: string,
    now = new Date(),
  ): Promise<CustomerFileLink> {
    const file = await this.prisma.customerFile.findUnique({ where: { storageKey } });
    if (!file || file.status !== "attached" || !file.ownerType || !file.ownerId) {
      throw problems.notFound("File not found");
    }
    await this.assertOwnerAccess(staff, file.ownerType as CustomerFileOwner, file.ownerId);
    if (file.scanStatus === "infected") {
      throw problems.conflict("This file failed the malware scan and is quarantined", "infected");
    }
    if (this.scanning && file.scanStatus !== "clean") {
      throw problems.conflict(
        "This file is still being checked for viruses. Try again in a minute.",
        "scanning",
      );
    }
    const expires = now.getTime() + CUSTOMER_FILE_LINK_MS;
    const payload = `${file.id}.${expires}.${staff.id}`;
    await this.audit.record({
      actor: staff,
      action: "file.link",
      entity: "CustomerFile",
      entityId: file.id,
      after: { owner: file.ownerType, ownerId: file.ownerId, fileName: file.fileName },
    });
    return {
      token: `${payload}.${this.sign(payload)}`,
      expiresAt: new Date(expires).toISOString(),
      fileName: file.fileName,
      mimeType: file.mimeType as CustomerFileType,
    };
  }

  /** Opens a file for a valid link and audits the download; null when the link is bad or expired. */
  async open(token: string, now = new Date()): Promise<OpenedFile | null> {
    const parts = token.split(".");
    if (parts.length !== 4) return null;
    const [id, expires, staffId, signature] = parts as [string, string, string, string];
    const payload = `${id}.${expires}.${staffId}`;
    const expected = Buffer.from(this.sign(payload));
    const given = Buffer.from(signature);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    if (!/^\d{13}$/.test(expires) || Number(expires) < now.getTime()) return null;
    const file = await this.prisma.customerFile.findUnique({ where: { id } });
    if (!file || file.status !== "attached" || file.scanStatus === "infected") return null;
    if (this.scanning && file.scanStatus !== "clean") return null;
    const absolute = path.join(this.root, file.path);
    const info = await stat(absolute).catch(() => null);
    if (!info?.isFile()) return null;
    const staff = await this.prisma.staffUser.findUnique({
      where: { id: staffId },
      select: { id: true, name: true, status: true },
    });
    if (!staff || staff.status !== "active") return null;
    await this.audit.record({
      actor: { id: null, name: staff.name },
      action: "file.download",
      entity: "CustomerFile",
      entityId: file.id,
      after: { staffId: staff.id, fileName: file.fileName },
    });
    return {
      stream: createReadStream(absolute),
      size: info.size,
      mimeType: file.mimeType,
      fileName: file.fileName,
    };
  }

  /**
   * Minute job: deletes uploads nobody claimed within a day and visa documents 90 days after their application
   * closed. Returns how many files went.
   */
  async purge(now = new Date()): Promise<number> {
    const expired = await this.prisma.customerFile.findMany({
      where: { status: "pending", deleteAfter: { lte: now } },
      select: { id: true, path: true },
      take: 200,
    });
    const visaCutoff = new Date(now.getTime() - VISA_DOCUMENT_RETENTION_MS);
    // Only files still attached to visa leads closed long enough ago: the query stays small as years pass.
    const oldVisa = await this.prisma.$queryRaw<Array<{ id: string; path: string }>>`
      SELECT f."id", f."path" FROM "CustomerFile" f
      JOIN "Lead" l ON l."id" = f."ownerId"
      WHERE f."ownerType" = 'lead' AND f."status" = 'attached'
        AND l."module" = 'visa' AND l."closedAt" <= ${visaCutoff}
      LIMIT 200`;
    let deleted = 0;
    const remove = async (file: { id: string; path: string }, status: "pending" | "attached") => {
      // Mark first and only if it is still what we found, so a claim landing meanwhile keeps its file.
      const marked = await this.prisma.customerFile.updateMany({
        where: { id: file.id, status },
        data: { status: "deleted", deletedAt: now },
      });
      if (marked.count === 0) return;
      await rm(path.join(this.root, file.path), { force: true });
      deleted += 1;
    };
    for (const file of expired) await remove(file, "pending");
    for (const file of oldVisa) await remove(file, "attached");
    return deleted;
  }

  /** Refuses an upload that would let unclaimed files crowd the disk (per visitor, in total, free space). */
  private async assertRoom(size: number, uploaderIp: string, now: Date): Promise<void> {
    const since = new Date(now.getTime() - CUSTOMER_FILE_PENDING_MS);
    const [mine, all] = await Promise.all([
      this.prisma.customerFile.aggregate({
        _sum: { sizeBytes: true },
        where: {
          status: "pending",
          uploaderIp: uploaderIp.slice(0, 64),
          createdAt: { gte: since },
        },
      }),
      this.prisma.customerFile.aggregate({
        _sum: { sizeBytes: true },
        where: { status: "pending" },
      }),
    ]);
    if ((mine._sum.sizeBytes ?? 0) + size > CUSTOMER_FILE_PENDING_PER_VISITOR_BYTES) {
      throw problems.tooMany("Send the form with the files you added, then add more");
    }
    const paused = new ProblemException(
      503,
      "Uploads paused",
      "Files can't be received right now; send the form and we will ask for them",
      undefined,
      "storage",
    );
    if ((all._sum.sizeBytes ?? 0) + size > CUSTOMER_FILE_PENDING_TOTAL_BYTES) throw paused;
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const disk = await statfs(this.root).catch(() => null);
    if (disk && disk.bavail * disk.bsize < CUSTOMER_FILE_MIN_FREE_BYTES + size) throw paused;
  }

  /**
   * In production the folder must be its own Docker volume (`privatedata`): without it files would live in the
   * container and vanish at the next deploy, so uploads pause instead (a server bundle from before issue 232).
   */
  private async storageReady(): Promise<boolean> {
    if (!this.production) return true;
    if (this.mounted !== null) return this.mounted;
    const info = await readFile("/proc/self/mountinfo", "utf8").catch(() => "");
    // mountinfo field 5 is the mount point inside this container.
    this.mounted = info.split("\n").some((line) => line.split(" ")[4] === this.root);
    return this.mounted;
  }

  private sign(payload: string): string {
    return createHmac("sha256", this.linkKey).update(payload).digest("base64url");
  }

  /**
   * Staff add a document to a record they may open (issue 242: e-tickets, vouchers and invoices on a booking). The file
   * is stored and scanned like a customer upload and attached at once; the audit log names it.
   */
  async attachForStaff(
    staff: StaffPrincipal,
    owner: CustomerFileOwner,
    ownerId: string,
    bytes: Buffer,
    declaredType: string,
    query: CustomerFileUploadQuery,
    ip: string,
  ): Promise<CustomerFileRow[]> {
    await this.assertOwnerAccess(staff, owner, ownerId);
    const stored = await this.store(bytes, declaredType, query, ip);
    await this.prisma.$transaction(async (tx) => {
      await this.claim(tx, [stored], owner, ownerId);
      await this.audit.record(
        {
          actor: staff,
          action: "file.attach",
          entity: owner,
          entityId: ownerId,
          after: { fileName: stored.fileName, kind: query.kind },
        },
        tx,
      );
    });
    return this.list(staff, owner, ownerId);
  }

  private async assertOwnerAccess(
    staff: StaffPrincipal,
    owner: CustomerFileOwner,
    ownerId: string,
  ): Promise<void> {
    if (staff.roles.includes("super-admin")) return;
    if (owner === "lead") {
      const lead = await this.prisma.lead.findUnique({
        where: { id: ownerId },
        select: { module: true },
      });
      if (!lead) throw problems.notFound("File not found");
      assertLeadAccess(staff, lead.module);
      return;
    }
    if (owner === "order") {
      if (!canSeeOrders(staff)) throw problems.notFound("File not found");
      return;
    }
    if (owner === "booking") {
      // Booking documents follow the booking: its lead's module, or Accounts (issue 242).
      const booking = await this.prisma.booking.findUnique({
        where: { id: ownerId },
        select: { module: true },
      });
      if (!booking || !bookingModulesFor(staff).includes(booking.module as never))
        throw problems.notFound("File not found");
      return;
    }
    if (!OWNER_ROLES[owner].some((role) => staff.roles.includes(role as never))) {
      throw problems.notFound("File not found");
    }
  }
}

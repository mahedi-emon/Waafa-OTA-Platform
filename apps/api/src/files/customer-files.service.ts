import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createReadStream, type ReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import {
  CUSTOMER_FILE_LINK_MS,
  CUSTOMER_FILE_MAX_BYTES,
  CUSTOMER_FILE_PENDING_MS,
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
import { PrismaService } from "../prisma/prisma.service";

const EXTENSION: Record<CustomerFileType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

/** A file reference as forms send it: only the storage key matters here. */
export type FileRef = { storageKey?: string | undefined; fileName: string };

export type ClaimResult = { claimed: number; missing: string[] };

export type CustomerFileRow = {
  storageKey: string;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: string;
  createdAt: string;
};

export type OpenedFile = {
  stream: ReadStream;
  size: number;
  mimeType: string;
  fileName: string;
};

/** Roles that may open files of each owner type, beside Super Admin (PRD §4; matches the admin screens). */
const OWNER_ROLES: Record<Exclude<CustomerFileOwner, "lead" | "order">, string[]> = {
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
  private mounted: boolean | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ENV) env: Env,
  ) {
    this.root = path.resolve(env.PRIVATE_FILES_DIR);
    this.production = env.NODE_ENV === "production";
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
      select: { id: true, storageKey: true },
    });
    if (pending.length > 0) {
      await tx.customerFile.updateMany({
        where: { id: { in: pending.map((file) => file.id) }, status: "pending" },
        data: {
          status: "attached",
          ownerType: owner,
          ownerId,
          attachedAt: now,
          deleteAfter: null,
        },
      });
    }
    const found = new Set(pending.map((file) => file.storageKey));
    return {
      claimed: pending.length,
      missing: [
        ...missingWithoutKey.map((ref) => ref.fileName),
        ...wanted.filter((ref) => !found.has(ref.storageKey as string)).map((ref) => ref.fileName),
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
      where: { ownerType: owner, ownerId, status: "attached" },
      orderBy: { createdAt: "asc" },
      select: {
        storageKey: true,
        kind: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        scanStatus: true,
        createdAt: true,
      },
    });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
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
    const closed = await this.prisma.lead.findMany({
      where: { module: "visa", closedAt: { lte: visaCutoff } },
      select: { id: true },
    });
    const oldVisa =
      closed.length === 0
        ? []
        : await this.prisma.customerFile.findMany({
            where: {
              ownerType: "lead",
              ownerId: { in: closed.map((lead) => lead.id) },
              status: "attached",
            },
            select: { id: true, path: true },
            take: 200,
          });
    const doomed = [...expired, ...oldVisa];
    for (const file of doomed) {
      await rm(path.join(this.root, file.path), { force: true });
      await this.prisma.customerFile.update({
        where: { id: file.id },
        data: { status: "deleted", deletedAt: now },
      });
    }
    return doomed.length;
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
    if (!OWNER_ROLES[owner].some((role) => staff.roles.includes(role as never))) {
      throw problems.notFound("File not found");
    }
  }
}

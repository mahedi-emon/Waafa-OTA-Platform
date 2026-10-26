import { mkdir, readFile, rename } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "../generated/prisma/client";
import type { ScanVerdict } from "./clamd";

/** What the scan needs from a scanner (the clamd client, or a stand-in in tests). */
export type Scanner = { scan(bytes: Buffer): Promise<ScanVerdict> };

export type ScanPass = { clean: number; infected: number; failed: number };

/** Files waiting for a scan, oldest first; a pass takes at most this many. */
export const SCAN_BATCH = 10;
/** Where a file that failed the scan is moved, inside the private volume. */
export const QUARANTINE_DIR = "quarantine";

/**
 * One pass of the malware scan (issue 235, FR-VISA-06): every customer file that is still "unscanned" goes through
 * ClamAV. Clean files become visible to staff; a hit is moved to the quarantine folder, marked "infected" (staff see a
 * warning, never the file) and written to the audit log. A file the scanner couldn't read stays unscanned and is tried
 * again on the next pass.
 */
export async function scanPendingFiles(
  prisma: Pick<PrismaClient, "customerFile" | "auditLog">,
  root: string,
  scanner: Scanner,
  limit = SCAN_BATCH,
): Promise<ScanPass> {
  const files = await prisma.customerFile.findMany({
    where: { scanStatus: "unscanned", status: { in: ["pending", "attached"] } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, path: true, fileName: true, ownerType: true, ownerId: true },
  });
  const pass: ScanPass = { clean: 0, infected: 0, failed: 0 };
  for (const file of files) {
    let verdict: ScanVerdict;
    try {
      verdict = await scanner.scan(await readFile(path.join(root, file.path)));
    } catch {
      pass.failed += 1;
      continue;
    }
    if (!verdict.infected) {
      const marked = await prisma.customerFile.updateMany({
        where: { id: file.id, scanStatus: "unscanned" },
        data: { scanStatus: "clean" },
      });
      pass.clean += marked.count;
      continue;
    }
    const quarantined = path.posix.join(QUARANTINE_DIR, path.posix.basename(file.path));
    await mkdir(path.join(root, QUARANTINE_DIR), { recursive: true, mode: 0o700 });
    await rename(path.join(root, file.path), path.join(root, quarantined));
    const marked = await prisma.customerFile.updateMany({
      where: { id: file.id, scanStatus: "unscanned" },
      data: { scanStatus: "infected", path: quarantined },
    });
    if (marked.count === 0) continue;
    pass.infected += 1;
    await prisma.auditLog.create({
      data: {
        actorId: null,
        actorName: "system",
        action: "file.infected",
        entity: "CustomerFile",
        entityId: file.id,
        after: {
          fileName: file.fileName,
          owner: file.ownerType,
          ownerId: file.ownerId,
          signature: verdict.signature,
        },
        reason: "Malware scan",
      },
    });
  }
  return pass;
}

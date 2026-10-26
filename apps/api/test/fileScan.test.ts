import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync } from "node:fs";
import { createServer, type Server } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { CustomerFileUploaded } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { ClamdClient, parseClamdUrl, readVerdict } from "../src/files/clamd";
import { QUARANTINE_DIR, scanPendingFiles } from "../src/files/fileScan";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

/*
 * Malware scan (issue 235) against a stand-in clamd that speaks the real INSTREAM protocol and flags the EICAR test
 * string. The test string is put together at run time so no file in the repository looks like a virus to the
 * developer's own antivirus.
 */
const EICAR = [
  "X5O!P%@AP[4",
  String.fromCharCode(92),
  "PZX54(P^)7CC)7}$",
  "EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
].join("");
const MARKER = "EICAR-STANDARD-ANTIVIRUS-TEST-FILE";

/** A clamd stand-in: INSTREAM with length-prefixed chunks, PING; "FOUND" when the stream holds the EICAR marker. */
function fakeClamd(): Promise<{ server: Server; port: number; scans: () => number }> {
  let count = 0;
  const server = createServer((socket) => {
    let buffer = Buffer.alloc(0);
    socket.on("data", (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.toString("latin1").startsWith("zPING\0")) {
        socket.end("PONG\0");
        return;
      }
      const header = "zINSTREAM\0";
      if (!buffer.toString("latin1").startsWith(header)) return;
      let offset = header.length;
      const body: Buffer[] = [];
      while (offset + 4 <= buffer.length) {
        const size = buffer.readUInt32BE(offset);
        if (size === 0) {
          count += 1;
          const all = Buffer.concat(body).toString("latin1");
          socket.end(
            all.includes(MARKER) ? "stream: Win.Test.EICAR_HDB-1 FOUND\0" : "stream: OK\0",
          );
          return;
        }
        if (offset + 4 + size > buffer.length) return;
        body.push(buffer.subarray(offset + 4, offset + 4 + size));
        offset += 4 + size;
      }
    });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        port: typeof address === "object" && address ? address.port : 0,
        scans: () => count,
      });
    }),
  );
}

describe("clamd client (issue 235)", () => {
  it("reads clamd's answers and the address", () => {
    expect(readVerdict("stream: OK\0")).toEqual({ infected: false });
    expect(readVerdict("stream: Win.Test.EICAR_HDB-1 FOUND\0")).toEqual({
      infected: true,
      signature: "Win.Test.EICAR_HDB-1",
    });
    expect(() => readVerdict("INSTREAM size limit exceeded. ERROR")).toThrow(/Scanner error/);
    expect(parseClamdUrl("tcp://clamav:3310")).toEqual({ host: "clamav", port: 3310 });
    expect(parseClamdUrl("http://clamav:3310")).toBeNull();
    expect(parseClamdUrl(undefined)).toBeNull();
  });

  it("streams a file in chunks and gets a verdict; an unreachable scanner is an error, not a pass", async () => {
    const clamd = await fakeClamd();
    const client = new ClamdClient("127.0.0.1", clamd.port);
    expect(await client.ping()).toBe(true);
    expect(await client.scan(Buffer.alloc(200_000, 65))).toEqual({ infected: false });
    expect(await client.scan(Buffer.from(`%PDF-1.7\n${EICAR}`))).toMatchObject({ infected: true });
    clamd.server.close();
    await expect(new ClamdClient("127.0.0.1", 1, 2_000).scan(Buffer.from("x"))).rejects.toThrow();
  });
});

describe.skipIf(!dbAvailable)("malware scan of customer files (issue 235)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let clamd: Awaited<ReturnType<typeof fakeClamd>>;
  let officer: Record<string, string>;
  let ip = 0;
  const filesDir = mkdtempSync(path.join(tmpdir(), "waafa-scan-"));

  const web = (extra: Record<string, string> = {}) => ({
    "x-intake-key": "test-intake-key-0123456789-abcdef",
    "x-client-ip": `10.8.0.${ip}`,
    ...extra,
  });
  const upload = (body: Buffer, name: string) =>
    app.inject({
      method: "POST",
      url: `/api/v1/public/files?kind=passport-bio&name=${encodeURIComponent(name)}`,
      headers: web({ "content-type": "application/pdf" }),
      payload: body,
    });
  const link = (storageKey: string) =>
    app.inject({
      method: "POST",
      url: "/api/v1/admin/files/link",
      headers: officer,
      payload: { storageKey },
    });

  beforeAll(async () => {
    prisma = testPrisma();
    clamd = await fakeClamd();
    app = await testApp(featureModules({ mailer: new MemoryMailer() }), {
      PRIVATE_FILES_DIR: filesDir,
      CLAMAV_URL: `tcp://127.0.0.1:${clamd.port}`,
    });
  });
  afterAll(async () => {
    await app?.get(NotificationService).idle();
    await app?.close();
    await prisma?.$disconnect();
    clamd?.server.close();
  });
  beforeEach(async () => {
    ip += 1;
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app.get(ContentService).invalidate();
    const user = await prisma.staffUser.create({
      data: {
        name: "Officer",
        email: "officer@example.com",
        passwordHash: "x",
        roles: ["visa-officer"],
      },
    });
    const session = await prisma.staffSession.create({
      data: {
        userId: user.id,
        refreshHash: randomUUID(),
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    const { token } = await signAccessToken(
      {
        sub: user.id,
        sid: session.id,
        name: "Officer",
        email: user.email,
        roles: ["visa-officer"],
      },
      "test-jwt-secret-0123456789-0123456789-abc",
    );
    officer = { authorization: `Bearer ${token}` };
  });

  it("opens a clean file only after the scan, and quarantines the EICAR test file", async () => {
    const clean = (
      await upload(Buffer.from("%PDF-1.7\nA clean document\n%%EOF"), "passport.pdf")
    ).json<CustomerFileUploaded>();
    const bad = (
      await upload(Buffer.from(`%PDF-1.7\n${EICAR}\n%%EOF`), "bad.pdf")
    ).json<CustomerFileUploaded>();
    const lead = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: web({ "idempotency-key": randomUUID() }),
      payload: {
        contact: { name: "Sample Customer", phone: "+8801000000888" },
        consent: true,
        payload: {
          module: "visa",
          countrySlug: "thailand",
          countryName: "Thailand",
          visaType: "tourist",
          travelDate: "2026-12-01",
          applicants: 1,
          documents: [clean, bad].map((file) => ({
            kind: "passport-bio",
            fileName: file.fileName,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            storageKey: file.storageKey,
          })),
        },
      },
    });
    expect(lead.statusCode).toBe(201);
    const leadId = (await prisma.lead.findFirstOrThrow()).id;
    const files = async () =>
      (
        await app.inject({
          method: "GET",
          url: `/api/v1/admin/files?owner=lead&id=${leadId}`,
          headers: officer,
        })
      ).json<Array<{ fileName: string; scan: string }>>();

    // Before the worker's pass: staff see "checking" and can't open either file.
    expect((await files()).map((file) => file.scan)).toEqual(["pending", "pending"]);
    const early = await link(clean.storageKey);
    expect(early.statusCode).toBe(409);
    expect(early.json<{ code: string }>().code).toBe("scanning");

    const pass = await scanPendingFiles(prisma, filesDir, new ClamdClient("127.0.0.1", clamd.port));
    expect(pass).toEqual({ clean: 1, infected: 1, failed: 0 });
    expect(Object.fromEntries((await files()).map((file) => [file.fileName, file.scan]))).toEqual({
      "passport.pdf": "clean",
      "bad.pdf": "infected",
    });
    expect((await link(clean.storageKey)).statusCode).toBe(201);
    const refused = await link(bad.storageKey);
    expect(refused.statusCode).toBe(409);
    expect(refused.json<{ code: string }>().code).toBe("infected");

    // The hit moved into quarantine/ and the audit log names the signature.
    const stored = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: bad.storageKey },
    });
    expect(stored.path.startsWith(`${QUARANTINE_DIR}/`)).toBe(true);
    expect(existsSync(path.join(filesDir, stored.path))).toBe(true);
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "file.infected" } });
    expect(audit.after).toMatchObject({ fileName: "bad.pdf", signature: "Win.Test.EICAR_HDB-1" });

    // Nothing left to scan; a scanner that doesn't answer leaves files waiting, never clean.
    expect(
      await scanPendingFiles(prisma, filesDir, new ClamdClient("127.0.0.1", clamd.port)),
    ).toEqual({
      clean: 0,
      infected: 0,
      failed: 0,
    });
    const later = (
      await upload(Buffer.from("%PDF-1.7\nLater\n%%EOF"), "later.pdf")
    ).json<CustomerFileUploaded>();
    const down = await scanPendingFiles(prisma, filesDir, new ClamdClient("127.0.0.1", 1, 2_000));
    expect(down.failed).toBe(1);
    const waiting = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: later.storageKey },
    });
    expect(waiting.scanStatus).toBe("unscanned");
  });
});

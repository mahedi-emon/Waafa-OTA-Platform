import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { CustomerFileLink, CustomerFileUploaded, Role } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ContentScheduler } from "../src/admin/scheduler.service";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE_KEY = "test-intake-key-0123456789-abcdef";

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]);
const PDF = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(300, 32)]);

const contact = { name: "Sample Customer", phone: "+8801000000777", email: "customer@example.com" };

describe.skipIf(!dbAvailable)("customer files (#232)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let ip = 0;
  let officer: Record<string, string>;
  let editor: Record<string, string>;
  let accounts: Record<string, string>;
  const filesDir = mkdtempSync(path.join(tmpdir(), "waafa-private-"));

  async function person(name: string, roles: Role[]) {
    const user = await prisma.staffUser.create({
      data: { name, email: `${name.toLowerCase()}@example.com`, passwordHash: "x", roles },
    });
    const session = await prisma.staffSession.create({
      data: {
        userId: user.id,
        refreshHash: randomUUID(),
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    const { token } = await signAccessToken(
      { sub: user.id, sid: session.id, name, email: user.email, roles },
      JWT_SECRET,
    );
    return { authorization: `Bearer ${token}` };
  }

  const web = (extra: Record<string, string> = {}) => ({
    "x-intake-key": INTAKE_KEY,
    "x-client-ip": `10.9.0.${ip}`,
    ...extra,
  });

  const upload = (body: Buffer, type: string, kind = "passport-bio", name = "passport.jpg") =>
    app.inject({
      method: "POST",
      url: `/api/v1/public/files?kind=${kind}&name=${encodeURIComponent(name)}`,
      headers: web({ "content-type": type }),
      payload: body,
    });

  const visaLead = (documents: unknown[]) =>
    app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: web({ "idempotency-key": randomUUID() }),
      payload: {
        contact,
        consent: true,
        payload: {
          module: "visa",
          countrySlug: "thailand",
          countryName: "Thailand",
          visaType: "tourist",
          travelDate: "2026-12-01",
          applicants: 1,
          documents,
        },
      },
    });

  const ref = (file: CustomerFileUploaded, kind = "passport-bio") => ({
    kind,
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    storageKey: file.storageKey,
  });

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(featureModules({ mailer: new MemoryMailer() }), {
      PRIVATE_FILES_DIR: filesDir,
    });
  });
  afterAll(async () => {
    await app?.get(NotificationService).idle();
    await app?.close();
    await prisma?.$disconnect();
  });
  beforeEach(async () => {
    ip += 1;
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app.get(ContentService).invalidate();
    officer = await person("Officer", ["visa-officer"]);
    editor = await person("Editor", ["content-editor"]);
    accounts = await person("Accounts", ["accounts"]);
  });

  it("stores a JPEG or PDF privately and refuses other bytes, wrong types and big files", async () => {
    const jpeg = await upload(JPEG, "image/jpeg");
    expect(jpeg.statusCode).toBe(201);
    const stored = jpeg.json<CustomerFileUploaded>();
    expect(stored.storageKey).toMatch(/^cf_[A-Za-z0-9_-]{32}$/);
    expect(stored).toMatchObject({
      fileName: "passport.jpg",
      mimeType: "image/jpeg",
      sizeBytes: JPEG.length,
    });
    const row = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: stored.storageKey },
    });
    expect(row.status).toBe("pending");
    expect(existsSync(path.join(filesDir, row.path))).toBe(true);

    expect((await upload(PDF, "application/pdf", "bank-statement", "bank.pdf")).statusCode).toBe(
      201,
    );
    // A PDF sent as a JPEG, and a script renamed .png, are refused by their bytes.
    expect((await upload(PDF, "image/jpeg")).statusCode).toBe(415);
    expect((await upload(Buffer.from("<script>alert(1)</script>"), "image/png")).statusCode).toBe(
      415,
    );
    expect(
      (await upload(Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)]), "image/jpeg")).statusCode,
    ).toBe(413);
    // Only the web server may upload.
    const anonymous = await app.inject({
      method: "POST",
      url: "/api/v1/public/files?kind=photo&name=a.jpg",
      headers: { "content-type": "image/jpeg" },
      payload: JPEG,
    });
    expect(anonymous.statusCode).toBe(401);
  });

  it("attaches files to the lead that names them and notes the ones that never arrived", async () => {
    const passport = (await upload(JPEG, "image/jpeg")).json<CustomerFileUploaded>();
    const lead = await visaLead([
      ref(passport),
      {
        kind: "photo",
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 10,
        storageKey: `cf_${"x".repeat(32)}`,
      },
    ]);
    expect(lead.statusCode).toBe(201);
    const stored = await prisma.lead.findFirstOrThrow({ include: { activities: true } });
    const file = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: passport.storageKey },
    });
    expect(file).toMatchObject({
      status: "attached",
      ownerType: "lead",
      ownerId: stored.id,
      deleteAfter: null,
    });
    expect(stored.activities.map((activity) => activity.body).join(" ")).toContain(
      "1 file did not arrive (photo.jpg)",
    );
    // A claimed file can't be claimed again by another form.
    await visaLead([ref(passport)]);
    const again = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: passport.storageKey },
    });
    expect(again.ownerId).toBe(stored.id);
  });

  it("gives staff who may see the record a ten-minute signed link and audits the link and the download", async () => {
    const passport = (await upload(JPEG, "image/jpeg")).json<CustomerFileUploaded>();
    await visaLead([ref(passport)]);
    const lead = await prisma.lead.findFirstOrThrow();

    const list = await app.inject({
      method: "GET",
      url: `/api/v1/admin/files?owner=lead&id=${lead.id}`,
      headers: officer,
    });
    expect(list.statusCode).toBe(200);
    expect(list.json<Array<{ storageKey: string }>>()).toHaveLength(1);
    // A content editor has no visa lead access: the file is not found for them.
    const refused = await app.inject({
      method: "POST",
      url: "/api/v1/admin/files/link",
      headers: editor,
      payload: { storageKey: passport.storageKey },
    });
    expect(refused.statusCode).toBe(404);

    const link = await app.inject({
      method: "POST",
      url: "/api/v1/admin/files/link",
      headers: officer,
      payload: { storageKey: passport.storageKey },
    });
    expect(link.statusCode).toBe(201);
    const { token, expiresAt } = link.json<CustomerFileLink>();
    expect(Date.parse(expiresAt) - Date.now()).toBeGreaterThan(9 * 60_000);

    const download = await app.inject({
      method: "GET",
      url: `/api/v1/public/files/signed?token=${token}`,
      headers: web(),
    });
    expect(download.statusCode).toBe(200);
    expect(download.rawPayload.equals(JPEG)).toBe(true);
    expect(download.headers["cache-control"]).toBe("private, no-store");
    expect(download.headers["x-content-type-options"]).toBe("nosniff");
    expect(download.headers["content-security-policy"]).toContain("sandbox");

    const actions = (await prisma.auditLog.findMany({ where: { entity: "CustomerFile" } })).map(
      (entry) => entry.action,
    );
    expect(actions.sort()).toEqual(["file.download", "file.link"]);

    // A tampered or expired token opens nothing; the link needs the intake key too.
    const [id, , staff, signature] = token.split(".");
    const tampered = `${id}.${Date.now() + 3_600_000}.${staff}.${signature}`;
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/api/v1/public/files/signed?token=${tampered}`,
          headers: web(),
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (await app.inject({ method: "GET", url: `/api/v1/public/files/signed?token=${token}` }))
        .statusCode,
    ).toBe(401);
  });

  it("keeps payment-proof slips for accounts staff", async () => {
    const slip = (
      await upload(JPEG, "image/jpeg", "payment-proof", "slip.jpg")
    ).json<CustomerFileUploaded>();
    const proof = await app.inject({
      method: "POST",
      url: "/api/v1/public/payment-proofs",
      headers: web({ "idempotency-key": randomUUID() }),
      payload: {
        reference: "ORD-261010-0042",
        name: "Sample Rahim",
        phone: "+8801712345678",
        amount: 3450,
        accountId: "acc-bkash",
        proof: ref(slip, "payment-proof"),
      },
    });
    expect(proof.statusCode).toBe(201);
    const stored = await prisma.paymentProof.findFirstOrThrow();
    const link = await app.inject({
      method: "POST",
      url: "/api/v1/admin/files/link",
      headers: accounts,
      payload: { storageKey: slip.storageKey },
    });
    expect(link.statusCode).toBe(201);
    const file = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: slip.storageKey },
    });
    expect(file).toMatchObject({ ownerType: "payment-proof", ownerId: stored.id });
  });

  it("deletes unclaimed uploads after six hours and visa documents 90 days after the lead closed", async () => {
    const lonely = (await upload(JPEG, "image/jpeg")).json<CustomerFileUploaded>();
    const kept = (
      await upload(PDF, "application/pdf", "bank-statement", "bank.pdf")
    ).json<CustomerFileUploaded>();
    await visaLead([ref(kept, "bank-statement")]);
    const scheduler = app.get(ContentScheduler);

    const later6h = new Date(Date.now() + 7 * 60 * 60_000);
    expect((await scheduler.tick(later6h)).files).toBe(1);
    const gone = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: lonely.storageKey },
    });
    expect(gone.status).toBe("deleted");
    expect(existsSync(path.join(filesDir, gone.path))).toBe(false);

    const lead = await prisma.lead.findFirstOrThrow();
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "lost", closedAt: new Date() },
    });
    const later = new Date(Date.now() + 91 * 24 * 60 * 60_000);
    expect((await scheduler.tick(later)).files).toBe(1);
    const visa = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: kept.storageKey },
    });
    expect(visa.status).toBe("deleted");
    // Staff still see the row, so they know the file went at retention rather than never arriving.
    const list = await app.inject({
      method: "GET",
      url: `/api/v1/admin/files?owner=lead&id=${lead.id}`,
      headers: officer,
    });
    expect(list.json<Array<{ status: string; deletedAt: string | null }>>()).toEqual([
      expect.objectContaining({ status: "deleted", deletedAt: expect.any(String) }),
    ]);
  });

  it("caps what one visitor may hold before sending a form", async () => {
    const big = Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024 - JPEG.length - 16, 3)]);
    for (let index = 0; index < 8; index += 1) {
      expect((await upload(big, "image/jpeg")).statusCode).toBe(201);
    }
    const refused = await upload(big, "image/jpeg");
    expect(refused.statusCode).toBe(429);
    // Another visitor is not affected.
    ip += 1;
    expect((await upload(JPEG, "image/jpeg")).statusCode).toBe(201);
  });

  it("claims a file only as the type the form names", async () => {
    const pdf = (
      await upload(PDF, "application/pdf", "photo", "trip.pdf")
    ).json<CustomerFileUploaded>();
    const feedback = await app.inject({
      method: "POST",
      url: "/api/v1/public/feedback",
      headers: web({ "idempotency-key": randomUUID() }),
      payload: {
        name: "Sample Karim",
        phone: "+8801812345678",
        service: "flights",
        comment: "Helpful team.",
        consentToPublish: false,
        photo: {
          fileName: "trip.jpg",
          mimeType: "image/jpeg",
          sizeBytes: pdf.sizeBytes,
          storageKey: pdf.storageKey,
        },
      },
    });
    expect(feedback.statusCode).toBe(201);
    const file = await prisma.customerFile.findUniqueOrThrow({
      where: { storageKey: pdf.storageKey },
    });
    expect(file.status).toBe("pending");
  });

  it("serves PDFs without the sandbox Chrome's viewer refuses, images sandboxed", async () => {
    const statement = (
      await upload(PDF, "application/pdf", "bank-statement", "bank.pdf")
    ).json<CustomerFileUploaded>();
    await visaLead([ref(statement, "bank-statement")]);
    const link = await app.inject({
      method: "POST",
      url: "/api/v1/admin/files/link",
      headers: officer,
      payload: { storageKey: statement.storageKey },
    });
    const download = await app.inject({
      method: "GET",
      url: `/api/v1/public/files/signed?token=${link.json<CustomerFileLink>().token}`,
      headers: web(),
    });
    expect(download.statusCode).toBe(200);
    expect(download.headers["content-type"]).toBe("application/pdf");
    expect(download.headers["content-security-policy"]).not.toContain("sandbox");
    expect(download.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});

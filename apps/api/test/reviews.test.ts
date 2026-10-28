import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { PublicReviews, Role } from "@waafa/shared";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { openSession } from "../src/customers/customerAuth";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const PACKAGE = "pkg-review-test";
const PRODUCT = "prod-review-test";

describe.skipIf(!dbAvailable)("reviews, questions and feedback photos (issue 245)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let editor: { authorization: string };
  let agent: { authorization: string };
  let buyer: string;
  let stranger: string;
  let ip = 0;
  const root = mkdtempSync(path.join(tmpdir(), "waafa-reviews-"));

  async function staff(name: string, roles: Role[]) {
    const user = await prisma.staffUser.create({
      data: { name, email: `${randomUUID()}@example.com`, passwordHash: "x", roles },
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

  const publicCall = (method: string, url: string, token?: string, payload?: unknown) => {
    ip += 1;
    return app.inject({
      method: method as "GET",
      url: `/api/v1/public${url}`,
      headers: {
        ...INTAKE,
        "x-client-ip": `10.24.5.${ip}`,
        ...(token ? { "x-customer-session": token } : {}),
      },
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });
  };

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    mkdirSync(path.join(root, "media"));
    mkdirSync(path.join(root, "private"));
    app = await testApp(featureModules({ mailer: new MemoryMailer() }), {
      MEDIA_DIR: path.join(root, "media"),
      PRIVATE_FILES_DIR: path.join(root, "private"),
    });
    app.get(ContentService).invalidate();
    editor = await staff("Sample Editor", ["content-editor"]);
    agent = await staff("Sample Accounts", ["accounts"]);
    const customer = await prisma.customer.create({
      data: { email: "buyer@example.com", name: "Karim Uddin", emailVerifiedAt: new Date() },
    });
    buyer = (await openSession(prisma, customer, undefined)).token;
    const other = await prisma.customer.create({
      data: { email: "other@example.com", name: "Other Person", emailVerifiedAt: new Date() },
    });
    stranger = (await openSession(prisma, other, undefined)).token;
    await prisma.lead.create({
      data: {
        reference: "PKG-261101-0901",
        module: "packages",
        status: "booked",
        name: "Karim Uddin",
        phone: "+8801700024501",
        contact: {},
        payload: { module: "packages", packageId: PACKAGE },
        source: {},
        summary: "Package",
        customerId: customer.id,
      },
    });
    await prisma.order.create({
      data: {
        reference: "WS-261101-0901",
        status: "placed",
        name: "Karim Uddin",
        phone: "+8801700024501",
        items: [
          {
            productId: PRODUCT,
            variantId: "v",
            title: "Thing",
            sku: "S",
            unitPrice: 100,
            quantity: 1,
          },
        ],
        subtotal: 100,
        discount: 0,
        delivery: 0,
        total: 100,
        address: {},
        payment: { method: "cod" },
        customerId: customer.id,
      } as never,
    });
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
    rmSync(root, { recursive: true, force: true });
  });

  it("takes a review only from a customer who booked the package, once, and shows it after approval", async () => {
    const review = {
      kind: "package",
      targetId: PACKAGE,
      rating: 5,
      body: "<b>Lovely trip</b>, well organised.",
    };
    expect((await publicCall("POST", "/account/reviews", undefined, review)).statusCode).toBe(401);
    expect((await publicCall("POST", "/account/reviews", stranger, review)).statusCode).toBe(403);
    expect(
      (await publicCall("POST", "/account/reviews", buyer, { ...review, rating: 6 })).statusCode,
    ).toBe(422);
    const sent = await publicCall("POST", "/account/reviews", buyer, review);
    expect(sent.statusCode, sent.body).toBe(201);
    expect((await publicCall("POST", "/account/reviews", buyer, review)).statusCode).toBe(409);

    // Nothing public until approved.
    expect((await publicCall("GET", "/reviews")).json<PublicReviews>().reviews).toEqual([]);
    const queue = await app.inject({
      method: "GET",
      url: "/api/v1/admin/reviews",
      headers: editor,
    });
    const id = queue.json<{ reviews: Array<{ id: string; proof: string }> }>().reviews[0]!;
    expect(id.proof).toBe("PKG-261101-0901");
    expect(
      (await app.inject({ method: "GET", url: "/api/v1/admin/reviews", headers: agent }))
        .statusCode,
    ).toBe(403);
    const decided = await app.inject({
      method: "POST",
      url: `/api/v1/admin/reviews/${id.id}/decide`,
      headers: editor,
      payload: { status: "approved", reply: "Thank you, Karim!" },
    });
    expect(decided.statusCode, decided.body).toBe(200);
    const shown = (await publicCall("GET", "/reviews")).json<PublicReviews>().reviews;
    expect(shown).toEqual([
      expect.objectContaining({
        name: "Karim U.",
        rating: 5,
        body: "<b>Lovely trip</b>, well organised.",
        reply: "Thank you, Karim!",
      }),
    ]);
    expect(await prisma.auditLog.count({ where: { action: "review.moderate" } })).toBe(1);
  });

  it("waits for delivery before a product review", async () => {
    const review = {
      kind: "product",
      targetId: PRODUCT,
      rating: 4,
      body: "Works well on our printer.",
    };
    expect((await publicCall("POST", "/account/reviews", buyer, review)).statusCode).toBe(403);
    await prisma.order.updateMany({
      where: { reference: "WS-261101-0901" },
      data: { status: "delivered" },
    });
    const eligible = await publicCall(
      "GET",
      `/account/reviews/eligibility?kind=product&targetId=${PRODUCT}`,
      buyer,
    );
    expect(eligible.json()).toEqual({ signedIn: true, eligible: true, reviewed: false });
    expect((await publicCall("POST", "/account/reviews", buyer, review)).statusCode).toBe(201);
  });

  it("shows a product question only once staff answer it", async () => {
    const products = await app.get(ContentService).collection("products");
    const productId = products[0]!.id;
    const asked = await publicCall("POST", "/questions", undefined, {
      productId,
      name: "Rafiq Hasan",
      question: "Does it fit the HP 1020?",
    });
    expect(asked.statusCode, asked.body).toBe(201);
    expect((await publicCall("GET", "/reviews")).json<PublicReviews>().questions).toEqual([]);
    const queue = await app.inject({
      method: "GET",
      url: "/api/v1/admin/reviews",
      headers: editor,
    });
    const question = queue.json<{ questions: Array<{ id: string }> }>().questions[0]!;
    const answered = await app.inject({
      method: "POST",
      url: `/api/v1/admin/reviews/questions/${question.id}`,
      headers: editor,
      payload: { status: "published", answer: "Yes, it fits the HP LaserJet 1020." },
    });
    expect(answered.statusCode, answered.body).toBe(200);
    expect((await publicCall("GET", "/reviews")).json<PublicReviews>().questions).toEqual([
      expect.objectContaining({
        productId,
        name: "Rafiq H.",
        answer: "Yes, it fits the HP LaserJet 1020.",
      }),
    ]);
    expect(
      (
        await publicCall("POST", "/questions", undefined, {
          productId: "nope",
          name: "X Y",
          question: "Hello there",
        })
      ).statusCode,
    ).toBe(404);
  });

  it("publishes an approved feedback photo as a library copy; a pending one stays private", async () => {
    const jpeg = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 30, g: 120, b: 200 } },
    })
      .jpeg()
      .toBuffer();
    writeFileSync(path.join(root, "private", "fb.jpg"), jpeg);
    await prisma.customerFile.create({
      data: {
        storageKey: "fb-photo-key-0001",
        kind: "photo",
        fileName: "trip.jpg",
        mimeType: "image/jpeg",
        sizeBytes: jpeg.byteLength,
        sha256: "x",
        path: "fb.jpg",
        status: "attached",
        ownerType: "feedback",
        scanStatus: "clean",
      },
    });
    const feedback = await prisma.feedback.create({
      data: {
        name: "Nadia Islam",
        phone: "+8801700024502",
        service: "packages",
        comment: "Great team",
        consentToPublish: true,
        photo: { storageKey: "fb-photo-key-0001", fileName: "trip.jpg" },
      },
    });
    app.get(ContentService).invalidate();
    const before = (await app.get(ContentService).snapshot()).body as {
      feedback: Array<{ photo?: unknown }>;
    };
    expect(
      before.feedback.find((item) => (item as { id?: string }).id === feedback.id),
    ).toBeUndefined();
    const moderated = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/feedback/${feedback.id}`,
      headers: editor,
      payload: { status: "approved" },
    });
    expect(moderated.statusCode, moderated.body).toBe(200);
    app.get(ContentService).invalidate();
    const after = (await app.get(ContentService).snapshot()).body as {
      feedback: Array<{ id: string; photo?: { src: string } }>;
    };
    const shown = after.feedback.find((item) => item.id === feedback.id);
    expect(shown?.photo?.src).toMatch(/^\/uploads\/\d{4}\/\d{2}\/.+\.webp$/);
  });
});

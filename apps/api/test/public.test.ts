import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const INTAKE_KEY = "test-intake-key-0123456789-abcdef";
const STAFF = "desk@example.com";

const contact = { name: "Sample Customer", phone: "+8801000000101", email: "customer@example.com" };
const flight = {
  module: "flights",
  search: {
    tripType: "one-way",
    legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
    travellers: { adults: 1, childAges: [], infants: 0 },
    cabin: "economy",
  },
};
const address = {
  name: "Sample Rahim",
  phone: "+8801712345678",
  email: "rahim@example.com",
  division: "Dhaka",
  district: "Dhaka",
  area: "Motijheel",
  street: "House 4, Road 2",
};

describe.skipIf(!dbAvailable)("public intake (B3)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  const mailer = new MemoryMailer();
  let ip = 0;

  /** Each test posts from its own visitor address, so the per-visitor limits never interfere. */
  const headers = (extra: Record<string, string> = {}) => ({
    "x-intake-key": INTAKE_KEY,
    "x-client-ip": `10.1.0.${ip}`,
    ...extra,
  });
  const post = (url: string, payload: unknown, key: string | null = randomUUID()) =>
    app.inject({
      method: "POST",
      url: `/api/v1/public/${url}`,
      headers: headers(key ? { "idempotency-key": key } : {}),
      payload: payload as Record<string, unknown>,
    });

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(featureModules({ mailer }), { STAFF_ALERT_EMAIL: STAFF });
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    ip += 1;
    mailer.sent.length = 0;
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app.get(ContentService).invalidate();
  });

  it("refuses callers without the intake key", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/public/snapshot" });
    expect(response.statusCode).toBe(401);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    const wrong = await app.inject({
      method: "GET",
      url: "/api/v1/public/snapshot",
      headers: { "x-intake-key": "not-the-key-but-long-enough-000" },
    });
    expect(wrong.statusCode).toBe(401);
  });

  it("serves the snapshot with an ETag and answers 304 when nothing changed", async () => {
    const first = await app.inject({
      method: "GET",
      url: "/api/v1/public/snapshot",
      headers: headers(),
    });
    expect(first.statusCode).toBe(200);
    const etag = first.headers.etag as string;
    expect(etag).toMatch(/^"[0-9a-f]{40}"$/);
    const body = first.json<Record<string, unknown[]>>();
    expect(body.products?.length).toBeGreaterThan(0);
    expect(body.orders).toEqual([]);
    expect(body.leads).toEqual([]);
    expect(body.feedback).toEqual([]);

    const again = await app.inject({
      method: "GET",
      url: "/api/v1/public/snapshot",
      headers: headers({ "if-none-match": etag }),
    });
    expect(again.statusCode).toBe(304);
    expect(again.body).toBe("");
  });

  it("creates a lead with a day reference, replays a repeated key and flags a duplicate", async () => {
    const key = randomUUID();
    const lead = { contact, payload: flight, consent: true };
    const first = await post("leads", lead, key);
    expect(first.statusCode).toBe(201);
    const created = first.json<{ reference: string; createdAt: string }>();
    expect(created.reference).toMatch(/^FLT-\d{6}-0001$/);
    expect(created.createdAt).toMatch(/\+06:00$/);

    const replay = await post("leads", lead, key);
    expect(replay.statusCode).toBe(201);
    expect(replay.headers["idempotent-replayed"]).toBe("true");
    expect(replay.json<{ reference: string }>().reference).toBe(created.reference);
    expect(await prisma.lead.count()).toBe(1);

    const second = await post("leads", lead);
    expect(second.json<{ reference: string }>().reference).toMatch(/-0002$/);
    const stored = await prisma.lead.findUniqueOrThrow({
      where: { reference: second.json<{ reference: string }>().reference },
      include: { activities: true },
    });
    expect(stored.duplicateOfId).not.toBeNull();
    expect(stored.summary).toContain("DAC");
    expect(stored.activities[0]?.body).toContain(created.reference);

    await vi.waitFor(() => expect(mailer.sent.length).toBe(4));
    expect(mailer.sent.map((mail) => mail.to).sort()).toEqual([
      "customer@example.com",
      "customer@example.com",
      STAFF,
      STAFF,
    ]);
    const alert = mailer.sent.find((mail) => mail.to === STAFF);
    expect(alert?.subject).toContain(created.reference);
    expect(alert?.text).toContain("http://localhost:3000/admin/leads/");
  });

  it("needs an Idempotency-Key and rejects unknown fields with a problem listing them", async () => {
    const noKey = await post("leads", { contact, payload: flight, consent: true }, null);
    expect(noKey.statusCode).toBe(400);
    expect(noKey.json<{ code: string }>().code).toBe("idempotency-key");

    const extra = await post("leads", { contact, payload: flight, consent: true, admin: true });
    expect(extra.statusCode).toBe(422);
    const problem = extra.json<{ title: string; requestId: string; fields: unknown[] }>();
    expect(problem.title).toBe("Validation failed");
    expect(problem.requestId).toBeTruthy();
    expect(problem.fields.length).toBeGreaterThan(0);
  });

  it("prices an order on the server, takes the stock and tracks it by number and phone", async () => {
    const response = await post("orders", {
      lines: [{ variantId: "bd-w1510a", quantity: 2 }],
      address,
      payment: { method: "cod" },
    });
    expect(response.statusCode).toBe(201);
    const order = response.json<{ reference: string; total: number }>();
    expect(order.reference).toMatch(/^ORD-\d{6}-0001$/);
    // 2 × ৳2,150 = ৳4,300, over the free delivery threshold (৳3,000).
    expect(order.total).toBe(4300);

    const product = await prisma.contentDocument.findUniqueOrThrow({
      where: {
        collection_docId: {
          collection: "products",
          docId: "better-day-hp-151a-w1510a-black-toner",
        },
      },
    });
    const variant = (
      product.data as { variants: Array<{ id: string; stock: number }> }
    ).variants.find((item) => item.id === "bd-w1510a");
    expect(variant?.stock).toBe(1);

    const tracked = await post(
      "orders/track",
      { reference: order.reference.toLowerCase(), phone: "01712-345678" },
      null,
    );
    expect(tracked.statusCode).toBe(200);
    expect(tracked.json<{ status: string; history: unknown[] }>()).toMatchObject({
      status: "placed",
    });
    const wrongPhone = await post(
      "orders/track",
      { reference: order.reference, phone: "01999000000" },
      null,
    );
    expect(wrongPhone.statusCode).toBe(404);

    await vi.waitFor(() => expect(mailer.sent.length).toBe(2));
    expect(mailer.sent.find((mail) => mail.to === STAFF)?.text).toContain("cash on delivery");
  });

  it("refuses an order the stock can't cover, and lets the same key try again after a fix", async () => {
    const key = randomUUID();
    const tooMany = await post(
      "orders",
      { lines: [{ variantId: "bd-w1510a", quantity: 5 }], address, payment: { method: "cod" } },
      key,
    );
    expect(tooMany.statusCode).toBe(409);
    expect(tooMany.json<{ code: string; quote: { ready: boolean } }>()).toMatchObject({
      code: "changed",
      quote: { ready: false },
    });
    const fixed = await post(
      "orders",
      { lines: [{ variantId: "bd-w1510a", quantity: 3 }], address, payment: { method: "cod" } },
      key,
    );
    expect(fixed.statusCode).toBe(201);
    expect(await prisma.order.count()).toBe(1);
  });

  it("sells the last item once when two orders race for it", async () => {
    const order = {
      lines: [{ variantId: "tee-nvy-xl", quantity: 2 }],
      address,
      payment: { method: "cod" },
    };
    const [a, b] = await Promise.all([post("orders", order), post("orders", order)]);
    expect([a.statusCode, b.statusCode].sort()).toEqual([201, 409]);
    expect(await prisma.order.count()).toBe(1);
  });

  it("stores feedback as pending and keeps it off the public wall until approved", async () => {
    const response = await post("feedback", {
      name: "Sample Karim",
      phone: "+8801812345678",
      service: "flights",
      rating: 5,
      comment: "The team found a better fare and called back within the hour.",
      consentToPublish: true,
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ firstName: "Sample" });
    const stored = await prisma.feedback.findFirstOrThrow();
    expect(stored.status).toBe("pending");

    const before = await app.inject({
      method: "GET",
      url: "/api/v1/public/snapshot",
      headers: headers(),
    });
    expect(before.json<{ feedback: unknown[] }>().feedback).toEqual([]);

    // Moderation (B4) approves it and drops the cached snapshot.
    await prisma.feedback.update({ where: { id: stored.id }, data: { status: "approved" } });
    app.get(ContentService).invalidate();
    const after = await app.inject({
      method: "GET",
      url: "/api/v1/public/snapshot",
      headers: headers(),
    });
    const wall = after.json<{ feedback: Array<Record<string, unknown>> }>().feedback;
    expect(wall).toHaveLength(1);
    expect(wall[0]).toMatchObject({ name: "Sample Karim", rating: 5, contact: "private" });
    expect(JSON.stringify(wall)).not.toContain("8801812345678");
  });

  it("stores a payment proof and alerts accounts", async () => {
    const response = await post("payment-proofs", {
      reference: "ORD-261010-0042",
      name: "Sample Rahim",
      phone: "+8801712345678",
      amount: 3450,
      accountId: "acc-bkash",
      transactionId: "8N7A6B5C4D",
    });
    expect(response.statusCode).toBe(201);
    expect(response.json<{ reference: string }>().reference).toBe("ORD-261010-0042");
    await vi.waitFor(() => expect(mailer.sent.length).toBe(1));
    expect(mailer.sent[0]?.text).toContain("8N7A6B5C4D");
    expect(mailer.sent[0]?.text).toContain("bKash");
  });

  it("logs searches and newsletter sign-ups", async () => {
    const logged = await post(
      "search-logs",
      {
        module: "flights",
        summary: "DAC → DXB",
        params: { from: "DAC", to: "DXB" },
        device: "phone",
        source: "home",
      },
      null,
    );
    expect(logged.statusCode).toBe(204);
    expect(await prisma.searchLog.count()).toBe(1);

    for (const email of ["News@Example.com", "news@example.com"]) {
      const subscribed = await post("subscribers", { email, source: "footer" }, null);
      expect(subscribed.statusCode).toBe(204);
    }
    expect(await prisma.subscriber.count()).toBe(1);
  });

  it("publishes the OpenAPI document outside production", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/openapi.json" });
    expect(response.statusCode).toBe(200);
    const document = response.json<{ openapi: string; paths: Record<string, unknown> }>();
    expect(document.openapi).toBe("3.1.0");
    expect(Object.keys(document.paths)).toContain("/api/v1/public/orders");
  });
});

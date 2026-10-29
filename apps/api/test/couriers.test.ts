import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ContentScheduler } from "../src/admin/scheduler.service";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const PROVIDER_SECRET_KEY = "test-provider-secret-key-0123456789-abcdef";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };

type Person = { headers: { authorization: string } };

/** A fake Steadfast: what was booked, and the status the test sets per invoice. */
const booked: Array<Record<string, unknown>> = [];
const statuses = new Map<string, string>();
let refuse = false;

describe.skipIf(!dbAvailable)("courier booking and tracking (issue 253)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let owner: Person;
  let shop: Person;
  let accounts: Person;
  let ip = 0;

  async function person(name: string, roles: Role[]): Promise<Person> {
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
    return { headers: { authorization: `Bearer ${token}` } };
  }

  const admin = (who: Person, method: "GET" | "POST", url: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/api/v1/admin${url}`,
      headers: who.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  /** A cash-on-delivery order, confirmed on the phone. */
  async function confirmedOrder() {
    ip += 1;
    const placed = await app.inject({
      method: "POST",
      url: "/api/v1/public/orders",
      headers: { ...INTAKE, "x-client-ip": `10.28.0.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        lines: [{ variantId: "pb-20k-blk", quantity: 1 }],
        address: {
          name: "Sample Rahim",
          phone: "+8801712345678",
          division: "Dhaka",
          district: "Dhaka",
          area: "Motijheel",
          street: "House 4, Road 2",
        },
        payment: { method: "cod" },
      },
    });
    expect(placed.statusCode, placed.body).toBe(201);
    const { reference, total } = placed.json<{ reference: string; total: number }>();
    const order = await prisma.order.findUniqueOrThrow({ where: { reference } });
    const confirmed = await admin(shop, "POST", `/orders/${order.id}/actions`, {
      type: "confirm",
      by: "call",
    });
    expect(confirmed.statusCode, confirmed.body).toBe(200);
    return { id: order.id, reference, total };
  }

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(
      featureModules({
        mailer: new MemoryMailer(),
        fetcher: async (url, init) => {
          if (url.startsWith("https://portal.packzy.test/api/v1")) {
            const headers = init.headers as Record<string, string>;
            if (refuse || headers["Api-Key"] !== "sf-key")
              return { status: 401, json: async () => ({ message: "Unauthorized" }) };
            if (url.endsWith("/create_order")) {
              const body = JSON.parse(String(init.body)) as Record<string, unknown>;
              booked.push(body);
              return {
                status: 200,
                json: async () => ({
                  status: 200,
                  consignment: {
                    consignment_id: 1424107,
                    invoice: body.invoice,
                    tracking_code: `SF${booked.length}TRACK`,
                    status: "in_review",
                  },
                }),
              };
            }
            if (url.includes("/status_by_invoice/")) {
              const invoice = decodeURIComponent(url.split("/").pop() ?? "");
              return {
                status: 200,
                json: async () => ({
                  status: 200,
                  delivery_status: statuses.get(invoice) ?? "pending",
                }),
              };
            }
            if (url.endsWith("/get_balance"))
              return { status: 200, json: async () => ({ status: 200, current_balance: 500 }) };
          }
          return { status: 200 };
        },
      }),
      { PROVIDER_SECRET_KEY },
    );
    owner = await person("Owner", ["super-admin"]);
    shop = await person("Shop", ["shop-manager"]);
    accounts = await person("Accounts", ["accounts"]);
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("offers no courier and refuses booking while Steadfast is off", async () => {
    expect((await admin(shop, "GET", "/couriers")).json()).toEqual({ couriers: [] });
    const order = await confirmedOrder();
    const refused = await admin(shop, "POST", `/orders/${order.id}/courier`, {
      courier: "steadfast",
    });
    expect(refused.statusCode).toBe(409);
    expect(refused.json<{ detail: string }>().detail).toContain("Admin › Integrations");
  });

  it("tests the Steadfast card with the keys and turns it on", async () => {
    const keys = {
      settings: { baseUrl: "https://portal.packzy.test/api/v1", apiKey: "wrong" },
      secrets: { secretKey: "sf-secret" },
    };
    expect((await admin(owner, "POST", "/providers/steadfast/production", keys)).statusCode).toBe(
      200,
    );
    const failed = await admin(owner, "POST", "/providers/steadfast/production/test");
    expect(failed.json()).toMatchObject({
      health: { ok: false, message: "Steadfast does not accept this API key and Secret key." },
    });
    keys.settings.apiKey = "sf-key";
    expect((await admin(owner, "POST", "/providers/steadfast/production", keys)).statusCode).toBe(
      200,
    );
    const passed = await admin(owner, "POST", "/providers/steadfast/production/test");
    expect(passed.json()).toMatchObject({
      health: { ok: true, message: expect.stringContaining("500.00") },
    });
    expect(
      (await admin(owner, "POST", "/providers/steadfast/setting", { isActive: true, isLive: true }))
        .statusCode,
    ).toBe(200);
    expect((await admin(shop, "GET", "/couriers")).json()).toEqual({ couriers: ["steadfast"] });
  });

  it("books the parcel with the cash to collect and ships the order with the tracking code", async () => {
    const order = await confirmedOrder();
    expect(
      (await admin(accounts, "POST", `/orders/${order.id}/courier`, { courier: "steadfast" }))
        .statusCode,
    ).toBe(403);
    const shipped = await admin(shop, "POST", `/orders/${order.id}/courier`, {
      courier: "steadfast",
    });
    expect(shipped.statusCode, shipped.body).toBe(200);
    expect(booked.at(-1)).toMatchObject({
      invoice: order.reference,
      recipient_name: "Sample Rahim",
      recipient_phone: "01712345678",
      recipient_address: "House 4, Road 2, Motijheel, Dhaka, Dhaka",
      cod_amount: order.total,
    });
    const after = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { history: true },
    });
    expect(after.status).toBe("shipped");
    expect(after.history.find((event) => event.status === "shipped")).toMatchObject({
      courier: "Steadfast",
      trackingNumber: expect.stringMatching(/^SF\d+TRACK$/),
    });
    // A shipped order is not booked twice.
    expect(
      (await admin(shop, "POST", `/orders/${order.id}/courier`, { courier: "steadfast" }))
        .statusCode,
    ).toBe(409);
  });

  it("says the courier's refusal in one sentence and leaves the order as it was", async () => {
    const order = await confirmedOrder();
    refuse = true;
    const refused = await admin(shop, "POST", `/orders/${order.id}/courier`, {
      courier: "steadfast",
    });
    refuse = false;
    expect(refused.statusCode).toBe(409);
    expect(refused.json<{ detail: string }>().detail).toBe(
      "Steadfast does not accept this API key and Secret key.",
    );
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
      "confirmed",
    );
  });

  it("writes the courier's status once and marks the order delivered (minute job)", async () => {
    const order = await confirmedOrder();
    await admin(shop, "POST", `/orders/${order.id}/courier`, { courier: "steadfast" });
    statuses.set(order.reference, "hold");
    const scheduler = app.get(ContentScheduler);
    const later = (minutes: number) => new Date(Date.now() + minutes * 60_000);
    expect((await scheduler.tick(later(31))).couriers).toBeGreaterThan(0);
    expect((await scheduler.tick(later(62))).couriers).toBe(0);
    const notes = await prisma.orderEvent.findMany({
      where: { orderId: order.id },
      select: { note: true },
    });
    expect(
      notes.filter((event) => event.note === "Steadfast: On hold at the courier"),
    ).toHaveLength(1);
    statuses.set(order.reference, "delivered");
    await scheduler.tick(later(93));
    const done = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(done).toMatchObject({ status: "delivered", paymentVerified: true });
  });

  it("takes the webhook only with the right token", async () => {
    const order = await confirmedOrder();
    await admin(shop, "POST", `/orders/${order.id}/courier`, { courier: "steadfast" });
    const token = (await admin(owner, "GET", "/providers/steadfast/webhook-token")).json<{
      token: string;
    }>().token;
    expect(token).toMatch(/^[\w-]{40}$/);
    expect((await admin(shop, "GET", "/providers/steadfast/webhook-token")).statusCode).toBe(403);
    const hook = (value: string, payload: Record<string, unknown>) =>
      app.inject({
        method: "POST",
        url: "/api/v1/public/couriers/steadfast/webhook",
        headers: { ...INTAKE, "x-courier-token": value },
        payload,
      });
    expect(
      (
        await hook("wrong-token-wrong-token-wrong-token-1234", {
          invoice: order.reference,
          status: "delivered",
        })
      ).statusCode,
    ).toBe(401);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
      "shipped",
    );
    const ok = await hook(token, {
      notification_type: "delivery_status",
      invoice: order.reference,
      status: "delivered",
    });
    expect(ok.statusCode).toBe(200);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
      "delivered",
    );
    // An unknown invoice is acknowledged, so the courier stops retrying.
    expect(
      (await hook(token, { invoice: "ORD-000000-0000", status: "delivered" })).statusCode,
    ).toBe(200);
  });
});

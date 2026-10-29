import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
const PHONE = "+8801712345678";

type Person = { headers: { authorization: string } };

/** A fake SSLCommerz: what it says about each val_id is set by the test. */
const validations = new Map<string, Record<string, string>>();

describe.skipIf(!dbAvailable)("online payment (issue 251)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let owner: Person;
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

  const admin = (who: Person, method: string, url: string, payload?: unknown) =>
    app.inject({
      method: method as "POST",
      url: `/api/v1/admin${url}`,
      headers: who.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });
  const publicCall = (url: string, payload: unknown, extra: Record<string, string> = {}) => {
    ip += 1;
    return app.inject({
      method: "POST",
      url: `/api/v1/public${url}`,
      headers: { ...INTAKE, "x-client-ip": `10.26.0.${ip}`, ...extra },
      payload: payload as Record<string, unknown>,
    });
  };

  async function order(gateway = "sslcommerz") {
    const response = await publicCall(
      "/orders",
      {
        lines: [{ variantId: "pb-20k-blk", quantity: 1 }],
        address: {
          name: "Sample Rahim",
          phone: PHONE,
          division: "Dhaka",
          district: "Dhaka",
          area: "Motijheel",
          street: "House 4, Road 2",
        },
        payment: { method: "online", gateway },
      },
      { "idempotency-key": randomUUID() },
    );
    return response;
  }

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(
      featureModules({
        mailer: new MemoryMailer(),
        fetcher: async (url, init) => {
          if (url.includes("/gwprocess/v4/api.php")) {
            const form = new URLSearchParams(String(init.body));
            return {
              status: 200,
              json: async () => ({
                status: "SUCCESS",
                GatewayPageURL: `https://sandbox.sslcommerz.com/pay/${form.get("tran_id")}`,
              }),
            };
          }
          if (url.includes("/validator/")) {
            const valId = new URL(url).searchParams.get("val_id") ?? "";
            return {
              status: 200,
              json: async () => validations.get(valId) ?? { status: "INVALID_TRANSACTION" },
            };
          }
          return { status: 200 };
        },
      }),
      { PROVIDER_SECRET_KEY },
    );
    owner = await person("Owner", ["super-admin"]);
    accounts = await person("Accounts", ["accounts"]);
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("offers nothing and refuses online orders until the gateway is live with live keys", async () => {
    const status = await app.inject({
      method: "GET",
      url: "/api/v1/public/integrations/status",
      headers: INTAKE,
    });
    expect(status.json()).toMatchObject({ payment: { gateways: [] } });
    const refused = await order();
    expect(refused.statusCode).toBe(409);

    const keys = {
      settings: { baseUrl: "https://sandbox.sslcommerz.com", storeId: "waafa01" },
      secrets: { storePassword: "store-pass-1234" },
    };
    expect((await admin(owner, "POST", "/providers/sslcommerz/sandbox", keys)).statusCode).toBe(
      200,
    );
    expect(
      (
        await admin(owner, "POST", "/providers/sslcommerz/setting", {
          isActive: true,
          isLive: false,
        })
      ).statusCode,
    ).toBe(200);
    // Sandbox mode never takes a customer's money.
    expect((await order()).statusCode).toBe(409);
    expect((await admin(owner, "POST", "/providers/sslcommerz/production", keys)).statusCode).toBe(
      200,
    );
    expect(
      (
        await admin(owner, "POST", "/providers/sslcommerz/setting", {
          isActive: true,
          isLive: true,
        })
      ).statusCode,
    ).toBe(200);
    const live = await app.inject({
      method: "GET",
      url: "/api/v1/public/integrations/status",
      headers: INTAKE,
    });
    expect(live.json()).toMatchObject({ payment: { gateways: ["sslcommerz"] } });
  });

  it("starts the gateway only for the order's own phone, and marks it paid once after validation", async () => {
    const placed = await order();
    expect(placed.statusCode, placed.body).toBe(201);
    const { reference, total } = placed.json<{ reference: string; total: number }>();
    expect(
      (await publicCall("/payments/start", { reference, phone: "+8801700000000" })).statusCode,
    ).toBe(404);
    const started = await publicCall("/payments/start", { reference, phone: PHONE });
    expect(started.statusCode, started.body).toBe(200);
    expect(started.json()).toEqual({
      redirectUrl: `https://sandbox.sslcommerz.com/pay/${reference}_1`,
    });

    // A forged success with no validation behind it changes nothing.
    const forged = await publicCall("/payments/sslcommerz/confirm", {
      event: "success",
      params: {
        val_id: "forged",
        tran_id: `${reference}_1`,
        status: "VALID",
        amount: String(total),
      },
    });
    expect(forged.json()).toMatchObject({ outcome: "failed" });
    // A valid payment of the wrong amount is noted for staff, not accepted.
    validations.set("short", {
      status: "VALID",
      tran_id: `${reference}_1`,
      currency_amount: "10.00",
      currency_type: "BDT",
    });
    expect(
      (
        await publicCall("/payments/sslcommerz/confirm", {
          event: "ipn",
          params: { val_id: "short" },
        })
      ).json(),
    ).toMatchObject({
      outcome: "failed",
    });
    validations.set("good", {
      status: "VALID",
      tran_id: `${reference}_1`,
      currency_amount: `${total}.00`,
      currency_type: "BDT",
      bank_tran_id: "BANK77",
    });
    for (const event of ["ipn", "success"]) {
      const confirmed = await publicCall("/payments/sslcommerz/confirm", {
        event,
        params: { val_id: "good" },
      });
      expect(confirmed.json()).toEqual({ reference, outcome: "paid" });
    }
    const row = await prisma.order.findUniqueOrThrow({
      where: { reference },
      include: { history: true },
    });
    expect(row.paymentVerified).toBe(true);
    expect(row.status).toBe("confirmed");
    expect(row.payment).toMatchObject({
      method: "online",
      gateway: "sslcommerz",
      transactionId: "BANK77",
    });
    expect(row.history.filter((event) => event.note?.startsWith("Paid online"))).toHaveLength(1);
    expect(row.history.some((event) => event.note?.includes("doesn't match the total"))).toBe(true);
    expect((await publicCall("/payments/start", { reference, phone: PHONE })).statusCode).toBe(409);

    // Refunds made in the gateway's panel are recorded by Accounts, never past the total.
    const refund = (amount: number) =>
      admin(accounts, "POST", `/orders/${row.id}/refunds`, {
        amount,
        reference: "RF-1",
        note: "Returned item",
      });
    expect((await refund(total + 1)).statusCode).toBe(409);
    expect((await refund(500)).statusCode).toBe(200);
    expect(await prisma.auditLog.count({ where: { action: "order.refund" } })).toBe(1);
  });

  it("passes cancel and fail back without asking the gateway", async () => {
    const cancelled = await publicCall("/payments/sslcommerz/confirm", {
      event: "cancel",
      params: { tran_id: "ORD-261104-0001_1" },
    });
    expect(cancelled.json()).toEqual({ reference: "ORD-261104-0001", outcome: "cancelled" });
    expect(
      (await publicCall("/payments/unknown/confirm", { event: "success", params: {} })).statusCode,
    ).toBe(404);
  });
});

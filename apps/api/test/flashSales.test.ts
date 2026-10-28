import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const VARIANT = "pb-20k-blk";
const NORMAL = 2450;
const FLASH = 1999;
const address = {
  name: "Sample Rahim",
  phone: "+8801712345678",
  division: "Dhaka",
  district: "Dhaka",
  area: "Motijheel",
  street: "House 4, Road 2",
};

describe.skipIf(!dbAvailable)("flash sales (issue 247)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let ip = 0;

  async function setDeal(deal: Record<string, unknown>) {
    await prisma.contentDocument.deleteMany({ where: { collection: "deals" } });
    await prisma.contentDocument.create({
      data: {
        collection: "deals",
        docId: "flash-test",
        data: {
          id: "flash-test",
          productId: "prod-power-bank",
          variantId: VARIANT,
          dealPrice: FLASH,
          sample: false,
          ...deal,
        } as Prisma.InputJsonValue,
        position: 0,
      },
    });
    app.get(ContentService).invalidate();
  }

  async function order(quantity: number) {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/orders",
      headers: { ...INTAKE, "x-client-ip": `10.24.7.${ip}`, "idempotency-key": randomUUID() },
      payload: { lines: [{ variantId: VARIANT, quantity }], address, payment: { method: "cod" } },
    });
    expect(response.statusCode, response.body).toBe(201);
    const row = await prisma.order.findUniqueOrThrow({
      where: { reference: response.json<{ reference: string }>().reference },
    });
    return { id: row.id, unit: (row.items as Array<{ unitPrice: number }>)[0]!.unitPrice };
  }

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("charges the flash price only inside its window", async () => {
    const hour = 3_600_000;
    await setDeal({
      startsAt: new Date(Date.now() + hour).toISOString(),
      endsAt: new Date(Date.now() + 2 * hour).toISOString(),
    });
    expect((await order(1)).unit).toBe(NORMAL);
    await setDeal({
      startsAt: new Date(Date.now() - 2 * hour).toISOString(),
      endsAt: new Date(Date.now() - hour).toISOString(),
    });
    expect((await order(1)).unit).toBe(NORMAL);
    await setDeal({ endsAt: new Date(Date.now() + hour).toISOString() });
    expect((await order(1)).unit).toBe(FLASH);
  });

  it("stops at the stock cap and gives cancelled units back", async () => {
    // A fresh count: the first test's flash order would otherwise count against this cap.
    await prisma.order.deleteMany({});
    const since = new Date(Date.now() - 1000).toISOString();
    await setDeal({
      startsAt: since,
      endsAt: new Date(Date.now() + 3_600_000).toISOString(),
      stockCap: 3,
    });
    const first = await order(2);
    expect(first.unit).toBe(FLASH);
    // Two more would pass the cap: the API prices them normally.
    expect((await order(2)).unit).toBe(NORMAL);
    expect((await order(1)).unit).toBe(FLASH);
    expect((await order(1)).unit).toBe(NORMAL);
    await prisma.order.update({ where: { id: first.id }, data: { status: "cancelled" } });
    expect((await order(2)).unit).toBe(FLASH);
  });
});

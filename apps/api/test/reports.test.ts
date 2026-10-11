import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";

describe.skipIf(!dbAvailable)("reports and customers (#111)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let manager: Record<string, string>;
  let visa: Record<string, string>;
  let editor: Record<string, string>;

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

  const lead = (reference: string, module: string, phone: string, at: string, extra = {}) =>
    prisma.lead.create({
      data: {
        reference,
        module,
        name: "Rahim Uddin",
        phone,
        contact: {},
        payload: {},
        source: {},
        summary: `${module} request`,
        createdAt: new Date(at),
        ...extra,
      },
    });

  const order = (reference: string, phone: string, total: number, status: string, at: string) =>
    prisma.order.create({
      data: {
        reference,
        status,
        items: [{ title: "Toner 83A", sku: "T83A", quantity: 1, lineTotal: total }],
        subtotal: total,
        discount: 0,
        delivery: 0,
        total,
        payment: {},
        address: {},
        name: "Rahim Uddin",
        phone,
        createdAt: new Date(at),
      },
    });

  const get = (headers: Record<string, string>, url: string) =>
    app.inject({ method: "GET", url: `/api/v1/admin${url}`, headers });

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
    manager = await person("Manager", ["admin"]);
    visa = await person("Visa", ["visa-officer"]);
    editor = await person("Editor", ["content-editor"]);
    await lead("FLT-0001", "flights", "+8801711111111", "2026-10-10T04:00:00Z", {
      status: "booked",
      firstResponseAt: new Date("2026-10-10T04:20:00Z"),
    });
    await lead("VIS-0001", "visa", "+8801722222222", "2026-10-11T04:00:00Z", {
      firstResponseAt: new Date("2026-10-11T04:40:00Z"),
    });
    await lead("FLT-0002", "flights", "+8801711111111", "2026-09-01T04:00:00Z");
    await order("SHP-0001", "+8801711111111", 4500, "delivered", "2026-10-10T08:00:00Z");
    await order("SHP-0002", "+8801733333333", 9000, "cancelled", "2026-10-11T08:00:00Z");
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("summarises the range in Dhaka days", async () => {
    const response = await get(manager, "/reports?from=2026-10-10&to=2026-10-11");
    expect(response.statusCode).toBe(200);
    const body = response.json<{
      leads: { total: number; won: number; wonRate: number; medianFirstResponseMinutes: number };
      orders: { total: number; sold: number; revenue: number };
      days: Array<{ day: string; leads: number; orders: number }>;
    }>();
    expect(body.leads).toMatchObject({
      total: 2,
      won: 1,
      wonRate: 50,
      medianFirstResponseMinutes: 30,
    });
    expect(body.orders).toMatchObject({ total: 2, sold: 1, revenue: 4500 });
    expect(body.days.map((day) => day.day)).toEqual(["2026-10-10", "2026-10-11"]);
  });

  it("scopes leads to the person's modules and hides orders from travel roles", async () => {
    const body = (await get(visa, "/reports?from=2026-10-10&to=2026-10-11")).json<{
      leads: { total: number };
      orders: unknown;
    }>();
    expect(body.leads.total).toBe(1);
    expect(body.orders).toBeNull();
    expect((await get(visa, "/reports/orders.csv?from=2026-10-10&to=2026-10-11")).statusCode).toBe(
      403,
    );
    expect((await get(editor, "/reports?from=2026-10-10&to=2026-10-11")).statusCode).toBe(403);
  });

  it("refuses reversed or year-long ranges", async () => {
    expect((await get(manager, "/reports?from=2026-10-11&to=2026-10-01")).statusCode).toBe(400);
    expect((await get(manager, "/reports?from=2024-01-01&to=2026-10-01")).statusCode).toBe(400);
  });

  it("downloads CSV with a byte order mark", async () => {
    const response = await get(manager, "/reports/leads.csv?from=2026-10-10&to=2026-10-11");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.body.startsWith("﻿")).toBe(true);
    expect(response.body).toContain("FLT-0001");
    expect(response.body).not.toContain("FLT-0002");
    expect(
      (await get(manager, "/reports/secrets.csv?from=2026-10-10&to=2026-10-11")).statusCode,
    ).toBe(404);
  });

  it("lists customers by phone and opens a profile", async () => {
    const list = (await get(manager, "/customers")).json<{
      items: Array<{ phone: string; leads: number; orders: number; spent: number }>;
    }>();
    expect(list.items.find((row) => row.phone === "+8801711111111")).toMatchObject({
      leads: 2,
      orders: 1,
      spent: 4500,
    });
    expect(list.items.find((row) => row.phone === "+8801733333333")).toMatchObject({ spent: 0 });
    const profile = await get(manager, `/customers/${encodeURIComponent("+8801711111111")}`);
    expect(profile.json()).toMatchObject({ name: "Rahim Uddin", spent: 4500 });
    expect((await get(manager, "/customers/not-a-phone")).statusCode).toBe(404);
    const visaList = (await get(visa, "/customers")).json<{ items: Array<{ phone: string }> }>();
    expect(visaList.items.map((row) => row.phone)).toEqual(["+8801722222222"]);
  });
});

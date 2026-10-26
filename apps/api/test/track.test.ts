import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

/* One /track for requests, visa applications and orders (issue 240; QA cases F-32, F-33, F-35). */

const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
let counter = 0;

describe.skipIf(!dbAvailable)("/public/track (issue 240)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  const track = (reference: string, phone: string, ip = `203.0.113.${++counter}`) =>
    app.inject({
      method: "POST",
      url: "/api/v1/public/track",
      headers: { ...INTAKE, "x-client-ip": ip },
      payload: { reference, phone },
    });

  const lead = (reference: string, module: string, data: Record<string, unknown> = {}) =>
    prisma.lead.create({
      data: {
        reference,
        module,
        name: "Private Name",
        phone: "+8801712345678",
        email: "private@example.com",
        contact: {},
        payload: {},
        source: {},
        summary: "Dhaka to Dubai with my family",
        ...data,
      },
    });

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(
      featureModules({
        mailer: new MemoryMailer(),
        fetcher: () => Promise.resolve({ status: 200 }),
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("F-32: a request answers with its status and step dates only, in any phone format", async () => {
    await lead("FLT-261027-0001", "flights", {
      status: "quoted",
      firstResponseAt: new Date("2026-10-27T05:00:00Z"),
    });
    const answer = await track("flt-261027-0001", "01712-345678");
    expect(answer.statusCode, answer.body).toBe(200);
    expect(answer.json()).toMatchObject({
      kind: "request",
      reference: "FLT-261027-0001",
      module: "flights",
      status: "quoted",
      closedAt: null,
      visa: null,
    });
    expect(answer.json<{ respondedAt: string }>().respondedAt).toContain("2026-10-27");
    for (const secret of ["Private Name", "private@example.com", "8801712345678", "Dubai"])
      expect(answer.body).not.toContain(secret);
  });

  it("F-32: a visa application shows its documents, submission and stage", async () => {
    await lead("VSA-261027-0001", "visa", {
      payload: { countrySlug: "thailand", visaType: "tourist" },
      progress: { received: [], submittedOn: "2026-10-20" },
    });
    const answer = await track("VSA-261027-0001", "+8801712345678");
    expect(answer.statusCode, answer.body).toBe(200);
    const visa = answer.json<{ visa: { stage: string; required: number; submittedOn: string } }>()
      .visa;
    expect(visa).toMatchObject({ stage: "submitted", submittedOn: "2026-10-20" });
    expect(visa.required).toBeGreaterThan(0);
  });

  it("F-32: an order answers with the order", async () => {
    await prisma.order.create({
      data: {
        reference: "ORD-261027-0001",
        items: [],
        subtotal: 100,
        discount: 0,
        delivery: 0,
        total: 100,
        payment: { method: "cod" },
        address: {},
        name: "Guest",
        phone: "+8801712345678",
      },
    });
    const answer = await track("ORD-261027-0001", "01712345678");
    expect(answer.statusCode, answer.body).toBe(200);
    expect(answer.json()).toMatchObject({ kind: "order", order: { reference: "ORD-261027-0001" } });
  });

  it("F-33: a wrong phone, an unknown reference and a spam request all give the same not found", async () => {
    await lead("CNT-261027-0009", "contact", { status: "spam" });
    const answers = await Promise.all([
      track("FLT-261027-0001", "01799-999999"),
      track("FLT-000000-0000", "01712-345678"),
      track("CNT-261027-0009", "01712-345678"),
      track("ORD-261027-0001", "01799-999999"),
    ]);
    for (const answer of answers) {
      expect(answer.statusCode).toBe(404);
      expect(answer.json<{ detail: string }>().detail).toBe(
        "Nothing with this reference and phone",
      );
    }
  });

  it("F-35: at most 20 lookups per address in 10 minutes", async () => {
    const ip = "203.0.113.250";
    for (let i = 0; i < 20; i += 1)
      expect((await track("FLT-000000-0000", "01712-345678", ip)).statusCode).toBe(404);
    expect((await track("FLT-000000-0000", "01712-345678", ip)).statusCode).toBe(429);
  });
});

import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const PHONE = "+8801711000001";

type Person = { headers: { authorization: string } };
type LeadList = {
  total: number;
  modules: Array<{ module: string; open: number }>;
  items: Array<{ reference: string; status: string }>;
};
type LeadDetail = {
  visa: { checklist: Array<{ item: string }> } | null;
  customer: {
    phone: string;
    leadCount: number;
    leads: Array<{ reference: string; module: string }>;
    orderCount: number;
    orders: Array<{ reference: string; total: number }> | null;
  };
};
type VisaApplications = {
  total: number;
  stages: Record<string, number>;
  items: Array<{
    reference: string;
    stage: string;
    received: number;
    required: number;
    country: string | null;
  }>;
};

describe.skipIf(!dbAvailable)("the inbox (D0 R6)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let owner: Person;
  let visaOfficer: Person;
  let sales: Person;
  let sequence = 0;

  async function person(name: string, roles: Role[]): Promise<Person> {
    const user = await prisma.staffUser.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        passwordHash: await argon2.hash("not-used-in-this-test", { type: argon2.argon2id }),
        roles,
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
      { sub: user.id, sid: session.id, name, email: user.email, roles },
      JWT_SECRET,
    );
    return { headers: { authorization: `Bearer ${token}` } };
  }

  const get = (who: Person, url: string) =>
    app.inject({ method: "GET", url: `/api/v1/admin${url}`, headers: who.headers });

  /** A request straight in the database, so each test controls status, phone and progress. */
  async function lead(fields: {
    module: string;
    status?: string;
    phone?: string;
    payload?: Record<string, unknown>;
    progress?: Record<string, unknown>;
  }) {
    sequence += 1;
    const reference = `TST-${String(sequence).padStart(4, "0")}`;
    const created = await prisma.lead.create({
      data: {
        reference,
        module: fields.module,
        status: fields.status ?? "new",
        name: `Sample Customer ${sequence}`,
        phone: fields.phone ?? `+88017110${String(10_000 + sequence)}`,
        contact: { name: `Sample Customer ${sequence}`, phone: fields.phone ?? PHONE },
        payload: (fields.payload ?? {}) as object,
        source: { channel: "web" },
        summary: "Sample request",
        ...(fields.progress ? { progress: fields.progress as object } : {}),
      },
    });
    return created;
  }

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app.get(ContentService).invalidate();
    owner = await person("Sample Owner", ["super-admin"]);
    visaOfficer = await person("Sample Visa Officer", ["visa-officer"]);
    sales = await person("Sample Sales", ["travel-sales"]);
  });

  it("counts open leads per module for the tabs, and lists lost and cancelled leads for the board", async () => {
    await lead({ module: "visa" });
    const lost = await lead({ module: "visa", status: "lost" });
    await lead({ module: "flights", status: "quoted" });
    const cancelled = await lead({ module: "flights", status: "cancelled" });
    await lead({ module: "printing", status: "booked" });

    const all = (await get(owner, "/leads?counts=1")).json<LeadList>();
    const open = Object.fromEntries(all.modules.map((item) => [item.module, item.open]));
    expect(open).toMatchObject({ visa: 1, flights: 1, printing: 0 });

    // A visa officer's tabs are the visa module only.
    const visaTabs = (await get(visaOfficer, "/leads?counts=1")).json<LeadList>().modules;
    expect(visaTabs).toEqual([{ module: "visa", open: 1 }]);

    const closed = (await get(owner, "/leads?view=closed")).json<LeadList>();
    expect(closed.items.map((item) => item.reference).sort()).toEqual(
      [lost.reference, cancelled.reference].sort(),
    );
  });

  it("shows other requests and orders from the same phone on the customer card", async () => {
    const first = await lead({ module: "visa", phone: PHONE });
    const second = await lead({ module: "flights", phone: PHONE });
    await lead({ module: "visa", phone: "+8801799000000" });
    await prisma.order.create({
      data: {
        reference: "WS-SAMPLE-CARD",
        items: [],
        subtotal: 4500,
        discount: 0,
        delivery: 0,
        total: 4500,
        payment: { method: "cod" },
        address: {},
        name: "Sample Customer",
        phone: PHONE,
      },
    });

    const card = (await get(owner, `/leads/${first.id}`)).json<LeadDetail>().customer;
    expect(card.leadCount).toBe(1);
    expect(card.leads.map((item) => item.reference)).toEqual([second.reference]);
    expect(card.orderCount).toBe(1);
    expect(card.orders?.[0]).toMatchObject({ reference: "WS-SAMPLE-CARD", total: 4500 });

    // A visa officer sees only visa requests, and nothing about orders.
    const narrow = (await get(visaOfficer, `/leads/${first.id}`)).json<LeadDetail>().customer;
    expect(narrow.leadCount).toBe(0);
    expect(narrow.orders).toBeNull();
  });

  it("lists visa applications by checklist stage, without spam", async () => {
    const payload = { countrySlug: "thailand", visaType: "tourist" };
    const pending = await lead({ module: "visa", payload });
    const checklist = (await get(owner, `/leads/${pending.id}`)).json<LeadDetail>().visa?.checklist;
    const items = (checklist ?? []).map((entry) => entry.item);
    expect(items.length).toBeGreaterThan(2);
    const ready = await lead({ module: "visa", payload, progress: { received: items } });
    const submitted = await lead({
      module: "visa",
      status: "in-progress",
      payload,
      progress: { received: items, submittedOn: "2026-10-20", submissionReference: "TH-1" },
    });
    await lead({ module: "visa", status: "spam", payload });

    const all = (await get(visaOfficer, "/visa-applications")).json<VisaApplications>();
    expect(all.total).toBe(3);
    expect(all.stages).toMatchObject({ documentsPending: 1, readyToSubmit: 1, submitted: 1 });
    const byReference = new Map(all.items.map((item) => [item.reference, item]));
    expect(byReference.get(pending.reference)).toMatchObject({
      stage: "documentsPending",
      received: 0,
      required: items.length,
      country: "Thailand",
    });
    expect(byReference.get(submitted.reference)?.stage).toBe("submitted");

    const onlyReady = (
      await get(visaOfficer, "/visa-applications?stage=readyToSubmit")
    ).json<VisaApplications>();
    expect(onlyReady.items.map((item) => item.reference)).toEqual([ready.reference]);

    // Visa work only: travel sales can't open the list.
    expect((await get(sales, "/visa-applications")).statusCode).toBe(403);
  });
});

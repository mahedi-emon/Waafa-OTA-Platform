import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { BookingView, Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { applySeedPatches, PATCH_MARKER } from "../src/seed/seedPatches";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
/** A month ahead, so the request is always for a future trip. */
const TRIP = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
type Person = { headers: { authorization: string } };

describe.skipIf(!dbAvailable)("bookings (issue 242)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let ip = 0;
  let agent: Person;
  let visaOfficer: Person;
  let accounts: Person;

  async function person(name: string, roles: Role[]): Promise<Person> {
    const user = await prisma.staffUser.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        passwordHash: "x",
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

  const call = (who: Person, method: "GET" | "POST" | "PATCH", url: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/api/v1/admin${url}`,
      headers: who.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  async function bookedLead(amount: number): Promise<string> {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.6.0.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        contact: { name: "Sample Booker", phone: `+88010000072${String(ip).padStart(2, "0")}` },
        consent: true,
        payload: {
          module: "flights",
          search: {
            tripType: "one-way",
            legs: [{ from: "DAC", to: "DXB", date: TRIP }],
            travellers: { adults: 1, childAges: [], infants: 0 },
            cabin: "economy",
          },
        },
      },
    });
    expect(response.statusCode, response.body).toBe(201);
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { reference: response.json<{ reference: string }>().reference },
    });
    await call(agent, "POST", `/leads/${lead.id}/actions`, { type: "contact", channel: "phone" });
    const converted = await call(agent, "POST", `/leads/${lead.id}/actions`, {
      type: "convert",
      amount,
    });
    expect(converted.statusCode, converted.body).toBe(200);
    return lead.id;
  }

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
    app.get(ContentService).invalidate();
    agent = await person("Sample Agent", ["travel-sales"]);
    visaOfficer = await person("Sample Visa", ["visa-officer"]);
    accounts = await person("Sample Accounts", ["accounts"]);
  });
  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("makes a booking when a lead is converted, linked from the lead and kept in step with its amount", async () => {
    const leadId = await bookedLead(146480);
    const lead = await call(agent, "GET", `/leads/${leadId}`);
    const link = lead.json<{ booking: { id: string; reference: string; status: string } }>()
      .booking;
    expect(link).toMatchObject({ status: "confirmed" });
    expect(link.reference).toMatch(/^BKG-\d{6}-\d{4}$/);

    const booking = (await call(agent, "GET", `/bookings/${link.id}`)).json<BookingView>();
    expect(booking).toMatchObject({
      amount: 146480,
      paid: 0,
      due: 146480,
      paymentStatus: "unpaid",
      module: "flights",
      customerName: "Sample Booker",
      travelDate: TRIP,
    });

    // The booked amount corrected on the lead follows to the booking.
    await call(agent, "PATCH", `/leads/${leadId}`, { amount: 150000 });
    expect((await call(agent, "GET", `/bookings/${link.id}`)).json<BookingView>().amount).toBe(
      150000,
    );
  });

  it("records the PNR, tickets and payments, with the payment status from the amounts and an audit entry", async () => {
    const leadId = await bookedLead(80000);
    const { id } = (await prisma.booking.findUniqueOrThrow({ where: { leadId } })) as {
      id: string;
    };
    const partly = await call(agent, "PATCH", `/bookings/${id}`, {
      pnr: "ab12cd",
      tickets: ["0652345678901", "0652345678901", "0652345678902"],
      paid: 30000,
      status: "ticketed",
      supplier: "Sample consolidator",
    });
    expect(partly.statusCode, partly.body).toBe(200);
    expect(partly.json<BookingView>()).toMatchObject({
      pnr: "AB12CD",
      tickets: ["0652345678901", "0652345678902"],
      paymentStatus: "partial",
      due: 50000,
      status: "ticketed",
    });
    expect((await call(agent, "PATCH", `/bookings/${id}`, { paid: 90000 })).statusCode).toBe(422);
    expect((await call(agent, "PATCH", `/bookings/${id}`, { pnr: "x" })).statusCode).toBe(422);
    expect(
      (await call(agent, "PATCH", `/bookings/${id}`, { paid: 80000 })).json<BookingView>()
        .paymentStatus,
    ).toBe("paid");
    expect(
      (await call(agent, "PATCH", `/bookings/${id}`, { refunded: true })).json<BookingView>()
        .paymentStatus,
    ).toBe("refunded");
    const audit = await prisma.auditLog.findMany({ where: { action: "booking.update" } });
    expect(audit.length).toBeGreaterThanOrEqual(3);

    // Search by PNR, ticket number or phone; filter by payment status.
    const found = (await call(agent, "GET", "/bookings?q=AB12CD")).json<{ items: BookingView[] }>();
    expect(found.items.map((item) => item.id)).toEqual([id]);
    const byTicket = (await call(agent, "GET", "/bookings?q=0652345678902")).json<{
      items: BookingView[];
    }>();
    expect(byTicket.items.map((item) => item.id)).toEqual([id]);
    const refunded = (await call(agent, "GET", "/bookings?payment=refunded")).json<{
      items: BookingView[];
    }>();
    expect(refunded.items.every((item) => item.paymentStatus === "refunded")).toBe(true);
  });

  it("shows bookings only to people who may open the lead, and to Accounts", async () => {
    const leadId = await bookedLead(50000);
    const { id } = await prisma.booking.findUniqueOrThrow({ where: { leadId } });
    expect((await call(visaOfficer, "GET", `/bookings/${id}`)).statusCode).toBe(404);
    expect((await call(visaOfficer, "GET", "/bookings")).json<{ total: number }>().total).toBe(0);
    expect((await call(accounts, "GET", `/bookings/${id}`)).statusCode).toBe(200);
    expect((await call(accounts, "GET", "/bookings/not-an-id!")).statusCode).toBe(422);
  });

  it("gives leads booked before the module their booking once (seed patch)", async () => {
    const leadId = await bookedLead(42000);
    await prisma.booking.deleteMany({ where: { leadId } });
    await prisma.setting.upsert({
      where: { key: PATCH_MARKER },
      update: { value: [] },
      create: { key: PATCH_MARKER, value: [], updatedBy: "seed" },
    });
    const marker = await prisma.setting.findUniqueOrThrow({ where: { key: PATCH_MARKER } });
    expect(marker.value).toEqual([]);
    const result = await applySeedPatches(prisma);
    expect(result.applied).toContain("2026-10-30-bookings-for-booked-leads");
    const booking = await prisma.booking.findUniqueOrThrow({ where: { leadId } });
    expect(booking).toMatchObject({ amount: 42000, status: "confirmed", createdBy: "seed-patch" });
    const again = await applySeedPatches(prisma);
    expect(again.applied).toEqual([]);
  });
});

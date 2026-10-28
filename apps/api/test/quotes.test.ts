import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { PublicQuote, QuoteSummary, QuoteView, Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const DAY = 86_400_000;
const dhakaDay = (offset: number) =>
  new Date(Date.now() + 6 * 3_600_000 + offset * DAY).toISOString().slice(0, 10);
const TRIP = dhakaDay(30);
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
type Person = { headers: { authorization: string } };

const OPTIONS = [
  {
    title: "Direct, evening",
    details: "DAC 10:05 pm to DXB 1:35 am",
    baggage: "2 x 23 kg",
    price: 146480,
  },
  { title: "One stop, morning", details: null, baggage: "30 kg", price: 98500 },
];

describe.skipIf(!dbAvailable)("quotes (issue 298)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  const mailer = new MemoryMailer();
  let ip = 0;
  let agent: Person;
  let visaOfficer: Person;

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

  const customer = (method: "GET" | "POST", url: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/api/v1/public/quotes${url}`,
      headers: { ...INTAKE, "x-client-ip": "10.7.0.1" },
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  async function lead(email: string | null = "sample.quote@example.com"): Promise<string> {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.7.1.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        contact: {
          name: "Sample Quoted Customer",
          phone: `+88010000073${String(ip).padStart(2, "0")}`,
          ...(email ? { email } : {}),
        },
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
    const row = await prisma.lead.findUniqueOrThrow({
      where: { reference: response.json<{ reference: string }>().reference },
    });
    return row.id;
  }

  async function quote(leadId: string, validUntil = dhakaDay(5)): Promise<QuoteView> {
    const response = await call(agent, "POST", `/leads/${leadId}/quotes`, {
      options: OPTIONS,
      validUntil,
      notes: "Fares change quickly.",
    });
    expect(response.statusCode, response.body).toBe(201);
    return response.json<QuoteView>();
  }

  const tokenOf = (view: QuoteView) => view.link.split("/quote/")[1] ?? "";

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(featureModules({ mailer }));
    app.get(ContentService).invalidate();
    agent = await person("Sample Quoter", ["travel-sales"]);
    visaOfficer = await person("Sample Visa Desk", ["visa-officer"]);
  });
  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("goes quote → sent by email → accepted → booking, with the timeline, the emails and the audit log", async () => {
    const leadId = await lead();
    const draft = await quote(leadId);
    expect(draft).toMatchObject({ status: "draft", expired: false, sentVia: [] });
    expect(draft.reference).toMatch(/^QTN-\d{6}-\d{4}$/);
    expect(draft.options.map((option) => option.id)).toEqual(["o1", "o2"]);
    expect(draft.link).toMatch(/^http:\/\/localhost:3000\/quote\/[a-z0-9]+\.[A-Za-z0-9_-]{32}$/);
    expect(draft.whatsapp).toMatch(/^https:\/\/wa\.me\/880/);

    // A draft is not open to the customer yet.
    expect((await customer("GET", `/${tokenOf(draft)}`)).statusCode).toBe(404);

    mailer.sent.length = 0;
    const sent = await call(agent, "POST", `/quotes/${draft.id}/send`, { channel: "email" });
    expect(sent.statusCode, sent.body).toBe(200);
    expect(sent.json<QuoteView>()).toMatchObject({ status: "sent", sentVia: ["email"] });
    await app.get(NotificationService).idle();
    const email = mailer.sent.find((mail) => mail.to === "sample.quote@example.com");
    expect(email?.subject).toContain(draft.reference);
    expect(email?.text).toContain(draft.link);

    const detail = await call(agent, "GET", `/leads/${leadId}`);
    const leadView = detail.json<{
      status: string;
      quotes: QuoteSummary[];
      activities: Array<{ type: string; body: string }>;
    }>();
    expect(leadView.status).toBe("quoted");
    expect(leadView.quotes[0]).toMatchObject({ reference: draft.reference, lowest: 98500 });
    expect(leadView.activities.some((entry) => entry.body.includes(draft.reference))).toBe(true);

    const page = await customer("GET", `/${tokenOf(draft)}`);
    expect(page.statusCode, page.body).toBe(200);
    const open = page.json<PublicQuote>();
    expect(open).toMatchObject({ state: "open", firstName: "Sample", reference: draft.reference });
    expect(JSON.stringify(open)).not.toContain("+880");
    expect(JSON.stringify(open)).not.toContain("example.com");

    mailer.sent.length = 0;
    const accepted = await customer("POST", "/accept", { token: tokenOf(draft), optionId: "o2" });
    expect(accepted.statusCode, accepted.body).toBe(200);
    expect(accepted.json<PublicQuote>()).toMatchObject({
      state: "accepted",
      acceptedOptionId: "o2",
    });
    // The same tap again answers the same; another option is refused.
    expect(
      (await customer("POST", "/accept", { token: tokenOf(draft), optionId: "o2" })).statusCode,
    ).toBe(200);
    expect(
      (await customer("POST", "/accept", { token: tokenOf(draft), optionId: "o1" })).statusCode,
    ).toBe(409);
    await vi.waitFor(() =>
      expect(mailer.sent.some((mail) => mail.subject.includes("accepted"))).toBe(true),
    );

    const afterAccept = (await call(agent, "GET", `/leads/${leadId}`)).json<{
      quotes: QuoteSummary[];
      activities: Array<{ body: string }>;
    }>();
    expect(afterAccept.quotes[0]?.accepted).toEqual({ title: "One stop, morning", price: 98500 });
    expect(afterAccept.activities.some((entry) => entry.body.includes("accepted"))).toBe(true);

    const converted = await call(agent, "POST", `/leads/${leadId}/actions`, {
      type: "convert",
      amount: 98500,
    });
    expect(converted.statusCode, converted.body).toBe(200);
    const booking = await prisma.booking.findUniqueOrThrow({ where: { leadId } });
    expect(booking.amount).toBe(98500);

    const audit = await prisma.auditLog.findMany({
      where: { entity: "quote", entityId: draft.reference },
      orderBy: { at: "asc" },
    });
    expect(audit.map((entry) => entry.action)).toEqual([
      "quote.create",
      "quote.send",
      "quote.accept",
    ]);
    expect(audit[2]?.actorName).toBe("Customer");
  });

  it("serves the PDF to staff and to the customer's link", async () => {
    const leadId = await lead();
    const draft = await quote(leadId);
    const staffPdf = await call(agent, "GET", `/quotes/${draft.id}/pdf`);
    expect(staffPdf.statusCode).toBe(200);
    expect(staffPdf.headers["content-type"]).toBe("application/pdf");
    expect(staffPdf.rawPayload.subarray(0, 5).toString()).toBe("%PDF-");
    await call(agent, "POST", `/quotes/${draft.id}/send`, { channel: "whatsapp" });
    const customerPdf = await customer("GET", `/${tokenOf(draft)}/pdf`);
    expect(customerPdf.statusCode).toBe(200);
    expect(customerPdf.headers["content-disposition"]).toContain(`${draft.reference}.pdf`);
  });

  it("refuses expired, withdrawn and tampered quotes, email without an address, and past days", async () => {
    const noEmail = await lead(null);
    const draft = await quote(noEmail);
    const byEmail = await call(agent, "POST", `/quotes/${draft.id}/send`, { channel: "email" });
    expect(byEmail.statusCode).toBe(422);
    const onWhatsApp = await call(agent, "POST", `/quotes/${draft.id}/send`, {
      channel: "whatsapp",
    });
    expect(onWhatsApp.statusCode, onWhatsApp.body).toBe(200);

    const past = await call(agent, "PATCH", `/quotes/${draft.id}`, {
      options: OPTIONS,
      validUntil: dhakaDay(-1),
      notes: null,
    });
    expect(past.statusCode).toBe(422);

    // The last valid day passes: Accept answers 410 and the page says expired.
    await prisma.quote.update({
      where: { id: draft.id },
      data: { validUntil: new Date(`${dhakaDay(-1)}T00:00:00Z`) },
    });
    expect((await customer("GET", `/${tokenOf(draft)}`)).json<PublicQuote>().state).toBe("expired");
    expect(
      (await customer("POST", "/accept", { token: tokenOf(draft), optionId: "o1" })).statusCode,
    ).toBe(410);

    const second = await quote(noEmail);
    await call(agent, "POST", `/quotes/${second.id}/send`, { channel: "whatsapp" });
    const withdrawn = await call(agent, "POST", `/quotes/${second.id}/withdraw`);
    expect(withdrawn.json<QuoteView>().status).toBe("withdrawn");
    expect((await customer("GET", `/${tokenOf(second)}`)).json<PublicQuote>().state).toBe(
      "withdrawn",
    );
    expect(
      (await customer("POST", "/accept", { token: tokenOf(second), optionId: "o1" })).statusCode,
    ).toBe(409);

    const tampered = `${second.id}.${"A".repeat(32)}`;
    expect((await customer("GET", `/${tampered}`)).statusCode).toBe(404);
    // Without the intake key the customer endpoints are closed.
    const direct = await app.inject({
      method: "GET",
      url: `/api/v1/public/quotes/${tokenOf(second)}`,
    });
    expect(direct.statusCode).toBe(401);
  });

  it("keeps quotes to the people who may open the lead", async () => {
    const leadId = await lead();
    const draft = await quote(leadId);
    expect((await call(visaOfficer, "GET", `/quotes/${draft.id}`)).statusCode).toBe(404);
    expect(
      (
        await call(visaOfficer, "POST", `/leads/${leadId}/quotes`, {
          options: OPTIONS,
          validUntil: dhakaDay(3),
          notes: null,
        })
      ).statusCode,
    ).toBe(404);
  });
});

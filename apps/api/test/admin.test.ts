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
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };

type Person = { id: string; headers: { authorization: string } };

const contact = { name: "Sample Customer", phone: "+8801000000101" };
const flight = {
  module: "flights",
  search: {
    tripType: "one-way",
    legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
    travellers: { adults: 1, childAges: [], infants: 0 },
    cabin: "economy",
  },
};
const visa = {
  module: "visa",
  countrySlug: "thailand",
  countryName: "Thailand",
  visaType: "tourist",
  travelDate: "2026-12-01",
  applicants: 1,
};
const address = {
  name: "Sample Rahim",
  phone: "+8801712345678",
  division: "Dhaka",
  district: "Dhaka",
  area: "Motijheel",
  street: "House 4, Road 2",
};

describe.skipIf(!dbAvailable)("admin API (B4)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let ip = 0;
  let owner: Person;
  let agent: Person;
  let visaOfficer: Person;
  let shop: Person;
  let editor: Person;
  let accounts: Person;
  const mailer = new MemoryMailer();

  async function person(
    name: string,
    roles: Role[],
    password = "not-used-in-this-test",
  ): Promise<Person> {
    const user = await prisma.staffUser.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
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
    return { id: user.id, headers: { authorization: `Bearer ${token}` } };
  }

  const call = (
    who: Person | null,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    url: string,
    payload?: unknown,
  ) =>
    app.inject({
      method,
      url: `/api/v1/admin${url}`,
      headers: who ? who.headers : {},
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  const submitLead = async (payload: unknown) => {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.2.0.${ip}`, "idempotency-key": randomUUID() },
      payload: { contact, payload, consent: true } as Record<string, unknown>,
    });
    expect(response.statusCode).toBe(201);
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { reference: response.json<{ reference: string }>().reference },
    });
    return lead.id;
  };

  const placeOrder = async () => {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/orders",
      headers: { ...INTAKE, "x-client-ip": `10.2.0.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        lines: [{ variantId: "bd-w1510a", quantity: 2 }],
        address,
        payment: { method: "cod" },
      },
    });
    expect(response.statusCode).toBe(201);
    const order = await prisma.order.findUniqueOrThrow({
      where: { reference: response.json<{ reference: string }>().reference },
    });
    return order;
  };

  const stockOf = async (slug: string, variantId: string) => {
    const doc = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "products", docId: slug } },
    });
    return (doc.data as { variants: Array<{ id: string; stock: number }> }).variants.find(
      (v) => v.id === variantId,
    )?.stock;
  };

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(featureModules({ mailer }));
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app.get(ContentService).invalidate();
    owner = await person("Sample Owner", ["super-admin"], "owner-password-123");
    agent = await person("Sample Agent", ["travel-sales"]);
    visaOfficer = await person("Sample Visa", ["visa-officer"]);
    shop = await person("Sample Shop", ["shop-manager"]);
    editor = await person("Sample Editor", ["content-editor"]);
    accounts = await person("Sample Accounts", ["accounts"]);
  });

  it("needs a staff token and the right role", async () => {
    expect((await call(null, "GET", "/leads")).statusCode).toBe(401);
    expect((await call(agent, "GET", "/orders")).statusCode).toBe(403);
    expect((await call(editor, "GET", "/leads")).statusCode).toBe(403);
    expect((await call(agent, "GET", "/users")).statusCode).toBe(403);
    expect((await call(owner, "GET", "/users")).statusCode).toBe(200);
  });

  it("lists leads by role and saved view, and finds them by phone", async () => {
    await submitLead(flight);
    await submitLead(visa);
    const forAgent = (await call(agent, "GET", "/leads")).json<{
      items: Array<{ module: string }>;
    }>();
    expect(forAgent.items.map((lead) => lead.module)).toEqual(["flights"]);
    const forVisa = (await call(visaOfficer, "GET", "/leads")).json<{
      items: Array<{ module: string }>;
    }>();
    expect(forVisa.items.map((lead) => lead.module)).toEqual(["visa"]);
    const all = (await call(owner, "GET", "/leads?view=unassigned")).json<{ total: number }>();
    expect(all.total).toBe(2);
    const byPhone = (await call(owner, "GET", "/leads?q=01000-000101")).json<{ total: number }>();
    expect(byPhone.total).toBe(2);
    expect((await call(owner, "GET", "/leads?status=nope")).statusCode).toBe(422);
  });

  it("moves a lead by its steps, stamps the first response and keeps the timeline and audit (D0 R4)", async () => {
    const id = await submitLead(flight);
    const step = (who: Person, input: Record<string, unknown>) =>
      call(who, "POST", `/leads/${id}/actions`, input);
    // The status is never sent on its own any more.
    expect((await call(agent, "PATCH", `/leads/${id}`, { status: "quoted" })).statusCode).toBe(422);
    expect((await step(agent, { type: "convert" })).statusCode).toBe(422);
    expect((await step(agent, { type: "close", outcome: "lost", reason: "" })).statusCode).toBe(
      422,
    );

    const replied = await step(agent, { type: "contact", channel: "whatsapp" });
    expect(replied.statusCode).toBe(200);
    const contacted = replied.json<{ status: string; firstResponseAt: string | null }>();
    expect(contacted.status).toBe("in-progress");
    expect(contacted.firstResponseAt).not.toBeNull();

    await call(agent, "PATCH", `/leads/${id}`, { assigneeId: agent.id });
    const quoted = await step(agent, { type: "quote", amount: 58500 });
    expect(quoted.json<{ status: string; assignee: { name: string } }>()).toMatchObject({
      status: "quoted",
      assignee: { name: "Sample Agent" },
    });
    expect((await step(agent, { type: "askPayment" })).json<{ status: string }>().status).toBe(
      "pending",
    );
    expect((await step(agent, { type: "customerReplied" })).json<{ status: string }>().status).toBe(
      "in-progress",
    );

    const booked = await step(agent, { type: "convert", amount: 58500 });
    expect(booked.json<{ status: string; amount: number }>()).toMatchObject({
      status: "booked",
      amount: 58500,
    });
    expect(booked.json<{ closedAt: string | null }>().closedAt).not.toBeNull();
    // A closed lead takes notes, never another booking or spam.
    expect((await step(agent, { type: "convert", amount: 1 })).statusCode).toBe(409);
    expect((await step(agent, { type: "markSpam" })).statusCode).toBe(409);
    const corrected = await call(agent, "PATCH", `/leads/${id}`, { amount: 59000 });
    expect(corrected.json<{ amount: number }>().amount).toBe(59000);
    const reopened = await step(agent, { type: "reopen", reason: "Changed the dates" });
    expect(reopened.json<{ status: string; closedAt: string | null }>()).toMatchObject({
      status: "in-progress",
      closedAt: null,
    });

    const noted = await call(agent, "POST", `/leads/${id}/activities`, {
      type: "note",
      body: "Prefers a window seat.",
    });
    expect(noted.statusCode).toBe(201);
    const activities = noted.json<{ activities: Array<{ type: string; body: string }> }>()
      .activities;
    expect(activities.map((item) => item.type)).toEqual([
      "created",
      "whatsapp",
      "assign",
      "quote",
      "status",
      "status",
      "converted",
      "status",
      "status",
      "note",
    ]);
    expect(activities[1]?.body).toBe("Replied on WhatsApp · Moved to In progress");
    expect(activities[3]?.body).toContain("৳58,500");
    expect(
      await prisma.auditLog.count({ where: { entity: "lead", action: { startsWith: "lead." } } }),
    ).toBe(8);

    // A visa officer can't open a flight lead.
    expect((await call(visaOfficer, "GET", `/leads/${id}`)).statusCode).toBe(404);
  });

  it("takes a booked group-fare lead's seats off the fare (D0 R4)", async () => {
    const fare = await prisma.contentDocument.findFirstOrThrow({
      where: { collection: "groupFares" },
    });
    const seats = Math.max((fare.data as { seatsLeft?: number }).seatsLeft ?? 0, 5);
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: "groupFares", docId: fare.docId } },
      data: { data: { ...(fare.data as object), seatsLeft: seats } },
    });
    const id = await submitLead({ ...flight, groupFareId: fare.docId });
    await prisma.lead.update({ where: { id }, data: { travellers: 2 } });
    await call(agent, "POST", `/leads/${id}/actions`, { type: "contact", channel: "call" });
    const booked = await call(agent, "POST", `/leads/${id}/actions`, {
      type: "convert",
      amount: 120000,
    });
    expect(booked.statusCode).toBe(200);
    const after = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "groupFares", docId: fare.docId } },
    });
    expect((after.data as { seatsLeft: number }).seatsLeft).toBe(seats - 2);
    const history = await prisma.auditLog.findFirstOrThrow({
      where: { entity: "groupFares", entityId: fare.docId, action: "content.update" },
    });
    expect(history.reason).toContain("2 seats booked");
  });

  it("walks a visa application through its checklist, submission and outcome (D0 R4)", async () => {
    const id = await submitLead(visa);
    await prisma.lead.update({ where: { id }, data: { email: "visa-customer@example.com" } });
    const visaStep = (input: Record<string, unknown>) =>
      call(visaOfficer, "POST", `/leads/${id}/visa`, input);
    const first = await call(visaOfficer, "GET", `/leads/${id}`);
    const start = first.json<{ visa: { stage: string; checklist: Array<{ item: string }> } }>()
      .visa;
    expect(start.stage).toBe("documentsPending");
    expect(start.checklist.length).toBeGreaterThan(0);
    const submit = { type: "submit", on: "2026-10-25", submissionReference: "VFS-1234" };
    expect((await visaStep(submit)).statusCode).toBe(409);
    let last = first;
    for (const { item } of start.checklist) {
      last = await visaStep({ type: "document", item, received: true });
      // The first document received is a reply: the new lead moves to In progress (D0 R6).
      expect(last.json<{ status: string }>().status).toBe("in-progress");
    }
    expect(
      last.json<{ visa: { stage: string; received: number; required: number } }>().visa,
    ).toMatchObject({
      stage: "readyToSubmit",
      received: start.checklist.length,
      required: start.checklist.length,
    });
    expect((await visaStep(submit)).json<{ visa: { stage: string } }>().visa.stage).toBe(
      "submitted",
    );
    const approved = await visaStep({ type: "outcome", outcome: "approved" });
    expect(approved.json<{ visa: { stage: string } }>().visa.stage).toBe("approved");
    const returned = await visaStep({ type: "passportReturned", on: "2026-11-02" });
    expect(returned.json<{ visa: { stage: string } }>().visa.stage).toBe("passportReturned");
    // The customer got one email for each step forward (FR-VISA-04, issue 233).
    await app.get(NotificationService).idle();
    const visaMails = mailer.sent
      .filter((mail) => mail.to === "visa-customer@example.com")
      .map((mail) => mail.text);
    expect(visaMails).toHaveLength(4);
    expect(visaMails[0]).toContain("is now complete");
    expect(visaMails[3]).toContain("your passport is back");
    expect(visaMails[1]).toContain("is now submitted to the embassy");
    expect(visaMails[2]).toContain("is now approved");
    const flightLead = await submitLead(flight);
    expect(
      (
        await call(agent, "POST", `/leads/${flightLead}/visa`, {
          type: "document",
          item: "Passport",
          received: true,
        })
      ).statusCode,
    ).toBe(400);
  });

  it("bulk assigns and exports CSV without spreadsheet formulas", async () => {
    const a = await submitLead(flight);
    const b = await submitLead({
      ...flight,
      search: { ...flight.search, legs: [{ from: "DAC", to: "BKK", date: "2026-11-20" }] },
    });
    const bulk = await call(owner, "POST", "/leads/bulk", { ids: [a, b], assigneeId: agent.id });
    expect(bulk.json()).toEqual({ changed: 2, skipped: [] });
    expect(
      (await call(owner, "GET", "/leads?view=unassigned")).json<{ total: number }>().total,
    ).toBe(0);

    await prisma.lead.update({ where: { id: a }, data: { name: "=HYPERLINK(1)" } });
    const csv = await call(owner, "GET", "/leads/export.csv");
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.body.startsWith(`${String.fromCharCode(0xfeff)}"Reference"`)).toBe(true);
    expect(csv.body).toContain(`"'=HYPERLINK(1)"`);
  });

  it("moves an order by its steps and puts stock back when it is cancelled (D0 R4)", async () => {
    const order = await placeOrder();
    expect(await stockOf("better-day-hp-151a-w1510a-black-toner", "bd-w1510a")).toBe(1);
    const step = (who: Person, input: Record<string, unknown>) =>
      call(who, "POST", `/orders/${order.id}/actions`, input);

    expect(
      (await call(shop, "PATCH", `/orders/${order.id}`, { status: "delivered" })).statusCode,
    ).toBe(422);
    expect((await step(shop, { type: "deliver" })).statusCode).toBe(409);
    // Cash on delivery is confirmed on the phone; there is no proof to verify.
    expect((await step(shop, { type: "confirm", by: "proof" })).statusCode).toBe(409);
    expect((await step(accounts, { type: "confirm", by: "call" })).statusCode).toBe(403);
    const confirmed = await step(shop, { type: "confirm", by: "call" });
    expect(confirmed.json<{ status: string }>().status).toBe("confirmed");
    expect((await step(shop, { type: "ship", courier: "Pathao" })).statusCode).toBe(422);
    const packing = await step(shop, { type: "startPacking" });
    expect(packing.json<{ status: string }>().status).toBe("processing");
    const noted = await call(accounts, "PATCH", `/orders/${order.id}`, { note: "Called twice" });
    expect(noted.statusCode).toBe(200);

    const cancelled = await step(shop, { type: "cancel", reason: "Customer asked" });
    expect(cancelled.json<{ status: string }>().status).toBe("cancelled");
    expect(await stockOf("better-day-hp-151a-w1510a-black-toner", "bd-w1510a")).toBe(3);
    expect((await step(shop, { type: "return", reason: "Twice" })).statusCode).toBe(409);

    const tracked = await app.inject({
      method: "POST",
      url: "/api/v1/public/orders/track",
      headers: { ...INTAKE, "x-client-ip": "10.2.9.1" },
      payload: { reference: order.reference, phone: "01712345678" },
    });
    expect(
      tracked
        .json<{ status: string; history: Array<{ status: string }> }>()
        .history.map((e) => e.status),
    ).toEqual(["placed", "confirmed", "processing", "processing", "cancelled"]);
  });

  it("delivers cash on delivery as paid, and a return puts the stock back (D0 R4)", async () => {
    const order = await placeOrder();
    const step = (input: Record<string, unknown>) =>
      call(shop, "POST", `/orders/${order.id}/actions`, input);
    await step({ type: "confirm", by: "call" });
    await step({ type: "ship", courier: "Pathao", trackingNumber: "PA123456" });
    const delivered = await step({ type: "deliver" });
    expect(delivered.json<{ status: string; paymentVerified: boolean }>()).toMatchObject({
      status: "delivered",
      paymentVerified: true,
    });
    const returned = await step({ type: "return", reason: "Wrong model" });
    expect(returned.json<{ status: string }>().status).toBe("returned");
    expect(await stockOf("better-day-hp-151a-w1510a-black-toner", "bd-w1510a")).toBe(3);
  });

  it("matches a payment proof to its order, verifies it once and confirms the order (D0 R4)", async () => {
    const order = await placeOrder();
    await prisma.order.update({
      where: { id: order.id },
      data: { payment: { method: "bkash", accountId: "acc-bkash" } },
    });
    ip += 1;
    const sent = await app.inject({
      method: "POST",
      url: "/api/v1/public/payment-proofs",
      headers: { ...INTAKE, "x-client-ip": `10.2.0.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        reference: order.reference.toLowerCase(),
        name: "Sample Rahim",
        phone: "+8801712345678",
        amount: order.total,
        accountId: "acc-bkash",
        transactionId: "8N7A6B5C4D",
      },
    });
    expect(sent.statusCode).toBe(201);
    const proof = await prisma.paymentProof.findFirstOrThrow({
      where: { transactionId: "8N7A6B5C4D" },
    });
    expect(proof).toMatchObject({ status: "matched", orderId: order.id });
    const queue = await call(accounts, "GET", "/payment-proofs?status=received");
    expect(
      queue.json<{ items: Array<{ id: string; order: { reference: string } | null }> }>().items,
    ).toContainEqual(
      expect.objectContaining({
        id: proof.id,
        order: expect.objectContaining({ reference: order.reference }),
      }),
    );

    expect(
      (await call(shop, "POST", `/payment-proofs/${proof.id}/actions`, { type: "verify" }))
        .statusCode,
    ).toBe(403);
    const verified = await call(accounts, "POST", `/payment-proofs/${proof.id}/actions`, {
      type: "verify",
    });
    expect(verified.json()).toEqual({ id: proof.id, status: "verified" });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({
      paymentVerified: true,
      status: "confirmed",
    });
    // A decided proof stays decided (D222).
    expect(
      (
        await call(accounts, "POST", `/payment-proofs/${proof.id}/actions`, {
          type: "reject",
          reason: "Changed my mind",
        })
      ).statusCode,
    ).toBe(409);
  });

  it("rejects a short payment proof with a reason (D0 R4)", async () => {
    const order = await placeOrder();
    const proof = await prisma.paymentProof.create({
      data: {
        reference: order.reference,
        name: "Sample Rahim",
        phone: "+8801712345678",
        amount: order.total - 100,
        accountId: "acc-bkash",
        orderId: order.id,
      },
    });
    expect(
      (await call(accounts, "POST", `/payment-proofs/${proof.id}/actions`, { type: "reject" }))
        .statusCode,
    ).toBe(422);
    const rejected = await call(accounts, "POST", `/payment-proofs/${proof.id}/actions`, {
      type: "reject",
      reason: "The amount is ৳100 short",
    });
    expect(rejected.json()).toEqual({ id: proof.id, status: "rejected" });
    expect(await prisma.paymentProof.findUniqueOrThrow({ where: { id: proof.id } })).toMatchObject({
      status: "rejected",
      note: "The amount is ৳100 short",
      decidedBy: "Sample Accounts",
    });
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentVerified,
    ).toBe(false);
  });

  it("moderates feedback into the public snapshot, never without consent", async () => {
    const yes = await prisma.feedback.create({
      data: {
        name: "Sample Karim",
        phone: "+8801812345678",
        service: "flights",
        rating: 5,
        comment: "Found a better fare and called back within the hour.",
        consentToPublish: true,
      },
    });
    const no = await prisma.feedback.create({
      data: {
        name: "Sample Rina",
        phone: "+8801912345678",
        service: "visa",
        comment: "Quick help with the checklist and the forms.",
        consentToPublish: false,
      },
    });
    const snapshot = () =>
      app
        .inject({ method: "GET", url: "/api/v1/public/snapshot", headers: INTAKE })
        .then((r) => r.json<{ feedback: unknown[] }>());
    expect((await snapshot()).feedback).toHaveLength(0);
    expect(
      (await call(editor, "PATCH", `/feedback/${no.id}`, { status: "approved" })).statusCode,
    ).toBe(409);
    expect(
      (await call(editor, "PATCH", `/feedback/${yes.id}`, { status: "approved" })).statusCode,
    ).toBe(200);
    expect((await snapshot()).feedback).toHaveLength(1);
    const queue = (await call(editor, "GET", "/feedback?status=pending")).json<{ total: number }>();
    expect(queue.total).toBe(1);
  });

  it("edits content with validation, versions, roles and a fresh snapshot", async () => {
    const overview = (await call(editor, "GET", "/content")).json<Array<{ key: string }>>();
    expect(overview.map((item) => item.key)).toContain("faqs");
    expect(overview.map((item) => item.key)).not.toContain("products");
    expect((await call(editor, "GET", "/content/products")).statusCode).toBe(403);

    const faqs = (await call(editor, "GET", "/content/faqs")).json<{
      items: Array<{ id: string; version: number; data: Record<string, unknown> }>;
    }>();
    const first = faqs.items[0];
    expect(first).toBeDefined();
    if (!first) return;
    const saved = await call(editor, "PUT", `/content/faqs/${first.id}`, {
      data: { ...first.data, answer: "Yes. Call or WhatsApp us any time during office hours." },
      version: first.version,
    });
    expect(saved.statusCode).toBe(200);
    const stale = await call(editor, "PUT", `/content/faqs/${first.id}`, {
      data: first.data,
      version: first.version,
    });
    expect(stale.statusCode).toBe(409);
    const invalid = await call(editor, "PUT", `/content/faqs/${first.id}`, {
      data: { ...first.data, question: 42 },
    });
    expect(invalid.statusCode).toBe(422);
    const duplicate = await call(editor, "POST", "/content/faqs", { data: first.data });
    expect(duplicate.statusCode).toBe(409);

    const public1 = await app.inject({
      method: "GET",
      url: "/api/v1/public/snapshot",
      headers: INTAKE,
    });
    expect(JSON.stringify(public1.json<{ faqs: unknown[] }>().faqs)).toContain(
      "any time during office hours",
    );

    const ids = faqs.items.map((item) => item.id).reverse();
    const reordered = await call(editor, "PUT", "/content/faqs/order", { ids });
    expect(reordered.json<{ items: Array<{ id: string }> }>().items.map((item) => item.id)).toEqual(
      ids,
    );
    expect(
      (await call(editor, "PUT", "/content/faqs/order", { ids: ids.slice(1) })).statusCode,
    ).toBe(400);

    // Delete moves the record to Trash (D0 R4).
    const removed = await call(editor, "DELETE", `/content/faqs/${first.id}`);
    expect(removed.statusCode).toBe(200);
    expect(removed.json<{ trashId: string }>().trashId).toBeTruthy();
    expect((await call(editor, "GET", `/content/faqs/${first.id}`)).statusCode).toBe(404);
    expect(await prisma.auditLog.count({ where: { entity: "faqs" } })).toBe(3);
  });

  it("saves settings with an optimistic version and keeps role boundaries", async () => {
    const current = (await call(owner, "GET", "/content/leadFormSettings")).json<{
      value: Record<string, unknown>;
      version: number;
    }>();
    const saved = await call(owner, "PUT", "/settings/leadFormSettings", {
      data: { ...current.value, slaMinutes: 20 },
      version: current.version,
    });
    expect(saved.json<{ value: { slaMinutes: number } }>().value.slaMinutes).toBe(20);
    const stale = await call(owner, "PUT", "/settings/leadFormSettings", {
      data: current.value,
      version: current.version,
    });
    expect(stale.statusCode).toBe(409);
    expect(
      (await call(editor, "PUT", "/settings/leadFormSettings", { data: current.value })).statusCode,
    ).toBe(403);
    const shipping = (await call(shop, "GET", "/content/shippingSettings")).json<{
      value: object;
      version: number;
    }>();
    expect(
      (
        await call(shop, "PUT", "/settings/shippingSettings", {
          data: shipping.value,
          version: shipping.version,
        })
      ).statusCode,
    ).toBe(200);
    expect((await call(owner, "PUT", "/settings/nope", { data: {} })).statusCode).toBe(404);
  });

  it("keeps Live booking locked until Phase E, while lock reasons stay editable (#72)", async () => {
    const modes = (await call(owner, "GET", "/content/bookingModes")).json<{
      value: Array<Record<string, unknown>>;
      version: number;
    }>();
    const unlocked = modes.value.map((item, index) =>
      index === 0 ? { ...item, liveLocked: false, mode: "live" } : item,
    );
    const refused = await call(owner, "PUT", "/settings/bookingModes", {
      data: unlocked,
      version: modes.version,
    });
    expect(refused.statusCode).toBe(409);
    expect(refused.json<{ code: string }>().code).toBe("live-locked");
    const reasons = modes.value.map((item) => ({
      ...item,
      lockReason: "Waiting for a provider contract",
    }));
    const saved = await call(owner, "PUT", "/settings/bookingModes", {
      data: reasons,
      version: modes.version,
    });
    expect(saved.statusCode).toBe(200);
  });

  it("manages staff: add, roles, deactivate, reset, own password, last Super Admin kept", async () => {
    const created = await call(owner, "POST", "/users", {
      name: "Sample New Agent",
      email: "New.Agent@example.com",
      roles: ["travel-sales"],
      password: "first-password-123",
    });
    expect(created.statusCode).toBe(201);
    const user = created.json<{ id: string; email: string }>();
    expect(user.email).toBe("new.agent@example.com");
    expect(
      (
        await call(owner, "POST", "/users", {
          name: "X Y",
          email: "new.agent@example.com",
          roles: ["admin"],
          password: "first-password-123",
        })
      ).statusCode,
    ).toBe(409);

    const self = (await call(owner, "GET", "/users"))
      .json<Array<{ id: string; roles: string[] }>>()
      .find((item) => item.roles.includes("super-admin"));
    expect(self).toBeDefined();
    if (!self) return;
    expect(
      (await call(owner, "PATCH", `/users/${self.id}`, { status: "deactivated" })).statusCode,
    ).toBe(400);

    expect(
      (await call(owner, "PATCH", `/users/${agent.id}`, { status: "deactivated" })).statusCode,
    ).toBe(200);
    expect((await call(agent, "GET", "/leads")).statusCode).toBe(401);

    expect(
      (await call(owner, "POST", `/users/${user.id}/password`, { password: "short" })).statusCode,
    ).toBe(422);
    expect(
      (await call(owner, "POST", `/users/${user.id}/password`, { password: "second-password-123" }))
        .statusCode,
    ).toBe(204);

    expect(
      (
        await call(owner, "POST", "/me/password", {
          current: "wrong-password",
          next: "owner-password-456",
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await call(owner, "POST", "/me/password", {
          current: "owner-password-123",
          next: "owner-password-456",
        })
      ).statusCode,
    ).toBe(204);
    expect((await call(owner, "GET", "/users")).statusCode).toBe(200);

    const audit = (await call(owner, "GET", "/audit?entity=staff")).json<{ total: number }>();
    expect(audit.total).toBe(4);
    const directory = (await call(editor, "GET", "/staff")).json<Array<{ name: string }>>();
    expect(directory.map((item) => item.name)).not.toContain("Sample Agent");
  });

  it("summarises the dashboard and the search activity", async () => {
    await submitLead(flight);
    await placeOrder();
    await prisma.searchLog.createMany({
      data: [
        { module: "flights", summary: "DAC → DXB", params: {}, device: "phone", source: "home" },
        { module: "flights", summary: "DAC → DXB", params: {}, device: "phone", source: "home" },
        {
          module: "flights",
          summary: "DAC → BKK",
          params: {},
          device: "desktop",
          source: "flights",
        },
      ],
    });
    const dashboard = (await call(owner, "GET", "/dashboard")).json<{
      leads: { newToday: number; open: number };
      orders: { today: number; revenueThisMonth: number };
      topRoutes: Array<{ summary: string; count: number }>;
    }>();
    expect(dashboard.leads).toMatchObject({ newToday: 1, open: 1 });
    expect(dashboard.orders).toMatchObject({ today: 1, revenueThisMonth: 4300 });
    expect(dashboard.topRoutes[0]).toEqual({ module: "flights", summary: "DAC → DXB", count: 2 });
    // Two weeks of days for the sparklines and the chart, today last (D0 R9).
    const trend = (await call(owner, "GET", "/dashboard")).json<{
      series: Array<{ day: string; leads: number; orders?: number; revenue?: number }>;
      weeks: { leads: { thisWeek: number; lastWeek: number }; orders?: { thisWeek: number } };
      oldestNewAt: string | null;
    }>();
    expect(trend.series).toHaveLength(14);
    expect(trend.series.at(-1)).toMatchObject({ leads: 1, orders: 1, revenue: 4300 });
    expect(trend.weeks.leads).toEqual({ thisWeek: 1, lastWeek: 0 });
    expect(trend.oldestNewAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Without order access the money and orders stay out of the series.
    const agentTrend = (await call(agent, "GET", "/dashboard")).json<{
      series: Array<Record<string, unknown>>;
      weeks: Record<string, unknown>;
    }>();
    expect(agentTrend.series[0]).not.toHaveProperty("revenue");
    expect(agentTrend.weeks).not.toHaveProperty("orders");

    const activity = (await call(agent, "GET", "/search-logs?module=flights")).json<{
      total: number;
      searchToLeadRate: number;
    }>();
    expect(activity.total).toBe(3);
    expect(activity.searchToLeadRate).toBeCloseTo(33.3, 1);
  });
  it("reads the audit log by area, person and Dhaka days, Super Admin and admins only (D0 R9)", async () => {
    await prisma.auditLog.deleteMany();
    await prisma.auditLog.createMany({
      data: [
        {
          actorId: owner.id,
          actorName: "Sample Owner",
          action: "settings.update",
          entity: "contactSettings",
          entityId: "contactSettings",
          at: new Date("2026-10-20T10:00:00+06:00"),
        },
        {
          actorId: agent.id,
          actorName: "Sample Agent",
          action: "lead.status",
          entity: "lead",
          entityId: "lead-1",
          at: new Date("2026-10-21T23:30:00+06:00"),
        },
        {
          actorId: owner.id,
          actorName: "Sample Owner",
          action: "payment-proof.verify",
          entity: "paymentProof",
          entityId: "proof-1",
          at: new Date("2026-10-22T00:30:00+06:00"),
        },
      ],
    });
    const read = async (query: string) => {
      const response = await call(owner, "GET", `/audit?${query}`);
      expect(response.statusCode, response.body).toBe(200);
      return response.json<{ items: Array<{ action: string }> }>().items.map((item) => item.action);
    };

    expect(await read("area=orders")).toEqual(["payment-proof.verify"]);
    expect(await read(`actorId=${agent.id}`)).toEqual(["lead.status"]);
    // 21 Oct in Dhaka ends at midnight Dhaka time, so 00:30 on the 22nd is the next day.
    expect(await read("from=2026-10-21&to=2026-10-21")).toEqual(["lead.status"]);
    expect(await read("from=2026-10-22&to=2026-10-20")).toHaveLength(3);
    expect((await call(owner, "GET", "/audit?area=unknown")).statusCode).toBe(422);
    expect((await call(agent, "GET", "/audit")).statusCode).toBe(403);
  });

  it("invites by email: the link sets a password once, expired and used links fail, and an invite can be sent again (D0 R9)", async () => {
    const tokenFor = async (email: string) => {
      await app.get(NotificationService).idle();
      const mail = mailer.sent.findLast((item) => item.to === email);
      const token = /welcome\?token=([A-Za-z0-9_-]+)/.exec(mail?.text ?? "")?.[1];
      expect(token, mail?.text).toBeTruthy();
      return token ?? "";
    };
    // Five tries in all: the endpoint allows five per address in 15 minutes, like sign-in.
    const accept = (token: string, password: string) =>
      app.inject({ method: "POST", url: "/api/v1/auth/invite", payload: { token, password } });

    const invited = await call(owner, "POST", "/users", {
      name: "Sample Invitee",
      email: "invitee@example.com",
      roles: ["travel-sales"],
    });
    expect(invited.statusCode).toBe(201);
    expect(invited.json<{ invite: { expired: boolean } | null }>().invite).toMatchObject({
      expired: false,
    });
    const token = await tokenFor("invitee@example.com");
    expect(mailer.sent.at(-1)?.subject).toBe("You're invited to Waafa Admin");

    expect((await accept(token, "invitee-password-123")).statusCode).toBe(200);
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { "x-client-ip": "10.9.0.2" },
      payload: { email: "invitee@example.com", password: "invitee-password-123" },
    });
    expect(login.statusCode).toBe(200);
    // Used once; and someone who chose a password gets no new invite.
    expect((await accept(token, "another-password-123")).statusCode).toBe(400);
    const person = await prisma.staffUser.findUniqueOrThrow({
      where: { email: "invitee@example.com" },
    });
    expect((await call(owner, "POST", `/users/${person.id}/invite`)).statusCode).toBe(409);

    // An expired link fails; sending again gives a new link and the old one stops working.
    await call(owner, "POST", "/users", {
      name: "Sample Late",
      email: "late@example.com",
      roles: ["accounts"],
    });
    const late = await prisma.staffUser.findUniqueOrThrow({ where: { email: "late@example.com" } });
    const first = await tokenFor("late@example.com");
    await prisma.staffUser.update({
      where: { id: late.id },
      data: { inviteExpiresAt: new Date(Date.now() - 1000) },
    });
    expect((await accept(first, "late-password-1234")).statusCode).toBe(400);
    expect((await call(owner, "POST", `/users/${late.id}/invite`)).statusCode).toBe(200);
    const second = await tokenFor("late@example.com");
    expect(second).not.toBe(first);
    expect((await accept(first, "late-password-1234")).statusCode).toBe(400);
    expect((await accept(second, "late-password-1234")).statusCode).toBe(200);
    expect((await call(agent, "POST", `/users/${late.id}/invite`)).statusCode).toBe(403);
    // A sixth try from the same address waits.
    expect((await accept(second, "late-password-1234")).statusCode).toBe(429);
  });
});

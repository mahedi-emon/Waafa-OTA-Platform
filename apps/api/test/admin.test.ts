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

  it("applies the status rules, stamps the first response and keeps the timeline and audit", async () => {
    const id = await submitLead(flight);
    const noAmount = await call(agent, "PATCH", `/leads/${id}`, { status: "booked" });
    expect(noAmount.statusCode).toBe(422);
    const noReason = await call(agent, "PATCH", `/leads/${id}`, { status: "lost" });
    expect(noReason.statusCode).toBe(422);

    const quoted = await call(agent, "PATCH", `/leads/${id}`, {
      status: "quoted",
      assigneeId: agent.id,
    });
    expect(quoted.statusCode).toBe(200);
    const detail = quoted.json<{
      status: string;
      firstResponseAt: string | null;
      assignee: { name: string };
    }>();
    expect(detail).toMatchObject({ status: "quoted", assignee: { name: "Sample Agent" } });
    expect(detail.firstResponseAt).not.toBeNull();

    const booked = await call(agent, "PATCH", `/leads/${id}`, { status: "booked", amount: 58500 });
    expect(booked.json<{ amount: number; closedAt: string | null }>()).toMatchObject({
      amount: 58500,
    });

    const noted = await call(agent, "POST", `/leads/${id}/activities`, {
      type: "call",
      body: "Called, sent the fare.",
    });
    expect(noted.statusCode).toBe(201);
    const activities = noted.json<{ activities: Array<{ type: string; actor: string }> }>()
      .activities;
    expect(activities.map((item) => item.type)).toEqual([
      "created",
      "status",
      "assign",
      "status",
      "call",
    ]);
    expect(await prisma.auditLog.count({ where: { action: "lead.update" } })).toBe(2);

    // A visa officer can't open a flight lead.
    expect((await call(visaOfficer, "GET", `/leads/${id}`)).statusCode).toBe(404);
  });

  it("bulk assigns and exports CSV without spreadsheet formulas", async () => {
    const a = await submitLead(flight);
    const b = await submitLead({
      ...flight,
      search: { ...flight.search, legs: [{ from: "DAC", to: "BKK", date: "2026-11-20" }] },
    });
    const bulk = await call(owner, "POST", "/leads/bulk", { ids: [a, b], assigneeId: agent.id });
    expect(bulk.json()).toEqual({ changed: 2 });
    expect(
      (await call(owner, "GET", "/leads?view=unassigned")).json<{ total: number }>().total,
    ).toBe(0);

    await prisma.lead.update({ where: { id: a }, data: { name: "=HYPERLINK(1)" } });
    const csv = await call(owner, "GET", "/leads/export.csv");
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.body.startsWith(`${String.fromCharCode(0xfeff)}"Reference"`)).toBe(true);
    expect(csv.body).toContain(`"'=HYPERLINK(1)"`);
  });

  it("moves an order along the workflow and puts stock back when it is cancelled", async () => {
    const order = await placeOrder();
    expect(await stockOf("better-day-hp-151a-w1510a-black-toner", "bd-w1510a")).toBe(1);

    const jump = await call(shop, "PATCH", `/orders/${order.id}`, { status: "delivered" });
    expect(jump.statusCode).toBe(409);
    const noCourier = await call(shop, "PATCH", `/orders/${order.id}`, { status: "confirmed" });
    expect(noCourier.statusCode).toBe(200);
    expect(
      (await call(shop, "PATCH", `/orders/${order.id}`, { status: "shipped" })).statusCode,
    ).toBe(422);
    expect(
      (await call(accounts, "PATCH", `/orders/${order.id}`, { status: "cancelled" })).statusCode,
    ).toBe(403);
    const paid = await call(accounts, "PATCH", `/orders/${order.id}`, { paymentVerified: true });
    expect(paid.json<{ paymentVerified: boolean }>().paymentVerified).toBe(true);

    const cancelled = await call(shop, "PATCH", `/orders/${order.id}`, {
      status: "cancelled",
      note: "Customer asked",
    });
    expect(cancelled.json<{ status: string; next: string[] }>()).toMatchObject({
      status: "cancelled",
      next: [],
    });
    expect(await stockOf("better-day-hp-151a-w1510a-black-toner", "bd-w1510a")).toBe(3);

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
    ).toEqual(["placed", "confirmed", "confirmed", "cancelled"]);
  });

  it("verifies a payment proof and marks the order paid", async () => {
    const order = await placeOrder();
    const proof = await prisma.paymentProof.create({
      data: {
        reference: order.reference,
        name: "Sample Rahim",
        phone: "+8801712345678",
        amount: order.total,
        accountId: "acc-bkash",
        transactionId: "8N7A6B5C4D",
      },
    });
    expect(
      (await call(shop, "PATCH", `/payment-proofs/${proof.id}`, { status: "verified" })).statusCode,
    ).toBe(403);
    const verified = await call(accounts, "PATCH", `/payment-proofs/${proof.id}`, {
      status: "verified",
    });
    expect(verified.statusCode).toBe(200);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentVerified,
    ).toBe(true);
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

    expect((await call(editor, "DELETE", `/content/faqs/${first.id}`)).statusCode).toBe(204);
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

    const activity = (await call(agent, "GET", "/search-logs?module=flights")).json<{
      total: number;
      searchToLeadRate: number;
    }>();
    expect(activity.total).toBe(3);
    expect(activity.searchToLeadRate).toBeCloseTo(33.3, 1);
  });
});

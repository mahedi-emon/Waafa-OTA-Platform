import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import { loadFixtures } from "@waafa/fixtures";
import { InboxSummarySchema, AdminSearchResultSchema, type Role } from "@waafa/shared";
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

type Person = { headers: { authorization: string } };

describe.skipIf(!dbAvailable)("admin workbench: inbox counts and Ctrl+K search (D0 R1)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let ip = 0;
  let owner: Person;
  let agent: Person;
  let shop: Person;
  let editor: Person;
  let visa: Person;
  let accounts: Person;

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

  async function submitLead(payload: Record<string, unknown>, phone: string, name: string) {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.7.0.${ip}`, "idempotency-key": randomUUID() },
      payload: { contact: { name, phone }, payload, consent: true },
    });
    expect(response.statusCode).toBe(201);
    return response.json<{ reference: string }>().reference;
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
    agent = await person("Sample Agent", ["travel-sales"]);
    shop = await person("Sample Shop", ["shop-manager"]);
    editor = await person("Sample Editor", ["content-editor"]);
    visa = await person("Sample Visa", ["visa-officer"]);
    accounts = await person("Sample Accounts", ["accounts"]);
  });

  it("counts the work each role can open and lists the newest arrivals", async () => {
    const reference = await submitLead(
      {
        module: "flights",
        search: {
          tripType: "one-way",
          legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
          travellers: { adults: 1, childAges: [], infants: 0 },
          cabin: "economy",
        },
      },
      "+8801000000501",
      "Sample Inbox Person",
    );
    await prisma.lead.updateMany({
      where: { reference },
      data: { createdAt: new Date(Date.now() - 2 * 60 * 60_000) },
    });
    await prisma.feedback.create({
      data: {
        name: "Sample Karim",
        phone: "+8801000000502",
        service: "flights",
        comment: "Quick and clear help with the fare.",
        consentToPublish: true,
      },
    });

    const ownerInbox = InboxSummarySchema.parse((await get(owner, "/inbox")).json());
    expect(ownerInbox.counts.newLeads).toBe(1);
    expect(ownerInbox.counts.overdueLeads).toBe(1);
    expect(ownerInbox.counts.feedbackToReview).toBe(1);
    expect(ownerInbox.counts.sampleLeft).toBeGreaterThan(0);
    expect(ownerInbox.recent[0]).toMatchObject({ kind: "lead", title: "Sample Inbox Person" });

    // A travel agent sees leads and group fares, never store queues or the Sample count.
    const agentInbox = InboxSummarySchema.parse((await get(agent, "/inbox")).json());
    expect(agentInbox.counts.newLeads).toBe(1);
    expect(agentInbox.counts).not.toHaveProperty("ordersToConfirm");
    expect(agentInbox.counts).not.toHaveProperty("sampleLeft");
    expect(agentInbox.counts).toHaveProperty("groupFaresEnding");

    // A content editor has no lead modules: no lead counts, only feedback.
    const editorInbox = InboxSummarySchema.parse((await get(editor, "/inbox")).json());
    expect(editorInbox.counts).not.toHaveProperty("newLeads");
    expect(editorInbox.counts.feedbackToReview).toBe(1);
    expect(editorInbox.recent).toEqual([]);

    // The shop manager sees store queues; flights leads are not theirs.
    const shopInbox = InboxSummarySchema.parse((await get(shop, "/inbox")).json());
    expect(shopInbox.counts.newLeads).toBe(0);
    expect(shopInbox.counts).toHaveProperty("ordersToConfirm");
    expect(shopInbox.counts).toHaveProperty("lowStock");
    // They can open payment proofs, but verifying them is Accounts' job.
    expect(shopInbox.counts).not.toHaveProperty("proofsToVerify");
    const accountsInbox = InboxSummarySchema.parse((await get(accounts, "/inbox")).json());
    expect(accountsInbox.counts).toHaveProperty("proofsToVerify");
  });

  it("finds leads by reference, name and phone, customers by phone, and records the role can edit", async () => {
    const reference = await submitLead(
      { module: "contact", topic: "visa", message: "Do you handle Thailand tourist visas?" },
      "+8801000000777",
      "Sample Search Person",
    );

    const byReference = AdminSearchResultSchema.parse(
      (await get(owner, `/search?q=${reference}`)).json(),
    );
    expect(byReference.hits).toContainEqual(
      expect.objectContaining({ kind: "lead", title: "Sample Search Person" }),
    );

    const byPhone = AdminSearchResultSchema.parse(
      (await get(owner, "/search?q=01000000777")).json(),
    );
    expect(byPhone.hits.map((hit) => hit.kind)).toEqual(
      expect.arrayContaining(["lead", "customer"]),
    );
    expect(byPhone.hits.find((hit) => hit.kind === "customer")?.id).toBe("+8801000000777");

    const records = AdminSearchResultSchema.parse((await get(owner, "/search?q=bali")).json());
    expect(records.hits).toContainEqual(
      expect.objectContaining({ kind: "record", contentKey: "tourPackages" }),
    );

    // A shop manager can't edit tour packages, so they never show up; nor do travel leads.
    const shopSearch = AdminSearchResultSchema.parse((await get(shop, "/search?q=bali")).json());
    expect(shopSearch.hits.some((hit) => hit.contentKey === "tourPackages")).toBe(false);
    const shopLeads = AdminSearchResultSchema.parse(
      (await get(shop, `/search?q=${reference}`)).json(),
    );
    expect(shopLeads.hits.some((hit) => hit.kind === "lead")).toBe(false);

    // Customers by phone follow the customer profile's rules: a contact lead is not a visa officer's or a shop
    // manager's customer, so neither of them sees the name behind the number.
    for (const who of [visa, shop]) {
      const people = AdminSearchResultSchema.parse(
        (await get(who, "/search?q=01000000777")).json(),
      );
      expect(people.hits.some((hit) => hit.kind === "customer" || hit.kind === "lead")).toBe(false);
    }

    // Wildcards are plain text, and a query needs two characters.
    expect((await get(owner, "/search?q=%25%25")).statusCode).toBe(200);
    expect((await get(owner, "/search?q=a")).statusCode).toBe(422);
  });
});

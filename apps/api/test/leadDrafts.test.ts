import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LeadDraftsService } from "../src/admin/leadDrafts.service";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const MINUTE = 60_000;
const TRIP = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

type Person = { headers: { authorization: string } };
type DraftList = {
  total: number;
  items: Array<{ id: string; name: string; outcome: string | null }>;
};

describe.skipIf(!dbAvailable)("partial lead capture (issue 250)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let mailer: MemoryMailer;
  let drafts: LeadDraftsService;
  let travel: Person;
  let visa: Person;
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

  const draft = (payload: Record<string, unknown>) => {
    ip += 1;
    return app.inject({
      method: "POST",
      url: "/api/v1/public/leads/drafts",
      headers: { ...INTAKE, "x-client-ip": `10.25.0.${ip}` },
      payload,
    });
  };

  const stepOne = (phone: string, extra: Record<string, unknown> = {}) =>
    draft({
      module: "flights",
      contact: { name: "Sample Karim", phone, ...extra },
      page: "/flights?from=DAC&to=DXB",
      consent: true,
    });

  const list = async (who: Person, _at: Date, view = "open") =>
    (
      await app.inject({
        method: "GET",
        url: `/api/v1/admin/leads/incomplete?view=${view}`,
        headers: who.headers,
      })
    ).json<DraftList>();

  async function fullLead(phone: string) {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.25.1.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        contact: { name: "Sample Karim", phone },
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
  }

  /** Makes every draft look older, as if the visitor left `minutes` ago. */
  const age = (minutes: number) =>
    prisma.leadDraft.updateMany({ data: { createdAt: new Date(Date.now() - minutes * MINUTE) } });

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    mailer = new MemoryMailer();
    app = await testApp(featureModules({ mailer }));
    drafts = app.get(LeadDraftsService);
    travel = await person("Sample Agent", ["travel-sales"]);
    visa = await person("Sample Visa", ["visa-officer"]);
  });

  beforeEach(async () => {
    await prisma.leadDraft.deleteMany({});
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("keeps one Incomplete request per phone and shows it after 30 minutes", async () => {
    expect((await stepOne("+8801700025001")).statusCode).toBe(204);
    expect((await stepOne("+8801700025001", { email: "karim@example.com" })).statusCode).toBe(204);
    expect(await prisma.leadDraft.count()).toBe(1);
    expect((await list(travel, new Date())).total).toBe(0);
    await age(31);
    const open = await list(travel, new Date());
    expect(open.total).toBe(1);
    // Another service's staff never see it.
    expect((await list(visa, new Date())).total).toBe(0);
  });

  it("the full request completes it: no Incomplete request beside the lead", async () => {
    await stepOne("+8801700025002");
    await fullLead("+8801700025002");
    await age(31);
    expect((await list(travel, new Date())).total).toBe(0);
    const row = await prisma.leadDraft.findFirstOrThrow();
    expect(row.completedAt).not.toBeNull();
    expect(row.leadId).not.toBeNull();
    // A phone that already sent this service's request keeps no new draft.
    await stepOne("+8801700025002");
    expect(await prisma.leadDraft.count()).toBe(1);
  });

  it("sends one reminder only when there is an email, and forgets old requests", async () => {
    await stepOne("+8801700025003", { email: "rahim@example.com" });
    await stepOne("+8801700025004");
    await age(40);
    const before = mailer.sent.length;
    expect(await drafts.remindAndPurge(new Date())).toBe(1);
    expect(await drafts.remindAndPurge(new Date())).toBe(0);
    await app.get(NotificationService).idle();
    const mails = mailer.sent.slice(before);
    expect(mails).toHaveLength(1);
    expect(mails[0]!.to).toBe("rahim@example.com");
    expect(mails[0]!.text).toContain("/flights?from=DAC&to=DXB");
    await age(31 * 24 * 60);
    await drafts.remindAndPurge(new Date());
    expect(await prisma.leadDraft.count()).toBe(0);
  });

  it("staff mark it contacted or set it aside; other services can't", async () => {
    await stepOne("+8801700025005");
    await age(31);
    const [item] = (await list(travel, new Date())).items;
    const act = (who: Person, type: string) =>
      app.inject({
        method: "POST",
        url: `/api/v1/admin/leads/incomplete/${item!.id}/actions`,
        headers: who.headers,
        payload: { type },
      });
    expect((await act(visa, "contacted")).statusCode).toBe(404);
    expect((await act(travel, "contacted")).statusCode).toBe(200);
    expect((await list(travel, new Date())).total).toBe(0);
    expect((await list(travel, new Date(), "done")).items[0]).toMatchObject({
      outcome: "contacted",
    });
    const audit = await prisma.auditLog.findFirst({ where: { action: "lead-draft.contacted" } });
    expect(audit?.entityId).toBe(item!.id);
  });

  it("refuses step 1 without consent, another site's page or a bad phone", async () => {
    const base = {
      module: "flights",
      contact: { name: "Sample Karim", phone: "+8801700025006" },
      page: "/flights",
      consent: true,
    };
    expect((await draft({ ...base, consent: false })).statusCode).toBe(422);
    expect((await draft({ ...base, page: "//evil.example/x" })).statusCode).toBe(422);
    expect((await draft({ ...base, page: "https://evil.example" })).statusCode).toBe(422);
    expect((await draft({ ...base, contact: { name: "Sample", phone: "123" } })).statusCode).toBe(
      422,
    );
    expect(await prisma.leadDraft.count()).toBe(0);
  });
});

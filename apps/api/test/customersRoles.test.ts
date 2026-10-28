import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ContentScheduler } from "../src/admin/scheduler.service";
import { SUMMARY_MARKER } from "../src/admin/summaryReports.service";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const TRIP = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const FIRST = "+8801700024401";
const SECOND = "+8801700024402";
/** Saturday 7 Nov 2026 09:05 and 08:30 in Dhaka. */
const SAT_NINE = new Date("2026-11-07T03:05:00Z");
const SAT_EARLY = new Date("2026-11-07T02:30:00Z");

type Person = { headers: { authorization: string } };

describe.skipIf(!dbAvailable)("reports, summaries, customers and custom roles (issue 244)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let mailer: MemoryMailer;
  let ip = 0;
  let owner: Person;
  let admin: Person;
  let agent: Person;
  let visa: Person;
  let shop: Person;

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

  const call = (who: Person, method: string, url: string, payload?: unknown) =>
    app.inject({
      method: method as "GET",
      url: `/api/v1/admin${url}`,
      headers: who.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  async function lead(phone: string, name: string) {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.24.4.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        contact: { name, phone },
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

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    mailer = new MemoryMailer();
    app = await testApp(featureModules({ mailer }));
    app.get(ContentService).invalidate();
    owner = await person("Sample Owner", ["super-admin"]);
    admin = await person("Sample Admin", ["admin"]);
    agent = await person("Sample Agent", ["travel-sales"]);
    visa = await person("Sample Visa", ["visa-officer"]);
    shop = await person("Sample Shop", ["shop-manager"]);
    await lead(FIRST, "Karim Uddin");
    await lead(SECOND, "Karim U.");
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("adds by agent, the funnel and searches per day to the report; visa cases only for visa staff", async () => {
    const today = new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
    const report = (await call(admin, "GET", `/reports?from=${today}&to=${today}`)).json<{
      byAgent: Array<{ name: string; leads: number }>;
      funnel: Array<{ step: string; count: number }>;
      days: Array<{ searches: number }>;
      visa: unknown;
    }>();
    expect(report.funnel.map((step) => step.step)).toEqual([
      "searches",
      "requests",
      "replied",
      "quoted",
      "booked",
    ]);
    expect(report.funnel[1]!.count).toBeGreaterThanOrEqual(2);
    expect(report.byAgent.some((row) => row.name === "Unassigned")).toBe(true);
    expect(report.days[0]).toHaveProperty("searches");
    expect(report.visa).not.toBeNull();
    const shopReport = (await call(shop, "GET", `/reports?from=${today}&to=${today}`)).json<{
      visa: unknown;
    }>();
    expect(shopReport.visa).toBeNull();
  });

  it("sends the daily summary at nine and the weekly one on Saturday, once each", async () => {
    const recipients = await prisma.setting.findUniqueOrThrow({
      where: { key: "leadFormSettings" },
    });
    const value = recipients.value as { staffAlerts?: unknown[] };
    await prisma.setting.update({
      where: { key: "leadFormSettings" },
      data: {
        value: {
          ...value,
          staffAlerts: [
            ...(value.staffAlerts ?? []),
            { email: "owner-summary@example.com", areas: ["daily-report", "weekly-report"] },
          ],
        } as Prisma.InputJsonValue,
      },
    });
    app.get(ContentService).invalidate();
    await prisma.setting.deleteMany({ where: { key: SUMMARY_MARKER } });
    const scheduler = app.get(ContentScheduler);
    expect((await scheduler.tick(SAT_EARLY)).summaries).toEqual([]);
    expect((await scheduler.tick(SAT_NINE)).summaries).toEqual(["daily", "weekly"]);
    expect((await scheduler.tick(new Date(SAT_NINE.getTime() + 60_000))).summaries).toEqual([]);
    await app.get(NotificationService).idle();
    const sent = mailer.sent.filter((mail) => mail.to === "owner-summary@example.com");
    expect(sent.map((mail) => mail.subject).sort()).toEqual([
      expect.stringMatching(/^Waafa daily summary: \d+ requests, \d+ booked$/),
      expect.stringMatching(/^Waafa weekly summary: /),
    ]);
    expect(sent.every((mail) => mail.text.includes("Requests:"))).toBe(true);
  });

  it("keeps notes and tags on a customer, exports them and refuses bad input", async () => {
    const phone = encodeURIComponent(FIRST);
    const tagged = await call(agent, "PATCH", `/customers/${phone}/tags`, {
      tags: ["VIP", " vip ", "Corporate"],
    });
    expect(tagged.json()).toEqual({ tags: ["VIP", "Corporate"] });
    const noted = await call(agent, "POST", `/customers/${phone}/notes`, {
      body: "<b>Prefers window seats</b>",
    });
    expect(noted.statusCode, noted.body).toBe(201);
    expect(noted.json<{ notes: Array<{ body: string }> }>().notes[0]!.body).toBe(
      "<b>Prefers window seats</b>",
    );
    expect((await call(agent, "POST", `/customers/${phone}/notes`, { body: "" })).statusCode).toBe(
      422,
    );
    expect(
      (await call(agent, "PATCH", `/customers/${phone}/tags`, { tags: ["x".repeat(31)] }))
        .statusCode,
    ).toBe(422);
    expect(
      (
        await call(agent, "POST", `/customers/${encodeURIComponent("+8801999999999")}/notes`, {
          body: "x",
        })
      ).statusCode,
    ).toBe(404);

    const list = (await call(agent, "GET", "/customers?tag=vip")).json<{
      items: Array<{ phone: string; tags: string[] }>;
    }>();
    expect(list.items.map((row) => row.phone)).toEqual([FIRST]);
    const csv = await call(agent, "GET", "/customers/export.csv");
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.body).toContain('"VIP; Corporate"');
  });

  it("merges a duplicate number into a customer, undoes it, and keeps merges to managers", async () => {
    const first = encodeURIComponent(FIRST);
    const second = encodeURIComponent(SECOND);
    expect(
      (await call(agent, "POST", `/customers/${second}/merge`, { into: FIRST })).statusCode,
    ).toBe(403);
    expect(
      (await call(admin, "POST", `/customers/${second}/merge`, { into: SECOND })).statusCode,
    ).toBe(409);
    const merged = await call(admin, "POST", `/customers/${second}/merge`, { into: FIRST });
    expect(merged.statusCode, merged.body).toBe(200);
    const detail = merged.json<{ mergedPhones: string[]; leads: unknown[] }>();
    expect(detail.mergedPhones).toEqual([SECOND]);
    expect(detail.leads.length).toBeGreaterThanOrEqual(2);
    expect((await call(admin, "GET", `/customers/${second}`)).json()).toMatchObject({
      mergedInto: FIRST,
    });
    const list = (await call(admin, "GET", `/customers?q=Karim`)).json<{
      items: Array<{ phone: string }>;
    }>();
    expect(list.items.map((row) => row.phone)).toEqual([FIRST]);
    // No chains: nothing can be merged into a number that was merged.
    expect(
      (await call(admin, "POST", `/customers/${first}/merge`, { into: SECOND })).statusCode,
    ).toBe(409);

    expect((await call(admin, "POST", `/customers/${second}/unmerge`)).statusCode).toBe(200);
    expect((await call(admin, "GET", `/customers/${second}`)).json()).toMatchObject({
      phone: SECOND,
      mergedInto: null,
    });
    const audit = await prisma.auditLog.findMany({
      where: { entity: "customer", action: { in: ["customer.merge", "customer.unmerge"] } },
    });
    expect(audit.map((row) => row.action).sort()).toEqual(["customer.merge", "customer.unmerge"]);
  });

  it("lets Super Admin make, change and delete custom roles, never with manager grants", async () => {
    expect(
      (await call(admin, "POST", "/roles", { name: "Senior sales", grants: ["travel-sales"] }))
        .statusCode,
    ).toBe(403);
    expect(
      (await call(owner, "POST", "/roles", { name: "Bad", grants: ["admin"] })).statusCode,
    ).toBe(422);
    const created = await call(owner, "POST", "/roles", {
      name: "Senior sales",
      grants: ["travel-sales", "visa-officer"],
    });
    expect(created.statusCode, created.body).toBe(201);
    const role = created
      .json<Array<{ id: string; name: string; people: number }>>()
      .find((row) => row.name === "Senior sales")!;
    expect(
      (await call(owner, "POST", "/roles", { name: "Senior sales", grants: ["accounts"] }))
        .statusCode,
    ).toBe(409);

    const staffRow = await prisma.staffUser.findFirstOrThrow({ where: { name: "Sample Agent" } });
    const given = await call(owner, "PATCH", `/users/${staffRow.id}`, { customRoleIds: [role.id] });
    expect(given.statusCode, given.body).toBe(200);
    expect(
      (await call(owner, "PATCH", `/users/${staffRow.id}`, { customRoleIds: ["nope"] })).statusCode,
    ).toBe(400);
    expect((await call(owner, "DELETE", `/roles/${role.id}`)).statusCode).toBe(409);
    await call(owner, "PATCH", `/users/${staffRow.id}`, { customRoleIds: [] });
    expect((await call(owner, "DELETE", `/roles/${role.id}`)).statusCode).toBe(200);
    expect(visa).toBeDefined();
  });
});

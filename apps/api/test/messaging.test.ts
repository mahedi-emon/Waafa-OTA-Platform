import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const PROVIDER_SECRET_KEY = "test-provider-secret-key-0123456789-abcdef";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const TOKEN = "123456789:AAEexampleexampleexampleexample1234";
const GROUP = "-1001234567890";
const TRIP = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

type Person = { headers: { authorization: string } };

/** What the fake gateways received, and what the test wants them to say. */
const sms: Array<Record<string, string>> = [];
const posts: Array<Record<string, unknown>> = [];
let smsAnswer: Record<string, unknown> = { response_code: 202 };
let telegramAnswer: { status: number; body: Record<string, unknown> } = {
  status: 200,
  body: { ok: true, result: {} },
};

describe.skipIf(!dbAvailable)("status SMS and Telegram alerts (issue 252)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let owner: Person;
  let sales: Person;
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

  const admin = (who: Person, url: string, payload?: unknown) =>
    app.inject({
      method: "POST",
      url: `/api/v1/admin${url}`,
      headers: who.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  async function lead(phone = "+8801712345678") {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.27.0.${ip}`, "idempotency-key": randomUUID() },
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
    await app.get(NotificationService).idle();
    return response.json<{ reference: string }>();
  }

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(
      featureModules({
        mailer: new MemoryMailer(),
        fetcher: async (url, init) => {
          if (url.includes("bulksms.example")) {
            const body = Object.fromEntries(new URLSearchParams(String(init.body ?? "")));
            if (url.includes("/api/smsapi")) sms.push(body);
            return { status: 200, json: async () => ({ balance: 120.5, ...smsAnswer }) };
          }
          if (url.startsWith("https://api.telegram.org/")) {
            const method = url.split("/").pop() ?? "";
            if (method === "getUpdates")
              return {
                status: 200,
                json: async () => ({
                  ok: true,
                  result: [
                    { message: { chat: { id: 42, type: "private", first_name: "Owner" } } },
                    {
                      my_chat_member: {
                        chat: { id: Number(GROUP), type: "supergroup", title: "Waafa sales" },
                      },
                    },
                  ],
                }),
              };
            if (method === "sendMessage")
              posts.push(JSON.parse(String(init.body)) as Record<string, unknown>);
            return { status: telegramAnswer.status, json: async () => telegramAnswer.body };
          }
          return { status: 200 };
        },
      }),
      { PROVIDER_SECRET_KEY },
    );
    owner = await person("Owner", ["super-admin"]);
    sales = await person("Sales", ["travel-sales"]);
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("sends no SMS and posts nothing while the cards are off", async () => {
    await lead();
    expect(sms).toEqual([]);
    expect(posts).toEqual([]);
    expect(
      await prisma.notificationLog.count({ where: { channel: { in: ["sms", "telegram"] } } }),
    ).toBe(0);
  });

  it("tests the SMS card with the gateway's own words, and sends a test SMS", async () => {
    const keys = {
      settings: { baseUrl: "https://bulksms.example", senderId: "8809601000000" },
      secrets: { apiKey: "bulk-api-key-123456" },
    };
    expect((await admin(owner, "/providers/bulksmsbd/production", keys)).statusCode).toBe(200);
    smsAnswer = { response_code: 1032 };
    const failed = await admin(owner, "/providers/bulksmsbd/production/test");
    expect(failed.json()).toMatchObject({
      health: { ok: false, message: expect.stringContaining("server IP") },
    });
    smsAnswer = { response_code: 202 };
    const passed = await admin(owner, "/providers/bulksmsbd/production/test");
    expect(passed.json()).toMatchObject({ health: { ok: true } });

    const test = await admin(owner, "/providers/bulksmsbd/production/test-sms", {
      phone: "01712-345678",
    });
    expect(test.json()).toEqual({ ok: true, message: expect.stringContaining("accepted") });
    expect(sms.at(-1)).toMatchObject({ number: "8801712345678", senderid: "8809601000000" });
    expect(
      (await admin(sales, "/providers/bulksmsbd/production/test-sms", { phone: "01712345678" }))
        .statusCode,
    ).toBe(403);
    expect(
      (await admin(owner, "/providers/bulksmsbd/production/test-sms", { phone: "<b>" })).statusCode,
    ).toBe(422);
  });

  it("sends the request SMS once the card is on, and logs the gateway's reason when it fails", async () => {
    sms.length = 0;
    expect(
      (await admin(owner, "/providers/bulksmsbd/setting", { isActive: true, isLive: true }))
        .statusCode,
    ).toBe(200);
    const { reference } = await lead();
    expect(sms).toHaveLength(1);
    expect(sms[0]?.message).toContain(reference);
    expect(sms[0]?.number).toBe("8801712345678");
    const sent = await prisma.notificationLog.findFirst({
      where: { channel: "sms", template: "lead-received-sms" },
    });
    expect(sent).toMatchObject({ status: "sent", recipient: "+8801712345678" });

    smsAnswer = { response_code: 1007 };
    await lead("+8801812345678");
    const failed = await prisma.notificationLog.findFirst({
      where: { channel: "sms", recipient: "+8801812345678" },
    });
    expect(failed).toMatchObject({ status: "failed", error: expect.stringContaining("balance") });
    smsAnswer = { response_code: 202 };
  });

  it("skips an SMS template that staff switched off", async () => {
    const row = await prisma.contentDocument.findUniqueOrThrow({
      where: {
        collection_docId: { collection: "notificationTemplates", docId: "lead-received-sms" },
      },
    });
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: row.collection, docId: row.docId } },
      data: { data: { ...(row.data as Record<string, unknown>), enabled: false } },
    });
    sms.length = 0;
    await lead("+8801912345678");
    expect(sms).toEqual([]);
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: row.collection, docId: row.docId } },
      data: { data: row.data as object },
    });
  });

  it("finds the sales group, tests it with a message, then posts new requests there", async () => {
    const found = await admin(owner, "/providers/telegram/groups", { botToken: TOKEN });
    expect(found.statusCode, found.body).toBe(200);
    expect(found.json()).toEqual({ groups: [{ id: GROUP, title: "Waafa sales" }] });
    expect((await admin(sales, "/providers/telegram/groups", { botToken: TOKEN })).statusCode).toBe(
      403,
    );
    const bad = await admin(owner, "/providers/telegram/groups", { botToken: "nope" });
    expect(bad.statusCode).toBe(400);
    expect(bad.json<{ detail: string }>().detail).toContain("@BotFather");

    const keys = { settings: { chatId: GROUP }, secrets: { botToken: TOKEN } };
    expect((await admin(owner, "/providers/telegram/production", keys)).statusCode).toBe(200);
    // The saved token is used when the field is left empty.
    expect((await admin(owner, "/providers/telegram/groups", {})).json()).toMatchObject({
      groups: [{ id: GROUP }],
    });

    telegramAnswer = {
      status: 403,
      body: { ok: false, description: "Forbidden: bot was kicked from the supergroup chat" },
    };
    const kicked = await admin(owner, "/providers/telegram/production/test");
    expect(kicked.json()).toMatchObject({
      health: { ok: false, message: expect.stringContaining("not in the group") },
    });
    telegramAnswer = { status: 200, body: { ok: true, result: {} } };
    const ok = await admin(owner, "/providers/telegram/production/test");
    expect(ok.json()).toMatchObject({ health: { ok: true } });
    expect(posts.at(-1)).toMatchObject({
      chat_id: GROUP,
      text: expect.stringContaining("WAAFA test"),
    });

    expect(
      (await admin(owner, "/providers/telegram/setting", { isActive: true, isLive: true }))
        .statusCode,
    ).toBe(200);
    posts.length = 0;
    const { reference } = await lead("+8801612345678");
    expect(posts).toHaveLength(1);
    const text = String(posts[0]?.text);
    expect(text).toContain(reference);
    expect(text).toContain("/leads/");
    // No phone number or parse mode: plain text, contact details stay in the admin.
    expect(text).not.toContain("1612345678");
    expect(posts[0]).not.toHaveProperty("parse_mode");
  });

  it("keeps taking requests when Telegram is down, and logs the failure", async () => {
    telegramAnswer = { status: 502, body: { ok: false } };
    const { reference } = await lead("+8801512345678");
    expect(reference).toBeTruthy();
    const failed = await prisma.notificationLog.findFirst({
      where: { channel: "telegram", status: "failed" },
      orderBy: { createdAt: "desc" },
    });
    expect(failed?.error).toContain("HTTP 502");
    telegramAnswer = { status: 200, body: { ok: true, result: {} } };
  });
});

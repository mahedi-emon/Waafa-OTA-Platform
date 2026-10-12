import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { IntegrationMailer } from "../src/notifications/integrationMailer";
import { MemoryMailer } from "../src/notifications/mailer";
import { ProvidersService } from "../src/providers/providers.service";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const PROVIDER_SECRET_KEY = "test-provider-secret-key-0123456789-abcdef";

describe.skipIf(!dbAvailable)("external API connections (#82, #107)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let owner: Record<string, string>;
  let manager: Record<string, string>;
  const reached: string[] = [];

  async function person(name: string, roles: Role[]) {
    const user = await prisma.staffUser.create({
      data: { name, email: `${name.toLowerCase()}@example.com`, passwordHash: "x", roles },
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
    return { authorization: `Bearer ${token}` };
  }

  const call = (
    headers: Record<string, string>,
    method: "GET" | "POST" | "DELETE",
    url: string,
    payload?: unknown,
  ) =>
    app.inject({
      method,
      url: `/api/v1/admin/providers${url}`,
      headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  const sabre = {
    settings: { baseUrl: "https://api.cert.example.com", clientId: "client-1", pcc: "AB12" },
    secrets: { clientSecret: "very-secret-value-9876" },
  };

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    app = await testApp(
      featureModules({
        mailer: new MemoryMailer(),
        fetcher: (url) => {
          reached.push(url);
          return Promise.resolve({ status: 401 });
        },
      }),
      { PROVIDER_SECRET_KEY },
    );
    owner = await person("Owner", ["super-admin"]);
    manager = await person("Manager", ["admin"]);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("is Super Admin only", async () => {
    expect((await call(manager, "GET", "")).statusCode).toBe(403);
    expect((await call({}, "GET", "")).statusCode).toBe(401);
    const list = await call(owner, "GET", "");
    expect(list.statusCode).toBe(200);
    const body = list.json<{ encryptionReady: boolean; catalog: Array<{ id: string }> }>();
    expect(body.encryptionReady).toBe(true);
    expect(body.catalog.map((item) => item.id)).toContain("sabre");
  });

  it("saves a connection with the secret sealed at rest and masked in every answer", async () => {
    const saved = await call(owner, "POST", "/sabre/sandbox", sabre);
    expect(saved.statusCode).toBe(200);
    expect(saved.body).not.toContain("very-secret-value");
    expect(saved.json()).toMatchObject({
      provider: "sabre",
      environment: "sandbox",
      secrets: { clientSecret: { set: true, last4: "9876" } },
      health: null,
    });
    const row = await prisma.providerCredential.findUniqueOrThrow({
      where: { provider_environment: { provider: "sabre", environment: "sandbox" } },
    });
    expect(JSON.stringify(row.secrets)).not.toContain("very-secret-value");
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "provider.connect" } });
    expect(JSON.stringify(audit)).not.toContain("very-secret-value");
    expect(audit.after).toMatchObject({ secretsChanged: ["clientSecret"] });
  });

  it("keeps the saved secret when it is left empty, refuses missing fields and http", async () => {
    const kept = await call(owner, "POST", "/sabre/sandbox", {
      ...sabre,
      secrets: { clientSecret: "" },
    });
    expect(kept.statusCode).toBe(200);
    expect(kept.json()).toMatchObject({ secrets: { clientSecret: { set: true, last4: "9876" } } });
    const missing = await call(owner, "POST", "/amadeus/sandbox", { settings: {} });
    expect(missing.statusCode).toBe(422);
    const http = await call(owner, "POST", "/sabre/production", {
      ...sabre,
      settings: { ...sabre.settings, baseUrl: "http://api.example.com" },
    });
    expect(http.statusCode).toBe(422);
    expect((await call(owner, "POST", "/unknown/sandbox", sabre)).statusCode).toBe(422);
  });

  it("tests a connection and records the result", async () => {
    const tested = await call(owner, "POST", "/sabre/sandbox/test");
    expect(tested.statusCode).toBe(200);
    expect(tested.json()).toMatchObject({ health: { ok: true } });
    expect(reached).toEqual(["https://api.cert.example.com"]);
    expect((await call(owner, "POST", "/bkash/sandbox/test")).statusCode).toBe(404);
  });

  it("lists the setting per provider: off and Sandbox until changed", async () => {
    const body = (await call(owner, "GET", "")).json<{
      settings: Array<{ provider: string; kind: string; isActive: boolean; isLive: boolean }>;
    }>();
    expect(body.settings.find((item) => item.provider === "sabre")).toMatchObject({
      kind: "flight",
      isActive: false,
      isLive: false,
    });
    expect(new Set(body.settings.map((item) => item.kind))).toEqual(
      new Set(["flight", "hotel", "payment", "sms", "email", "auth"]),
    );
  });

  it("turns a provider on only with credentials for its mode, with markup and an audit entry", async () => {
    const live = await call(owner, "POST", "/sabre/setting", { isActive: true, isLive: true });
    expect(live.statusCode).toBe(422);
    const on = await call(owner, "POST", "/sabre/setting", {
      isActive: true,
      isLive: false,
      markupType: "percentage",
      markupValue: 5,
    });
    expect(on.statusCode).toBe(200);
    expect(on.json()).toMatchObject({
      isActive: true,
      isLive: false,
      markupType: "percentage",
      markupValue: 5,
    });
    // Payment providers carry no markup.
    await call(owner, "POST", "/sslcommerz/sandbox", {
      settings: { baseUrl: "https://sandbox.sslcommerz.example.com", storeId: "waafa" },
      secrets: { storePassword: "store-pass-0001" },
    });
    const payment = await call(owner, "POST", "/sslcommerz/setting", {
      isActive: true,
      isLive: false,
      markupType: "fixed",
      markupValue: 100,
    });
    expect(payment.json()).toMatchObject({ markupType: "none", markupValue: 0 });
    expect(await prisma.auditLog.count({ where: { action: "integration.update" } })).toBe(2);
  });

  it("gives server code opened credentials and markup, and the site only a mode", async () => {
    const service = app.get(ProvidersService);
    const config = await service.getIntegrationConfig("flight", "sabre");
    expect(config).toMatchObject({
      status: "ready",
      environment: "sandbox",
      secrets: { clientSecret: "very-secret-value-9876" },
      markup: { type: "percentage", value: 5 },
    });
    expect(await service.getIntegrationConfig("flight", "amadeus")).toMatchObject({
      status: "inactive",
    });
    expect(await service.getIntegrationConfig("hotel", "sabre")).toMatchObject({
      status: "unknown",
    });
    expect(await service.resolveCategory("hotel")).toMatchObject({ mode: "manual" });
    const status = await app.inject({
      method: "GET",
      url: "/api/v1/public/integrations/status",
      headers: { "x-intake-key": "test-intake-key-0123456789-abcdef" },
    });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toEqual({
      flight: { mode: "provider" },
      hotel: { mode: "manual" },
      payment: { ready: true },
      sms: { ready: false },
      email: { ready: false },
      auth: { google: false },
    });
    expect(status.body).not.toContain("sabre");
    const anonymous = await app.inject({
      method: "GET",
      url: "/api/v1/public/integrations/status",
    });
    expect(anonymous.statusCode).toBe(401);
  });

  it("reveals a saved secret to the Super Admin only, and logs who looked", async () => {
    expect((await call(manager, "POST", "/sabre/sandbox/reveal/clientSecret")).statusCode).toBe(
      403,
    );
    const shown = await call(owner, "POST", "/sabre/sandbox/reveal/clientSecret");
    expect(shown.statusCode).toBe(200);
    expect(shown.headers["cache-control"]).toBe("no-store");
    expect(shown.json()).toEqual({ field: "clientSecret", value: "very-secret-value-9876" });
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "provider.reveal" } });
    expect(JSON.stringify(audit)).not.toContain("very-secret-value");
    expect((await call(owner, "POST", "/sabre/sandbox/reveal/nope")).statusCode).toBe(404);
  });

  it("adds, connects and removes a custom provider", async () => {
    const added = await call(owner, "POST", "", { kind: "flight", name: "Galileo BD" });
    expect(added.statusCode).toBe(201);
    expect(added.json()).toMatchObject({
      provider: "custom-flight-galileo-bd",
      custom: true,
      isActive: false,
    });
    const again = await call(owner, "POST", "", { kind: "flight", name: "Galileo BD" });
    expect(again.json()).toMatchObject({ provider: "custom-flight-galileo-bd-2" });
    expect((await call(owner, "POST", "", { kind: "hajj", name: "X" })).statusCode).toBe(422);
    // Issue 121: a repeated long name still gets a key the API accepts.
    const longName = "Very long consolidator name used twice in tests";
    await call(owner, "POST", "", { kind: "sms", name: longName });
    const repeated = (await call(owner, "POST", "", { kind: "sms", name: longName })).json<{
      provider: string;
    }>();
    expect(repeated.provider.endsWith("-2")).toBe(true);
    expect(
      (
        await call(owner, "POST", `/${repeated.provider}/setting`, {
          isActive: false,
          isLive: false,
        })
      ).statusCode,
    ).toBe(200);
    const connection = {
      settings: {
        baseUrl: "https://api.galileo.example.com",
        extraHeaders: JSON.stringify({ "X-Agency": "WAAFA" }),
      },
      secrets: { apiKey: "galileo-key-000000001" },
    };
    const connected = await call(owner, "POST", "/custom-flight-galileo-bd/production", connection);
    expect(connected.statusCode).toBe(200);
    const unknown = await call(owner, "POST", "/custom-flight-nothing/production", connection);
    expect(unknown.statusCode).toBe(404);
    expect((await call(owner, "DELETE", "/sabre")).statusCode).toBe(400);
    expect((await call(owner, "DELETE", "/custom-flight-galileo-bd")).statusCode).toBe(204);
    expect(
      await prisma.providerCredential.count({ where: { provider: "custom-flight-galileo-bd" } }),
    ).toBe(0);
  });

  it("sends email through the provider turned on in Admin, else the fallback", async () => {
    const fallback = new MemoryMailer();
    const posted: string[] = [];
    const fetcher = ((url: string) => {
      posted.push(url);
      return Promise.resolve(new Response("{}", { status: 200 }));
    }) as typeof fetch;
    const before = new IntegrationMailer(prisma, PROVIDER_SECRET_KEY, fallback, fetcher);
    await before.send({ to: "a@example.com", subject: "s", text: "t" });
    expect(fallback.sent).toHaveLength(1);
    await call(owner, "POST", "/resend/sandbox", {
      settings: { baseUrl: "https://api.resend.example.com", from: "WAAFA <info@example.com>" },
      secrets: { apiKey: "re_test_key_00000001" },
    });
    await call(owner, "POST", "/resend/setting", { isActive: true, isLive: false });
    const after = new IntegrationMailer(prisma, PROVIDER_SECRET_KEY, fallback, fetcher);
    await after.send({ to: "b@example.com", subject: "s", text: "t" });
    expect(posted).toEqual(["https://api.resend.example.com/emails"]);
    expect(fallback.sent).toHaveLength(1);
  });

  it("removes a connection", async () => {
    expect((await call(owner, "DELETE", "/sabre/sandbox")).statusCode).toBe(204);
    expect(await prisma.providerCredential.count({ where: { provider: "sabre" } })).toBe(0);
    // Its mode's credentials are gone, so the provider is off again.
    const setting = await prisma.integrationSetting.findUniqueOrThrow({
      where: { provider: "sabre" },
    });
    expect(setting.isActive).toBe(false);
    expect(await prisma.auditLog.count({ where: { action: "provider.remove" } })).toBe(1);
  });

  it("refuses secrets when the server has no encryption key", async () => {
    const plain = await testApp(featureModules({ mailer: new MemoryMailer() }));
    try {
      const response = await plain.inject({
        method: "POST",
        url: "/api/v1/admin/providers/sabre/sandbox",
        headers: owner,
        payload: sabre,
      });
      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({ code: "no-encryption-key" });
    } finally {
      await plain.close();
    }
  });
});

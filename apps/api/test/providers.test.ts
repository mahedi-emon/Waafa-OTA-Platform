import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const PROVIDER_SECRET_KEY = "test-provider-secret-key-0123456789-abcdef";

describe.skipIf(!dbAvailable)("external API connections (#82)", () => {
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
    enabled: true,
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
      enabled: true,
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
    const missing = await call(owner, "POST", "/amadeus/sandbox", { enabled: true, settings: {} });
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

  it("removes a connection", async () => {
    expect((await call(owner, "DELETE", "/sabre/sandbox")).statusCode).toBe(204);
    expect(await prisma.providerCredential.count()).toBe(0);
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

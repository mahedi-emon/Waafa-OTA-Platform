import { loadFixtures } from "@waafa/fixtures";
import { CONTENT_KEYS, CONTENT_MODEL } from "@waafa/shared";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";
import type { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

describe("environment", () => {
  const base = {
    DATABASE_URL: "postgresql://x@localhost/y",
    JWT_SECRET: "a-real-looking-secret-0123456789-abcdefgh",
    REVALIDATE_SECRET: "another-real-secret-0123456789",
    INTAKE_KEY: "intake-key-0123456789-abcdefgh",
  };

  it("parses lists and defaults in development", () => {
    const env = loadEnv({ ...base, WEB_ORIGINS: "http://a.test, http://b.test" });
    expect(env.WEB_ORIGINS).toEqual(["http://a.test", "http://b.test"]);
    expect(env.PORT).toBe(4000);
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("refuses to start production without Redis, email and real secrets", () => {
    expect(() => loadEnv({ ...base, NODE_ENV: "production" })).toThrow(/REDIS_URL/);
    expect(() =>
      loadEnv({
        ...base,
        NODE_ENV: "production",
        REDIS_URL: "redis://r:6379",
        RESEND_API_KEY: "re_x",
        WEB_ORIGINS: "https://waafasworld.com",
        JWT_SECRET: "change-me-0123456789-0123456789-0123456789",
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it("rejects short secrets", () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
  });
});

describe("content model", () => {
  it("covers every admin-managed fixture key, and every fixture record passes its schema", () => {
    const data = loadFixtures() as unknown as Record<string, unknown>;
    for (const key of CONTENT_KEYS) {
      expect(data[key], key).toBeDefined();
      const entry = CONTENT_MODEL[key];
      const value = data[key];
      if (entry.kind === "singleton") expect(entry.schema.safeParse(value).success, key).toBe(true);
      else
        for (const record of value as unknown[])
          expect(entry.schema.safeParse(record).success, key).toBe(true);
    }
  });
});

describe.skipIf(!dbAvailable)("health and errors", () => {
  let app: NestFastifyApplication;
  beforeAll(async () => {
    app = await testApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it("answers /health and /ready (database up) with a request ID", async () => {
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });
    expect(health.headers["x-request-id"]).toBeTruthy();
    const ready = await app.inject({ method: "GET", url: "/ready" });
    expect(ready.json()).toEqual({ status: "ready", database: "up" });
  });

  it("keeps an incoming request ID and answers unknown routes as RFC 7807 problems", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/nothing-here",
      headers: { "x-request-id": "test-request-0001" },
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.json()).toMatchObject({ status: 404, requestId: "test-request-0001" });
  });
});

describe.skipIf(!dbAvailable)("seed", () => {
  let prisma: PrismaClient;
  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("loads content once, never overwrites admin edits, and creates the first Super Admin once", async () => {
    const admin = { email: "Owner@Example.com", password: "a-long-test-password" };
    const first = await seedDatabase(prisma, loadFixtures(), { admin });
    expect(first.settings).toBeGreaterThan(10);
    expect(first.documents).toBeGreaterThan(100);
    expect(first.adminCreated).toBe(true);

    await prisma.setting.update({
      where: { key: "maintenanceSettings" },
      data: { value: { enabled: true, message: "Edited in Admin" } },
    });
    const second = await seedDatabase(prisma, loadFixtures(), { admin });
    expect(second).toEqual({ settings: 0, documents: 0, adminCreated: false });
    const kept = await prisma.setting.findUnique({ where: { key: "maintenanceSettings" } });
    expect(kept?.value).toEqual({ enabled: true, message: "Edited in Admin" });

    const staff = await prisma.staffUser.findMany();
    expect(staff).toHaveLength(1);
    expect(staff[0]?.email).toBe("owner@example.com");
    expect(staff[0]?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("refuses a weak first password", async () => {
    await resetDatabase(prisma);
    await expect(
      seedDatabase(prisma, {}, { admin: { email: "a@b.test", password: "short" } }),
    ).rejects.toThrow(/at least 12/);
  });
});

import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import { Redis } from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RateLimitService } from "../src/common/rateLimit.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testEnv, testPrisma } from "./helpers";

const REDIS_URL = process.env.API_TEST_REDIS_URL;

/** Waits until the service's Redis connection is ready, so a test measures Redis and not the fallback. */
async function ready(service: RateLimitService): Promise<void> {
  const redis = (service as unknown as { redis: Redis | null }).redis;
  if (!redis) return;
  for (let attempt = 0; attempt < 50 && redis.status !== "ready"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  expect(redis.status).toBe("ready");
}

describe("rate limits (issue 234)", () => {
  it("counts in this process without Redis, per key and per window", async () => {
    const limits = new RateLimitService(testEnv());
    const now = Date.UTC(2026, 9, 26, 10, 0, 0);
    for (let index = 0; index < 5; index += 1) {
      expect(await limits.allow("login", "10.0.0.1", now + index)).toBe(true);
    }
    expect(await limits.allow("login", "10.0.0.1", now + 10)).toBe(false);
    expect(await limits.allow("login", "10.0.0.2", now + 10)).toBe(true);
    // The next 15-minute window starts fresh.
    expect(await limits.allow("login", "10.0.0.1", now + 15 * 60_000)).toBe(true);
    await limits.onModuleDestroy();
  });

  it("raises every limit by RATE_LIMIT_FACTOR (end-to-end runs only)", async () => {
    const limits = new RateLimitService(testEnv({ RATE_LIMIT_FACTOR: "3" }));
    const now = Date.UTC(2026, 9, 26, 10, 0, 0);
    for (let index = 0; index < 15; index += 1) {
      expect(await limits.allow("login", "10.0.0.1", now)).toBe(true);
    }
    expect(await limits.allow("login", "10.0.0.1", now)).toBe(false);
    await limits.onModuleDestroy();
  });

  it("falls back to this process when Redis can't be reached, so limits still hold", async () => {
    const limits = new RateLimitService(testEnv({ REDIS_URL: "redis://127.0.0.1:1" }));
    const now = Date.now();
    for (let index = 0; index < 5; index += 1) {
      expect(await limits.allow("login", "10.0.0.9", now)).toBe(true);
    }
    expect(await limits.allow("login", "10.0.0.9", now)).toBe(false);
    await limits.onModuleDestroy();
  });

  it.skipIf(!REDIS_URL)("shares counts through Redis, so a restart keeps them", async () => {
    const key = `10.9.${randomUUID()}`;
    const before = new RateLimitService(testEnv({ REDIS_URL: REDIS_URL ?? "" }));
    await ready(before);
    for (let index = 0; index < 5; index += 1) {
      expect(await before.allow("login", key)).toBe(true);
    }
    await before.onModuleDestroy();

    // A new process (an API restart, or a second replica) sees the same count.
    const after = new RateLimitService(testEnv({ REDIS_URL: REDIS_URL ?? "" }));
    await ready(after);
    expect(await after.allow("login", key)).toBe(false);

    // Nothing readable is stored: the key is a hash, and it expires with its window.
    const redis = new Redis(REDIS_URL ?? "");
    const keys = await redis.keys("rl:login:*");
    expect(keys.some((item) => item.includes(key))).toBe(false);
    const ttl = await redis.pttl(keys[0] ?? "");
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(15 * 60_000);
    await redis.quit();
    await after.onModuleDestroy();
  });
});

describe.skipIf(!dbAvailable)("lead limit per phone number (NFR-SEC, issue 234)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
  });
  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("takes 10 requests an hour from one phone, from any address", async () => {
    const lead = (phone: string) => ({
      contact: { name: "Sample Caller", phone },
      consent: true,
      payload: { module: "contact", topic: "other", message: "Please call me about a trip." },
    });
    const send = (phone: string, index: number) =>
      app.inject({
        method: "POST",
        url: "/api/v1/public/leads",
        headers: {
          "x-intake-key": "test-intake-key-0123456789-abcdef",
          "x-client-ip": `10.3.0.${index}`,
          "idempotency-key": randomUUID(),
        },
        payload: lead(phone),
      });
    for (let index = 0; index < 10; index += 1) {
      const response = await send("+8801000000777", index);
      expect(response.statusCode, response.body).toBe(201);
    }
    const blocked = await send("+8801000000777", 50);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json<{ detail: string }>().detail).toMatch(/phone number/);
    expect((await send("+8801000000778", 51)).statusCode).toBe(201);
  });
});

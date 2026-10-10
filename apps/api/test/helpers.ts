import { PrismaPg } from "@prisma/adapter-pg";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp, type FeatureFactory } from "../src/app";
import { loadEnv, type Env } from "../src/config/env";
import { PrismaClient } from "../src/generated/prisma/client";

export const TEST_DATABASE_URL =
  process.env.API_TEST_DATABASE_URL ?? "postgresql://waafa@localhost:5433/waafa_test";

/** True when globalSetup found a database; database suites use `describe.skipIf(!dbAvailable)`. */
export const dbAvailable = process.env.API_TEST_DB !== "off";

export function testEnv(overrides: Partial<Record<string, string>> = {}): Env {
  return loadEnv({
    NODE_ENV: "test",
    DATABASE_URL: TEST_DATABASE_URL,
    JWT_SECRET: "test-jwt-secret-0123456789-0123456789-abc",
    REVALIDATE_SECRET: "test-revalidate-secret-0123456789",
    INTAKE_KEY: "test-intake-key-0123456789-abcdef",
    WEB_ORIGINS: "http://localhost:3000",
    ...overrides,
  });
}

export async function testApp(
  features?: FeatureFactory,
  overrides?: Partial<Record<string, string>>,
): Promise<NestFastifyApplication> {
  const app = await createApp(testEnv(overrides), features);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

export function testPrisma(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }) });
}

/** Empties every table between suites (fast TRUNCATE … CASCADE). */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map((table) => `"public"."${table.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

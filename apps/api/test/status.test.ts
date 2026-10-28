import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import { MemoryMailer } from "../src/notifications/mailer";
import type { PrismaClient } from "../src/generated/prisma/client";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";

describe.skipIf(!dbAvailable)("System status disk use (issue 303)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  const root = mkdtempSync(join(tmpdir(), "waafa-status-"));

  async function headers(roles: Role[]) {
    const user = await prisma.staffUser.create({
      data: {
        name: `Status ${roles[0]}`,
        email: `${randomUUID()}@example.com`,
        passwordHash: "x",
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
      { sub: user.id, sid: session.id, name: user.name, email: user.email, roles },
      JWT_SECRET,
    );
    return { authorization: `Bearer ${token}` };
  }

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    for (const dir of ["media/2026/10", "private", "backups"]) {
      mkdirSync(join(root, dir), { recursive: true });
    }
    writeFileSync(join(root, "media/2026/10/a.webp"), Buffer.alloc(2048));
    writeFileSync(join(root, "private/visa.pdf"), Buffer.alloc(1024));
    writeFileSync(join(root, "backups/waafa-1.sql.gz"), Buffer.alloc(4096));
    app = await testApp(featureModules({ mailer: new MemoryMailer() }), {
      MEDIA_DIR: join(root, "media"),
      PRIVATE_FILES_DIR: join(root, "private"),
      BACKUPS_DIR: join(root, "backups"),
      WAAFA_RELEASE: "test",
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    rmSync(root, { recursive: true, force: true });
  });

  it("shows what fills the disk to Super Admin: database, uploads, customer files and backups", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/status",
      headers: await headers(["super-admin"]),
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { usage: Record<string, number | null> };
    expect(body.usage.database).toBeGreaterThan(0);
    expect(body.usage).toMatchObject({ uploads: 2048, customerFiles: 1024, backups: 4096 });
  });

  it("is not open to travel sales", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/status",
      headers: await headers(["travel-sales"]),
    });
    expect(response.statusCode).toBe(403);
  });
});

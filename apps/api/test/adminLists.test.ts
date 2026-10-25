import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";

describe.skipIf(!dbAvailable)("admin lists and fixed records (issue 229)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let admin: Record<string, string>;

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

  const get = (url: string) =>
    app.inject({ method: "GET", url: `/api/v1/admin/${url}`, headers: admin });

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
    app.get(ContentService).invalidate();
    admin = await person("Owner", ["super-admin"]);
  });
  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("never moves a fixed record (message template, home section, menu…) to Trash", async () => {
    const template = await prisma.contentDocument.findFirstOrThrow({
      where: { collection: "notificationTemplates" },
    });
    const refused = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/content/notificationTemplates/${template.docId}`,
      headers: admin,
    });
    expect(refused.statusCode).toBe(409);
    expect(refused.json<{ code: string }>().code).toBe("fixed");
    expect(await prisma.trashItem.count()).toBe(0);
  });

  it("searches subscribers, sent emails, search activity and the audit log by words", async () => {
    await prisma.subscriber.createMany({
      data: [{ email: "rahim@example.com" }, { email: "karim@example.com" }],
    });
    await prisma.notificationLog.createMany({
      data: [
        {
          channel: "email",
          recipient: "a@example.com",
          template: "x",
          subject: "Your visa",
          status: "sent",
        },
        {
          channel: "email",
          recipient: "b@example.com",
          template: "x",
          subject: "New order",
          status: "sent",
        },
      ],
    });
    await prisma.searchLog.createMany({
      data: [
        { module: "flights", summary: "DAC → DXB", params: {} },
        { module: "flights", summary: "DAC → BKK", params: {} },
      ],
    });
    await prisma.auditLog.createMany({
      data: [
        { actorName: "Nadia", action: "content.update", entity: "faqs", entityId: "baggage" },
        { actorName: "Rafi", action: "lead.status", entity: "lead", entityId: "FLT-1" },
      ],
    });

    const subscribers = (await get("subscribers?q=RAHIM")).json<{
      items: Array<{ email: string }>;
    }>();
    expect(subscribers.items.map((row) => row.email)).toEqual(["rahim@example.com"]);
    const emails = (await get("notifications?q=visa")).json<{
      items: Array<{ subject: string }>;
    }>();
    expect(emails.items.map((row) => row.subject)).toEqual(["Your visa"]);
    const searches = (await get("search-logs?q=bkk")).json<{ items: Array<{ summary: string }> }>();
    expect(searches.items.map((row) => row.summary)).toEqual(["DAC → BKK"]);
    const audit = (await get("audit?q=nadia")).json<{ items: Array<{ actor: string }> }>();
    expect(audit.items.map((row) => row.actor)).toEqual(["Nadia"]);
    expect((await get("trash?q=nothing-like-this")).json<{ total: number }>().total).toBe(0);
  });
});

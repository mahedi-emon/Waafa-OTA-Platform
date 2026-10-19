import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import { loadFixtures } from "@waafa/fixtures";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };

type Faq = { id: string; order: number; question: string };
type Item = { id: string; version: number; data: Faq };

describe.skipIf(!dbAvailable)("list order: the admin list owns each record's order (#205)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let editor: { headers: { authorization: string } };

  const call = (method: "GET" | "POST" | "PUT", url: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/api/v1/admin${url}`,
      headers: editor.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  /** The FAQs as the website shows them: sorted by their own order (apps/web/src/lib/data/query.ts). */
  async function siteOrder(): Promise<string[]> {
    app.get(ContentService).invalidate();
    const snapshot = await app.inject({
      method: "GET",
      url: "/api/v1/public/snapshot",
      headers: INTAKE,
    });
    return [...snapshot.json<{ faqs: Faq[] }>().faqs]
      .sort((a, b) => a.order - b.order)
      .map((faq) => faq.id);
  }

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app.get(ContentService).invalidate();
    const user = await prisma.staffUser.create({
      data: {
        name: "Sample Editor",
        email: "sample.editor@example.com",
        passwordHash: await argon2.hash("not-used-in-this-test", { type: argon2.argon2id }),
        roles: ["content-editor"],
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
      {
        sub: user.id,
        sid: session.id,
        name: user.name,
        email: user.email,
        roles: ["content-editor"],
      },
      JWT_SECRET,
    );
    editor = { headers: { authorization: `Bearer ${token}` } };
  });

  it("shows a new list order on the site and in the admin", async () => {
    const before = (await call("GET", "/content/faqs")).json<{ items: Item[] }>().items;
    expect(before.length).toBeGreaterThan(2);
    expect(await siteOrder()).toEqual(before.map((item) => item.id));

    const ids = before.map((item) => item.id).reverse();
    expect((await call("PUT", "/content/faqs/order", { ids })).statusCode).toBe(200);

    expect(await siteOrder()).toEqual(ids);
    const after = (await call("GET", "/content/faqs")).json<{ items: Item[] }>().items;
    expect(after.map((item) => item.id)).toEqual(ids);
  });

  it("never moves a record when it is saved, and puts new records and copies last", async () => {
    const items = (await call("GET", "/content/faqs")).json<{ items: Item[] }>().items;
    const first = items[0];
    if (!first) throw new Error("no faqs");

    // A save that carries an old or made-up order keeps the record where it is.
    const saved = await call("PUT", `/content/faqs/${first.id}`, {
      data: { ...first.data, order: 999, question: "Sample: can I pay in instalments?" },
      version: first.version,
    });
    expect(saved.statusCode).toBe(200);
    expect(saved.json<Item>().data.order).toBe(first.data.order);

    const created = await call("POST", "/content/faqs", {
      data: { ...first.data, id: "sample-new-question", order: 0 },
    });
    expect(created.statusCode).toBe(201);
    const highest = Math.max(...items.map((item) => item.data.order));
    expect(created.json<Item>().data.order).toBe(highest + 1);

    const copy = await call("POST", `/content/faqs/${first.id}/duplicate`);
    expect(copy.json<Item>().data.order).toBe(highest + 2);
    expect((await siteOrder()).slice(-2)).toEqual(["sample-new-question", `${first.id}-copy`]);
  });
});

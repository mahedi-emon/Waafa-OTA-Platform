import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";

type Person = { headers: { authorization: string } };
type RecordsPage = {
  total: number;
  page: number;
  pageSize: number;
  items: Array<{ id: string; title: string; data: Record<string, unknown> }>;
};

describe.skipIf(!dbAvailable)("the shared DataTable's list endpoints (D0 R5)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let owner: Person;
  let editor: Person;

  async function person(name: string, roles: Role[]): Promise<Person> {
    const user = await prisma.staffUser.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        passwordHash: await argon2.hash("not-used-in-this-test", { type: argon2.argon2id }),
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
      { sub: user.id, sid: session.id, name, email: user.email, roles },
      JWT_SECRET,
    );
    return { headers: { authorization: `Bearer ${token}` } };
  }

  const call = (who: Person, method: "GET" | "POST", url: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/api/v1/admin${url}`,
      headers: who.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });
  const records = async (key: string, query = "") =>
    (await call(owner, "GET", `/content/${key}/records${query}`)).json<RecordsPage>();

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
    owner = await person("Sample Owner", ["super-admin"]);
    editor = await person("Sample Editor", ["content-editor"]);
  });

  it("searches, filters by chip, sorts and pages a content list", async () => {
    const all = await records("tourPackages");
    expect(all.total).toBeGreaterThan(1);
    expect(all.items.length).toBe(Math.min(all.total, 25));

    const found = await records("tourPackages", "?q=kathmandu");
    expect(found.items.map((item) => item.id)).toContain("kathmandu-and-pokhara");
    expect(found.total).toBeLessThan(all.total);

    const live = await records("tourPackages", "?chip=live");
    expect(live.items.every((item) => item.data.status === "published")).toBe(true);

    const sorted = await records("tourPackages", "?sort=title.desc");
    const titles = sorted.items.map((item) => item.title);
    expect(titles).toEqual([...titles].sort((a, b) => b.localeCompare(a)));

    const second = await records("airports", "?page=2&pageSize=25");
    const first = await records("airports", "?pageSize=25");
    expect(second.page).toBe(2);
    if (first.total > 25) expect(second.items[0]?.id).not.toBe(first.items[0]?.id);

    // Only the page sizes the table offers, and no unknown sort.
    expect((await call(owner, "GET", "/content/tourPackages/records?pageSize=30")).statusCode).toBe(
      422,
    );
    expect(
      (await call(owner, "GET", "/content/tourPackages/records?sort=price.asc")).statusCode,
    ).toBe(422);
  });

  it("runs one step on many records, each through the normal save, and skips the ones it can't change", async () => {
    const live = await records("tourPackages", "?chip=live");
    const ids = live.items.slice(0, 2).map((item) => item.id);
    expect(ids).toHaveLength(2);

    const unpublished = await call(owner, "POST", "/content/tourPackages/bulk", {
      ids,
      action: "unpublish",
    });
    expect(unpublished.statusCode).toBe(200);
    expect(unpublished.json()).toMatchObject({ changed: 2 });
    const drafts = await records("tourPackages", "?chip=draft");
    expect(drafts.items.map((item) => item.id)).toEqual(expect.arrayContaining(ids));

    const archived = await call(owner, "POST", "/content/tourPackages/bulk", {
      ids,
      action: "archive",
    });
    expect(archived.json()).toMatchObject({ changed: 2 });

    // An archived record is restored before it can go live again: Publish skips both, never forces them.
    const again = await call(owner, "POST", "/content/tourPackages/bulk", {
      ids,
      action: "publish",
    });
    expect(again.json()).toMatchObject({ changed: 0 });
    expect(again.json<{ skipped: string[] }>().skipped).toHaveLength(2);

    const trashed = await call(owner, "POST", "/content/tourPackages/bulk", {
      ids,
      action: "trash",
    });
    expect(trashed.json()).toMatchObject({ changed: 2 });
    expect(await prisma.trashItem.count({ where: { collection: "tourPackages" } })).toBe(2);

    // Every record got its own History and audit row.
    expect(
      await prisma.auditLog.count({ where: { entity: "tourPackages", entityId: { in: ids } } }),
    ).toBeGreaterThanOrEqual(4);

    expect(
      (await call(owner, "POST", "/content/tourPackages/bulk", { ids: [], action: "trash" }))
        .statusCode,
    ).toBe(422);
  });

  it("moves one record a place earlier or later in the site's order", async () => {
    const before = (await records("faqs", "?pageSize=100")).items.map((item) => item.id);
    expect(before.length).toBeGreaterThan(2);
    const [first, second] = before as [string, string];

    const moved = await call(editor, "POST", `/content/faqs/${first}/move`, { by: 1 });
    expect(moved.statusCode).toBe(200);
    const after = (await records("faqs", "?pageSize=100")).items.map((item) => item.id);
    expect(after.slice(0, 2)).toEqual([second, first]);

    // The first record can't go earlier: nothing changes.
    await call(editor, "POST", `/content/faqs/${second}/move`, { by: -1 });
    expect((await records("faqs", "?pageSize=100")).items.map((item) => item.id)).toEqual(after);

    expect(
      (await call(editor, "POST", "/content/faqs/no-such-record/move", { by: 1 })).statusCode,
    ).toBe(404);
  });

  it("searches and sorts feedback and payment proofs", async () => {
    await prisma.feedback.createMany({
      data: [
        {
          name: "Sample Rahim",
          phone: "+8801711000001",
          service: "Visa",
          comment: "Quick visa help",
          consentToPublish: true,
        },
        {
          name: "Sample Karim",
          phone: "+8801711000002",
          service: "Flights",
          comment: "Good fare",
          consentToPublish: false,
        },
      ],
    });
    const feedback = (await call(owner, "GET", "/feedback?status=pending&q=visa")).json<{
      total: number;
      items: Array<{ name: string }>;
    }>();
    expect(feedback.items.map((item) => item.name)).toEqual(["Sample Rahim"]);

    await prisma.paymentProof.createMany({
      data: [
        {
          reference: "WS-SAMPLE-1",
          name: "Sample One",
          phone: "+8801711000003",
          amount: 5000,
          accountId: "bkash",
        },
        {
          reference: "WS-SAMPLE-2",
          name: "Sample Two",
          phone: "+8801711000004",
          amount: 900,
          accountId: "bkash",
          transactionId: "TX12345",
        },
      ],
    });
    const byTx = (await call(owner, "GET", "/payment-proofs?status=received&q=tx123")).json<{
      items: Array<{ reference: string }>;
    }>();
    expect(byTx.items.map((item) => item.reference)).toEqual(["WS-SAMPLE-2"]);
    const byAmount = (
      await call(owner, "GET", "/payment-proofs?status=received&sort=amount.asc")
    ).json<{
      items: Array<{ amount: number }>;
    }>();
    const amounts = byAmount.items.map((item) => item.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  });
});

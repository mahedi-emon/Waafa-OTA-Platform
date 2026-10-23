import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentScheduler, TRASH_DAYS } from "../src/admin/scheduler.service";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const DAY = 86_400_000;

type Person = { headers: { authorization: string } };
type Saved = {
  id: string;
  version: number;
  data: Record<string, unknown>;
  sampleCleared: boolean;
};

describe.skipIf(!dbAvailable)("status automation, Trash and slug redirects (D0 R4)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let mailer: MemoryMailer;
  let owner: Person;
  let editor: Person;
  let agent: Person;
  let ip = 0;

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

  const call = (
    who: Person,
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    payload?: unknown,
  ) =>
    app.inject({
      method,
      url: `/api/v1/admin${url}`,
      headers: who.headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  const record = async (key: string, id: string) =>
    (await call(owner, "GET", `/content/${key}/${id}`)).json<Saved>();

  const snapshot = async () =>
    (await app.inject({ method: "GET", url: "/api/v1/public/snapshot", headers: INTAKE })).json<
      Record<string, unknown>
    >();

  beforeAll(async () => {
    prisma = testPrisma();
    mailer = new MemoryMailer();
    app = await testApp(featureModules({ mailer }), { STAFF_ALERT_EMAIL: "desk@example.com" });
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app.get(ContentService).invalidate();
    mailer.sent.length = 0;
    owner = await person("Sample Owner", ["super-admin"]);
    editor = await person("Sample Editor", ["content-editor"]);
    agent = await person("Sample Agent", ["travel-sales"]);
  });

  it("moves content only by its buttons; the data's own status is ignored", async () => {
    const slug = "kathmandu-and-pokhara";
    const live = await record("tourPackages", slug);
    expect(live.data.status).toBe("published");

    // A plain save that says "draft" keeps the record live.
    const sneaky = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: { ...live.data, status: "draft" },
      version: live.version,
    });
    expect(sneaky.json<Saved>().data.status).toBe("published");

    // A live record is unpublished, never "saved as a draft".
    const refused = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: live.data,
      action: { type: "saveDraft" },
    });
    expect(refused.statusCode).toBe(409);
    expect(refused.json()).toMatchObject({ code: "live" });

    const unpublished = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: live.data,
      action: { type: "unpublish" },
    });
    expect(unpublished.json<Saved>().data.status).toBe("draft");
    expect(JSON.stringify((await snapshot()).tourPackages)).toContain(slug);

    const past = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: live.data,
      action: { type: "schedule", at: "2020-01-01T10:00:00+06:00" },
    });
    expect(past.statusCode).toBe(409);
    const at = new Date(Date.now() + DAY).toISOString();
    const scheduled = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: live.data,
      action: { type: "schedule", at },
    });
    expect(scheduled.json<Saved>().data).toMatchObject({ status: "scheduled", publishAt: at });

    const published = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: live.data,
      action: { type: "publish" },
    });
    const now = published.json<Saved>().data;
    expect(now.status).toBe("published");
    expect(now.publishAt).toBeUndefined();
    expect(typeof now.liveSince).toBe("string");

    const archived = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: live.data,
      action: { type: "archive" },
    });
    expect(archived.json<Saved>().data.status).toBe("archived");
    expect(
      (
        await call(owner, "PUT", `/content/tourPackages/${slug}`, {
          data: live.data,
          action: { type: "publish" },
        })
      ).statusCode,
    ).toBe(409);
    const restored = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: live.data,
      action: { type: "restore" },
    });
    expect(restored.json<Saved>().data.status).toBe("draft");

    // The audit log names each button in plain words.
    const reasons = await prisma.auditLog.findMany({
      where: { entity: "tourPackages", entityId: slug, reason: { not: null } },
      orderBy: { at: "asc" },
      select: { reason: true },
    });
    expect(reasons.map((row) => row.reason)).toEqual([
      "Unpublished",
      expect.stringContaining("Scheduled to go live on"),
      "Published",
      "Archived",
      "Restored from the archive",
    ]);
  });

  it("restores an old version's words without changing today's status", async () => {
    const slug = "kathmandu-and-pokhara";
    const live = await record("tourPackages", slug);
    const edited = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: { ...live.data, title: "Sample Kathmandu, renamed" },
      action: { type: "unpublish" },
    });
    expect(edited.json<Saved>().data.status).toBe("draft");
    const entries = (await call(owner, "GET", `/content/tourPackages/${slug}/history`)).json<{
      entries: Array<{ id: string }>;
    }>().entries;
    const back = await call(owner, "POST", `/content/tourPackages/${slug}/restore`, {
      auditId: entries[0]?.id,
      side: "before",
    });
    expect(back.json<Saved>().data).toMatchObject({ title: live.data.title, status: "draft" });
  });

  it("makes a Sample record the team's own on its first save, with an undo", async () => {
    const faqs = (await call(editor, "GET", "/content/faqs")).json<{ items: Saved[] }>();
    const faq = faqs.items.find((item) => item.data.sample === true);
    if (!faq) throw new Error("no Sample FAQ");
    const saved = await call(editor, "PUT", `/content/faqs/${faq.id}`, {
      data: { ...faq.data, answer: "Yes, call us." },
      version: faq.version,
    });
    expect(saved.json<Saved>()).toMatchObject({ sampleCleared: true, data: { sample: false } });
    const undone = await call(editor, "PUT", `/content/faqs/${faq.id}`, {
      data: { ...saved.json<Saved>().data, sample: true },
      version: saved.json<Saved>().version,
      keepSample: true,
    });
    expect(undone.json<Saved>()).toMatchObject({ sampleCleared: false, data: { sample: true } });
    // New records are never Sample.
    const created = await call(editor, "POST", "/content/faqs", {
      data: { ...faq.data, id: "sample-own-question", sample: true },
    });
    expect(created.json<Saved>().data.sample).toBe(false);
  });

  it("keeps a live record's old address working after its link changes", async () => {
    const slug = "kathmandu-and-pokhara";
    const live = await record("tourPackages", slug);
    const moved = await call(owner, "PUT", `/content/tourPackages/${slug}`, {
      data: { ...live.data, slug: `${slug}-6d` },
      version: live.version,
    });
    expect(moved.json<Saved>().id).toBe(`${slug}-6d`);
    const again = await call(owner, "PUT", `/content/tourPackages/${slug}-6d`, {
      data: { ...moved.json<Saved>().data, slug: `${slug}-7d` },
    });
    expect(again.statusCode).toBe(200);
    // No chains: both old addresses lead straight to the newest one.
    expect((await snapshot()).slugRedirects).toEqual(
      expect.arrayContaining([
        { collection: "tourPackages", from: slug, to: `${slug}-7d` },
        { collection: "tourPackages", from: `${slug}-6d`, to: `${slug}-7d` },
      ]),
    );
    // A new record at an old address wins over the redirect.
    const reused = await call(owner, "POST", "/content/tourPackages", {
      data: { ...live.data, slug, id: "sample-kathmandu-again", title: "Sample Kathmandu again" },
    });
    expect(reused.statusCode).toBe(201);
    const redirects = (await snapshot()).slugRedirects as Array<{ from: string }>;
    expect(redirects.map((item) => item.from)).not.toContain(slug);
    expect(redirects.map((item) => item.from)).toContain(`${slug}-6d`);
  });

  it("moves deleted records to Trash, restores them, and deletes for good only as Super Admin", async () => {
    const faqs = (await call(editor, "GET", "/content/faqs")).json<{ items: Saved[] }>();
    const faq = faqs.items[0];
    if (!faq) throw new Error("no FAQ");
    const removed = await call(editor, "DELETE", `/content/faqs/${faq.id}`);
    const { trashId } = removed.json<{ trashId: string }>();
    expect(JSON.stringify((await snapshot()).faqs)).not.toContain(`"id":"${faq.id}"`);

    const trash = (await call(editor, "GET", "/trash")).json<{
      total: number;
      items: Array<{ id: string; collection: string; title: string; purgeAt: string }>;
    }>();
    expect(trash.items[0]).toMatchObject({ id: trashId, collection: "faqs" });
    // Lists this person can't edit stay out of their Trash.
    expect((await call(agent, "GET", "/trash")).json<{ total: number }>().total).toBe(0);
    expect((await call(agent, "POST", `/trash/${trashId}/restore`)).statusCode).toBe(403);

    const back = await call(editor, "POST", `/trash/${trashId}/restore`);
    expect(back.json()).toEqual({ collection: "faqs", id: faq.id });
    expect((await record("faqs", faq.id)).data.question).toBe(faq.data.question);
    expect((await call(editor, "GET", "/trash")).json<{ total: number }>().total).toBe(0);

    // The address is taken again: a second copy in Trash can't come back over it.
    const second = (await call(editor, "DELETE", `/content/faqs/${faq.id}`)).json<{
      trashId: string;
    }>();
    await call(editor, "POST", "/content/faqs", { data: faq.data });
    expect((await call(editor, "POST", `/trash/${second.trashId}/restore`)).statusCode).toBe(409);

    expect((await call(editor, "DELETE", `/trash/${second.trashId}`)).statusCode).toBe(403);
    expect((await call(owner, "DELETE", `/trash/${second.trashId}`)).statusCode).toBe(204);
    expect(await prisma.trashItem.count()).toBe(0);
  });

  it("publishes scheduled records on time, purges old Trash and alerts once about overdue leads", async () => {
    const scheduler = app.get(ContentScheduler);
    const post = (await call(owner, "GET", "/content/blogPosts")).json<{ items: Saved[] }>()
      .items[0];
    if (!post) throw new Error("no post");
    const at = new Date(Date.now() + 60_000).toISOString();
    await call(owner, "PUT", `/content/blogPosts/${post.id}`, {
      data: post.data,
      action: { type: "unpublish" },
    });
    await call(owner, "PUT", `/content/blogPosts/${post.id}`, {
      data: post.data,
      action: { type: "schedule", at },
    });
    expect((await scheduler.tick(new Date())).published).toEqual([]);
    const due = await scheduler.tick(new Date(Date.now() + 120_000));
    expect(due.published).toEqual([{ collection: "blogPosts", id: post.id }]);
    const after = (await record("blogPosts", post.id)).data;
    expect(after).toMatchObject({ status: "published", liveSince: at });
    expect(after.publishAt).toBeUndefined();
    // Dated the day it went live in Dhaka.
    expect(after.publishedAt).toBe(
      new Date(Date.parse(at) + 6 * 3_600_000).toISOString().slice(0, 10),
    );
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { entity: "blogPosts", actorName: "Scheduler" },
    });
    expect(audit).toMatchObject({
      action: "content.update",
      reason: "Published at the scheduled time",
    });

    // Trash older than 30 days goes for good.
    const faq = (await call(owner, "GET", "/content/faqs")).json<{ items: Saved[] }>().items[0];
    if (!faq) throw new Error("no FAQ");
    const { trashId } = (await call(owner, "DELETE", `/content/faqs/${faq.id}`)).json<{
      trashId: string;
    }>();
    await prisma.trashItem.update({
      where: { id: trashId },
      data: { deletedAt: new Date(Date.now() - (TRASH_DAYS + 1) * DAY) },
    });
    expect((await scheduler.tick(new Date(Date.now() + 180_000))).purged).toBe(1);

    // A lead unanswered past the reply target alerts the desk once.
    ip += 1;
    const lead = await app.inject({
      method: "POST",
      url: "/api/v1/public/leads",
      headers: { ...INTAKE, "x-client-ip": `10.4.0.${ip}`, "idempotency-key": randomUUID() },
      payload: {
        contact: { name: "Sample Customer", phone: "+8801000000201" },
        payload: {
          module: "visa",
          countrySlug: "thailand",
          countryName: "Thailand",
          visaType: "tourist",
          travelDate: "2026-12-01",
          applicants: 1,
        },
        consent: true,
      },
    });
    expect(lead.statusCode).toBe(201);
    const later = new Date(Date.now() + 45 * 60_000);
    expect((await scheduler.tick(later)).overdue).toBe(1);
    expect((await scheduler.tick(new Date(later.getTime() + 60_000))).overdue).toBe(0);
    await vi.waitFor(() =>
      expect(mailer.sent.some((mail) => mail.subject.startsWith("No reply yet"))).toBe(true),
    );
  });

  it("stops a coupon at its use limit and shows its uses", async () => {
    const coupon = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "coupons", docId: "WELCOME10" } },
    });
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: "coupons", docId: "WELCOME10" } },
      data: { data: { ...(coupon.data as object), maxUses: 1 } },
    });
    app.get(ContentService).invalidate();
    const order = async () => {
      ip += 1;
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/public/orders",
        headers: { ...INTAKE, "x-client-ip": `10.4.1.${ip}`, "idempotency-key": randomUUID() },
        payload: {
          lines: [{ variantId: "bd-w1510a", quantity: 1 }],
          address: {
            name: "Sample Rahim",
            phone: "+8801712345678",
            division: "Dhaka",
            district: "Dhaka",
            area: "Motijheel",
            street: "House 4, Road 2",
          },
          payment: { method: "cod" },
          couponCode: "WELCOME10",
        },
      });
      expect(response.statusCode).toBe(201);
      return prisma.order.findUniqueOrThrow({
        where: { reference: response.json<{ reference: string }>().reference },
      });
    };
    expect((await order()).couponCode).toBe("WELCOME10");
    const second = await order();
    expect(second).toMatchObject({ couponCode: null, discount: 0 });
    const list = (await call(owner, "GET", "/content/coupons")).json<{
      items: Array<{ id: string; uses?: number }>;
    }>();
    expect(list.items.find((item) => item.id === "WELCOME10")?.uses).toBe(1);
  });
});

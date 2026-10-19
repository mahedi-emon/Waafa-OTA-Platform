import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import { loadFixtures } from "@waafa/fixtures";
import { ContentHistorySchema, ContentOptionsSchema, type Role } from "@waafa/shared";
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
type Record_ = {
  id: string;
  version: number;
  updatedBy: string | null;
  data: Record<string, unknown>;
};

describe.skipIf(!dbAvailable)(
  "form engine v2: history, restore, duplicate and pickers (D0 R2)",
  () => {
    let app: NestFastifyApplication;
    let prisma: PrismaClient;
    let owner: Person;
    let agent: Person;
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

    const call = (who: Person, method: "GET" | "POST" | "PUT", url: string, payload?: unknown) =>
      app.inject({
        method,
        url: `/api/v1/admin${url}`,
        headers: who.headers,
        ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
      });

    const history = async (who: Person, url: string) =>
      ContentHistorySchema.parse((await call(who, "GET", url)).json()).entries;

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
      agent = await person("Sample Agent", ["travel-sales"]);
      editor = await person("Sample Editor", ["content-editor"]);
    });

    it("keeps every saved version, follows slug changes and restores one", async () => {
      const posts = (await call(editor, "GET", "/content/blogPosts")).json<{ items: Record_[] }>();
      const post = posts.items[0];
      expect(post).toBeDefined();
      if (!post) return;
      const slug = post.id;

      const first = await call(editor, "PUT", `/content/blogPosts/${slug}`, {
        data: { ...post.data, title: "Sample first title" },
        version: post.version,
      });
      expect(first.statusCode).toBe(200);
      const renamed = await call(editor, "PUT", `/content/blogPosts/${slug}`, {
        data: { ...post.data, slug: `${slug}-moved`, title: "Sample second title" },
        version: post.version + 1,
      });
      expect(renamed.statusCode).toBe(200);

      // The history follows the record to its new slug, newest first.
      const moved = await history(editor, `/content/blogPosts/${slug}-moved/history`);
      expect(moved.map((entry) => entry.action)).toEqual(["content.update", "content.update"]);
      expect(moved.map((entry) => (entry.after as { title: string }).title)).toEqual([
        "Sample second title",
        "Sample first title",
      ]);
      expect(moved[0]?.actorName).toBe("Sample Editor");

      // A stale save says who saved last, so the editor can compare before overwriting.
      const stale = await call(editor, "PUT", `/content/blogPosts/${slug}-moved`, {
        data: post.data,
        version: post.version,
      });
      expect(stale.statusCode).toBe(409);
      expect(stale.json()).toMatchObject({
        code: "stale",
        current: { version: post.version + 2, updatedBy: "Sample Editor" },
      });

      // Restoring the first version brings back its title and its slug; the restore is audited.
      const older = moved[1];
      if (!older) throw new Error("missing version");
      const staleRestore = await call(editor, "POST", `/content/blogPosts/${slug}-moved/restore`, {
        auditId: older.id,
        version: post.version,
      });
      expect(staleRestore.statusCode).toBe(409);
      const restored = await call(editor, "POST", `/content/blogPosts/${slug}-moved/restore`, {
        auditId: older.id,
        version: post.version + 2,
      });
      expect(restored.statusCode).toBe(200);
      expect(restored.json<Record_>()).toMatchObject({
        id: slug,
        data: { title: "Sample first title" },
      });
      expect(
        (await history(editor, `/content/blogPosts/${slug}/history`)).map((e) => e.action),
      ).toEqual(["content.restore", "content.update", "content.update"]);

      // A new post that takes the old slug starts with its own history.
      const again = await call(editor, "PUT", `/content/blogPosts/${slug}`, {
        data: { ...post.data, slug: `${slug}-final`, title: "Sample first title" },
        version: post.version + 3,
      });
      expect(again.statusCode).toBe(200);
      const reused = await call(editor, "POST", "/content/blogPosts", {
        data: { ...post.data, title: "Sample other post" },
      });
      expect(reused.statusCode).toBe(201);
      expect(
        (await history(editor, `/content/blogPosts/${slug}/history`)).map((e) => e.action),
      ).toEqual(["content.create"]);
      expect(await history(editor, `/content/blogPosts/${slug}-final/history`)).toHaveLength(4);

      // Versions of another record, unknown versions and other roles are refused.
      const otherPost = posts.items[1];
      if (otherPost) {
        const foreign = await call(editor, "POST", `/content/blogPosts/${otherPost.id}/restore`, {
          auditId: older.id,
        });
        expect(foreign.statusCode).toBe(404);
      }
      expect(
        (
          await call(editor, "POST", `/content/blogPosts/${slug}-final/restore`, {
            auditId: "nope",
          })
        ).statusCode,
      ).toBe(404);
      expect(
        (await call(agent, "GET", `/content/blogPosts/${slug}-final/history`)).statusCode,
      ).toBe(403);
    });

    it("undoes the very first change of a seeded record by restoring the version before it", async () => {
      const faqs = (await call(editor, "GET", "/content/faqs")).json<{ items: Record_[] }>();
      const faq = faqs.items[0];
      if (!faq) throw new Error("no faqs");
      const saved = await call(editor, "PUT", `/content/faqs/${faq.id}`, {
        data: { ...faq.data, answer: "Sample: a wrong answer." },
        version: faq.version,
      });
      expect(saved.statusCode).toBe(200);
      const [change] = await history(editor, `/content/faqs/${faq.id}/history`);
      if (!change) throw new Error("no history");
      // The seed wrote no history, so only "before" can bring the original back.
      const restored = await call(editor, "POST", `/content/faqs/${faq.id}/restore`, {
        auditId: change.id,
        side: "before",
        version: faq.version + 1,
      });
      expect(restored.statusCode).toBe(200);
      expect(restored.json<Record_>().data.answer).toBe(faq.data.answer);
      const createdOnly = await call(editor, "POST", "/content/faqs", {
        data: { ...faq.data, id: "sample-fresh-question" },
      });
      expect(createdOnly.statusCode).toBe(201);
      const [creation] = await history(editor, "/content/faqs/sample-fresh-question/history");
      // A created record has nothing before it.
      expect(
        (
          await call(editor, "POST", "/content/faqs/sample-fresh-question/restore", {
            auditId: creation?.id,
            side: "before",
          })
        ).statusCode,
      ).toBe(404);
    });

    it("copies a record as a hidden draft with a free id, never Sample", async () => {
      const posts = (await call(editor, "GET", "/content/blogPosts")).json<{ items: Record_[] }>();
      const post = posts.items[0];
      if (!post) throw new Error("no posts");

      const copy = await call(editor, "POST", `/content/blogPosts/${post.id}/duplicate`);
      expect(copy.statusCode).toBe(201);
      expect(copy.json<Record_>()).toMatchObject({
        id: `${post.id}-copy`,
        data: { title: `${String(post.data.title)} (copy)`, status: "draft", sample: false },
      });
      const second = await call(editor, "POST", `/content/blogPosts/${post.id}/duplicate`);
      expect(second.json<Record_>().id).toBe(`${post.id}-copy-2`);
      expect(
        await prisma.auditLog.count({
          where: { entity: "blogPosts", action: "content.duplicate" },
        }),
      ).toBe(2);

      const faqs = (await call(editor, "GET", "/content/faqs")).json<{ items: Record_[] }>();
      const faq = faqs.items[0];
      if (!faq) throw new Error("no faqs");
      const faqCopy = await call(editor, "POST", `/content/faqs/${faq.id}/duplicate`);
      expect(faqCopy.statusCode).toBe(201);
      expect(faqCopy.json<Record_>().id).toBe(`${faq.id}-copy`);

      expect((await call(editor, "POST", "/content/products/any/duplicate")).statusCode).toBe(403);
      expect((await call(editor, "POST", "/content/blogPosts/missing/duplicate")).statusCode).toBe(
        404,
      );
    });

    it("lists picker choices for any staff member and filters them", async () => {
      const all = ContentOptionsSchema.parse(
        (await call(agent, "GET", "/content/blogCategories/options")).json(),
      );
      expect(all.items.length).toBeGreaterThan(0);
      const first = all.items[0];
      if (!first) throw new Error("no categories");
      expect(first.values.slug).toBe(first.id);

      const filtered = ContentOptionsSchema.parse(
        (
          await call(
            agent,
            "GET",
            `/content/blogCategories/options?q=${encodeURIComponent(first.title.slice(0, 4))}`,
          )
        ).json(),
      );
      expect(filtered.items.map((item) => item.id)).toContain(first.id);
      expect(filtered.items.length).toBeLessThanOrEqual(all.items.length);

      const destinations = ContentOptionsSchema.parse(
        (await call(editor, "GET", "/content/destinations/options")).json(),
      );
      expect(destinations.items.some((item) => item.image)).toBe(true);
      expect((await call(agent, "GET", "/content/siteSettings/options")).statusCode).toBe(400);
    });

    it("keeps a setting's versions and restores one", async () => {
      const read = async () =>
        (await call(owner, "GET", "/content/leadFormSettings")).json<{
          version: number;
          value: Record<string, unknown>;
        }>();
      const start = await read();
      const save = (value: Record<string, unknown>, version: number) =>
        call(owner, "PUT", "/settings/leadFormSettings", { data: value, version });

      expect((await save({ ...start.value, slaMinutes: 45 }, start.version)).statusCode).toBe(200);
      expect((await save({ ...start.value, slaMinutes: 90 }, start.version + 1)).statusCode).toBe(
        200,
      );

      const entries = await history(owner, "/settings/leadFormSettings/history");
      expect(entries.map((entry) => (entry.after as { slaMinutes: number }).slaMinutes)).toEqual([
        90, 45,
      ]);
      const restored = await call(owner, "POST", "/settings/leadFormSettings/restore", {
        auditId: entries[1]?.id,
        version: start.version + 2,
      });
      expect(restored.statusCode).toBe(200);
      expect((await read()).value.slaMinutes).toBe(45);
      expect(
        await prisma.auditLog.count({
          where: { entity: "leadFormSettings", action: "settings.restore" },
        }),
      ).toBe(1);

      expect((await call(owner, "GET", "/settings/blogPosts/history")).statusCode).toBe(400);
      expect((await call(editor, "GET", "/settings/leadFormSettings/history")).statusCode).toBe(
        403,
      );
    });
  },
);

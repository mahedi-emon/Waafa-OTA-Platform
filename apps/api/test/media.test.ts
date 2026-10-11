import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Role } from "@waafa/shared";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";

describe.skipIf(!dbAvailable)("media library (#109)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let editor: Record<string, string>;
  let sales: Record<string, string>;
  let accounts: Record<string, string>;
  const mediaDir = mkdtempSync(path.join(tmpdir(), "waafa-media-"));

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

  const upload = (
    headers: Record<string, string>,
    body: Buffer,
    type: string,
    alt = "Sunset over Cox's Bazar",
  ) =>
    app.inject({
      method: "POST",
      url: `/api/v1/admin/media?alt=${encodeURIComponent(alt)}&name=beach.jpg`,
      headers: { ...headers, "content-type": type },
      payload: body,
    });

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    app = await testApp(featureModules({ mailer: new MemoryMailer() }), { MEDIA_DIR: mediaDir });
    editor = await person("Editor", ["content-editor"]);
    sales = await person("Sales", ["travel-sales"]);
    accounts = await person("Accounts", ["accounts"]);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("uploads a photo as optimised WebP and serves it publicly", async () => {
    const jpeg = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: { r: 13, g: 140, b: 238 } },
    })
      .jpeg()
      .toBuffer();
    const response = await upload(editor, jpeg, "image/jpeg");
    expect(response.statusCode).toBe(201);
    const asset = response.json<{
      id: string;
      url: string;
      path: string;
      width: number;
      height: number;
    }>();
    expect(asset).toMatchObject({ width: 2560, height: 1707 });
    expect(asset.url).toBe(`/uploads/${asset.path}`);
    expect(existsSync(path.join(mediaDir, asset.path))).toBe(true);
    const file = await app.inject({ method: "GET", url: `/api/v1/media/${asset.path}` });
    expect(file.statusCode).toBe(200);
    expect(file.headers["content-type"]).toBe("image/webp");
    expect(file.headers["cache-control"]).toContain("immutable");
    expect(await prisma.auditLog.count({ where: { action: "media.upload" } })).toBe(1);
  });

  it("refuses files that are not photos, mislabelled files and missing alt text", async () => {
    const svg = Buffer.from(
      "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>",
    );
    expect((await upload(editor, svg, "image/svg+xml")).statusCode).toBe(415);
    expect((await upload(editor, svg, "image/png")).statusCode).toBe(415);
    const png = await sharp({
      create: { width: 20, height: 20, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
    expect((await upload(editor, png, "image/jpeg")).statusCode).toBe(415);
    expect((await upload(editor, png, "image/png", "x")).statusCode).toBe(422);
  });

  it("lists, renames and deletes with role checks", async () => {
    expect(
      (await app.inject({ method: "GET", url: "/api/v1/admin/media", headers: accounts }))
        .statusCode,
    ).toBe(403);
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/admin/media?q=sunset",
      headers: sales,
    });
    expect(list.statusCode).toBe(200);
    const [asset] = list.json<{ items: Array<{ id: string; path: string }> }>().items;
    expect(asset).toBeDefined();
    const renamed = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/media/${asset?.id}`,
      headers: sales,
      payload: { alt: "Sunset over the beach at Cox's Bazar" },
    });
    expect(renamed.json()).toMatchObject({ alt: "Sunset over the beach at Cox's Bazar" });
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: `/api/v1/admin/media/${asset?.id}`,
          headers: sales,
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: `/api/v1/admin/media/${asset?.id}`,
          headers: editor,
        })
      ).statusCode,
    ).toBe(204);
    expect(existsSync(path.join(mediaDir, asset?.path ?? "missing"))).toBe(false);
    expect(
      (await app.inject({ method: "GET", url: `/api/v1/media/${asset?.path}` })).statusCode,
    ).toBe(404);
  });

  it("never serves paths outside the media folder", async () => {
    for (const url of [
      "/api/v1/media/..%2F..%2Fpackage.json/x/y",
      "/api/v1/media/2026/10/..%2F.env",
    ]) {
      expect((await app.inject({ method: "GET", url })).statusCode).toBe(404);
    }
  });
});

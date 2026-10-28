import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { ContentService } from "../src/content/content.service";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
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

  it("never shows a new upload with its placeholder path while it is being saved (issue 308)", async () => {
    const big = await sharp({
      create: { width: 2560, height: 1700, channels: 3, background: { r: 200, g: 120, b: 40 } },
    })
      .jpeg()
      .toBuffer();
    let done = false;
    const uploading = upload(editor, big, "image/jpeg", "Race check").finally(() => {
      done = true;
    });
    const seen: string[] = [];
    while (!done) {
      const rows = await prisma.mediaAsset.findMany({ select: { path: true } });
      seen.push(...rows.map((row) => row.path));
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    expect((await uploading).statusCode).toBe(201);
    expect(seen.filter((value) => value.startsWith("pending/"))).toEqual([]);
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

describe.skipIf(!dbAvailable)("media library v2: uses, replace, crop and video (D0 R3)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let editor: Record<string, string>;
  let accounts: Record<string, string>;
  const mediaDir = mkdtempSync(path.join(tmpdir(), "waafa-media-v2-"));

  type Asset = {
    id: string;
    url: string;
    path: string;
    width: number;
    height: number;
    uses: number;
    kind: string;
    alt: string;
  };

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

  const photo = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: { r: 0, g: 83, b: 215 } } })
      .jpeg()
      .toBuffer();
  const send = (
    headers: Record<string, string>,
    method: "GET" | "POST" | "DELETE",
    url: string,
    payload?: unknown,
  ) =>
    app.inject({
      method,
      url: `/api/v1/admin/media${url}`,
      headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });
  const uploadPhoto = async (width: number, height: number, alt: string) =>
    (
      await app.inject({
        method: "POST",
        url: `/api/v1/admin/media?alt=${encodeURIComponent(alt)}`,
        headers: { ...editor, "content-type": "image/jpeg" },
        payload: await photo(width, height),
      })
    ).json<Asset>();

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(featureModules({ mailer: new MemoryMailer() }), { MEDIA_DIR: mediaDir });
    app.get(ContentService).invalidate();
    editor = await person("EditorTwo", ["content-editor"]);
    accounts = await person("AccountsTwo", ["accounts"]);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("knows where a file is shown, never deletes it there, and replaces it everywhere", async () => {
    const first = await uploadPhoto(1600, 1200, "Our desk in Motijheel");
    const second = await uploadPhoto(1200, 1200, "Our team at the desk");
    const spare = await uploadPhoto(400, 300, "A spare photo nobody uses");

    // A team member's photo points at the first file.
    const member = await prisma.contentDocument.findFirstOrThrow({ where: { collection: "team" } });
    const data = member.data as Record<string, unknown>;
    await prisma.contentDocument.update({
      where: { collection_docId: { collection: "team", docId: member.docId } },
      data: {
        data: {
          ...data,
          photo: {
            src: first.url,
            alt: "Rafi at the desk",
            width: 1600,
            height: 1200,
            credit: "Old photographer",
            creditUrl: "https://unsplash.com/photos/old-desk",
            focal: { x: 30, y: 40 },
          },
        },
      },
    });

    const list = (await send(editor, "GET", "")).json<{ items: Asset[] }>();
    expect(list.items.find((item) => item.id === first.id)?.uses).toBe(1);
    expect(list.items.find((item) => item.id === second.id)?.uses).toBe(0);
    const unused = (await send(editor, "GET", "?unused=true")).json<{ items: Asset[] }>();
    expect(unused.items.map((item) => item.id)).not.toContain(first.id);
    expect(unused.items.map((item) => item.id)).toContain(spare.id);

    const usage = (await send(editor, "GET", `/${first.id}/usage`)).json<{
      items: Array<{ area: string; key: string; recordId: string; field: string }>;
    }>();
    expect(usage.items).toEqual([
      expect.objectContaining({
        area: "content",
        key: "team",
        recordId: member.docId,
        field: "photo.src",
      }),
    ]);

    const refused = await send(editor, "DELETE", `/${first.id}`);
    expect(refused.statusCode).toBe(409);
    expect(refused.json()).toMatchObject({ code: "inUse" });
    expect((await send(editor, "DELETE", `/${spare.id}`)).statusCode).toBe(204);

    expect(
      (await send(accounts, "POST", `/${first.id}/replace`, { with: second.id })).statusCode,
    ).toBe(403);
    const replaced = await send(editor, "POST", `/${first.id}/replace`, { with: second.id });
    expect(replaced.statusCode).toBe(200);
    expect(replaced.json()).toEqual({ replaced: 1, failed: [] });
    const after = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "team", docId: member.docId } },
    });
    // The new photo brings its own words and size; the old credit and focal point don't follow it.
    expect((after.data as { photo: unknown }).photo).toEqual({
      src: second.url,
      alt: "Our team at the desk",
      width: 1200,
      height: 1200,
    });
    // The record's History has the change, by the person who replaced it.
    expect(
      await prisma.auditLog.count({
        where: { entity: "team", entityId: member.docId, action: "content.update" },
      }),
    ).toBe(1);
    expect((await send(editor, "GET", `/${first.id}/usage`)).json()).toEqual({ items: [] });
    expect((await send(editor, "DELETE", `/${first.id}`)).statusCode).toBe(204);
  });

  it("saves a crop as a new photo and refuses one past the edge", async () => {
    const source = await uploadPhoto(1600, 900, "Sea temple at sunset");
    const crop = await send(editor, "POST", `/${source.id}/crop`, {
      x: 400,
      y: 0,
      width: 900,
      height: 900,
    });
    expect(crop.statusCode).toBe(201);
    const cropped = crop.json<Asset>();
    expect(cropped).toMatchObject({
      width: 900,
      height: 900,
      alt: "Sea temple at sunset",
      kind: "photo",
    });
    expect(cropped.id).not.toBe(source.id);
    expect(
      (
        await send(editor, "POST", `/${source.id}/crop`, {
          x: 1000,
          y: 0,
          width: 900,
          height: 900,
        })
      ).statusCode,
    ).toBe(400);
  });

  it("takes MP4 videos as they are and serves byte ranges for seeking", async () => {
    const box = Buffer.alloc(92);
    box.writeUInt32BE(92, 0);
    box.write("tkhd", 4, "ascii");
    box.writeUInt32BE(1280 * 65536, 84);
    box.writeUInt32BE(720 * 65536, 88);
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 16]),
      Buffer.from("ftypisom", "ascii"),
      Buffer.alloc(4),
      box,
      Buffer.alloc(2048, 7),
    ]);
    const upload = await app.inject({
      method: "POST",
      url: `/api/v1/admin/media/video?alt=${encodeURIComponent("Waves at Saint Martin")}`,
      headers: { ...editor, "content-type": "video/mp4" },
      payload: mp4,
    });
    expect(upload.statusCode).toBe(201);
    const video = upload.json<Asset>();
    expect(video).toMatchObject({ kind: "video", width: 1280, height: 720 });
    expect(video.path).toMatch(/\.mp4$/);

    const whole = await app.inject({ method: "GET", url: `/api/v1/media/${video.path}` });
    expect(whole.statusCode).toBe(200);
    expect(whole.headers["content-type"]).toBe("video/mp4");
    expect(whole.headers["accept-ranges"]).toBe("bytes");
    const part = await app.inject({
      method: "GET",
      url: `/api/v1/media/${video.path}`,
      headers: { range: "bytes=0-9" },
    });
    expect(part.statusCode).toBe(206);
    expect(part.headers["content-range"]).toBe(`bytes 0-9/${mp4.length}`);
    expect(part.rawPayload.length).toBe(10);
    const past = await app.inject({
      method: "GET",
      url: `/api/v1/media/${video.path}`,
      headers: { range: `bytes=${mp4.length + 10}-` },
    });
    expect(past.statusCode).toBe(416);

    const webmAsMp4 = await app.inject({
      method: "POST",
      url: `/api/v1/admin/media/video?alt=${encodeURIComponent("Not really an MP4")}`,
      headers: { ...editor, "content-type": "video/mp4" },
      payload: Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64)]),
    });
    expect(webmAsMp4.statusCode).toBe(415);

    // A video slot keeps its format: an MP4 is replaced by an MP4, never by a WebM.
    const webm = await app.inject({
      method: "POST",
      url: `/api/v1/admin/media/video?alt=${encodeURIComponent("Waves at Saint Martin, lighter copy")}`,
      headers: { ...editor, "content-type": "video/webm" },
      payload: Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64)]),
    });
    expect(webm.statusCode).toBe(201);
    const swap = await send(editor, "POST", `/${video.id}/replace`, {
      with: webm.json<Asset>().id,
    });
    expect(swap.statusCode).toBe(400);
  });
});

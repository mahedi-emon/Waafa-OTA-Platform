import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { ContentImportReport, Product, Role } from "@waafa/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { parseCsv, toCsv } from "../src/common/csv";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };

type Person = { headers: { authorization: string } };

describe.skipIf(!dbAvailable)("invoices, packing slips and CSV import (issue 248)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let admin: Person;
  let shop: Person;
  let accounts: Person;
  let editor: Person;
  let orderId = "";

  async function person(name: string, roles: Role[]): Promise<Person> {
    const user = await prisma.staffUser.create({
      data: { name, email: `${randomUUID()}@example.com`, passwordHash: "x", roles },
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

  const call = (who: Person | null, method: string, url: string, payload?: unknown) =>
    app.inject({
      method: method as "GET",
      url: `/api/v1/admin${url}`,
      headers: who?.headers ?? {},
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  const csvOf = async (key: string) => {
    const response = await call(admin, "GET", `/content/${key}/export.csv`);
    expect(response.statusCode, response.body).toBe(200);
    return response.body;
  };

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(featureModules({ mailer: new MemoryMailer() }));
    admin = await person("Sample Admin", ["admin"]);
    shop = await person("Sample Store", ["shop-manager"]);
    accounts = await person("Sample Accounts", ["accounts"]);
    editor = await person("Sample Editor", ["content-editor"]);
    const order = await app.inject({
      method: "POST",
      url: "/api/v1/public/orders",
      headers: { ...INTAKE, "x-client-ip": "10.24.8.1", "idempotency-key": randomUUID() },
      payload: {
        lines: [{ variantId: "pb-20k-blk", quantity: 2 }],
        address: {
          name: "Sample Rahim",
          phone: "+8801712345678",
          division: "Dhaka",
          district: "Dhaka",
          area: "Motijheel",
          street: "House 4, Road 2",
        },
        payment: { method: "cod" },
        invoice: { companyName: "Sample Traders Ltd", bin: "000123456789" },
      },
    });
    expect(order.statusCode, order.body).toBe(201);
    orderId = (
      await prisma.order.findUniqueOrThrow({
        where: { reference: order.json<{ reference: string }>().reference },
      })
    ).id;
  });

  afterAll(async () => {
    await app.get(NotificationService).idle();
    await app.close();
    await prisma.$disconnect();
  });

  it("prints the invoice for the team and Accounts, the packing slip for the people who pack", async () => {
    for (const who of [admin, shop, accounts]) {
      const invoice = await call(who, "GET", `/orders/${orderId}/invoice`);
      expect(invoice.statusCode).toBe(200);
      expect(invoice.headers["content-type"]).toBe("application/pdf");
      expect(invoice.headers["content-disposition"]).toMatch(/-invoice\.pdf"$/);
      expect(invoice.rawPayload.toString("latin1")).toContain("(VAT invoice ");
    }
    const slip = await call(shop, "GET", `/orders/${orderId}/packing-slip`);
    expect(slip.statusCode).toBe(200);
    expect(slip.rawPayload.toString("latin1")).toContain("(Packing slip ");
    expect((await call(accounts, "GET", `/orders/${orderId}/packing-slip`)).statusCode).toBe(403);
    expect((await call(editor, "GET", `/orders/${orderId}/invoice`)).statusCode).toBe(403);
    expect((await call(null, "GET", `/orders/${orderId}/invoice`)).statusCode).toBe(401);
    expect((await call(admin, "GET", `/orders/clnotanorder000000000000/invoice`)).statusCode).toBe(
      404,
    );
  });

  it("round-trips the export: unchanged lines, nothing saved", async () => {
    for (const key of ["products", "groupFares", "compatibleModels"]) {
      const csv = await csvOf(key);
      expect(csv.startsWith("﻿")).toBe(true);
      const preview = await call(admin, "POST", `/content/${key}/import/preview`, { csv });
      const report = preview.json<ContentImportReport>();
      expect(report.summary.unchanged).toBeGreaterThan(0);
      expect({ key, ...report.summary, create: 0, update: 0, error: 0 }).toEqual({
        key,
        ...report.summary,
      });
      const before = await prisma.contentDocument.findMany({ where: { collection: key } });
      const applied = await call(admin, "POST", `/content/${key}/import`, { csv });
      expect(applied.statusCode, applied.body).toBe(200);
      const after = await prisma.contentDocument.findMany({ where: { collection: key } });
      expect(after.map((row) => row.version)).toEqual(before.map((row) => row.version));
    }
  });

  it("previews and imports edited prices and new fares, and exports the edit back", async () => {
    const table = parseCsv(await csvOf("products"));
    const price = table[0]!.indexOf("price");
    const stock = table[0]!.indexOf("stock");
    table[1]![price] = String(Number(table[1]![price]) + 50);
    table[1]![stock] = "37";
    const csv = toCsv(table[0]!, table.slice(1));
    const preview = (
      await call(shop, "POST", "/content/products/import/preview", { csv })
    ).json<ContentImportReport>();
    expect(preview.rows[0]).toMatchObject({
      line: 2,
      action: "update",
      changes: ["price", "stock"],
    });
    expect(preview.summary.update).toBe(1);
    const applied = await call(shop, "POST", "/content/products/import", { csv });
    expect(applied.json<ContentImportReport>()).toMatchObject({ applied: true });
    const slug = table[1]![0]!;
    const saved = await prisma.contentDocument.findUniqueOrThrow({
      where: { collection_docId: { collection: "products", docId: slug } },
    });
    const variant = (saved.data as Product).variants.find((found) => found.id === table[1]![6]);
    expect(variant).toMatchObject({ stock: 37 });
    expect(parseCsv(await csvOf("products"))).toEqual(table);
    const audit = await prisma.auditLog.findMany({
      where: { action: { in: ["content.import", "content.import.file"] }, entity: "products" },
    });
    // One save for the product, one line per imported file (the round trip above wrote one too).
    expect(audit.filter((row) => row.action === "content.import")).toHaveLength(1);
    expect(audit.filter((row) => row.action === "content.import.file")).toHaveLength(2);

    const fares = parseCsv(await csvOf("groupFares"));
    const copy = [...fares[1]!];
    copy[0] = "gf-import-new";
    const added = await call(admin, "POST", "/content/groupFares/import", {
      csv: toCsv(fares[0]!, [copy]),
    });
    expect(added.json<ContentImportReport>().summary).toMatchObject({ create: 1 });
    // Rows missing from the file stay.
    expect(await prisma.contentDocument.count({ where: { collection: "groupFares" } })).toBe(
      fares.length,
    );
  });

  it("refuses the whole file while a line has a problem, and lists each one", async () => {
    const table = parseCsv(await csvOf("compatibleModels"));
    const model = table[0]!.indexOf("model");
    table[1]![model] = "Edited model";
    table[2]![model] = "";
    const response = await call(admin, "POST", "/content/compatibleModels/import", {
      csv: toCsv(table[0]!, table.slice(1)),
    });
    expect(response.statusCode).toBe(422);
    const report = response.json<{ code: string; report: ContentImportReport }>();
    expect(report.code).toBe("import-problems");
    expect(report.report.rows.find((row) => row.line === 3)).toMatchObject({ action: "error" });
    const saved = await prisma.contentDocument.findFirstOrThrow({
      where: { collection: "compatibleModels", docId: table[1]![0]! },
    });
    expect((saved.data as { model: string }).model).not.toBe("Edited model");
    expect(
      (await call(editor, "POST", "/content/products/import/preview", { csv: "a" })).statusCode,
    ).toBe(403);
    expect(
      (await call(admin, "POST", "/content/coupons/import/preview", { csv: "a" })).statusCode,
    ).toBe(422);
  });
});

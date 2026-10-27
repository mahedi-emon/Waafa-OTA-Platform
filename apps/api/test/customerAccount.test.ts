import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openSession } from "../src/customers/customerAuth";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

/* My account sections and the optional password (issue 278; QA cases F-25 to F-31 in docs/qa/F-accounts.md). */

const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
let counter = 0;

describe.skipIf(!dbAvailable)("My account sections (issue 278)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  const call = (method: "GET" | "POST", url: string, token?: string, payload?: unknown) =>
    app.inject({
      method,
      url: `/api/v1/public${url}`,
      headers: {
        ...INTAKE,
        "x-client-ip": `192.0.2.${++counter % 250}`,
        ...(token ? { "x-customer-session": token } : {}),
      },
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  /** A verified customer with a session token. */
  const customer = async (email: string) => {
    const row = await prisma.customer.create({
      data: { email, name: "Rahim Uddin", emailVerifiedAt: new Date(), signInMethod: "email-code" },
    });
    const session = await openSession(prisma, row, "Mozilla/5.0 (Linux; Android 14) Chrome/130.0");
    return { id: row.id, token: session.token };
  };

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(
      featureModules({
        mailer: new MemoryMailer(),
        fetcher: () => Promise.resolve({ status: 200 }),
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("F-25: lists requests with their progress, visa steps and orders", async () => {
    const me = await customer("sections@example.com");
    await prisma.lead.create({
      data: {
        reference: "VSA-261027-0101",
        module: "visa",
        name: "Rahim",
        phone: "+8801712000101",
        email: "sections@example.com",
        contact: {},
        payload: { countrySlug: "thailand", visaType: "tourist" },
        source: {},
        summary: "Thailand tourist visa",
        status: "in-progress",
        progress: { received: [] },
      },
    });
    const view = await call("GET", "/account", me.token);
    expect(view.statusCode, view.body).toBe(200);
    const body = view.json<{
      requests: Array<{ reference: string; visa: { stage: string } | null }>;
      signIns: Array<{ device: string; current: boolean }>;
      hasPassword: boolean;
      preferences: { notifyOffers: boolean };
    }>();
    expect(body.requests[0]).toMatchObject({
      reference: "VSA-261027-0101",
      visa: { stage: "documentsPending" },
    });
    expect(body.signIns[0]).toMatchObject({ device: "Chrome on Android", current: true });
    expect(body).toMatchObject({ hasPassword: false, preferences: { notifyOffers: false } });
  });

  it("F-26: saves and removes wishlist items once each", async () => {
    const me = await customer("wish@example.com");
    const item = { kind: "package", slug: "bangkok-and-phuket" };
    expect((await call("POST", "/account/wishlist", me.token, item)).statusCode).toBe(204);
    expect((await call("POST", "/account/wishlist", me.token, item)).statusCode).toBe(204);
    expect(
      (await call("GET", "/account", me.token)).json<{ wishlist: unknown[] }>().wishlist,
    ).toEqual([item]);
    expect(
      (await call("POST", "/account/wishlist", me.token, { kind: "hotel", slug: "x" })).statusCode,
    ).toBe(422);
    expect((await call("POST", "/account/wishlist/remove", me.token, item)).statusCode).toBe(204);
    expect(
      (await call("GET", "/account", me.token)).json<{ wishlist: unknown[] }>().wishlist,
    ).toEqual([]);
    expect((await call("POST", "/account/wishlist", undefined, item)).statusCode).toBe(401);
  });

  it("F-27: keeps the passport number sealed, shows it masked, and refuses another customer's traveller", async () => {
    const me = await customer("passport@example.com");
    const other = await customer("someone@example.com");
    const added = await call("POST", "/account/travellers", me.token, {
      fullName: "Rahim Uddin",
      nationality: "BD",
      passportNumber: "ab1234821",
      passportExpiry: "2030-05-01",
    });
    expect(added.statusCode, added.body).toBe(201);
    const traveller = added.json<{ id: string; passportMasked: string }>();
    expect(traveller.passportMasked).toBe("•••• 4821");
    expect(added.body).not.toContain("AB1234821");
    const row = await prisma.customerTraveller.findUniqueOrThrow({ where: { id: traveller.id } });
    expect(row.passportSealed).not.toContain("AB1234821");
    expect(JSON.stringify(row)).not.toContain("AB1234821");

    // Saving without a number keeps the stored one.
    const kept = await call("POST", `/account/travellers/${traveller.id}`, me.token, {
      fullName: "Rahim U.",
      nationality: "BD",
    });
    expect(kept.json<{ passportMasked: string }>().passportMasked).toBe("•••• 4821");

    // Another customer cannot read, change or remove it.
    expect(
      (await call("POST", `/account/travellers/${traveller.id}`, other.token, { fullName: "X Y" }))
        .statusCode,
    ).toBe(404);
    expect(
      (await call("POST", `/account/travellers/${traveller.id}/remove`, other.token)).statusCode,
    ).toBe(404);
    expect(
      (await call("GET", "/account", other.token)).json<{ travellers: unknown[] }>().travellers,
    ).toEqual([]);
    expect(
      (await call("POST", `/account/travellers/${traveller.id}/remove`, me.token)).statusCode,
    ).toBe(204);
  });

  it("F-28: the first address is the default; a new default moves it; removing the default promotes the next", async () => {
    const me = await customer("address@example.com");
    const address = (street: string, isDefault?: boolean) => ({
      name: "Rahim Uddin",
      phone: "+8801712000102",
      division: "Dhaka",
      district: "Dhaka",
      area: "Motijheel",
      street,
      ...(isDefault === undefined ? {} : { isDefault }),
    });
    const first = (await call("POST", "/account/addresses", me.token, address("House 1"))).json<{
      id: string;
      isDefault: boolean;
    }>();
    expect(first.isDefault).toBe(true);
    const second = (
      await call("POST", "/account/addresses", me.token, address("House 2", true))
    ).json<{ id: string; isDefault: boolean }>();
    expect(second.isDefault).toBe(true);
    let list = (await call("GET", "/account", me.token)).json<{
      addresses: Array<{ id: string; isDefault: boolean }>;
    }>().addresses;
    expect(list.filter((item) => item.isDefault).map((item) => item.id)).toEqual([second.id]);
    expect(
      (await call("POST", `/account/addresses/${second.id}/remove`, me.token)).statusCode,
    ).toBe(204);
    list = (await call("GET", "/account", me.token)).json<{
      addresses: Array<{ id: string; isDefault: boolean }>;
    }>().addresses;
    expect(list).toEqual([expect.objectContaining({ id: first.id, isDefault: true })]);
  });

  it("F-29, F-30: saves the offers preference and signs out other devices only", async () => {
    const me = await customer("prefs@example.com");
    const row = await prisma.customer.findUniqueOrThrow({ where: { id: me.id } });
    const other = await openSession(prisma, row, "Mozilla/5.0 (Windows NT 10.0) Firefox/131.0");
    expect(
      (await call("POST", "/account/preferences", me.token, { notifyOffers: true })).statusCode,
    ).toBe(204);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: me.id } })).notifyOffers).toBe(
      true,
    );
    expect((await call("POST", "/account/sign-out-others", me.token)).json()).toEqual({ ended: 1 });
    expect((await call("GET", "/account", other.token)).statusCode).toBe(401);
    expect((await call("GET", "/account", me.token)).statusCode).toBe(200);
  });

  it("F-31: an optional password signs in; wrong ones share 5 tries; an unknown email gets the same answer", async () => {
    const me = await customer("password@example.com");
    expect(
      (await call("POST", "/account/password", me.token, { password: "short" })).statusCode,
    ).toBe(422);
    expect(
      (await call("POST", "/account/password", me.token, { password: "a long enough secret" }))
        .statusCode,
    ).toBe(204);
    const ok = await call("POST", "/auth/password", undefined, {
      email: "Password@Example.com",
      password: "a long enough secret",
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: me.id } })).signInMethod).toBe(
      "password",
    );

    const unknown = await call("POST", "/auth/password", undefined, {
      email: "nobody@example.com",
      password: "whatever",
    });
    const wrong = await call("POST", "/auth/password", undefined, {
      email: "password@example.com",
      password: "wrong",
    });
    expect(unknown.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(unknown.json<{ detail: string }>().detail).toBe(wrong.json<{ detail: string }>().detail);
    for (let i = 0; i < 3; i += 1)
      expect(
        (
          await call("POST", "/auth/password", undefined, {
            email: "password@example.com",
            password: "wrong",
          })
        ).statusCode,
      ).toBe(401);
    expect(
      (
        await call("POST", "/auth/password", undefined, {
          email: "password@example.com",
          password: "a long enough secret",
        })
      ).statusCode,
    ).toBe(429);

    expect((await call("POST", "/account/password/remove", me.token)).statusCode).toBe(204);
    expect(
      (await call("GET", "/account", me.token)).json<{ hasPassword: boolean }>().hasPassword,
    ).toBe(false);
  });

  it("deleting the account removes its travellers, addresses and wishlist", async () => {
    const me = await customer("delete-sections@example.com");
    await call("POST", "/account/travellers", me.token, { fullName: "Rahim Uddin" });
    await call("POST", "/account/wishlist", me.token, {
      kind: "product",
      slug: "voltaro-power-bank-22-5w",
    });
    expect((await call("POST", "/account/delete", me.token)).statusCode).toBe(204);
    expect(await prisma.customerTraveller.count({ where: { customerId: me.id } })).toBe(0);
    expect(await prisma.customerWishlistItem.count({ where: { customerId: me.id } })).toBe(0);
  });
});

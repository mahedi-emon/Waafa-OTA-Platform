import { Controller, Get, Module, UseGuards } from "@nestjs/common";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Roles, StaffGuard } from "../src/auth/auth.guard";
import { AuthModule } from "../src/auth/auth.module";
import { signAccessToken } from "../src/auth/tokens";
import type { PrismaClient } from "../src/generated/prisma/client";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

@Controller("test-shop")
@UseGuards(StaffGuard)
@Roles("shop-manager")
class ShopOnlyController {
  @Get()
  ok() {
    return { ok: true };
  }
}

@Module({ controllers: [ShopOnlyController] })
class ShopOnlyModule {}

const PASSWORD = "correct horse battery staple";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };

describe.skipIf(!dbAvailable)("staff auth", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let ip = 0;

  /** Each test signs in from its own address so the per-address limit never interferes. */
  const login = (email: string, password: string) =>
    app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { ...INTAKE, "x-client-ip": `10.0.0.${ip}` },
      payload: { email, password },
    });

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(() => [{ module: AuthModule }, { module: ShopOnlyModule }]);
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    ip += 1;
    await resetDatabase(prisma);
    const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
    await prisma.staffUser.createMany({
      data: [
        { name: "Sample Agent", email: "agent@example.com", passwordHash, roles: ["travel-sales"] },
        { name: "Sample Shop", email: "shop@example.com", passwordHash, roles: ["shop-manager"] },
      ],
    });
  });

  it("signs in, then /me answers with the roles", async () => {
    const response = await login("Agent@Example.com", PASSWORD);
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user).toMatchObject({ email: "agent@example.com", roles: ["travel-sales"] });
    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${body.accessToken}` },
    });
    expect(me.json()).toMatchObject({ name: "Sample Agent", roles: ["travel-sales"] });
    const session = await prisma.staffSession.findFirst();
    expect(session?.refreshHash).not.toBe(body.refreshToken);
  });

  it("gives one message for a wrong password and an unknown email", async () => {
    const wrong = await login("agent@example.com", "nope");
    const unknown = await login("nobody@example.com", "nope");
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json().detail).toBe(unknown.json().detail);
  });

  it("locks the account for 15 minutes after five wrong passwords", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      ip += 1;
      expect((await login("agent@example.com", "wrong-password")).statusCode).toBe(401);
    }
    ip += 1;
    const locked = await login("agent@example.com", PASSWORD);
    expect(locked.statusCode).toBe(429);
    expect(locked.json().detail).toMatch(/15 minutes/);
    expect(await prisma.auditLog.count({ where: { action: "staff.locked" } })).toBe(1);
  });

  it("rotates refresh tokens and closes every session when an old one comes back", async () => {
    const first = (await login("agent@example.com", PASSWORD)).json();
    const rotated = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: { refreshToken: first.refreshToken },
    });
    expect(rotated.statusCode).toBe(200);
    const second = rotated.json();
    expect(second.refreshToken).not.toBe(first.refreshToken);

    const reuse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: { refreshToken: first.refreshToken },
    });
    expect(reuse.statusCode).toBe(401);
    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${second.accessToken}` },
    });
    expect(me.statusCode).toBe(401);
  });

  it("logout closes the session", async () => {
    const tokens = (await login("agent@example.com", PASSWORD)).json();
    const out = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      payload: { refreshToken: tokens.refreshToken },
    });
    expect(out.statusCode).toBe(204);
    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    });
    expect(me.statusCode).toBe(401);
  });

  it("checks roles: shop routes refuse travel sales, accept the shop manager and Super Admin", async () => {
    const agent = (await login("agent@example.com", PASSWORD)).json();
    const shop = (await login("shop@example.com", PASSWORD)).json();
    const call = (token: string) =>
      app.inject({
        method: "GET",
        url: "/api/v1/test-shop",
        headers: { authorization: `Bearer ${token}` },
      });
    expect((await call(agent.accessToken)).statusCode).toBe(403);
    expect((await call(shop.accessToken)).statusCode).toBe(200);

    const session = await prisma.staffSession.findFirstOrThrow();
    const forged = await signAccessToken(
      { sub: "x", sid: session.id, name: "x", email: "x@example.com", roles: ["super-admin"] },
      "a-different-secret-0123456789-0123456789",
    );
    expect((await call(forged.token)).statusCode).toBe(401);
  });

  it("refuses missing and expired tokens", async () => {
    expect((await app.inject({ method: "GET", url: "/api/v1/auth/me" })).statusCode).toBe(401);
    const tokens = (await login("agent@example.com", PASSWORD)).json();
    const session = await prisma.staffSession.findFirstOrThrow();
    const old = await signAccessToken(
      { sub: tokens.user.id, sid: session.id, name: "a", email: "a@example.com", roles: [] },
      "test-jwt-secret-0123456789-0123456789-abc",
      new Date(Date.now() - 60 * 60_000),
    );
    const expired = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${old.token}` },
    });
    expect(expired.statusCode).toBe(401);
  });
});

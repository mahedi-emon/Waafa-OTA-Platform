import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import type { GoogleFetch } from "../src/customers/googleOAuth";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const PROVIDER_SECRET_KEY = "test-provider-secret-key-0123456789-abcdef";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const CLIENT_ID = "123-test.apps.googleusercontent.com";
const REDIRECT = "http://localhost:3000/api/auth/google/callback";

/** A fake Google token endpoint: the code names the account it signs in. */
const accounts: Record<string, Record<string, unknown>> = {
  "code-rahim": { sub: "g-1", email: "Rahim@Example.com", name: "Rahim Uddin" },
  "code-unverified": { sub: "g-2", email: "x@example.com", email_verified: false },
};
const googleFetch: GoogleFetch = async (_url, init) => {
  const form = new URLSearchParams(String(init.body));
  const account = accounts[form.get("code") ?? ""];
  if (!account || form.get("client_secret") !== "google-secret-1234") {
    return Response.json({ error: "invalid_grant" }, { status: 400 });
  }
  const claims = {
    iss: "https://accounts.google.com",
    aud: form.get("client_id"),
    exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true,
    ...account,
  };
  return Response.json({
    id_token: `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.sig`,
  });
};

describe.skipIf(!dbAvailable)("customer sign-in with Google (issue 134)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let owner: Record<string, string>;

  const pub = (method: "GET" | "POST", url: string, payload?: unknown, session?: string) =>
    app.inject({
      method,
      url: `/api/v1/public${url}`,
      headers: { ...INTAKE, ...(session ? { "x-customer-session": session } : {}) },
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });
  const signIn = (code: string, redirectUri = REDIRECT) =>
    pub("POST", "/auth/google", { code, codeVerifier: "v".repeat(64), redirectUri });

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    app = await testApp(
      featureModules({
        mailer: new MemoryMailer(),
        fetcher: () => Promise.resolve({ status: 200 }),
        googleFetch,
      }),
      { PROVIDER_SECRET_KEY },
    );
    const user = await prisma.staffUser.create({
      data: {
        name: "Owner",
        email: "owner@example.com",
        passwordHash: "x",
        roles: ["super-admin"],
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
      { sub: user.id, sid: session.id, name: "Owner", email: user.email, roles: ["super-admin"] },
      JWT_SECRET,
    );
    owner = { authorization: `Bearer ${token}` };
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("is off until the Super Admin connects Google and turns it on", async () => {
    expect((await pub("GET", "/auth/google/config")).json()).toEqual({
      enabled: false,
      clientId: null,
    });
    expect((await signIn("code-rahim")).statusCode).toBe(404);

    const admin = (url: string, payload: unknown) =>
      app.inject({
        method: "POST",
        url: `/api/v1/admin/providers${url}`,
        headers: owner,
        payload: payload as Record<string, unknown>,
      });
    const saved = await admin("/google/production", {
      settings: { clientId: CLIENT_ID },
      secrets: { clientSecret: "google-secret-1234" },
    });
    expect(saved.statusCode).toBe(200);
    expect(saved.body).not.toContain("google-secret-1234");
    expect((await admin("/google/setting", { isActive: true, isLive: true })).statusCode).toBe(200);

    const config = await pub("GET", "/auth/google/config");
    expect(config.json()).toEqual({ enabled: true, clientId: CLIENT_ID });
    expect(config.body).not.toContain("google-secret");
    const status = await pub("GET", "/integrations/status");
    expect(status.json()).toMatchObject({ auth: { google: true } });
  });

  it("refuses a redirect address that is not the site's callback", async () => {
    expect(
      (await signIn("code-rahim", "https://evil.example.com/api/auth/google/callback")).statusCode,
    ).toBe(400);
    expect((await signIn("code-rahim", "http://localhost:3000/somewhere-else")).statusCode).toBe(
      400,
    );
  });

  it("refuses a code Google rejects and an unverified email", async () => {
    expect((await signIn("code-unknown")).statusCode).toBe(401);
    expect((await signIn("code-unverified")).statusCode).toBe(401);
    expect(await prisma.customer.count()).toBe(0);
  });

  it("signs in, lists requests and orders sent with the same email, signs out", async () => {
    const lead = await prisma.lead.create({
      data: {
        reference: "FLT-TEST-1",
        module: "flights",
        name: "Rahim",
        phone: "+8801711000000",
        email: "rahim@example.com",
        contact: {},
        payload: {},
        source: {},
        summary: "Dhaka to Dubai, 2 travellers",
      },
    });
    await prisma.lead.create({
      data: {
        reference: "FLT-TEST-2",
        module: "flights",
        name: "Someone else",
        phone: "+8801711000001",
        email: "someone@example.com",
        contact: {},
        payload: {},
        source: {},
        summary: "Not Rahim's",
      },
    });

    const first = await signIn("code-rahim");
    expect(first.statusCode).toBe(200);
    const session = first.json<{ token: string; customer: { email: string; name: string } }>();
    expect(session.customer).toMatchObject({ email: "rahim@example.com", name: "Rahim Uddin" });
    const row = await prisma.customerSession.findFirstOrThrow();
    expect(row.tokenHash).not.toBe(session.token);

    const account = await pub("GET", "/account", undefined, session.token);
    expect(account.statusCode).toBe(200);
    const body = account.json<{ requests: Array<{ reference: string }> }>();
    expect(body.requests.map((request) => request.reference)).toEqual([lead.reference]);

    // Signing in again keeps one account.
    expect((await signIn("code-rahim")).statusCode).toBe(200);
    expect(await prisma.customer.count()).toBe(1);

    expect((await pub("POST", "/account/sign-out", undefined, session.token)).statusCode).toBe(204);
    expect((await pub("GET", "/account", undefined, session.token)).statusCode).toBe(401);
    expect((await pub("GET", "/account")).statusCode).toBe(401);
    expect((await pub("GET", "/account", undefined, "x".repeat(43))).statusCode).toBe(401);
  });

  it("deletes the account and its sessions, never the requests", async () => {
    const session = (await signIn("code-rahim")).json<{ token: string }>();
    expect((await pub("POST", "/account/delete", undefined, session.token)).statusCode).toBe(204);
    expect(await prisma.customer.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
    expect(await prisma.lead.count()).toBe(2);
    expect((await pub("GET", "/account", undefined, session.token)).statusCode).toBe(401);
  });

  it("needs the intake key", async () => {
    const anonymous = await app.inject({ method: "GET", url: "/api/v1/public/auth/google/config" });
    expect(anonymous.statusCode).toBe(401);
  });
});

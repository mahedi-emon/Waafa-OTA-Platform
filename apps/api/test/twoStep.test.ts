import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import argon2 from "argon2";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { newRefreshToken } from "../src/auth/tokens";
import { totpCode } from "../src/auth/totp";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

const PASSWORD = "correct horse battery staple";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const FIREFOX_ANDROID = "Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0";
const DEVICE_A = "device-a-0123456789abcdefghij";
const DEVICE_B = "device-b-0123456789abcdefghij";

type Body = Record<string, unknown> & {
  step?: string;
  challenge?: string;
  secret?: string;
  accessToken?: string;
  refreshToken?: string;
  recoveryCodes?: string[];
};

describe.skipIf(!dbAvailable)("two-step sign-in (issue 234)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  const mailer = new MemoryMailer();
  let ip = 0;

  const post = async (url: string, payload: unknown, headers: Record<string, string> = {}) => {
    ip += 1;
    const response = await app.inject({
      method: "POST",
      url: `/api/v1${url}`,
      headers: { ...INTAKE, "x-client-ip": `10.7.${Math.floor(ip / 250)}.${ip % 250}`, ...headers },
      payload: payload as Record<string, unknown>,
    });
    return { status: response.statusCode, body: response.json<Body>() };
  };
  const login = (email: string, extra: Record<string, unknown> = {}, ua = CHROME) =>
    post("/auth/login", { email, password: PASSWORD, ...extra }, { "user-agent": ua });
  const authed = async (token: string, method: "GET" | "POST", url: string, payload?: unknown) => {
    const response = await app.inject({
      method,
      url: `/api/v1${url}`,
      headers: { authorization: `Bearer ${token}` },
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });
    return {
      status: response.statusCode,
      body: response.body ? response.json<Record<string, unknown>>() : {},
    };
  };

  async function person(email: string, roles: Role[]) {
    return prisma.staffUser.create({
      data: {
        name: `Sample ${roles[0]}`,
        email,
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        roles,
      },
    });
  }

  /** Signs an admin in for the first time: the enrol step, the first code, and the recovery codes. */
  async function enrolled(email: string, extra: Record<string, unknown> = {}) {
    const first = await login(email, extra);
    expect(first.body.step).toBe("enrol");
    const secret = first.body.secret ?? "";
    const done = await post("/auth/login/enrol", {
      challenge: first.body.challenge,
      code: totpCode(secret),
      ...extra,
    });
    expect(done.status).toBe(200);
    return { secret, done: done.body };
  }

  beforeAll(async () => {
    prisma = testPrisma();
    app = await testApp(featureModules({ mailer }));
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    mailer.sent.length = 0;
    await prisma.contentDocument.create({
      data: {
        collection: "notificationTemplates",
        docId: "staff-new-device",
        position: 0,
        data: {
          key: "staff-new-device",
          audience: "Staff, on a new device",
          channel: "email",
          subject: "New sign-in to Waafa Admin",
          body: "Hello {{name}}, new device: {{device}}, address {{address}}, on {{time}}. {{link}}",
          variables: ["{{name}}", "{{device}}", "{{address}}", "{{time}}", "{{link}}"],
          enabled: true,
        },
      },
    });
    await prisma.contentDocument.create({
      data: {
        collection: "notificationTemplates",
        docId: "staff-code-locked",
        position: 1,
        data: {
          key: "staff-code-locked",
          audience: "Staff, when sign-in pauses at the code",
          channel: "email",
          subject: "Sign-in to Waafa Admin paused",
          body: "Hello {{name}}, wrong codes from {{address}} at {{time}}. {{link}}",
          variables: ["{{name}}", "{{address}}", "{{time}}", "{{link}}"],
          enabled: true,
        },
      },
    });
  });

  it("makes Super Admin and Admin set up an authenticator before the first session", async () => {
    await person("admin@example.com", ["admin"]);
    const first = await login("admin@example.com");
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ step: "enrol" });
    expect(first.body.accessToken).toBeUndefined();
    expect(first.body.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(first.body.otpauthUrl).toContain("otpauth://totp/Waafa%20Admin:admin%40example.com");

    const wrong = await post("/auth/login/enrol", {
      challenge: first.body.challenge,
      code: "000000",
    });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe("wrong-code");

    const done = await post("/auth/login/enrol", {
      challenge: first.body.challenge,
      code: totpCode(first.body.secret ?? ""),
    });
    expect(done.status).toBe(200);
    expect(done.body.step).toBe("done");
    expect(done.body.accessToken).toBeTruthy();
    expect(done.body.recoveryCodes).toHaveLength(10);

    const stored = await prisma.staffUser.findUniqueOrThrow({
      where: { email: "admin@example.com" },
    });
    expect(stored.totpEnabledAt).not.toBeNull();
    // Sealed at rest, never the plain secret.
    expect(stored.totpSecret).toMatch(/^v1\./);
    expect(stored.totpSecret).not.toContain(first.body.secret);
    expect(await prisma.staffRecoveryCode.count({ where: { userId: stored.id } })).toBe(10);
    expect(await prisma.auditLog.count({ where: { action: "staff.two-step-on" } })).toBe(1);

    // The challenge can't set up a second authenticator.
    const again = await post("/auth/login/enrol", {
      challenge: first.body.challenge,
      code: totpCode(first.body.secret ?? "", Date.now() + 30_000),
    });
    expect(again.status).toBe(401);
  });

  it("asks for a code once it is on: wrong codes fail, a used code can't open a second session", async () => {
    await person("admin@example.com", ["admin"]);
    const { secret } = await enrolled("admin@example.com");

    const next = await login("admin@example.com");
    expect(next.body).toMatchObject({ step: "code" });
    expect(next.body.accessToken).toBeUndefined();
    const wrong = await post("/auth/login/code", {
      challenge: next.body.challenge,
      code: "123456",
    });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe("wrong-code");

    const code = totpCode(secret, Date.now() + 30_000);
    const ok = await post("/auth/login/code", { challenge: next.body.challenge, code });
    expect(ok.status).toBe(200);
    expect(ok.body.step).toBe("done");

    const replay = await login("admin@example.com");
    const reused = await post("/auth/login/code", { challenge: replay.body.challenge, code });
    expect(reused.status).toBe(400);

    // A forged or expired challenge is refused.
    const forged = await post("/auth/login/code", { challenge: "x".repeat(40), code });
    expect(forged.status).toBe(401);
  });

  it("takes each recovery code once", async () => {
    await person("owner@example.com", ["super-admin"]);
    const { done } = await enrolled("owner@example.com");
    const [recovery = ""] = done.recoveryCodes ?? [];

    const first = await login("owner@example.com");
    const used = await post("/auth/login/code", {
      challenge: first.body.challenge,
      code: recovery.toLowerCase(),
    });
    expect(used.status).toBe(200);
    expect(used.body.step).toBe("done");

    const second = await login("owner@example.com");
    const again = await post("/auth/login/code", {
      challenge: second.body.challenge,
      code: recovery,
    });
    expect(again.status).toBe(400);
    expect(await prisma.auditLog.count({ where: { action: "staff.recovery-code-used" } })).toBe(1);
  });

  it("locks the account after five wrong codes, like wrong passwords", async () => {
    await person("admin@example.com", ["admin"]);
    await enrolled("admin@example.com");
    const step = await login("admin@example.com");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const wrong = await post("/auth/login/code", {
        challenge: step.body.challenge,
        code: "000000",
      });
      expect(wrong.status).toBe(400);
    }
    const locked = await post("/auth/login/code", {
      challenge: step.body.challenge,
      code: "111111",
    });
    expect(locked.status).toBe(429);
    expect((await login("admin@example.com")).status).toBe(429);
    expect(await prisma.auditLog.count({ where: { action: "staff.locked" } })).toBe(1);

    // The password was right: the person hears about it.
    await app.get(NotificationService).idle();
    const alert = mailer.sent.find((mail) => mail.subject === "Sign-in to Waafa Admin paused");
    expect(alert?.to).toBe("admin@example.com");

    // A second lock the same day lasts twice as long (review: no endless five-at-a-time guessing).
    await prisma.staffUser.updateMany({ data: { lockedUntil: new Date(Date.now() - 1_000) } });
    const again = await login("admin@example.com");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await post("/auth/login/code", { challenge: again.body.challenge, code: "000000" });
    }
    const stored = await prisma.staffUser.findUniqueOrThrow({
      where: { email: "admin@example.com" },
    });
    const minutes = ((stored.lockedUntil?.getTime() ?? 0) - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(29);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  it("turns two-step sign-in on once when the first code is sent twice at the same moment", async () => {
    await person("admin@example.com", ["admin"]);
    const first = await login("admin@example.com");
    const payload = { challenge: first.body.challenge, code: totpCode(first.body.secret ?? "") };
    const [a, b] = await Promise.all([
      post("/auth/login/enrol", payload),
      post("/auth/login/enrol", payload),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const winner = a.status === 200 ? a : b;
    const codes = await prisma.staffRecoveryCode.count();
    expect(codes).toBe(10);
    expect(winner.body.recoveryCodes).toHaveLength(10);
  });

  it("skips the code for 30 days on a trusted device only", async () => {
    await person("admin@example.com", ["admin"]);
    const { secret } = await enrolled("admin@example.com", { device: DEVICE_A });

    const step = await login("admin@example.com", { device: DEVICE_A });
    expect(step.body.step).toBe("code");
    const trusted = await post("/auth/login/code", {
      challenge: step.body.challenge,
      code: totpCode(secret, Date.now() + 30_000),
      device: DEVICE_A,
      trustDevice: true,
    });
    expect(trusted.body.step).toBe("done");

    expect((await login("admin@example.com", { device: DEVICE_A })).body.step).toBe("done");
    expect((await login("admin@example.com", { device: DEVICE_B })).body.step).toBe("code");
    expect((await login("admin@example.com")).body.step).toBe("code");

    // Past the 30 days the code is asked again.
    await prisma.staffDevice.updateMany({ data: { trustedUntil: new Date(Date.now() - 1_000) } });
    expect((await login("admin@example.com", { device: DEVICE_A })).body.step).toBe("code");
  });

  it("records the history and emails a sign-in from a new device", async () => {
    const user = await person("agent@example.com", ["travel-sales"]);
    expect((await login("agent@example.com", { device: DEVICE_A })).body.step).toBe("done");
    await post("/auth/login", { email: "agent@example.com", password: "wrong" });
    expect((await login("agent@example.com", { device: DEVICE_A })).body.step).toBe("done");
    const fromPhone = await login("agent@example.com", { device: DEVICE_B }, FIREFOX_ANDROID);
    expect(fromPhone.body.step).toBe("done");

    await app.get(NotificationService).idle();
    // The first device after the feature ships sends nothing; the second one does.
    const emails = mailer.sent.filter((mail) => mail.subject === "New sign-in to Waafa Admin");
    expect(emails).toHaveLength(1);
    expect(emails[0]?.to).toBe("agent@example.com");
    expect(emails[0]?.text).toContain("Firefox on Android");

    const events = await prisma.staffLoginEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((event) => event.result)).toEqual([
      "success",
      "wrong-password",
      "success",
      "success",
    ]);
    expect(events.map((event) => event.newDevice)).toEqual([false, false, false, true]);
    expect(events[0]?.device).toBe("Chrome on Windows");
    expect(events[0]?.ip).toMatch(/^10\.7\./);

    const token = (await login("agent@example.com", { device: DEVICE_A })).body.accessToken ?? "";
    const own = await authed(token, "GET", "/auth/logins");
    expect(own.status).toBe(200);
    expect(own.body).toHaveLength(5);
    expect((own.body as unknown as Array<{ result: string }>)[0]?.result).toBe("success");
  });

  it("ends the session of an admin who hasn't set it up, at the next refresh", async () => {
    const user = await person("admin@example.com", ["admin"]);
    const refresh = newRefreshToken();
    await prisma.staffSession.create({
      data: {
        userId: user.id,
        refreshHash: refresh.hash,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    const response = await post("/auth/refresh", { refreshToken: refresh.token });
    expect(response.status).toBe(401);
  });

  it("lets other roles turn it on and off in My account; admins can't turn it off", async () => {
    await person("agent@example.com", ["travel-sales"]);
    const token = (await login("agent@example.com")).body.accessToken ?? "";
    expect((await authed(token, "GET", "/auth/two-step")).body).toMatchObject({
      enabled: false,
      required: false,
    });

    const started = await authed(token, "POST", "/auth/two-step/start");
    const secret = String(started.body.secret);
    expect(
      (
        await authed(token, "POST", "/auth/two-step/confirm", {
          challenge: started.body.challenge,
          code: "000000",
        })
      ).status,
    ).toBe(400);
    const confirmed = await authed(token, "POST", "/auth/two-step/confirm", {
      challenge: started.body.challenge,
      code: totpCode(secret),
    });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.recoveryCodes).toHaveLength(10);
    expect((await authed(token, "GET", "/auth/two-step")).body).toMatchObject({
      enabled: true,
      recoveryCodesLeft: 10,
    });

    const fresh = await authed(token, "POST", "/auth/two-step/recovery-codes", {
      code: totpCode(secret, Date.now() + 30_000),
    });
    expect(fresh.status).toBe(200);
    expect(fresh.body.recoveryCodes).toHaveLength(10);

    expect((await authed(token, "POST", "/auth/two-step/off", { password: "wrong" })).status).toBe(
      400,
    );
    expect((await authed(token, "POST", "/auth/two-step/off", { password: PASSWORD })).status).toBe(
      204,
    );
    expect((await authed(token, "GET", "/auth/two-step")).body).toMatchObject({ enabled: false });
    expect(await prisma.staffRecoveryCode.count()).toBe(0);

    await person("admin@example.com", ["admin"]);
    const admin = (await enrolled("admin@example.com")).done.accessToken ?? "";
    const refused = await authed(admin, "POST", "/auth/two-step/off", { password: PASSWORD });
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe("required");
  });

  it("lets the Super Admin see someone's sign-ins and reset their two-step sign-in", async () => {
    await person("owner@example.com", ["super-admin"]);
    const admin = await person("admin@example.com", ["admin"]);
    const owner = (await enrolled("owner@example.com")).done.accessToken ?? "";
    await enrolled("admin@example.com");

    const history = await authed(owner, "GET", `/admin/users/${admin.id}/logins`);
    expect(history.status).toBe(200);
    expect(history.body).toHaveLength(1);

    const list = await authed(owner, "GET", "/admin/users");
    const row = (list.body as unknown as Array<{ email: string; twoStep: boolean }>).find(
      (item) => item.email === "admin@example.com",
    );
    expect(row?.twoStep).toBe(true);

    expect((await authed(owner, "POST", `/admin/users/${admin.id}/two-step/reset`)).status).toBe(
      204,
    );
    expect((await login("admin@example.com")).body.step).toBe("enrol");
    expect(await prisma.auditLog.count({ where: { action: "staff.two-step-reset" } })).toBe(1);

    // Only the Super Admin.
    const adminToken = (await enrolled("admin@example.com")).done.accessToken ?? "";
    expect((await authed(adminToken, "GET", `/admin/users/${admin.id}/logins`)).status).toBe(403);
  });
});

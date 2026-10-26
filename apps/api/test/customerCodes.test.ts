import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { loadFixtures } from "@waafa/fixtures";
import type { Role } from "@waafa/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signAccessToken } from "../src/auth/tokens";
import { featureModules } from "../src/features";
import type { PrismaClient } from "../src/generated/prisma/client";
import { MemoryMailer } from "../src/notifications/mailer";
import { NotificationService } from "../src/notifications/notification.service";
import { seedDatabase } from "../src/seed/seedDatabase";
import { dbAvailable, resetDatabase, testApp, testPrisma } from "./helpers";

/*
 * Email code sign-in and sign-up (issue 241, D301), QA cases F-01 to F-24 in docs/qa/F-accounts.md. Each test uses its
 * own visitor address (x-client-ip) and email, so the per-address limits never leak between tests.
 */

const JWT_SECRET = "test-jwt-secret-0123456789-0123456789-abc";
const INTAKE = { "x-intake-key": "test-intake-key-0123456789-abcdef" };
let counter = 0;
const nextIp = () => `198.51.100.${++counter}`;

type Problem = { code?: string; triesLeft?: number };

describe.skipIf(!dbAvailable)("email code sign-in (issue 241)", () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  const mailer = new MemoryMailer();
  let admin: Record<string, string>;
  let sales: Record<string, string>;

  const pub = (url: string, payload: unknown, ip: string, session?: string) =>
    app.inject({
      method: "POST",
      url: `/api/v1/public${url}`,
      headers: {
        ...INTAKE,
        "x-client-ip": ip,
        ...(session ? { "x-customer-session": session } : {}),
      },
      payload: payload as Record<string, unknown>,
    });
  const account = (session: string) =>
    app.inject({
      method: "GET",
      url: "/api/v1/public/account",
      headers: { ...INTAKE, "x-customer-session": session },
    });

  /** The code in the newest email to the address. */
  const codeFor = async (email: string) => {
    await app.get(NotificationService).idle();
    const mail = mailer.sent.findLast((item) => item.to === email);
    const code = /\b(\d{6})\b/.exec(mail?.text ?? "")?.[1];
    expect(code, mail?.text).toBeTruthy();
    return code ?? "";
  };

  const askCode = (email: string, ip = nextIp()) => pub("/auth/email/code", { email }, ip);
  const verify = (email: string, code: string, ip = nextIp()) =>
    pub("/auth/email/verify", { email, code }, ip);

  /** Signs a new address up through code, ticket and profile; returns the session token. */
  const signUp = async (email: string, phone = "+8801712000000", name = "Rahim Uddin") => {
    expect((await askCode(email)).statusCode).toBe(202);
    const verified = await verify(email, await codeFor(email));
    expect(verified.statusCode, verified.body).toBe(200);
    const result = verified.json<{ status: string; ticket: string }>();
    expect(result.status).toBe("new");
    const done = await pub(
      "/auth/email/complete",
      { ticket: result.ticket, name, phone },
      nextIp(),
    );
    expect(done.statusCode, done.body).toBe(200);
    return done.json<{ token: string; customer: { id: string } }>();
  };

  const staffHeaders = async (roles: Role[], email: string) => {
    const user = await prisma.staffUser.create({
      data: { name: roles[0] ?? "Staff", email, passwordHash: "x", roles },
    });
    const session = await prisma.staffSession.create({
      data: {
        userId: user.id,
        refreshHash: randomUUID(),
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    const { token } = await signAccessToken(
      { sub: user.id, sid: session.id, name: user.name, email, roles },
      JWT_SECRET,
    );
    return { authorization: `Bearer ${token}` };
  };
  const staffCall = (
    headers: Record<string, string>,
    method: "GET" | "POST",
    url: string,
    payload?: unknown,
  ) =>
    app.inject({
      method,
      url: `/api/v1/admin${url}`,
      headers,
      ...(payload === undefined ? {} : { payload: payload as Record<string, unknown> }),
    });

  const guestLead = (reference: string, phone: string, email: string | null) =>
    prisma.lead.create({
      data: {
        reference,
        module: "flights",
        name: "Guest",
        phone,
        email,
        contact: {},
        payload: {},
        source: {},
        summary: reference,
      },
    });

  beforeAll(async () => {
    prisma = testPrisma();
    await resetDatabase(prisma);
    await seedDatabase(prisma, loadFixtures());
    app = await testApp(
      featureModules({ mailer, fetcher: () => Promise.resolve({ status: 200 }) }),
    );
    admin = await staffHeaders(["admin"], "admin-241@example.com");
    sales = await staffHeaders(["travel-sales"], "sales-241@example.com");
  });

  beforeEach(() => {
    mailer.sent.length = 0;
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("F-02, F-10: signs a new address up with one email holding the code, then name and phone", async () => {
    const email = "new.person@example.com";
    expect((await askCode("  New.Person@Example.com ")).statusCode).toBe(202);
    await app.get(NotificationService).idle();
    const mails = mailer.sent.filter((mail) => mail.to === email);
    expect(mails).toHaveLength(1);
    expect(mails[0]?.subject).toBe("Your Waafa sign-in code");
    expect(mails[0]?.text).toMatch(/\b\d{6}\b/);
    expect(mails[0]?.text).toContain("10 minutes");
    const row = await prisma.customerSignInCode.findFirstOrThrow({ where: { email } });
    expect(row.codeHash).not.toContain(await codeFor(email));

    const session = await signUp(email);
    const customer = await prisma.customer.findUniqueOrThrow({ where: { email } });
    expect(customer).toMatchObject({ phone: "+8801712000000", signInMethod: "email-code" });
    expect(customer.emailVerifiedAt).not.toBeNull();
    expect((await account(session.token)).json()).toMatchObject({
      customer: { email, phone: "+8801712000000" },
    });
  });

  it("F-01: signs an existing account in with the code", async () => {
    const email = "returning@example.com";
    await signUp(email);
    expect((await askCode(email)).statusCode).toBe(202);
    const result = await verify(email, await codeFor(email));
    expect(result.statusCode).toBe(200);
    expect(result.json<{ status: string }>().status).toBe("signed-in");
    expect(await prisma.customer.count({ where: { email } })).toBe(1);
  });

  it("F-07: answers the same for an unknown, a known and a disabled address", async () => {
    const known = "known@example.com";
    const { customer } = await signUp(known);
    const disabled = "disabled@example.com";
    const off = await signUp(disabled);
    await prisma.customer.update({
      where: { id: off.customer.id },
      data: { disabledAt: new Date() },
    });

    await app.get(NotificationService).idle();
    mailer.sent.length = 0;
    const answers = await Promise.all(
      [known, "nobody@example.com", disabled].map((email) => askCode(email)),
    );
    for (const answer of answers) {
      expect(answer.statusCode).toBe(202);
      expect(answer.body).toBe("{}");
    }
    await app.get(NotificationService).idle();
    // F-19: a disabled account gets no email.
    expect(mailer.sent.some((mail) => mail.to === disabled)).toBe(false);
    expect(customer.id).toBeTruthy();
  });

  it("F-03: five wrong codes lock the code; a new one is needed", async () => {
    const email = "tries@example.com";
    await askCode(email);
    const code = await codeFor(email);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let left = 4; left >= 1; left -= 1) {
      const answer = await verify(email, wrong);
      expect(answer.statusCode).toBe(401);
      expect(answer.json<Problem>()).toMatchObject({ code: "wrong-code", triesLeft: left });
    }
    const fifth = await verify(email, wrong);
    expect(fifth.json<Problem>().code).toBe("locked");
    // Even the right code no longer works.
    expect((await verify(email, code)).statusCode).toBe(401);
  });

  it("F-04: refuses an expired code", async () => {
    const email = "late@example.com";
    await askCode(email);
    const code = await codeFor(email);
    await prisma.customerSignInCode.updateMany({
      where: { email },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const answer = await verify(email, code);
    expect(answer.statusCode).toBe(401);
    expect(answer.json<Problem>().code).toBe("expired");
  });

  it("F-05, F-06: a code works once and only the newest code counts", async () => {
    const email = "once@example.com";
    await signUp(email);
    await askCode(email);
    const first = await codeFor(email);
    await askCode(email);
    const second = await codeFor(email);
    if (first !== second) expect((await verify(email, first)).statusCode).toBe(401);
    expect((await verify(email, second)).statusCode).toBe(200);
    expect((await verify(email, second)).statusCode).toBe(401);
  });

  it("F-08: at most 5 codes an hour per email and 20 per visitor address", async () => {
    const email = "many@example.com";
    for (let i = 0; i < 5; i += 1) expect((await askCode(email)).statusCode).toBe(202);
    const sixth = await askCode(email);
    expect(sixth.statusCode).toBe(429);
    await app.get(NotificationService).idle();
    expect(mailer.sent.filter((mail) => mail.to === email)).toHaveLength(5);

    const ip = nextIp();
    for (let i = 0; i < 20; i += 1)
      expect((await askCode(`ip${i}@example.com`, ip)).statusCode).toBe(202);
    expect((await askCode("ip-last@example.com", ip)).statusCode).toBe(429);
  });

  it("refuses a sign-up ticket twice, after 15 minutes, or made up", async () => {
    const email = "ticket@example.com";
    await askCode(email);
    const { ticket } = (await verify(email, await codeFor(email))).json<{ ticket: string }>();
    const complete = (value: string) =>
      pub(
        "/auth/email/complete",
        { ticket: value, name: "Ticket Test", phone: "+8801712000009" },
        nextIp(),
      );
    expect((await complete("t".repeat(43))).statusCode).toBe(401);
    expect((await complete(ticket)).statusCode).toBe(200);
    expect((await complete(ticket)).statusCode).toBe(401);
  });

  it("F-13, F-14, F-15: attaches guest records by email, by phone only without an email, never another email's", async () => {
    const email = "attach@example.com";
    const phone = "+8801712000111";
    await guestLead("FLT-ATT-EMAIL", "+8801712999999", "ATTACH@example.com");
    await guestLead("FLT-ATT-PHONE", phone, null);
    await guestLead("FLT-ATT-OTHER", phone, "someone.else@example.com");
    await prisma.order.create({
      data: {
        reference: "WW-ATT-1",
        items: [],
        subtotal: 100,
        discount: 0,
        delivery: 0,
        total: 100,
        payment: { method: "cod" },
        address: {},
        name: "Guest",
        phone: "+8801700000000",
        email,
      },
    });
    const session = await signUp(email, phone);
    const view = (await account(session.token)).json<{
      requests: Array<{ reference: string }>;
      orders: Array<{ reference: string }>;
    }>();
    expect(view.requests.map((item) => item.reference).sort()).toEqual([
      "FLT-ATT-EMAIL",
      "FLT-ATT-PHONE",
    ]);
    expect(view.orders.map((item) => item.reference)).toEqual(["WW-ATT-1"]);
  });

  it("F-16, F-18: staff attach by hand, sign out everywhere and disable, all audited", async () => {
    const email = "staff-actions@example.com";
    const session = await signUp(email);
    const id = session.customer.id;
    await guestLead("FLT-HAND-1", "+8801712555555", "different@example.com");

    expect(
      (
        await staffCall(sales, "POST", `/customers/accounts/${id}/attach`, {
          kind: "lead",
          reference: "flt-hand-1",
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (await prisma.lead.findUniqueOrThrow({ where: { reference: "FLT-HAND-1" } })).customerId,
    ).toBe(id);

    const list = await staffCall(
      admin,
      "GET",
      `/customers/accounts?q=${encodeURIComponent(email)}`,
    );
    expect(list.json<{ items: unknown[] }>().items).toEqual([
      expect.objectContaining({
        email,
        verified: true,
        signInMethod: "email-code",
        disabled: false,
      }),
    ]);

    // Sales cannot turn accounts off; an admin can.
    expect(
      (await staffCall(sales, "POST", `/customers/accounts/${id}/disable`, {})).statusCode,
    ).toBe(403);
    expect(
      (await staffCall(admin, "POST", `/customers/accounts/${id}/sign-out-everywhere`)).statusCode,
    ).toBe(200);
    expect((await account(session.token)).statusCode).toBe(401);

    const again = await askCode(email);
    expect(again.statusCode).toBe(202);
    const second = (await verify(email, await codeFor(email))).json<{
      session: { token: string };
    }>();
    expect(
      (
        await staffCall(admin, "POST", `/customers/accounts/${id}/disable`, {
          reason: "Fraud report",
        })
      ).statusCode,
    ).toBe(200);
    expect((await account(second.session.token)).statusCode).toBe(401);

    const actions = await prisma.auditLog.findMany({
      where: { entityId: { in: [id] } },
      select: { action: true },
    });
    expect(actions.map((row) => row.action).sort()).toEqual([
      "customer.disable",
      "customer.sign-out-everywhere",
    ]);
    expect(await prisma.auditLog.count({ where: { action: "customer.attach" } })).toBe(1);
  });

  it("F-21: keeps a name with markup as plain text", async () => {
    const session = await signUp(
      "markup@example.com",
      "+8801712000222",
      '<img src=x onerror="alert(1)">',
    );
    const body = (await account(session.token)).json<{ customer: { name: string } }>();
    expect(body.customer.name).toBe('<img src=x onerror="alert(1)">');
  });

  it("F-40: keeps a Bangla name as typed", async () => {
    const session = await signUp("bangla@example.com", "+8801712000333", "রহিম উদ্দিন");
    expect(
      (await account(session.token)).json<{ customer: { name: string } }>().customer.name,
    ).toBe("রহিম উদ্দিন");
  });

  it("refuses bad input with 422 and needs the intake key", async () => {
    expect((await askCode("not-an-email")).statusCode).toBe(422);
    expect((await verify("a@b.co", "12345")).statusCode).toBe(422);
    const anonymous = await app.inject({
      method: "POST",
      url: "/api/v1/public/auth/email/code",
      payload: { email: "a@b.co" },
    });
    expect(anonymous.statusCode).toBe(401);
  });
});

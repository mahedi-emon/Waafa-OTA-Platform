import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  SIGN_IN_CODE_MINUTES,
  SIGN_IN_CODE_TRIES,
  SIGN_UP_TICKET_MINUTES,
  type EmailCodeResult,
  type CustomerSession,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { ProblemException, problems } from "../common/problem";
import { RateLimitService } from "../common/rateLimit.service";
import { NotificationService } from "../notifications/notification.service";
import type { Customer } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  attachGuestRecords,
  codeHash,
  hashToken,
  newSignInCode,
  newToken,
  openSession,
  sameHash,
} from "./customerAuth";

/** A wrong, expired or used-up code: one answer shape, the code says which (only the inbox owner can get this far). */
const refused = (code: "wrong-code" | "expired" | "locked", triesLeft?: number) =>
  new ProblemException(
    HttpStatus.UNAUTHORIZED,
    "Unauthorized",
    code === "wrong-code"
      ? "That code isn't right."
      : code === "locked"
        ? "Too many wrong codes. Ask for a new one."
        : "That code has expired. Ask for a new one.",
    undefined,
    code,
    triesLeft === undefined ? undefined : { triesLeft },
  );

/**
 * Email sign-in codes (FR-ACC, issue 241, D301). No phone OTP and no SMS for sign-in.
 *
 * - A code request always gets the same answer, whether an account exists, is disabled or is new (no enumeration);
 *   only the limits can refuse it, and they refuse every address the same way.
 * - A code is 6 digits, works for 10 minutes, once, with at most 5 tries; a new request replaces the old code.
 * - The right code signs an existing account in (and attaches its guest records), or turns into a 15-minute sign-up
 *   ticket that the name-and-phone step spends.
 */
@Injectable()
export class CustomerCodesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Sends a code to the address. Resolves the same way for every address; throws only for the limits. */
  async requestCode(email: string, ip: string, now = new Date()): Promise<void> {
    const [byAddress, byEmail] = await Promise.all([
      this.limits.allow("customerCodeIp", ip, now.getTime()),
      this.limits.allow("customerCodeEmail", email, now.getTime()),
    ]);
    if (!byAddress || !byEmail)
      throw problems.tooMany("Too many codes asked for. Try again in an hour.");

    const customer = await this.prisma.customer.findUnique({ where: { email } });
    // A disabled account gets the same answer and no email.
    if (customer?.disabledAt) return;

    const code = newSignInCode();
    await this.prisma.$transaction([
      // Only the newest code for an address works.
      this.prisma.customerSignInCode.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.customerSignInCode.create({
        data: {
          email,
          codeHash: codeHash(this.env.JWT_SECRET, email, code),
          expiresAt: new Date(now.getTime() + SIGN_IN_CODE_MINUTES * 60_000),
          ip,
        },
      }),
    ]);
    void this.notifications.notify("customer-sign-in-code", email, {
      code,
      minutes: String(SIGN_IN_CODE_MINUTES),
    });
  }

  /** Checks a code: a session for an existing account, or a sign-up ticket for a new address. */
  async verifyCode(
    email: string,
    code: string,
    ip: string,
    userAgent: string | undefined,
    now = new Date(),
  ): Promise<EmailCodeResult> {
    if (!(await this.limits.allow("customerCodeVerify", ip, now.getTime())))
      throw problems.tooMany();

    const row = await this.prisma.customerSignInCode.findFirst({
      where: { email, usedAt: null, ticketHash: null },
      orderBy: { createdAt: "desc" },
    });
    if (!row || row.expiresAt.getTime() <= now.getTime()) throw refused("expired");
    if (row.attempts >= SIGN_IN_CODE_TRIES) throw refused("locked");

    if (!sameHash(row.codeHash, codeHash(this.env.JWT_SECRET, email, code))) {
      const attempts = row.attempts + 1;
      await this.prisma.customerSignInCode.update({
        where: { id: row.id },
        data: { attempts, ...(attempts >= SIGN_IN_CODE_TRIES ? { usedAt: now } : {}) },
      });
      if (attempts >= SIGN_IN_CODE_TRIES) throw refused("locked");
      throw refused("wrong-code", SIGN_IN_CODE_TRIES - attempts);
    }

    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (customer) {
      // Spend the code once, even when two checks race.
      const spent = await this.prisma.customerSignInCode.updateMany({
        where: { id: row.id, usedAt: null },
        data: { usedAt: now },
      });
      if (spent.count !== 1) throw refused("expired");
      if (customer.disabledAt)
        throw problems.unauthorized("This account is turned off. Contact us.");
      return { status: "signed-in", session: await this.signIn(customer, userAgent, now) };
    }

    const ticket = newToken();
    const claimed = await this.prisma.customerSignInCode.updateMany({
      where: { id: row.id, usedAt: null, ticketHash: null },
      data: {
        ticketHash: hashToken(ticket),
        ticketExpiresAt: new Date(now.getTime() + SIGN_UP_TICKET_MINUTES * 60_000),
      },
    });
    if (claimed.count !== 1) throw refused("expired");
    return { status: "new", ticket };
  }

  /** Spends a sign-up ticket: creates the account (email verified) and signs it in. */
  async completeSignUp(
    input: { ticket: string; name: string; phone: string },
    userAgent: string | undefined,
    now = new Date(),
  ): Promise<CustomerSession> {
    const row = await this.prisma.customerSignInCode.findUnique({
      where: { ticketHash: hashToken(input.ticket) },
    });
    if (
      !row ||
      !row.ticketExpiresAt ||
      row.ticketExpiresAt.getTime() <= now.getTime() ||
      row.usedAt
    ) {
      throw problems.unauthorized("This sign-up has expired. Start again with your email.");
    }
    const spent = await this.prisma.customerSignInCode.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: now },
    });
    if (spent.count !== 1) {
      throw problems.unauthorized("This sign-up has expired. Start again with your email.");
    }

    // Google may have made the account meanwhile: then this is a sign-in, keeping that account's name.
    const existing = await this.prisma.customer.findUnique({ where: { email: row.email } });
    if (existing) {
      if (existing.disabledAt)
        throw problems.unauthorized("This account is turned off. Contact us.");
      if (!existing.phone) {
        await this.prisma.customer.update({
          where: { id: existing.id },
          data: { phone: input.phone },
        });
      }
      return this.signIn(existing, userAgent, now);
    }
    const created = await this.prisma.customer.create({
      data: {
        email: row.email,
        name: input.name,
        phone: input.phone,
        emailVerifiedAt: now,
        signInMethod: "email-code",
        lastSignInAt: now,
      },
    });
    await attachGuestRecords(this.prisma, created);
    return openSession(this.prisma, created, userAgent, now);
  }

  /** Marks the email proven, records the way in, attaches guest records and opens a session. */
  private async signIn(customer: Customer, userAgent: string | undefined, now: Date) {
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastSignInAt: now,
        signInMethod: "email-code",
        ...(customer.emailVerifiedAt ? {} : { emailVerifiedAt: now }),
      },
    });
    await attachGuestRecords(this.prisma, updated);
    return openSession(this.prisma, updated, userAgent, now);
  }
}

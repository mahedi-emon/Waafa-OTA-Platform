import { Inject, Injectable } from "@nestjs/common";
import argon2 from "argon2";
import { twoStepRequired, type StaffLoginResult } from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { problems } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notification.service";
import { Prisma, type StaffUser } from "../generated/prisma/client";
import type { StaffPrincipal } from "./principal";
import { TRUST_DAYS, deviceHashOf, deviceLabel } from "./device";
import {
  REFRESH_TTL_SECONDS,
  asRoles,
  hashToken,
  newRefreshToken,
  signAccessToken,
  signChallenge,
  verifyAccessToken,
  verifyChallenge,
} from "./tokens";
import {
  hashRecoveryCode,
  looksLikeRecoveryCode,
  newRecoveryCodes,
  newTotpSecret,
  otpauthUrl,
  verifyTotp,
} from "./totp";
import { twoStepBox } from "./twoStepSecret";

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
/** The longest lock after repeated ones, and how far back earlier locks count. */
export const MAX_LOCK_MINUTES = 24 * 60;
const LOCK_WINDOW_MS = 24 * 60 * 60_000;
/** A rotated refresh token presented again within this window is a concurrent refresh, not a stolen token (#66). */
export const REFRESH_GRACE_MS = 30_000;

export type SessionTokens = {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  user: { id: string; name: string; email: string; roles: string[] };
};

/**
 * What a correct password leads to (issue 234): a session, the code step (two-step sign-in is on and this device
 * isn't trusted), or setting up an authenticator first (the role requires it and it isn't set up yet).
 */
export type LoginOutcome =
  | ({ step: "done" } & SessionTokens)
  | { step: "code"; challenge: string; challengeExpiresAt: string }
  | {
      step: "enrol";
      challenge: string;
      challengeExpiresAt: string;
      secret: string;
      otpauthUrl: string;
    };

export type ClientMeta = { ip?: string; userAgent?: string; device?: string };

type SecondStep = { trustDevice?: boolean };

const dhakaTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * Staff sign-in (PRD §13, NFR-SEC): argon2id passwords, a 15-minute access token, a rotating 7-day refresh token
 * stored only as a hash, a 15-minute lockout after five failures, and reuse detection (a refresh token used twice
 * revokes every session of that person). Issue 234 adds two-step sign-in (authenticator codes, recovery codes,
 * trusted devices), the sign-in history and the new-device email.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
  ) {}

  async login(
    email: string,
    password: string,
    meta: ClientMeta,
    now = new Date(),
  ): Promise<LoginOutcome> {
    const user = await this.prisma.staffUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    // One message for every failure, so the form never reveals which emails exist.
    const invalid = problems.unauthorized("Email or password is wrong");
    if (!user || user.status !== "active") {
      await argon2.hash(password).catch(() => undefined);
      if (user) await this.record(user.id, "paused", meta, now);
      throw invalid;
    }
    this.refuseWhileLocked(user, now);
    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!valid) {
      await this.countFailure(user, "wrong-password", meta, now);
      throw invalid;
    }

    if (user.totpEnabledAt && user.totpSecret) {
      if (await this.trusted(user.id, meta, now)) return this.finish(user, "success", meta, now);
      const challenge = await signChallenge(
        { sub: user.id, purpose: "code" },
        this.env.JWT_SECRET,
        now,
      );
      return {
        step: "code",
        challenge: challenge.token,
        challengeExpiresAt: challenge.expiresAt.toISOString(),
      };
    }
    if (twoStepRequired(user.roles)) {
      const secret = newTotpSecret();
      const challenge = await signChallenge(
        { sub: user.id, purpose: "enrol", secret: twoStepBox(this.env.JWT_SECRET).seal(secret) },
        this.env.JWT_SECRET,
        now,
      );
      return {
        step: "enrol",
        challenge: challenge.token,
        challengeExpiresAt: challenge.expiresAt.toISOString(),
        secret,
        otpauthUrl: otpauthUrl(secret, user.email),
      };
    }
    return this.finish(user, "success", meta, now);
  }

  /** The code step: a 6-digit authenticator code, or one of the recovery codes (each works once). */
  async verifyCode(
    challengeToken: string,
    code: string,
    meta: ClientMeta & SecondStep,
    now = new Date(),
  ): Promise<LoginOutcome> {
    const user = await this.challengedUser(challengeToken, "code", now);
    if (!user.totpSecret || !user.totpEnabledAt) throw problems.unauthorized();
    this.refuseWhileLocked(user, now);

    if (looksLikeRecoveryCode(code)) {
      const used = await this.prisma.staffRecoveryCode.updateMany({
        where: { userId: user.id, codeHash: hashRecoveryCode(code), usedAt: null },
        data: { usedAt: now },
      });
      if (used.count === 1) {
        await this.audit.record({
          actor: { id: user.id, name: user.name },
          action: "staff.recovery-code-used",
          entity: "staff",
          entityId: user.email,
        });
        return this.finish(user, "recovery-code", meta, now);
      }
    } else {
      const secret = twoStepBox(this.env.JWT_SECRET).open(user.totpSecret);
      const step = verifyTotp(secret, code, { now, lastUsedStep: user.totpLastStep });
      if (step !== null) {
        // Only one request can move the step forward, so the same code sent twice opens one session.
        const claimed = await this.prisma.staffUser.updateMany({
          where: {
            id: user.id,
            OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }],
          },
          data: { totpLastStep: step },
        });
        if (claimed.count === 1) return this.finish(user, "success", meta, now);
      }
    }
    await this.countFailure(user, "wrong-code", meta, now);
    throw problems.badRequest("That code didn't work", "wrong-code");
  }

  /** First sign-in for a role that needs two-step sign-in: the first code turns it on and gives recovery codes. */
  async enrol(
    challengeToken: string,
    code: string,
    meta: ClientMeta & SecondStep,
    now = new Date(),
  ): Promise<LoginOutcome & { recoveryCodes: string[] }> {
    const verified = await verifyChallenge(challengeToken, this.env.JWT_SECRET, now);
    if (!verified || verified.purpose !== "enrol" || !verified.secret) {
      throw problems.unauthorized();
    }
    const user = await this.prisma.staffUser.findUnique({ where: { id: verified.sub } });
    if (!user || user.status !== "active" || user.totpEnabledAt) throw problems.unauthorized();
    this.refuseWhileLocked(user, now);
    const secret = twoStepBox(this.env.JWT_SECRET).open(verified.secret);
    const step = verifyTotp(secret, code, { now });
    if (step === null) {
      await this.countFailure(user, "wrong-code", meta, now);
      throw problems.badRequest("That code didn't work", "wrong-code");
    }
    const recoveryCodes = await this.turnOn(user, verified.secret, step, now);
    const outcome = await this.finish(user, "success", meta, now);
    return { ...outcome, recoveryCodes };
  }

  /**
   * Saves a confirmed authenticator and a fresh set of recovery codes; used by sign-in enrolment and My account.
   * Returns the recovery codes, which are shown once.
   */
  async turnOn(
    user: { id: string; name: string; email: string },
    sealedSecret: string,
    step: number,
    now: Date,
  ): Promise<string[]> {
    const codes = newRecoveryCodes();
    await this.prisma.$transaction(async (tx) => {
      // Only the first of two requests at the same moment turns it on (the second would replace the codes shown).
      const claimed = await tx.staffUser.updateMany({
        where: { id: user.id, totpEnabledAt: null },
        data: { totpSecret: sealedSecret, totpEnabledAt: now, totpLastStep: step },
      });
      if (claimed.count !== 1)
        throw problems.conflict("Two-step sign-in is already on", "already-on");
      await tx.staffRecoveryCode.deleteMany({ where: { userId: user.id } });
      await tx.staffRecoveryCode.createMany({
        data: codes.map((code) => ({ userId: user.id, codeHash: hashRecoveryCode(code) })),
      });
      await this.audit.record(
        {
          actor: { id: user.id, name: user.name },
          action: "staff.two-step-on",
          entity: "staff",
          entityId: user.email,
        },
        tx,
      );
    });
    return codes;
  }

  async refresh(refreshToken: string, meta: ClientMeta, now = new Date()): Promise<SessionTokens> {
    const session = await this.prisma.staffSession.findUnique({
      where: { refreshHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!session) throw problems.unauthorized();
    // A role that needs two-step sign-in and hasn't set it up signs in again, which asks for it (issue 234).
    const usable =
      session.expiresAt > now &&
      session.user.status === "active" &&
      !(twoStepRequired(session.user.roles) && !session.user.totpEnabledAt);
    if (session.revokedAt) {
      // Two requests refreshing at the same moment (a page and its prefetches) both present the token: one that
      // was rotated in the last 30 seconds still opens a session (#66).
      const concurrent =
        session.rotatedAt !== null &&
        now.getTime() - session.rotatedAt.getTime() <= REFRESH_GRACE_MS;
      if (concurrent && usable) return this.openSession(session.user, meta, now);
      // A rotated token came back later: someone else may hold it. Close every session of this person.
      await this.prisma.staffSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw problems.unauthorized();
    }
    if (!usable) throw problems.unauthorized();
    await this.prisma.staffSession.update({
      where: { id: session.id },
      data: { revokedAt: now, rotatedAt: now },
    });
    return this.openSession(session.user, meta, now);
  }

  async logout(refreshToken: string, now = new Date()): Promise<void> {
    await this.prisma.staffSession.updateMany({
      where: { refreshHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: now },
    });
  }

  /** The principal for a valid access token whose session is still open. */
  async principal(accessToken: string, now = new Date()): Promise<StaffPrincipal | null> {
    const claims = await verifyAccessToken(accessToken, this.env.JWT_SECRET, now);
    if (!claims) return null;
    const session = await this.prisma.staffSession.findUnique({ where: { id: claims.sid } });
    if (!session || session.revokedAt) return null;
    return {
      id: claims.sub,
      name: claims.name,
      email: claims.email,
      roles: claims.roles,
      sessionId: claims.sid,
    };
  }

  private async challengedUser(
    token: string,
    purpose: "code" | "enrol",
    now: Date,
  ): Promise<StaffUser> {
    const verified = await verifyChallenge(token, this.env.JWT_SECRET, now);
    if (!verified || verified.purpose !== purpose) throw problems.unauthorized();
    const user = await this.prisma.staffUser.findUnique({ where: { id: verified.sub } });
    if (!user || user.status !== "active") throw problems.unauthorized();
    return user;
  }

  private refuseWhileLocked(user: StaffUser, now: Date): void {
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60_000);
      throw problems.tooMany(`Too many attempts. Try again in ${minutes} minutes.`);
    }
  }

  /** A wrong password or code: counted in the database, so parallel guesses still lock the account (#78). */
  private async countFailure(
    user: StaffUser,
    result: "wrong-password" | "wrong-code",
    meta: ClientMeta,
    now: Date,
  ): Promise<void> {
    const counted = await this.prisma.staffUser.update({
      where: { id: user.id },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    const lock = counted.failedLogins >= MAX_FAILED_LOGINS;
    // Each lock in the last day doubles the next one (15, 30, 60 minutes… up to a day), so someone who has the
    // password can't keep guessing codes five at a time (issue 234 review).
    const earlier = lock
      ? await this.prisma.staffLoginEvent.count({
          where: {
            userId: user.id,
            result: "locked",
            createdAt: { gt: new Date(now.getTime() - LOCK_WINDOW_MS) },
          },
        })
      : 0;
    await this.record(user.id, lock ? "locked" : result, meta, now);
    if (!lock) return;
    const minutes = Math.min(LOCK_MINUTES * 2 ** earlier, MAX_LOCK_MINUTES);
    await this.prisma.staffUser.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: new Date(now.getTime() + minutes * 60_000) },
    });
    if (result === "wrong-code") {
      // The password was right: tell the person, who may not know it is out.
      void this.notifications.notify("staff-code-locked", user.email, {
        name: user.name,
        address: meta.ip ?? "unknown",
        time: dhakaTime.format(now),
        link: this.notifications.adminLink("/account"),
      });
    }
    await this.audit.record({
      actor: { id: null, name: "system" },
      action: "staff.locked",
      entity: "staff",
      entityId: user.id,
      reason: `${MAX_FAILED_LOGINS} failed sign-ins`,
    });
  }

  /** True when this browser was trusted after a code in the last 30 days (needs the device cookie). */
  private async trusted(userId: string, meta: ClientMeta, now: Date): Promise<boolean> {
    if (!meta.device) return false;
    const device = await this.prisma.staffDevice.findUnique({
      where: {
        userId_deviceHash: { userId, deviceHash: deviceHashOf(meta.device, meta.userAgent) },
      },
      select: { trustedUntil: true },
    });
    return Boolean(device?.trustedUntil && device.trustedUntil > now);
  }

  /** Every step passed: clear the failure count, remember the device, write the history, open the session. */
  private async finish(
    user: StaffUser,
    result: "success" | "recovery-code",
    meta: ClientMeta & SecondStep,
    now: Date,
  ): Promise<{ step: "done" } & SessionTokens> {
    await this.prisma.staffUser.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now },
    });
    const newDevice = await this.rememberDevice(user, meta, now);
    await this.record(user.id, result, meta, now, newDevice);
    if (newDevice) {
      void this.notifications.notify("staff-new-device", user.email, {
        name: user.name,
        device: deviceLabel(meta.userAgent),
        address: meta.ip ?? "unknown",
        time: dhakaTime.format(now),
        link: this.notifications.adminLink("/account"),
      });
    }
    const tokens = await this.openSession(user, meta, now);
    return { step: "done", ...tokens };
  }

  /**
   * Saves the device of a successful sign-in; true when it is new for someone who had signed in from another device
   * before (the first device after this feature ships sends no email).
   */
  private async rememberDevice(
    user: StaffUser,
    meta: ClientMeta & SecondStep,
    now: Date,
  ): Promise<boolean> {
    const deviceHash = deviceHashOf(meta.device, meta.userAgent);
    const trustedUntil =
      meta.trustDevice && meta.device
        ? new Date(now.getTime() + TRUST_DAYS * 86_400_000)
        : undefined;
    const existing = await this.prisma.staffDevice.findUnique({
      where: { userId_deviceHash: { userId: user.id, deviceHash } },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.staffDevice.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: now,
          lastIp: meta.ip ?? null,
          ...(trustedUntil ? { trustedUntil } : {}),
        },
      });
      return false;
    }
    const others = await this.prisma.staffDevice.count({ where: { userId: user.id } });
    try {
      await this.prisma.staffDevice.create({
        data: {
          userId: user.id,
          deviceHash,
          label: deviceLabel(meta.userAgent),
          lastIp: meta.ip ?? null,
          firstSeenAt: now,
          lastSeenAt: now,
          trustedUntil: trustedUntil ?? null,
        },
      });
    } catch (error) {
      // The same device signing in twice at once: the other request saved it first.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"))
        throw error;
      await this.prisma.staffDevice.update({
        where: { userId_deviceHash: { userId: user.id, deviceHash } },
        data: {
          lastSeenAt: now,
          lastIp: meta.ip ?? null,
          ...(trustedUntil ? { trustedUntil } : {}),
        },
      });
      return false;
    }
    return others > 0;
  }

  private async record(
    userId: string,
    result: StaffLoginResult,
    meta: ClientMeta,
    now: Date,
    newDevice = false,
  ): Promise<void> {
    await this.prisma.staffLoginEvent.create({
      data: {
        userId,
        result,
        ip: meta.ip ?? null,
        device: deviceLabel(meta.userAgent),
        newDevice,
        createdAt: now,
      },
    });
  }

  /**
   * The roles a token carries (issue 244): the person's built-in roles plus what their custom roles grant. Grants are
   * never Super Admin or Admin, so two-step sign-in rules stay with the built-in roles.
   */
  private async effectiveRoles(user: { roles: string[]; customRoleIds?: string[] }) {
    const base = asRoles(user.roles);
    if (!user.customRoleIds || user.customRoleIds.length === 0) return base;
    const custom = await this.prisma.customRole.findMany({
      where: { id: { in: user.customRoleIds } },
      select: { grants: true },
    });
    const granted = asRoles(custom.flatMap((role) => role.grants)).filter(
      (role) => role !== "super-admin" && role !== "admin",
    );
    return [...new Set([...base, ...granted])];
  }

  private async openSession(
    user: { id: string; name: string; email: string; roles: string[]; customRoleIds?: string[] },
    meta: ClientMeta,
    now: Date,
  ): Promise<SessionTokens> {
    const refresh = newRefreshToken();
    const refreshExpiresAt = new Date(now.getTime() + REFRESH_TTL_SECONDS * 1000);
    const session = await this.prisma.staffSession.create({
      data: {
        userId: user.id,
        refreshHash: refresh.hash,
        expiresAt: refreshExpiresAt,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent?.slice(0, 200) ?? null,
      },
    });
    const roles = await this.effectiveRoles(user);
    const access = await signAccessToken(
      { sub: user.id, sid: session.id, name: user.name, email: user.email, roles },
      this.env.JWT_SECRET,
      now,
    );
    return {
      accessToken: access.token,
      accessExpiresAt: access.expiresAt.toISOString(),
      refreshToken: refresh.token,
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      user: { id: user.id, name: user.name, email: user.email, roles },
    };
  }
}

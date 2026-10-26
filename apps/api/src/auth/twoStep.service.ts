import { Inject, Injectable } from "@nestjs/common";
import argon2 from "argon2";
import {
  StaffLoginResultSchema,
  toDhakaIsoString,
  twoStepRequired,
  type StaffLoginEvent,
  type TwoStepStatus,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import { problems } from "../common/problem";
import { ENV, type Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";
import type { StaffPrincipal } from "./principal";
import { signChallenge, verifyChallenge } from "./tokens";
import { newRecoveryCodes, newTotpSecret, otpauthUrl, verifyTotp, hashRecoveryCode } from "./totp";
import { twoStepBox } from "./twoStepSecret";

/** How many sign-ins the history shows. */
export const HISTORY_LIMIT = 30;

/**
 * Two-step sign-in in My account and Users (issue 234): status, set up with a confirming code, new recovery codes,
 * turn off (only for roles that don't require it), the Super Admin's reset, and the sign-in history.
 */
@Injectable()
export class TwoStepService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async status(staff: StaffPrincipal, now = new Date()): Promise<TwoStepStatus> {
    const user = await this.prisma.staffUser.findUnique({
      where: { id: staff.id },
      select: { roles: true, totpEnabledAt: true },
    });
    if (!user) throw problems.unauthorized();
    const [recoveryCodesLeft, trustedDevices] = await Promise.all([
      this.prisma.staffRecoveryCode.count({ where: { userId: staff.id, usedAt: null } }),
      this.prisma.staffDevice.count({ where: { userId: staff.id, trustedUntil: { gt: now } } }),
    ]);
    return {
      enabled: Boolean(user.totpEnabledAt),
      required: twoStepRequired(user.roles),
      enabledAt: user.totpEnabledAt ? toDhakaIsoString(user.totpEnabledAt) : null,
      recoveryCodesLeft: user.totpEnabledAt ? recoveryCodesLeft : 0,
      trustedDevices: user.totpEnabledAt ? trustedDevices : 0,
    };
  }

  /** A new secret for the authenticator app; nothing changes until a code from it is confirmed. */
  async start(staff: StaffPrincipal, now = new Date()) {
    const user = await this.prisma.staffUser.findUnique({ where: { id: staff.id } });
    if (!user) throw problems.unauthorized();
    if (user.totpEnabledAt) throw problems.conflict("Two-step sign-in is already on", "already-on");
    const secret = newTotpSecret();
    const challenge = await signChallenge(
      { sub: user.id, purpose: "setup", secret: twoStepBox(this.env.JWT_SECRET).seal(secret) },
      this.env.JWT_SECRET,
      now,
    );
    return {
      challenge: challenge.token,
      challengeExpiresAt: challenge.expiresAt.toISOString(),
      secret,
      otpauthUrl: otpauthUrl(secret, user.email),
    };
  }

  async confirm(staff: StaffPrincipal, challengeToken: string, code: string, now = new Date()) {
    const verified = await verifyChallenge(challengeToken, this.env.JWT_SECRET, now);
    if (
      !verified ||
      verified.purpose !== "setup" ||
      verified.sub !== staff.id ||
      !verified.secret
    ) {
      throw problems.badRequest("The setup expired. Start again.", "expired");
    }
    const user = await this.prisma.staffUser.findUnique({ where: { id: staff.id } });
    if (!user) throw problems.unauthorized();
    if (user.totpEnabledAt) throw problems.conflict("Two-step sign-in is already on", "already-on");
    const step = verifyTotp(twoStepBox(this.env.JWT_SECRET).open(verified.secret), code, { now });
    if (step === null) throw problems.badRequest("That code didn't work", "wrong-code");
    return { recoveryCodes: await this.auth.turnOn(user, verified.secret, step, now) };
  }

  /** Replaces every recovery code; needs a current authenticator code. */
  async newRecoveryCodes(staff: StaffPrincipal, code: string, now = new Date()) {
    const user = await this.enabledUser(staff);
    await this.checkCode(user, code, now);
    const codes = newRecoveryCodes();
    await this.prisma.$transaction(async (tx) => {
      await tx.staffRecoveryCode.deleteMany({ where: { userId: user.id } });
      await tx.staffRecoveryCode.createMany({
        data: codes.map((item) => ({ userId: user.id, codeHash: hashRecoveryCode(item) })),
      });
      await this.audit.record(
        { actor: staff, action: "staff.recovery-codes-new", entity: "staff", entityId: user.email },
        tx,
      );
    });
    return { recoveryCodes: codes };
  }

  /** Turns two-step sign-in off with the password; refused for roles that require it. */
  async turnOff(staff: StaffPrincipal, password: string) {
    const user = await this.enabledUser(staff);
    if (twoStepRequired(user.roles)) {
      throw problems.conflict("Your role needs two-step sign-in", "required");
    }
    if (!(await argon2.verify(user.passwordHash, password).catch(() => false))) {
      throw problems.badRequest("The password is wrong", "wrong-password");
    }
    await this.clear(staff, user.id, user.email, "staff.two-step-off");
  }

  /** Super Admin: someone lost their phone and their recovery codes. Their next sign-in sets it up again. */
  async reset(actor: StaffPrincipal, userId: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { id: userId } });
    if (!user) throw problems.notFound("Staff member not found");
    await this.clear(actor, user.id, user.email, "staff.two-step-reset");
  }

  async history(userId: string): Promise<StaffLoginEvent[]> {
    const events = await this.prisma.staffLoginEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    });
    return events.map((event) => ({
      id: event.id,
      at: toDhakaIsoString(event.createdAt),
      result: StaffLoginResultSchema.catch("wrong-password").parse(event.result),
      device: event.device,
      address: event.ip,
      newDevice: event.newDevice,
    }));
  }

  private async enabledUser(staff: StaffPrincipal) {
    const user = await this.prisma.staffUser.findUnique({ where: { id: staff.id } });
    if (!user) throw problems.unauthorized();
    if (!user.totpEnabledAt || !user.totpSecret) {
      throw problems.conflict("Two-step sign-in is off", "off");
    }
    return { ...user, totpSecret: user.totpSecret };
  }

  private async checkCode(
    user: { id: string; totpSecret: string; totpLastStep: number | null },
    code: string,
    now: Date,
  ): Promise<void> {
    const step = verifyTotp(twoStepBox(this.env.JWT_SECRET).open(user.totpSecret), code, {
      now,
      lastUsedStep: user.totpLastStep,
    });
    const claimed =
      step === null
        ? { count: 0 }
        : await this.prisma.staffUser.updateMany({
            where: {
              id: user.id,
              OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }],
            },
            data: { totpLastStep: step },
          });
    if (claimed.count !== 1) throw problems.badRequest("That code didn't work", "wrong-code");
  }

  private async clear(actor: StaffPrincipal, userId: string, email: string, action: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id: userId },
        data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null },
      });
      await tx.staffRecoveryCode.deleteMany({ where: { userId } });
      await tx.staffDevice.updateMany({ where: { userId }, data: { trustedUntil: null } });
      await this.audit.record({ actor, action, entity: "staff", entityId: email }, tx);
    });
  }
}

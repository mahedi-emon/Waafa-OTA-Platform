import { Inject, Injectable } from "@nestjs/common";
import argon2 from "argon2";
import { ENV, type Env } from "../config/env";
import { problems } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "./principal";
import {
  REFRESH_TTL_SECONDS,
  asRoles,
  hashToken,
  newRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "./tokens";

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export type SessionTokens = {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  user: { id: string; name: string; email: string; roles: string[] };
};

type ClientMeta = { ip?: string; userAgent?: string };

/**
 * Staff sign-in (PRD §13, NFR-SEC): argon2id passwords, a 15-minute access token, a rotating 7-day refresh token
 * stored only as a hash, a 15-minute lockout after five failures, and reuse detection (a refresh token used twice
 * revokes every session of that person).
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async login(
    email: string,
    password: string,
    meta: ClientMeta,
    now = new Date(),
  ): Promise<SessionTokens> {
    const user = await this.prisma.staffUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    // One message for every failure, so the form never reveals which emails exist.
    const invalid = problems.unauthorized("Email or password is wrong");
    if (!user || user.status !== "active") {
      await argon2.hash(password).catch(() => undefined);
      throw invalid;
    }
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60_000);
      throw problems.tooMany(`Too many attempts. Try again in ${minutes} minutes.`);
    }
    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!valid) {
      const failed = user.failedLogins + 1;
      const lock = failed >= MAX_FAILED_LOGINS;
      await this.prisma.staffUser.update({
        where: { id: user.id },
        data: {
          failedLogins: lock ? 0 : failed,
          lockedUntil: lock ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : null,
        },
      });
      if (lock) {
        await this.audit.record({
          actor: { id: null, name: "system" },
          action: "staff.locked",
          entity: "staff",
          entityId: user.id,
          reason: `${MAX_FAILED_LOGINS} failed sign-ins`,
        });
      }
      throw invalid;
    }
    await this.prisma.staffUser.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now },
    });
    return this.openSession(user, meta, now);
  }

  async refresh(refreshToken: string, meta: ClientMeta, now = new Date()): Promise<SessionTokens> {
    const session = await this.prisma.staffSession.findUnique({
      where: { refreshHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!session) throw problems.unauthorized();
    if (session.revokedAt) {
      // A rotated token came back: someone else may hold it. Close every session of this person.
      await this.prisma.staffSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw problems.unauthorized();
    }
    if (session.expiresAt <= now || session.user.status !== "active") throw problems.unauthorized();
    await this.prisma.staffSession.update({ where: { id: session.id }, data: { revokedAt: now } });
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

  private async openSession(
    user: { id: string; name: string; email: string; roles: string[] },
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
    const roles = asRoles(user.roles);
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

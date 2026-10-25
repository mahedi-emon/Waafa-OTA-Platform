import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import argon2 from "argon2";
import {
  AUDIT_AREAS,
  toDhakaIsoString,
  type AuditArea,
  type StaffCreateInput,
  type StaffUpdateInput,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { Prisma } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { dhakaDate } from "./access";

const hash = (password: string) => argon2.hash(password, { type: argon2.argon2id });

/** How long an invite link works. */
const INVITE_DAYS = 7;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** A fresh invite: the token for the email link, and what the database keeps (its hash and expiry). */
function newInvite(now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    inviteHash: sha256(token),
    inviteExpiresAt: new Date(now.getTime() + INVITE_DAYS * 24 * 60 * 60_000),
  };
}

/**
 * Users and roles (Super Admin): add staff with a first password, change names and roles, deactivate (which ends
 * their sessions) and reset passwords. Everyone can change their own password. The audit log lists every admin write.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
  ) {}

  /** The invite email with its link to the welcome page; fire and forget, like every email. */
  private sendInvite(user: { name: string; email: string }, inviter: string, token: string) {
    void this.notifications.notify("staff-invite", user.email, {
      name: user.name,
      inviter,
      link: this.notifications.adminLink(`/welcome?token=${token}`),
    });
  }

  private view(user: Prisma.StaffUserGetPayload<object>, now = new Date()) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      status: user.status,
      locked: Boolean(user.lockedUntil && user.lockedUntil > now),
      lastLoginAt: user.lastLoginAt ? toDhakaIsoString(user.lastLoginAt) : null,
      createdAt: toDhakaIsoString(user.createdAt),
      /** An invite that is still open (sent, not yet used); an expired one can be sent again. */
      invite: user.inviteHash
        ? {
            expiresAt: user.inviteExpiresAt ? toDhakaIsoString(user.inviteExpiresAt) : null,
            expired: Boolean(user.inviteExpiresAt && user.inviteExpiresAt <= now),
          }
        : null,
    };
  }

  async list() {
    const users = await this.prisma.staffUser.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
    return users.map((user) => this.view(user));
  }

  /** Active staff for assignee pickers (any signed-in staff may read names). */
  async directory() {
    const users = await this.prisma.staffUser.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roles: true },
    });
    return users;
  }

  async create(actor: StaffPrincipal, input: StaffCreateInput) {
    // Without a password the person gets an invite email and chooses one; until then no password works.
    const invite = input.password ? null : newInvite();
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.staffUser.create({
          data: {
            name: input.name,
            email: input.email.trim().toLowerCase(),
            passwordHash: await hash(input.password ?? randomBytes(32).toString("base64url")),
            roles: input.roles,
            ...(invite
              ? { inviteHash: invite.inviteHash, inviteExpiresAt: invite.inviteExpiresAt }
              : {}),
          },
        });
        await this.audit.record(
          {
            actor,
            action: "staff.create",
            entity: "staff",
            entityId: created.email,
            after: { name: input.name, roles: input.roles, invited: Boolean(invite) },
          },
          tx,
        );
        return created;
      });
      if (invite) this.sendInvite(user, actor.name, invite.token);
      return this.view(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw problems.conflict("Someone already uses this email", "exists");
      }
      throw error;
    }
  }

  async update(actor: StaffPrincipal, id: string, input: StaffUpdateInput) {
    const user = await this.prisma.staffUser.findUnique({ where: { id } });
    if (!user) throw problems.notFound("Staff member not found");
    if (id === actor.id && input.status === "deactivated")
      throw problems.badRequest("You can't deactivate yourself");
    if (
      id === actor.id &&
      input.roles &&
      !input.roles.includes("super-admin") &&
      user.roles.includes("super-admin")
    ) {
      throw problems.badRequest("Ask another Super Admin to remove your Super Admin role");
    }
    if (
      user.roles.includes("super-admin") &&
      (input.status === "deactivated" || (input.roles && !input.roles.includes("super-admin")))
    ) {
      const others = await this.prisma.staffUser.count({
        where: { id: { not: id }, status: "active", roles: { has: "super-admin" } },
      });
      if (others === 0)
        throw problems.conflict("Keep at least one active Super Admin", "last-super-admin");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.staffUser.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.roles ? { roles: input.roles } : {}),
          ...(input.status ? { status: input.status } : {}),
        },
      });
      if (input.status === "deactivated" || input.roles) {
        // New roles take effect at the next sign-in; a deactivated person is signed out everywhere.
        await tx.staffSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      await this.audit.record(
        {
          actor,
          action: "staff.update",
          entity: "staff",
          entityId: user.email,
          before: { name: user.name, roles: user.roles, status: user.status },
          after: input,
        },
        tx,
      );
      return next;
    });
    return this.view(updated);
  }

  /** Sends a new invite to someone who hasn't chosen a password yet; the old link stops working. */
  async resendInvite(actor: StaffPrincipal, id: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { id } });
    if (!user) throw problems.notFound("Staff member not found");
    if (user.status !== "active" || user.lastLoginAt || !user.inviteHash)
      throw problems.conflict("This person already chose a password", "not-invited");
    const invite = newInvite();
    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id },
        data: { inviteHash: invite.inviteHash, inviteExpiresAt: invite.inviteExpiresAt },
      });
      await this.audit.record(
        { actor, action: "staff.invite", entity: "staff", entityId: user.email },
        tx,
      );
    });
    this.sendInvite(user, actor.name, invite.token);
    return this.view({ ...user, ...invite });
  }

  /**
   * The welcome page: a valid, unexpired invite sets the person's password and closes the invite. Wrong, used and
   * expired links all read the same, so the page never says which emails have accounts.
   */
  async acceptInvite(token: string, password: string, now = new Date()) {
    const user = await this.prisma.staffUser.findUnique({ where: { inviteHash: sha256(token) } });
    if (!user || user.status !== "active" || !user.inviteExpiresAt || user.inviteExpiresAt <= now)
      throw problems.badRequest("This invite link has expired or was already used", "invite");
    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id: user.id },
        data: {
          passwordHash: await hash(password),
          inviteHash: null,
          inviteExpiresAt: null,
          failedLogins: 0,
          lockedUntil: null,
        },
      });
      await this.audit.record(
        {
          actor: { id: null, name: user.name },
          action: "staff.invite-accepted",
          entity: "staff",
          entityId: user.email,
        },
        tx,
      );
    });
    return { email: user.email };
  }

  async resetPassword(actor: StaffPrincipal, id: string, password: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { id } });
    if (!user) throw problems.notFound("Staff member not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id },
        // A password set by the Super Admin closes any open invite.
        data: {
          passwordHash: await hash(password),
          failedLogins: 0,
          lockedUntil: null,
          inviteHash: null,
          inviteExpiresAt: null,
        },
      });
      await tx.staffSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        { actor, action: "staff.password-reset", entity: "staff", entityId: user.email },
        tx,
      );
    });
  }

  async changeOwnPassword(actor: StaffPrincipal, current: string, next: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { id: actor.id } });
    if (!user || !(await argon2.verify(user.passwordHash, current))) {
      throw problems.badRequest("The current password is wrong", "wrong-password");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id: actor.id },
        data: { passwordHash: await hash(next) },
      });
      // Other devices sign in again; this session stays.
      await tx.staffSession.updateMany({
        where: { userId: actor.id, revokedAt: null, id: { not: actor.sessionId } },
        data: { revokedAt: new Date() },
      });
      await this.audit.record(
        { actor, action: "staff.password-change", entity: "staff", entityId: user.email },
        tx,
      );
    });
  }

  async auditLog(query: {
    entity?: string;
    actorId?: string;
    area?: AuditArea;
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }) {
    // Dhaka days, both included; a range given backwards is read the right way round.
    const [first, last] =
      query.from && query.to && query.from > query.to
        ? [query.to, query.from]
        : [query.from, query.to];
    const at = {
      ...(first ? { gte: dhakaDate(first) } : {}),
      ...(last ? { lt: dhakaDate(last, true) } : {}),
    };
    const where: Prisma.AuditLogWhereInput = {
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.area
        ? { OR: AUDIT_AREAS[query.area].map((prefix) => ({ action: { startsWith: prefix } })) }
        : {}),
      ...(first || last ? { at } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { at: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => ({
        id: row.id,
        actor: row.actorName,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        before: row.before,
        after: row.after,
        reason: row.reason,
        at: toDhakaIsoString(row.at),
      })),
    };
  }
}

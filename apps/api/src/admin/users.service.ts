import { Inject, Injectable } from "@nestjs/common";
import argon2 from "argon2";
import { toDhakaIsoString, type StaffCreateInput, type StaffUpdateInput } from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const hash = (password: string) => argon2.hash(password, { type: argon2.argon2id });

/**
 * Users and roles (Super Admin): add staff with a first password, change names and roles, deactivate (which ends
 * their sessions) and reset passwords. Everyone can change their own password. The audit log lists every admin write.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

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
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.staffUser.create({
          data: {
            name: input.name,
            email: input.email.trim().toLowerCase(),
            passwordHash: await hash(input.password),
            roles: input.roles,
          },
        });
        await this.audit.record(
          {
            actor,
            action: "staff.create",
            entity: "staff",
            entityId: created.email,
            after: { name: input.name, roles: input.roles },
          },
          tx,
        );
        return created;
      });
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

  async resetPassword(actor: StaffPrincipal, id: string, password: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { id } });
    if (!user) throw problems.notFound("Staff member not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.staffUser.update({
        where: { id },
        data: { passwordHash: await hash(password), failedLogins: 0, lockedUntil: null },
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

  async auditLog(query: { entity?: string; actorId?: string; page: number; pageSize: number }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
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

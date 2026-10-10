import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Prisma } from "../generated/prisma/client";
import type { StaffPrincipal } from "../auth/principal";

export type AuditEvent = {
  actor: StaffPrincipal | { id: null; name: string };
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
};

const json = (value: unknown) =>
  value === undefined ? undefined : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);

/** Every admin write is recorded with before and after values (PRD §13 admin security). */
@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(event: AuditEvent, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.auditLog.create({
      data: {
        actorId: event.actor.id,
        actorName: event.actor.name,
        action: event.action,
        entity: event.entity,
        entityId: event.entityId,
        before: json(event.before),
        after: json(event.after),
        reason: event.reason ?? null,
      },
    });
  }
}

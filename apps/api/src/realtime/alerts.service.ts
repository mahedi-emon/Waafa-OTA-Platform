import { Inject, Injectable } from "@nestjs/common";
import { toDhakaIsoString, type StaffAlertView } from "@waafa/shared";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LiveBus } from "./liveBus";

export type AlertKind = StaffAlertView["kind"];
export type NewAlert = {
  staffId: string;
  kind: AlertKind;
  title: string;
  detail: string;
  href: string;
};

const view = (row: {
  id: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
  readAt: Date | null;
  createdAt: Date;
}): StaffAlertView => ({
  id: row.id,
  kind: row.kind as AlertKind,
  title: row.title,
  detail: row.detail,
  href: row.href,
  read: row.readAt !== null,
  at: toDhakaIsoString(row.createdAt),
});

/**
 * Personal alerts in the bell (issue 243): a mention, a reminder that fell due, a lead handed over in turn. Each is
 * stored (so it waits in the bell until read) and pushed to that person's open admin tabs at once.
 */
@Injectable()
export class StaffAlertsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(LiveBus) private readonly bus: LiveBus,
  ) {}

  /** Stores the alerts (inside the caller's transaction when given) and pushes them once it has committed. */
  async create(alerts: NewAlert[], tx?: Prisma.TransactionClient, now = new Date()) {
    if (alerts.length === 0) return () => undefined;
    const client = tx ?? this.prisma;
    await client.staffAlert.createMany({
      data: alerts.map((alert) => ({ ...alert, createdAt: now })),
    });
    const push = () => {
      for (const alert of alerts) {
        this.bus.publish({
          audience: { staffId: alert.staffId },
          event: {
            type: "alert",
            title: alert.title,
            detail: alert.detail,
            href: alert.href,
            at: toDhakaIsoString(now),
          },
        });
      }
    };
    if (!tx) push();
    return push;
  }

  async latest(staffId: string): Promise<{ alerts: StaffAlertView[]; unread: number }> {
    const [rows, unread] = await Promise.all([
      this.prisma.staffAlert.findMany({
        where: { staffId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.prisma.staffAlert.count({ where: { staffId, readAt: null } }),
    ]);
    return { alerts: rows.map(view), unread };
  }

  /** Marks this person's alerts read; ids of someone else's alerts change nothing. */
  async markRead(staffId: string, input: { ids?: string[] | undefined; all?: true | undefined }) {
    const now = new Date();
    await this.prisma.staffAlert.updateMany({
      where: {
        staffId,
        readAt: null,
        ...(input.all ? {} : { id: { in: input.ids ?? [] } }),
      },
      data: { readAt: now },
    });
    return this.latest(staffId);
  }
}

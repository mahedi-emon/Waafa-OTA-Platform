import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import {
  CONTENT_MODEL,
  isContentKey,
  isDue,
  isOverdueLead,
  type CollectionKey,
} from "@waafa/shared";
import { withWorkflow } from "./workflow";
import { AuditService } from "../audit/audit.service";
import { ENV, type Env } from "../config/env";
import type { Prisma } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";
import { ContentService } from "../content/content.service";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

/** Who the audit log names for the minute job's changes. */
export const SCHEDULER = { id: null, name: "Scheduler" } as const;
/** One Postgres advisory lock key for the job, so two API instances never run it at once. */
const LOCK_KEY = 4_194_001;
/** Records stay in Trash this long, then the job deletes them for good (ADMIN.md §9). */
export const TRASH_DAYS = 30;
const DAY = 86_400_000;

/** Lists the site shows inside a time window, with the fields that open or close it. */
const WINDOWS: Partial<Record<CollectionKey, readonly string[]>> = {
  banners: ["startsAt", "endsAt"],
  announcements: ["startsAt", "endsAt"],
  deals: ["endsAt"],
  groupFares: ["expiresAt"],
};

export type TickResult = {
  published: Array<{ collection: string; id: string }>;
  windows: string[];
  purged: number;
  overdue: number;
};

const EMPTY: TickResult = { published: [], windows: [], purged: 0, overdue: 0 };

const isCollectionKey = (key: string): key is CollectionKey =>
  isContentKey(key) && CONTENT_MODEL[key].kind === "collection";

/**
 * The minute job (D0 R4, D215): publishes scheduled records whose time has come, refreshes the site when a banner,
 * announcement, deal or group fare starts or ends, deletes Trash older than 30 days, and alerts the desk once about
 * each lead still unanswered past the reply target. It runs in the API process because the public snapshot cache
 * and the web revalidation live here; a Postgres advisory lock keeps it to one instance at a time.
 */
@Injectable()
export class ContentScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("Scheduler");
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private last = new Date();

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
  ) {}

  onModuleInit(): void {
    const every = this.env.SCHEDULER_INTERVAL_MS ?? (this.env.NODE_ENV === "test" ? 0 : 60_000);
    if (!every) return;
    this.timer = setInterval(() => {
      void this.tick().catch((error: unknown) =>
        this.logger.warn(`Scheduled run failed: ${String(error)}`),
      );
    }, every);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** One pass; returns what changed. Safe to call at any time: a pass already running or held elsewhere is skipped. */
  async tick(now = new Date()): Promise<TickResult> {
    if (this.running) return EMPTY;
    this.running = true;
    const since = this.last;
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const [lock] = await tx.$queryRaw<Array<{ locked: boolean }>>`
          SELECT pg_try_advisory_xact_lock(${LOCK_KEY}) AS "locked"`;
        if (!lock?.locked) return null;
        const published = await this.publishDue(tx, now);
        const purged = await this.purgeTrash(tx, now);
        return { published, purged };
      });
      if (!result) return EMPTY;
      this.last = now;
      const windows = await this.windowsCrossed(since, now);
      const keys = new Set([...result.published.map((item) => item.collection), ...windows]);
      if (result.published.length > 0) this.content.invalidate();
      if (keys.size > 0) this.revalidate.request([...keys]);
      const overdue = await this.alertOverdue(now);
      return { published: result.published, windows, purged: result.purged, overdue };
    } finally {
      this.running = false;
    }
  }

  /** Scheduled records whose time has come go live, stamped with the time they were due. */
  private async publishDue(tx: Prisma.TransactionClient, now: Date) {
    const rows = await tx.$queryRaw<
      Array<{ collection: string; docId: string; data: Record<string, unknown> }>
    >`
      SELECT "collection", "docId", "data" FROM "ContentDocument"
      WHERE "data"->>'status' = 'scheduled'
      FOR UPDATE SKIP LOCKED`;
    const published: Array<{ collection: string; id: string }> = [];
    for (const row of rows) {
      const due = row.data as { status?: string; publishAt?: string };
      if (!isCollectionKey(row.collection) || !isDue(due, now) || !due.publishAt) continue;
      // Published as if the button was pressed at the scheduled minute: live since then, dated that day.
      const { record: after } = withWorkflow(
        row.collection,
        row.data,
        row.data,
        { type: "publish" },
        new Date(due.publishAt),
      );
      await tx.contentDocument.update({
        where: { collection_docId: { collection: row.collection, docId: row.docId } },
        data: { data: json(after), version: { increment: 1 }, updatedBy: SCHEDULER.name },
      });
      await this.audit.record(
        {
          actor: SCHEDULER,
          action: "content.update",
          entity: row.collection,
          entityId: row.docId,
          before: row.data,
          after,
          reason: "Published at the scheduled time",
        },
        tx,
      );
      published.push({ collection: row.collection, id: row.docId });
    }
    return published;
  }

  /** Deletes Trash older than 30 days, with one audit entry per record. */
  private async purgeTrash(tx: Prisma.TransactionClient, now: Date): Promise<number> {
    const before = new Date(now.getTime() - TRASH_DAYS * DAY);
    const old = await tx.trashItem.findMany({
      where: { deletedAt: { lt: before } },
      select: { id: true, collection: true, docId: true },
      take: 200,
    });
    if (old.length === 0) return 0;
    await tx.trashItem.deleteMany({ where: { id: { in: old.map((item) => item.id) } } });
    for (const item of old) {
      await this.audit.record(
        {
          actor: SCHEDULER,
          action: "trash.purge",
          entity: item.collection,
          entityId: item.docId,
          reason: `In Trash for more than ${TRASH_DAYS} days`,
        },
        tx,
      );
    }
    return old.length;
  }

  /** The window lists with a start or end between the last pass and now: the site shows them differently now. */
  private async windowsCrossed(since: Date, now: Date): Promise<string[]> {
    const keys = Object.keys(WINDOWS) as CollectionKey[];
    const rows = await this.prisma.contentDocument.findMany({
      where: { collection: { in: keys } },
      select: { collection: true, data: true },
    });
    const crossed = new Set<string>();
    for (const row of rows) {
      const fields = WINDOWS[row.collection as CollectionKey] ?? [];
      const data = row.data as Record<string, unknown>;
      for (const field of fields) {
        const at = typeof data[field] === "string" ? Date.parse(data[field] as string) : NaN;
        if (at > since.getTime() && at <= now.getTime()) crossed.add(row.collection);
      }
    }
    return [...crossed].filter(isCollectionKey);
  }

  /** Each lead still new and unanswered past the reply target alerts the desk once (marked on its timeline). */
  private async alertOverdue(now: Date): Promise<number> {
    let sla = 30;
    try {
      sla = (await this.content.setting("leadFormSettings")).slaMinutes;
    } catch {
      // Without the setting the 30-minute target applies.
    }
    const leads = await this.prisma.lead.findMany({
      where: {
        status: "new",
        firstResponseAt: null,
        createdAt: {
          lt: new Date(now.getTime() - sla * 60_000),
          gt: new Date(now.getTime() - DAY),
        },
        activities: { none: { type: "overdue" } },
      },
      select: {
        id: true,
        reference: true,
        name: true,
        module: true,
        status: true,
        createdAt: true,
      },
      take: 50,
    });
    let alerted = 0;
    for (const lead of leads) {
      if (!isOverdueLead({ ...lead, createdAt: lead.createdAt.toISOString() }, sla, now)) continue;
      await this.prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "overdue",
          body: `No reply ${sla} minutes after it arrived: the desk was alerted`,
          actorName: SCHEDULER.name,
          createdAt: now,
        },
      });
      void this.notifications.notify("lead-overdue-staff", this.notifications.staffAddress, {
        reference: lead.reference,
        name: lead.name,
        minutes: String(sla),
        link: this.notifications.adminLink(`/leads/${lead.id}`),
      });
      alerted += 1;
    }
    return alerted;
  }
}

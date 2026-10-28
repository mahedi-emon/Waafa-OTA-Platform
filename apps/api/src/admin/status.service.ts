import { statfs } from "node:fs/promises";
import { freemem, totalmem } from "node:os";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { toDhakaIsoString } from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { WORKER_HEARTBEAT_KEY } from "../common/heartbeat";
import { problems } from "../common/problem";
import { ENV, type Env } from "../config/env";
import { NOTIFICATION_QUEUE } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { type DiskUsage, folderBytes } from "./diskUsage";

/** Older than two minutes means the worker stopped. */
const HEARTBEAT_STALE_MS = 2 * 60_000;
const STARTED = new Date();
/** Folder sizes are counted at most every ten minutes (a big uploads folder takes a moment). */
const USAGE_TTL_MS = 10 * 60_000;

export type FailedJobView = {
  id: string;
  name: string;
  to: string | null;
  subject: string | null;
  reason: string;
  attempts: number;
  failedAt: string | null;
};

/**
 * The staff Status page (issue 238): release, database, Redis, the worker's heartbeat, the email queue with its
 * dead-letter list (failed jobs, kept until staff retry or discard them, both audited), and the server's memory and
 * disk. Reads only; nothing here changes the site.
 */
@Injectable()
export class StatusService implements OnModuleDestroy {
  private readonly queue: Queue | null;
  private readonly redis: Redis | null;
  private usageCache: { at: number; value: DiskUsage } | null = null;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {
    this.queue = env.REDIS_URL
      ? new Queue(NOTIFICATION_QUEUE, {
          connection: { url: env.REDIS_URL, maxRetriesPerRequest: 1, enableOfflineQueue: false },
        })
      : null;
    this.redis = env.REDIS_URL
      ? new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 2_000,
          lazyConnect: true,
        })
      : null;
    this.redis?.on("error", () => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
    this.redis?.disconnect();
  }

  async overview(now = new Date()) {
    const database = await this.timed(() => this.prisma.$queryRaw`SELECT 1`);
    let redis: { ok: boolean; ms: number | null } = { ok: false, ms: null };
    let queue: Record<string, number> | null = null;
    let worker: { ok: boolean; lastSeen: string | null } = { ok: false, lastSeen: null };
    const client = this.redis;
    if (this.queue && client) {
      redis = await this.timed(async () => {
        if (client.status === "wait") await client.connect();
        await client.ping();
      });
      if (redis.ok) {
        queue = await this.queue.getJobCounts("waiting", "active", "delayed", "failed");
        const beat = Number(await client.get(WORKER_HEARTBEAT_KEY));
        worker = {
          ok: beat > 0 && now.getTime() - beat < HEARTBEAT_STALE_MS,
          lastSeen: beat > 0 ? toDhakaIsoString(new Date(beat)) : null,
        };
      }
    }
    let disk: { totalBytes: number; freeBytes: number } | null = null;
    try {
      const stats = await statfs("/");
      disk = { totalBytes: stats.blocks * stats.bsize, freeBytes: stats.bavail * stats.bsize };
    } catch {
      disk = null;
    }
    return {
      release: process.env.WAAFA_RELEASE?.trim() || "development",
      revision: process.env.WAAFA_REVISION?.trim() || null,
      startedAt: toDhakaIsoString(STARTED),
      checkedAt: toDhakaIsoString(now),
      database,
      redis,
      worker,
      queue,
      memory: { totalBytes: totalmem(), freeBytes: freemem() },
      disk,
      usage: await this.usage(now),
    };
  }

  /** What fills the disk (issue 303): the database, uploads, customer files and backups. */
  private async usage(now: Date): Promise<DiskUsage> {
    if (this.usageCache && now.getTime() - this.usageCache.at < USAGE_TTL_MS) {
      return this.usageCache.value;
    }
    let database: number | null = null;
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{ bytes: bigint }>
      >`SELECT pg_database_size(current_database()) AS bytes`;
      database = Number(rows[0]?.bytes ?? 0);
    } catch {
      database = null;
    }
    const [uploads, customerFiles, backups] = await Promise.all([
      folderBytes(this.env.MEDIA_DIR),
      folderBytes(this.env.PRIVATE_FILES_DIR),
      folderBytes(this.env.BACKUPS_DIR),
    ]);
    const value = { database, uploads, customerFiles, backups };
    this.usageCache = { at: now.getTime(), value };
    return value;
  }

  /** The dead-letter list: emails that failed every try, newest first. */
  async failed(limit = 50): Promise<FailedJobView[]> {
    if (!this.queue) return [];
    const jobs = await this.queue.getFailed(0, limit - 1);
    return jobs.map((job) => {
      const data = (job.data ?? {}) as { to?: unknown; subject?: unknown };
      return {
        id: String(job.id),
        name: job.name,
        to: typeof data.to === "string" ? data.to : null,
        subject: typeof data.subject === "string" ? data.subject : null,
        reason: (job.failedReason ?? "").slice(0, 300),
        attempts: job.attemptsMade,
        failedAt: job.finishedOn ? toDhakaIsoString(new Date(job.finishedOn)) : null,
      };
    });
  }

  /** Puts a failed job back in the queue, or removes it for good; both go to the audit log. */
  async decide(staff: StaffPrincipal, id: string, action: "retry" | "discard"): Promise<void> {
    const job = this.queue ? await this.queue.getJob(id) : null;
    if (!job || !(await job.isFailed())) throw problems.notFound("This failed job is gone");
    if (action === "retry") await job.retry();
    else await job.remove();
    await this.audit.record({
      actor: staff,
      action: action === "retry" ? "queue.retry" : "queue.discard",
      entity: "queue",
      entityId: `${NOTIFICATION_QUEUE}:${id}`,
      after: { name: job.name, reason: (job.failedReason ?? "").slice(0, 300) },
    });
  }

  private async timed(work: () => Promise<unknown>): Promise<{ ok: boolean; ms: number | null }> {
    const start = performance.now();
    try {
      await work();
      return { ok: true, ms: Math.round(performance.now() - start) };
    } catch {
      return { ok: false, ms: null };
    }
  }
}

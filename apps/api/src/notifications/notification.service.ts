import { Inject, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import type { NotificationTemplate } from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { ContentService } from "../content/content.service";
import { PrismaService } from "../prisma/prisma.service";
import type { PrismaClient } from "../generated/prisma/client";
import type { Mail, Mailer } from "./mailer";

export const MAILER = Symbol("MAILER");
export const NOTIFICATION_QUEUE = "notifications";

export type EmailJob = Mail & { logId: string };

/** "{{reference}}" style variables from the admin-edited templates. */
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([a-z][a-z0-9_]*)\}\}/g, (_match, name: string) => vars[name] ?? "");
}

/** Sends one queued email and records the result; throws so the queue retries with backoff. */
export async function deliverEmail(
  prisma: PrismaClient,
  mailer: Mailer,
  job: EmailJob,
): Promise<void> {
  try {
    await mailer.send({ to: job.to, subject: job.subject, text: job.text });
    await prisma.notificationLog.update({
      where: { id: job.logId },
      data: { status: "sent", sentAt: new Date(), attempts: { increment: 1 } },
    });
  } catch (error) {
    await prisma.notificationLog
      .update({
        where: { id: job.logId },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message.slice(0, 300) : "unknown",
          attempts: { increment: 1 },
        },
      })
      .catch(() => undefined);
    throw error;
  }
}

/**
 * Customer and staff emails from the admin-edited templates (Settings › Notifications). Jobs go through a BullMQ queue
 * with retries when Redis is configured (production), and are sent in-process otherwise (development and tests), so a
 * slow mail provider never slows a form submit.
 */
@Injectable()
export class NotificationService implements OnModuleDestroy {
  private readonly logger = new Logger("Notifications");
  private readonly queue: Queue | null;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ContentService) private readonly content: ContentService,
  ) {
    this.queue = env.REDIS_URL
      ? new Queue(NOTIFICATION_QUEUE, {
          connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
        })
      : null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }

  /** The address staff alerts go to (Settings › Notifications recipients come later; env for launch). */
  get staffAddress(): string | undefined {
    return this.env.STAFF_ALERT_EMAIL;
  }

  async notify(
    key: NotificationTemplate["key"],
    to: string | undefined,
    vars: Record<string, string>,
  ) {
    if (!to) return;
    try {
      const templates = await this.content.collection("notificationTemplates");
      const template = templates.find(
        (item) => item.key === key && item.channel === "email" && item.enabled,
      );
      if (!template) return;
      const mail: Mail = {
        to,
        subject: renderTemplate(template.subject, vars),
        text: renderTemplate(template.body, vars),
      };
      const log = await this.prisma.notificationLog.create({
        data: {
          channel: "email",
          recipient: to,
          template: key,
          subject: mail.subject,
          status: "queued",
        },
      });
      const job: EmailJob = { ...mail, logId: log.id };
      if (this.queue) {
        await this.queue.add("email", job, {
          attempts: 5,
          backoff: { type: "exponential", delay: 30_000 },
          removeOnComplete: 1_000,
          removeOnFail: false,
        });
      } else {
        // In-process without Redis: never block the request, never throw into it.
        setImmediate(() => {
          deliverEmail(this.prisma, this.mailer, job).catch((error: unknown) =>
            this.logger.warn(`Email ${key} to ${to} failed: ${String(error)}`),
          );
        });
      }
    } catch (error) {
      this.logger.warn(`Could not queue ${key}: ${String(error)}`);
    }
  }
}

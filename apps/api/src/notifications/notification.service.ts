import { Inject, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import {
  ADMIN_BASE_PATH,
  type NotificationTemplate,
  type SmsTemplateKey,
  type StaffAlertArea,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { ContentService } from "../content/content.service";
import { PrismaService } from "../prisma/prisma.service";
import type { PrismaClient } from "../generated/prisma/client";
import { deliverSms, MESSAGING, type Messaging, type SmsJob } from "./integrationSms";
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
  /** Emails on their way: being queued, or being sent in-process. */
  private readonly inFlight = new Set<Promise<unknown>>();

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(MESSAGING) private readonly messaging: Messaging,
  ) {
    this.queue = env.REDIS_URL
      ? new Queue(NOTIFICATION_QUEUE, {
          // Fail fast when Redis is down instead of holding the command until it returns (#78).
          connection: { url: env.REDIS_URL, maxRetriesPerRequest: 1, enableOfflineQueue: false },
        })
      : null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }

  /**
   * Who gets a staff alert about an area (issue 233): the recipients set in Settings › Forms and messages, or the
   * server's STAFF_ALERT_EMAIL while that list names nobody for the area.
   */
  async staffRecipients(area: StaffAlertArea): Promise<string[]> {
    let chosen: string[] = [];
    try {
      const settings = await this.content.setting("leadFormSettings");
      chosen = (settings.staffAlerts ?? [])
        .filter((recipient) => recipient.areas.includes(area))
        .map((recipient) => recipient.email.toLowerCase());
    } catch {
      chosen = [];
    }
    if (chosen.length === 0 && this.env.STAFF_ALERT_EMAIL) chosen = [this.env.STAFF_ALERT_EMAIL];
    return [...new Set(chosen)];
  }

  /** One staff alert to everyone who gets alerts about the area; fire and forget like notify(). */
  notifyStaff(
    key: NotificationTemplate["key"],
    area: StaffAlertArea,
    vars: Record<string, string>,
  ): Promise<void> {
    return this.track(
      (async () => {
        const recipients = await this.staffRecipients(area);
        await Promise.all(recipients.map((to) => this.queueEmail(key, to, vars)));
      })(),
    );
  }

  /** A link into the admin for staff emails, on the first web origin. */
  adminLink(path: string): string {
    return `${this.env.WEB_ORIGINS[0] ?? ""}${ADMIN_BASE_PATH}${path}`;
  }

  /** One template email; callers fire and forget it (`void notify(...)`), so a slow provider never slows a submit. */
  notify(
    key: NotificationTemplate["key"],
    to: string | undefined,
    vars: Record<string, string>,
  ): Promise<void> {
    return this.track(this.queueEmail(key, to, vars));
  }

  /**
   * One status SMS (issue 252) from an SMS template, while an SMS card is on in Admin › Integrations and the template is
   * on. Only status messages have SMS templates: sign-in codes never go by SMS (D300). Fire and forget like notify().
   */
  sms(
    key: SmsTemplateKey,
    phone: string | null | undefined,
    vars: Record<string, string>,
  ): Promise<void> {
    return this.track(this.queueSms(key, phone ?? undefined, vars));
  }

  /**
   * One alert to the sales group on Telegram (issue 252) while that card is on. Plain text with the reference, a short
   * summary and the admin link; never a phone, email or document. Failures are logged, never thrown into a submit.
   */
  telegram(kind: string, lines: readonly string[]): Promise<void> {
    const text = lines.filter(Boolean).join("\n");
    return this.track(
      (async () => {
        try {
          if (!(await this.messaging.telegram.post(text))) return;
          await this.prisma.notificationLog.create({
            data: {
              channel: "telegram",
              recipient: "sales group",
              template: kind,
              subject: lines[0] ?? kind,
              status: "sent",
              attempts: 1,
              sentAt: new Date(),
            },
          });
        } catch (error) {
          this.logger.warn(`Telegram alert ${kind} failed: ${String(error)}`);
          await this.prisma.notificationLog
            .create({
              data: {
                channel: "telegram",
                recipient: "sales group",
                template: kind,
                subject: lines[0] ?? kind,
                status: "failed",
                error: error instanceof Error ? error.message.slice(0, 300) : "unknown",
                attempts: 1,
              },
            })
            .catch(() => undefined);
        }
      })(),
    );
  }

  /**
   * Resolves once every email started in this process so far has been handled (queued in Redis, or sent in-process).
   * Callers never wait for emails; tests do, so each test counts only its own (#222).
   */
  async idle(): Promise<void> {
    while (this.inFlight.size > 0) await Promise.allSettled([...this.inFlight]);
  }

  private track<T>(work: Promise<T>): Promise<T> {
    this.inFlight.add(work);
    const done = () => this.inFlight.delete(work);
    work.then(done, done);
    return work;
  }

  private async queueEmail(
    key: NotificationTemplate["key"],
    to: string | undefined,
    vars: Record<string, string>,
  ): Promise<void> {
    if (!to) return;
    let logId: string | null = null;
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
      logId = log.id;
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
        void this.track(
          new Promise<void>((resolve) => {
            setImmediate(() => {
              deliverEmail(this.prisma, this.mailer, job)
                .catch((error: unknown) =>
                  this.logger.warn(`Email ${key} to ${to} failed: ${String(error)}`),
                )
                .finally(resolve);
            });
          }),
        );
      }
    } catch (error) {
      this.logger.warn(`Could not queue ${key}: ${String(error)}`);
      if (logId) {
        await this.prisma.notificationLog
          .update({ where: { id: logId }, data: { status: "failed", error: "queue unavailable" } })
          .catch(() => undefined);
      }
    }
  }

  private async queueSms(
    key: SmsTemplateKey,
    to: string | undefined,
    vars: Record<string, string>,
  ): Promise<void> {
    if (!to) return;
    let logId: string | null = null;
    try {
      if (!(await this.messaging.sms.ready())) return;
      const templates = await this.content.collection("notificationTemplates");
      const template = templates.find(
        (item) => item.key === key && item.channel === "sms" && item.enabled,
      );
      if (!template) return;
      const text = renderTemplate(template.body, vars);
      const log = await this.prisma.notificationLog.create({
        data: {
          channel: "sms",
          recipient: to,
          template: key,
          subject: text.slice(0, 120),
          status: "queued",
        },
      });
      logId = log.id;
      const job: SmsJob = { channel: "sms", to, text, logId: log.id };
      if (this.queue) {
        await this.queue.add("sms", job, {
          attempts: 3,
          backoff: { type: "exponential", delay: 60_000 },
          removeOnComplete: 1_000,
          removeOnFail: false,
        });
      } else {
        void this.track(
          new Promise<void>((resolve) => {
            setImmediate(() => {
              deliverSms(this.prisma, this.messaging.sms, job)
                .catch((error: unknown) => this.logger.warn(`SMS ${key} failed: ${String(error)}`))
                .finally(resolve);
            });
          }),
        );
      }
    } catch (error) {
      this.logger.warn(`Could not queue SMS ${key}: ${String(error)}`);
      if (logId) {
        await this.prisma.notificationLog
          .update({ where: { id: logId }, data: { status: "failed", error: "queue unavailable" } })
          .catch(() => undefined);
      }
    }
  }
}

import type { PrismaClient } from "../generated/prisma/client";
import { ActiveIntegrations } from "../providers/activeIntegration";
import type { Fetcher } from "../providers/catalogAdapters";
import { isSmsGateway, SMS_GATEWAYS, smsAdapter, SmsError } from "./smsGateways";
import { sendTelegram } from "./telegram";

export type SmsJob = { channel: "sms"; to: string; text: string; logId: string };

/**
 * Status SMS through the SMS card that is on in Admin › Integrations (issue 252). Off (no card on, no values, a failed
 * last test) means nothing is sent: callers check ready() first so nothing is logged for a channel that is off.
 */
export class IntegrationSms {
  constructor(
    private readonly active: ActiveIntegrations,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async ready(): Promise<boolean> {
    return (await this.active.get("sms", SMS_GATEWAYS)) !== null;
  }

  async send(to: string, text: string): Promise<void> {
    const integration = await this.active.get("sms", SMS_GATEWAYS);
    if (!integration || !isSmsGateway(integration.provider))
      throw new SmsError("No SMS service is on in Admin › Integrations.");
    await smsAdapter(integration.provider, this.fetcher).send(to, text, integration.context);
  }
}

/** Sends one queued SMS and records the result; throws so the queue retries with backoff. */
export async function deliverSms(
  prisma: Pick<PrismaClient, "notificationLog">,
  sms: Pick<IntegrationSms, "send">,
  job: SmsJob,
): Promise<void> {
  try {
    await sms.send(job.to, job.text);
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

/** Alerts to the sales group on Telegram (issue 252) while the Telegram card is on and its last test passed. */
export class TelegramAlerts {
  constructor(
    private readonly active: ActiveIntegrations,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  /** Returns false when Telegram is off; throws the plain reason when Telegram refused the message. */
  async post(text: string): Promise<boolean> {
    const integration = await this.active.get("alerts", ["telegram"]);
    const token = integration?.context.secrets.botToken;
    const chatId = integration?.context.settings.chatId;
    if (!token || !chatId) return false;
    await sendTelegram(token, chatId, text, this.fetcher);
    return true;
  }
}

export const MESSAGING = Symbol("MESSAGING");

/** SMS and Telegram over one cache of the cards that are on (issue 252); the API and the worker each build one. */
export type Messaging = {
  active: ActiveIntegrations;
  sms: IntegrationSms;
  telegram: TelegramAlerts;
  /** The fetch outside services are called with (tests pass a fake); couriers use it too (issue 253). */
  fetcher: Fetcher;
};

export function createMessaging(
  prisma: ConstructorParameters<typeof ActiveIntegrations>[0],
  secretKey: string | undefined,
  fetcher: Fetcher = fetch,
): Messaging {
  const active = new ActiveIntegrations(prisma, secretKey);
  return {
    active,
    sms: new IntegrationSms(active, fetcher),
    telegram: new TelegramAlerts(active, fetcher),
    fetcher,
  };
}

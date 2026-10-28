import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";

/** Where an error happened; Sentry and GlitchTip show it as the server name. */
export type ErrorSource = "api" | "worker" | "web";

type Dsn = { endpoint: string; key: string; raw: string };

/** "https://<key>@<host>/<project>" → the envelope endpoint and the public key; null for anything else. */
export function parseDsn(value: string | null | undefined): Dsn | null {
  if (!value) return null;
  const match = /^https:\/\/([A-Za-z0-9]+)@([A-Za-z0-9.-]+(?::\d+)?)\/(\d+)$/.exec(value.trim());
  if (!match) return null;
  const [, key, host, project] = match;
  return {
    endpoint: `https://${host}/api/${project}/envelope/`,
    key: key ?? "",
    raw: value.trim(),
  };
}

/** A Sentry envelope with one error event (the format GlitchTip reads too). */
export function envelopeFor(
  dsn: Dsn,
  error: { message: string; stack?: string | undefined; name?: string | undefined },
  context: { source: ErrorSource; release: string; path?: string | undefined; now?: Date },
): string {
  const now = context.now ?? new Date();
  const eventId = randomUUID().replace(/-/g, "");
  const event = {
    event_id: eventId,
    timestamp: now.getTime() / 1000,
    platform: "node",
    level: "error",
    release: context.release,
    environment: "production",
    server_name: context.source,
    tags: { source: context.source },
    ...(context.path ? { transaction: context.path } : {}),
    exception: {
      values: [
        {
          type: error.name || "Error",
          value: error.message.slice(0, 1000),
          ...(error.stack ? { stacktrace: { frames: framesOf(error.stack) } } : {}),
        },
      ],
    },
  };
  return [
    JSON.stringify({ event_id: eventId, sent_at: now.toISOString(), dsn: dsn.raw }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

/** Stack lines as Sentry frames, oldest first; file paths only, no source code or variables. */
function framesOf(stack: string): Array<{ function: string; filename: string; lineno?: number }> {
  return stack
    .split("\n")
    .slice(1, 30)
    .map((line) => /at (?:(.+?) \()?(.+?):(\d+):\d+\)?$/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      function: match[1] ?? "?",
      filename: match[2] ?? "?",
      lineno: Number(match[3]),
    }))
    .reverse();
}

/**
 * The DSN of the error tracking card that is On in Admin › Integrations (Sentry first, then GlitchTip; issue 238),
 * unless its last test failed. A DSN is a plain setting, so no secret has to be opened.
 */
export async function activeDsn(prisma: PrismaClient): Promise<string | null> {
  const settings = await prisma.integrationSetting.findMany({
    where: { kind: "monitoring", isActive: true },
    orderBy: { provider: "desc" },
  });
  for (const setting of settings) {
    const row = await prisma.providerCredential.findUnique({
      where: { provider_environment: { provider: setting.provider, environment: "production" } },
    });
    const dsn = (row?.settings as Record<string, string> | undefined)?.dsn;
    if (row && row.healthOk !== false && dsn) return dsn;
  }
  return null;
}

const MAX_PER_MINUTE = 30;
const REFRESH_MS = 60_000;

/**
 * Sends unexpected errors to Sentry or GlitchTip without their SDK (issue 238): the DSN comes from Admin ›
 * Integrations and is read again every minute, so turning the card on or off needs no restart. Off: nothing is sent.
 * At most 30 reports a minute, so an error loop cannot flood the free plan. Reporting never throws.
 */
export class ErrorReporter {
  private dsn: Dsn | null = null;
  private sentThisMinute = 0;
  private minute = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly source: ErrorSource,
    private readonly release = process.env.WAAFA_RELEASE?.trim() || "development",
    private readonly send: (url: string, init: RequestInit) => Promise<unknown> = fetch,
  ) {}

  configure(dsn: string | null): void {
    this.dsn = parseDsn(dsn);
  }

  /** Reads the DSN after `firstDelayMs`, then every minute; returns a stop function. */
  watch(read: () => Promise<string | null>, firstDelayMs = 0): () => void {
    const refresh = () =>
      void read()
        .then((dsn) => this.configure(dsn))
        .catch(() => undefined);
    const first = setTimeout(refresh, firstDelayMs);
    first.unref?.();
    this.timer = setInterval(refresh, REFRESH_MS);
    this.timer.unref?.();
    return () => {
      clearTimeout(first);
      if (this.timer) clearInterval(this.timer);
    };
  }

  get enabled(): boolean {
    return this.dsn !== null;
  }

  report(
    error: unknown,
    context: { path?: string; source?: ErrorSource } = {},
    now = new Date(),
  ): void {
    const dsn = this.dsn;
    if (!dsn) return;
    const minute = Math.floor(now.getTime() / 60_000);
    if (minute !== this.minute) {
      this.minute = minute;
      this.sentThisMinute = 0;
    }
    if (this.sentThisMinute >= MAX_PER_MINUTE) return;
    this.sentThisMinute += 1;
    const plain =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : { message: String(error) };
    const body = envelopeFor(dsn, plain, {
      source: context.source ?? this.source,
      release: this.release,
      path: context.path,
      now,
    });
    void Promise.resolve()
      .then(() =>
        this.send(dsn.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/x-sentry-envelope",
            "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=waafa/1.0`,
          },
          body,
          signal: AbortSignal.timeout(5_000),
        }),
      )
      .catch(() => undefined);
  }
}

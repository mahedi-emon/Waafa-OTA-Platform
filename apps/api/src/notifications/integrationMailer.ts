import nodemailer from "nodemailer";
import type { PrismaClient } from "../generated/prisma/client";
import { SecretBox } from "../providers/secretBox";
import type { Mail, Mailer } from "./mailer";

type Prisma = Pick<PrismaClient, "integrationSetting" | "providerCredential">;

type EmailConfig =
  | { provider: "resend"; baseUrl: string; apiKey: string; from: string }
  | {
      provider: "smtp";
      host: string;
      port: number;
      username: string;
      password: string;
      from: string;
    };

const CACHE_MS = 60_000;

/**
 * Email through the provider turned on in Admin › Settings › Integrations (#107): Resend or SMTP with the Sandbox or
 * Live credentials chosen there. With no active email provider (or secrets that cannot be opened) it falls back to
 * the server's mailer from the environment (RESEND_API_KEY, SMTP_URL), so alerts keep flowing.
 */
export class IntegrationMailer implements Mailer {
  readonly kind = "integration" as const;
  private cached: { at: number; config: EmailConfig | null } | null = null;
  private readonly box: SecretBox | null;

  constructor(
    private readonly prisma: Prisma,
    secretKey: string | undefined,
    private readonly fallback: Mailer,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.box = secretKey ? new SecretBox(secretKey) : null;
  }

  async send(mail: Mail): Promise<void> {
    const config = await this.config();
    if (!config) return this.fallback.send(mail);
    if (config.provider === "resend") {
      const response = await this.fetcher(`${config.baseUrl.replace(/\/+$/, "")}/emails`, {
        method: "POST",
        headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: config.from,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Resend answered ${response.status}`);
      return;
    }
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.username, pass: config.password },
    });
    await transport.sendMail({
      from: config.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
    });
  }

  /** The active email provider's opened settings, cached for a minute; null means "use the fallback". */
  private async config(now = Date.now()): Promise<EmailConfig | null> {
    if (this.cached && now - this.cached.at < CACHE_MS) return this.cached.config;
    let config: EmailConfig | null = null;
    try {
      config = await this.load();
    } catch {
      config = null;
    }
    this.cached = { at: now, config };
    return config;
  }

  private async load(): Promise<EmailConfig | null> {
    if (!this.box) return null;
    const setting = await this.prisma.integrationSetting.findFirst({
      where: { kind: "email", isActive: true, provider: { in: ["resend", "smtp"] } },
      orderBy: { updatedAt: "desc" },
    });
    if (!setting) return null;
    const row = await this.prisma.providerCredential.findUnique({
      where: {
        provider_environment: {
          provider: setting.provider,
          environment: setting.isLive ? "production" : "sandbox",
        },
      },
    });
    if (!row) return null;
    const settings = row.settings as Record<string, string>;
    const sealed = row.secrets as Record<string, string>;
    const open = (key: string) => (sealed[key] && this.box ? this.box.open(sealed[key]) : "");
    if (setting.provider === "resend") {
      const apiKey = open("apiKey");
      if (!apiKey || !settings.from) return null;
      return {
        provider: "resend",
        baseUrl: settings.baseUrl ?? "https://api.resend.com",
        apiKey,
        from: settings.from,
      };
    }
    const password = open("password");
    const port = Number(settings.port);
    if (!settings.host || !port || !settings.username || !password || !settings.from) return null;
    return {
      provider: "smtp",
      host: settings.host,
      port,
      username: settings.username,
      password,
      from: settings.from,
    };
  }
}

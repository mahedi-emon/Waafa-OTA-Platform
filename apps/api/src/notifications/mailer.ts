import nodemailer, { type Transporter } from "nodemailer";
import type { Env } from "../config/env";

export type Mail = { to: string; subject: string; text: string };

export interface Mailer {
  readonly kind: "resend" | "smtp" | "memory";
  send(mail: Mail): Promise<void>;
}

/** Test and development mailer without a provider: keeps the last messages in memory. */
export class MemoryMailer implements Mailer {
  readonly kind = "memory" as const;
  readonly sent: Mail[] = [];
  async send(mail: Mail): Promise<void> {
    this.sent.push(mail);
    if (this.sent.length > 200) this.sent.shift();
  }
}

class ResendMailer implements Mailer {
  readonly kind = "resend" as const;
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}
  async send(mail: Mail): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Resend answered ${response.status}`);
  }
}

class SmtpMailer implements Mailer {
  readonly kind = "smtp" as const;
  private readonly transport: Transporter;
  constructor(
    url: string,
    private readonly from: string,
  ) {
    this.transport = nodemailer.createTransport(url);
  }
  async send(mail: Mail): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
    });
  }
}

/** Resend in production when the key is set, SMTP (Mailpit locally) when a URL is set, memory otherwise. */
export function createMailer(env: Env): Mailer {
  if (env.RESEND_API_KEY) return new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
  if (env.SMTP_URL) return new SmtpMailer(env.SMTP_URL, env.MAIL_FROM);
  return new MemoryMailer();
}

import { describe, expect, it } from "vitest";
import type { Env } from "../config/env";
import type { ContentService } from "../content/content.service";
import type { PrismaService } from "../prisma/prisma.service";
import type { Messaging } from "./integrationSms";
import type { Mail, Mailer } from "./mailer";
import { NotificationService } from "./notification.service";

/** A provider that takes a moment, like a real one. */
class SlowMailer implements Mailer {
  readonly kind = "memory" as const;
  readonly sent: Mail[] = [];
  async send(mail: Mail): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    this.sent.push(mail);
  }
}

/** SMS and Telegram as the cards are set: off unless a test turns them on. */
function fakeMessaging(on = false) {
  const sms: Array<{ to: string; text: string }> = [];
  const posts: string[] = [];
  const messaging = {
    sms: {
      ready: async () => on,
      send: async (to: string, text: string) => void sms.push({ to, text }),
    },
    telegram: {
      post: async (text: string) => {
        if (!on) return false;
        posts.push(text);
        return true;
      },
    },
  } as unknown as Messaging;
  return { messaging, sms, posts };
}

function service(mailer: Mailer, messaging: Messaging = fakeMessaging().messaging) {
  let logs = 0;
  const created: Array<Record<string, unknown>> = [];
  const prisma = {
    notificationLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: `log-${(logs += 1)}` };
      },
      update: async () => ({}),
    },
  } as unknown as PrismaService;
  const content = {
    collection: async () => [
      {
        key: "order-placed-staff",
        channel: "email",
        enabled: true,
        subject: "Order {{reference}}",
        body: "New order {{reference}}",
      },
      {
        key: "order-status-sms",
        channel: "sms",
        enabled: true,
        subject: "Order status",
        body: "WAAFA: order {{order_number}} is {{status}}.",
      },
      {
        key: "visa-status-sms",
        channel: "sms",
        enabled: false,
        subject: "Visa status",
        body: "Visa {{reference}}: {{status}}",
      },
    ],
  } as unknown as ContentService;
  // No REDIS_URL: emails go out in-process, after the caller has moved on.
  const env = { STAFF_ALERT_EMAIL: "desk@example.com", WEB_ORIGINS: [] } as unknown as Env;
  return Object.assign(new NotificationService(env, mailer, prisma, content, messaging), {
    created,
  });
}

describe("NotificationService.idle (#222)", () => {
  it("waits for every email started so far, the in-process sends included", async () => {
    const mailer = new SlowMailer();
    const notifications = service(mailer);
    void notifications.notify("order-placed-staff", "desk@example.com", { reference: "ORD-1" });
    void notifications.notify("order-placed-staff", "desk@example.com", { reference: "ORD-2" });
    expect(mailer.sent).toHaveLength(0);
    await notifications.idle();
    expect(mailer.sent.map((mail) => mail.subject).sort()).toEqual(["Order ORD-1", "Order ORD-2"]);
  });

  it("is ready at once when nothing is on its way, and skips a missing address", async () => {
    const mailer = new SlowMailer();
    const notifications = service(mailer);
    await notifications.idle();
    void notifications.notify("order-placed-staff", undefined, { reference: "ORD-3" });
    await notifications.idle();
    expect(mailer.sent).toHaveLength(0);
  });
});

describe("status SMS and Telegram alerts (issue 252)", () => {
  it("sends nothing and logs nothing while no SMS card is on", async () => {
    const fake = fakeMessaging(false);
    const notifications = service(new SlowMailer(), fake.messaging);
    await notifications.sms("order-status-sms", "01712345678", {
      order_number: "W-1",
      status: "shipped",
    });
    await notifications.telegram("lead", ["New request"]);
    await notifications.idle();
    expect(fake.sms).toEqual([]);
    expect(fake.posts).toEqual([]);
    expect(notifications.created).toEqual([]);
  });

  it("sends the SMS template's text once the card is on, and skips a template that is off", async () => {
    const fake = fakeMessaging(true);
    const notifications = service(new SlowMailer(), fake.messaging);
    await notifications.sms("order-status-sms", "01712345678", {
      order_number: "W-1",
      status: "shipped",
    });
    await notifications.sms("visa-status-sms", "01712345678", {
      reference: "V-1",
      status: "approved",
    });
    await notifications.sms("order-status-sms", undefined, {
      order_number: "W-2",
      status: "shipped",
    });
    await notifications.idle();
    expect(fake.sms).toEqual([{ to: "01712345678", text: "WAAFA: order W-1 is shipped." }]);
    expect(notifications.created).toMatchObject([{ channel: "sms", template: "order-status-sms" }]);
  });

  it("posts a Telegram alert as plain lines and logs it", async () => {
    const fake = fakeMessaging(true);
    const notifications = service(new SlowMailer(), fake.messaging);
    await notifications.telegram("lead", ["New flight request · WF-1", "", "DAC → DXB"]);
    await notifications.idle();
    expect(fake.posts).toEqual(["New flight request · WF-1\nDAC → DXB"]);
    expect(notifications.created).toMatchObject([{ channel: "telegram", status: "sent" }]);
  });
});

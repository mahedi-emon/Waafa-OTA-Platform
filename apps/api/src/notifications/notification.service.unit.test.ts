import { describe, expect, it } from "vitest";
import type { Env } from "../config/env";
import type { ContentService } from "../content/content.service";
import type { PrismaService } from "../prisma/prisma.service";
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

function service(mailer: Mailer) {
  let logs = 0;
  const prisma = {
    notificationLog: {
      create: async () => ({ id: `log-${(logs += 1)}` }),
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
    ],
  } as unknown as ContentService;
  // No REDIS_URL: emails go out in-process, after the caller has moved on.
  const env = { STAFF_ALERT_EMAIL: "desk@example.com", WEB_ORIGINS: [] } as unknown as Env;
  return new NotificationService(env, mailer, prisma, content);
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

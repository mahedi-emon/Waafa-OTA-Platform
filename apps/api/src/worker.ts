import { PrismaPg } from "@prisma/adapter-pg";
import { Worker } from "bullmq";
import { loadEnv } from "./config/env";
import { PrismaClient } from "./generated/prisma/client";
import { IntegrationMailer } from "./notifications/integrationMailer";
import { createMailer } from "./notifications/mailer";
import {
  NOTIFICATION_QUEUE,
  deliverEmail,
  type EmailJob,
} from "./notifications/notification.service";

/**
 * Job worker (separate process, same image): sends queued emails with retries and backoff; failed jobs stay in the
 * queue's failed list (the dead-letter list) and in the notification log.
 */
async function main() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("The worker needs REDIS_URL");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  // The email provider turned on in Admin › Integrations wins; the environment mailer is the fallback (#107).
  const fallback = createMailer(env);
  const mailer = new IntegrationMailer(prisma, env.PROVIDER_SECRET_KEY, fallback);
  const worker = new Worker<EmailJob>(
    NOTIFICATION_QUEUE,
    async (job) => deliverEmail(prisma, mailer, job.data),
    { connection: { url: env.REDIS_URL, maxRetriesPerRequest: null }, concurrency: 4 },
  );
  worker.on("failed", (job, error) => console.error(`Job ${job?.id} failed: ${error.message}`));
  const stop = async () => {
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => void stop());
  process.on("SIGINT", () => void stop());
  console.warn(
    `Worker listening on "${NOTIFICATION_QUEUE}" with Admin integrations, else ${fallback.kind} mail`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

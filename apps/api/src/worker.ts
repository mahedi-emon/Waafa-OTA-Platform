import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Worker } from "bullmq";
import { loadEnv } from "./config/env";
import { ClamdClient, parseClamdUrl } from "./files/clamd";
import { scanPendingFiles } from "./files/fileScan";
import { PrismaClient } from "./generated/prisma/client";
import { IntegrationMailer } from "./notifications/integrationMailer";
import { TRANSACTION_OPTIONS, warmUp } from "./prisma/prisma.service";
import { createMailer } from "./notifications/mailer";
import {
  NOTIFICATION_QUEUE,
  deliverEmail,
  type EmailJob,
} from "./notifications/notification.service";

const SCAN_INTERVAL_MS = 10_000;

/**
 * Job worker (separate process, same image): sends queued emails with retries and backoff; failed jobs stay in the
 * queue's failed list (the dead-letter list) and in the notification log. With CLAMAV_URL set it also scans customer
 * files for malware (issue 235).
 */
async function main() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("The worker needs REDIS_URL");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    transactionOptions: TRANSACTION_OPTIONS,
  });
  // The email provider turned on in Admin › Integrations wins; the environment mailer is the fallback (#107).
  const fallback = createMailer(env);
  const mailer = new IntegrationMailer(prisma, env.PROVIDER_SECRET_KEY, fallback);
  await warmUp(prisma).catch(() => undefined);
  const worker = new Worker<EmailJob>(
    NOTIFICATION_QUEUE,
    async (job) => deliverEmail(prisma, mailer, job.data),
    { connection: { url: env.REDIS_URL, maxRetriesPerRequest: null }, concurrency: 4 },
  );
  worker.on("failed", (job, error) => console.error(`Job ${job?.id} failed: ${error.message}`));

  // Malware scan of customer files (issue 235): a pass every 10 seconds while CLAMAV_URL is set.
  const clamd = parseClamdUrl(env.CLAMAV_URL);
  let scanTimer: NodeJS.Timeout | null = null;
  if (clamd) {
    const scanner = new ClamdClient(clamd.host, clamd.port);
    const root = path.resolve(env.PRIVATE_FILES_DIR);
    let busy = false;
    let lastWarning = 0;
    const pass = async () => {
      if (busy) return;
      busy = true;
      try {
        const result = await scanPendingFiles(prisma, root, scanner);
        if (result.infected > 0)
          console.warn(`Malware scan: ${result.infected} file(s) quarantined`);
        if (result.failed > 0 && Date.now() - lastWarning > 10 * 60_000) {
          lastWarning = Date.now();
          console.warn(
            `Malware scan: ${result.failed} file(s) waiting, the scanner did not answer`,
          );
        }
      } catch (error) {
        console.error(`Malware scan pass failed: ${String(error)}`);
      } finally {
        busy = false;
      }
    };
    scanTimer = setInterval(() => void pass(), SCAN_INTERVAL_MS);
    void pass();
  }

  const stop = async () => {
    if (scanTimer) clearInterval(scanTimer);
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => void stop());
  process.on("SIGINT", () => void stop());
  console.warn(
    `Worker listening on "${NOTIFICATION_QUEUE}" with Admin integrations, else ${fallback.kind} mail` +
      (clamd ? `; scanning files with ClamAV at ${clamd.host}:${clamd.port}` : ""),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

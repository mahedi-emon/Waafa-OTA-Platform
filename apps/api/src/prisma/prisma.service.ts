import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV, type Env } from "../config/env";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Interactive transactions get 15 s instead of Prisma's 5 s default (issue 119): right after a restart on a small
 * VPS, the first queries also load the query compiler and open connections, and a short lead or order transaction
 * crossed 5 s and failed with a 500.
 */
export const TRANSACTION_OPTIONS = { maxWait: 5_000, timeout: 15_000 } as const;

/** Runs the queries the first requests need, so a customer never pays for the cold start (issue 119). */
export async function warmUp(
  client: Pick<PrismaClient, "$queryRaw" | "lead" | "order">,
): Promise<void> {
  await client.$queryRaw`SELECT 1`;
  await client.lead.findFirst({ select: { id: true } });
  await client.order.findFirst({ select: { id: true } });
}

/** One Prisma client per process, on the pg driver adapter (Prisma 7). */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    super({
      adapter: new PrismaPg({ connectionString: env.DATABASE_URL, max: 10 }),
      transactionOptions: TRANSACTION_OPTIONS,
    });
  }

  async onModuleInit(): Promise<void> {
    // Best effort: a database that is still starting must not stop the API; /ready reports it.
    await warmUp(this).catch(() => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

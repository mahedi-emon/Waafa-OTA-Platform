import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV, type Env } from "../config/env";
import { PrismaClient } from "../generated/prisma/client";

/** One Prisma client per process, on the pg driver adapter (Prisma 7). */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL, max: 10 }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

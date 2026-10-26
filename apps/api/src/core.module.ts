import { type DynamicModule, Global, Module } from "@nestjs/common";
import { ENV, type Env } from "./config/env";
import { RateLimitService } from "./common/rateLimit.service";
import { PrismaService } from "./prisma/prisma.service";

/** The parsed environment, the database client and the shared rate limits, available everywhere. */
@Global()
@Module({})
export class CoreModule {
  static register(env: Env): DynamicModule {
    return {
      module: CoreModule,
      providers: [{ provide: ENV, useValue: env }, PrismaService, RateLimitService],
      exports: [ENV, PrismaService, RateLimitService],
    };
  }
}

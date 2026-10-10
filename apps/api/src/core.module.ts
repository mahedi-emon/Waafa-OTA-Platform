import { type DynamicModule, Global, Module } from "@nestjs/common";
import { ENV, type Env } from "./config/env";
import { PrismaService } from "./prisma/prisma.service";

/** The parsed environment and the database client, available everywhere. */
@Global()
@Module({})
export class CoreModule {
  static register(env: Env): DynamicModule {
    return {
      module: CoreModule,
      providers: [{ provide: ENV, useValue: env }, PrismaService],
      exports: [ENV, PrismaService],
    };
  }
}

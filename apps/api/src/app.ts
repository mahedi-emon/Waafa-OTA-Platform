import "reflect-metadata";
import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { type DynamicModule, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { IncomingMessage } from "node:http";
import type { Env } from "./config/env";
import { CoreModule } from "./core.module";
import { HealthController } from "./health/health.controller";
import { ProblemFilter } from "./common/problem";

@Module({})
class AppModule {
  static register(env: Env, features: DynamicModule[]): DynamicModule {
    return {
      module: AppModule,
      imports: [CoreModule.register(env), ...features],
      controllers: [HealthController],
    };
  }
}

/** Feature modules are added by later issues (auth, public intake, admin); the app is assembled here for tests too. */
export type FeatureFactory = (env: Env) => DynamicModule[];

/**
 * Builds the Nest app on Fastify: request IDs (taken from x-request-id or generated), pino logs without secrets,
 * helmet, CORS for the web origins, RFC 7807 errors, /health and /ready outside the /api/v1 prefix.
 */
export async function createApp(
  env: Env,
  features: FeatureFactory = () => [],
): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger:
      env.NODE_ENV === "test"
        ? false
        : {
            level: env.NODE_ENV === "production" ? "info" : "debug",
            redact: [
              "req.headers.authorization",
              "req.headers.cookie",
              'req.headers["x-intake-key"]',
            ],
          },
    genReqId: (request: IncomingMessage) => {
      const incoming = request.headers["x-request-id"];
      return typeof incoming === "string" && /^[\w-]{8,64}$/.test(incoming)
        ? incoming
        : randomUUID();
    },
    trustProxy: true,
    bodyLimit: 1_048_576,
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(env, features(env)),
    adapter,
    { logger: env.NODE_ENV === "test" ? false : ["error", "warn", "log"] },
  );
  app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.WEB_ORIGINS.length > 0 ? env.WEB_ORIGINS : false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onSend", async (request, reply) => {
      reply.header("x-request-id", request.id);
    });
  app.useGlobalFilters(new ProblemFilter());
  app.enableShutdownHooks();
  return app;
}

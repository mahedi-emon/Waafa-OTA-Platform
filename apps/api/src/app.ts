import "reflect-metadata";
import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { type DynamicModule, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { IncomingMessage } from "node:http";
import type { Env } from "./config/env";
import { redactToken } from "./common/redact";
import { CoreModule } from "./core.module";
import { HealthController } from "./health/health.controller";
import { ErrorReporter } from "./common/errorReporter";
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
            serializers: {
              // Signed file links carry their token in the query (issue 232): never write it to the log.
              req: (request: {
                method?: string;
                url?: string;
                host?: string;
                ip?: string;
                socket?: { remotePort?: number };
              }) => ({
                method: request.method,
                url: redactToken(request.url ?? ""),
                host: request.host,
                remoteAddress: request.ip,
                remotePort: request.socket?.remotePort,
              }),
            },
          },
    genReqId: (request: IncomingMessage) => {
      const incoming = request.headers["x-request-id"];
      return typeof incoming === "string" && /^[\w-]{8,64}$/.test(incoming)
        ? incoming
        : randomUUID();
    },
    // One proxy hop (Railway's edge); X-Forwarded-For entries before it are the caller's own (#78).
    trustProxy: (_address: string, hop: number) => hop === 0,
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
  // Photo uploads arrive as the raw body (Admin › Media library, #109), with their own size limit.
  app
    .getHttpAdapter()
    .getInstance()
    .addContentTypeParser(
      /^image\/(jpeg|png|webp|avif)$/,
      { parseAs: "buffer", bodyLimit: 12 * 1024 * 1024 + 1024 },
      (_request, body, done) => done(null, body),
    );
  // Customer PDFs (issue 232, up to 5 MB); customer JPEG and PNG files use the photo parser above.
  app
    .getHttpAdapter()
    .getInstance()
    .addContentTypeParser(
      "application/pdf",
      { parseAs: "buffer", bodyLimit: 5 * 1024 * 1024 + 1024 },
      (_request, body, done) => done(null, body),
    );
  // Videos too (MP4 or WebM up to 50 MB, D0 R3); only the video upload route reads them.
  app
    .getHttpAdapter()
    .getInstance()
    .addContentTypeParser(
      /^video\/(mp4|webm)$/,
      { parseAs: "buffer", bodyLimit: 50 * 1024 * 1024 + 1024 },
      (_request, body, done) => done(null, body),
    );
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onSend", async (request, reply) => {
      reply.header("x-request-id", request.id);
    });
  // Unexpected errors go to Sentry or GlitchTip when that card is On in Admin › Integrations (issue 238).
  // Apps built without the services module (some tests) have no reporter: errors are only logged there.
  let reporter: ErrorReporter | undefined;
  try {
    reporter = app.get(ErrorReporter);
  } catch {
    reporter = undefined;
  }
  app.useGlobalFilters(new ProblemFilter(reporter));
  app.enableShutdownHooks();
  return app;
}

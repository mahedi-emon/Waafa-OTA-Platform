import { type DynamicModule, Global, Module } from "@nestjs/common";
import { ENV, type Env } from "./config/env";
import { IdempotencyService } from "./common/idempotency.service";
import { IntakeKeyGuard } from "./common/serverKey";
import { ContentService } from "./content/content.service";
import { IntegrationMailer } from "./notifications/integrationMailer";
import { createMailer, type Mailer } from "./notifications/mailer";
import { PrismaService } from "./prisma/prisma.service";
import { MAILER, NotificationService } from "./notifications/notification.service";
import { ErrorReporter } from "./common/errorReporter";
import { ErrorReporterWatcher } from "./common/errorReporterWatcher";
import { RevalidateService } from "./revalidate/revalidate.service";

export type ServicesOptions = {
  /** Tests pass a MemoryMailer to read what was sent. */
  mailer?: Mailer;
};

/** Content, notifications, web revalidation and idempotency: used by the public intake and the admin modules. */
@Global()
@Module({})
export class ServicesModule {
  static register(options: ServicesOptions = {}): DynamicModule {
    const providers = [
      options.mailer
        ? { provide: MAILER, useValue: options.mailer }
        : {
            provide: MAILER,
            // The email provider turned on in Admin › Integrations wins over the environment mailer (#107).
            useFactory: (env: Env, prisma: PrismaService) =>
              new IntegrationMailer(prisma, env.PROVIDER_SECRET_KEY, createMailer(env)),
            inject: [ENV, PrismaService],
          },
      ContentService,
      NotificationService,
      RevalidateService,
      IdempotencyService,
      IntakeKeyGuard,
      { provide: ErrorReporter, useValue: new ErrorReporter("api") },
      ErrorReporterWatcher,
    ];
    return {
      module: ServicesModule,
      providers,
      exports: [
        MAILER,
        ContentService,
        NotificationService,
        RevalidateService,
        IdempotencyService,
        IntakeKeyGuard,
        ErrorReporter,
      ],
    };
  }
}

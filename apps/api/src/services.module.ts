import { type DynamicModule, Global, Module } from "@nestjs/common";
import { ENV, type Env } from "./config/env";
import { IdempotencyService } from "./common/idempotency.service";
import { IntakeKeyGuard } from "./common/serverKey";
import { ContentService } from "./content/content.service";
import { createMailer, type Mailer } from "./notifications/mailer";
import { MAILER, NotificationService } from "./notifications/notification.service";
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
        : { provide: MAILER, useFactory: (env: Env) => createMailer(env), inject: [ENV] },
      ContentService,
      NotificationService,
      RevalidateService,
      IdempotencyService,
      IntakeKeyGuard,
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
      ],
    };
  }
}

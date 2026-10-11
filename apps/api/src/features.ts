import type { FeatureFactory } from "./app";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { OpenApiModule } from "./docs/openapi";
import type { Mailer } from "./notifications/mailer";
import type { Fetcher } from "./providers/catalogAdapters";
import { ProvidersModule } from "./providers/providers.module";
import { PublicModule } from "./public/public.module";
import { ServicesModule } from "./services.module";

/** The feature modules the running API mounts; tests pass a memory mailer and a fake fetch. */
export function featureModules(
  options: { mailer?: Mailer; fetcher?: Fetcher } = {},
): FeatureFactory {
  return (env) => [
    { module: AuthModule },
    ServicesModule.register(options),
    { module: PublicModule },
    { module: AdminModule },
    ProvidersModule.register({ fetcher: options.fetcher }),
    ...(env.NODE_ENV === "production" ? [] : [{ module: OpenApiModule }]),
  ];
}

export const features: FeatureFactory = featureModules();

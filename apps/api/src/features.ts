import type { FeatureFactory } from "./app";
import { AuthModule } from "./auth/auth.module";
import { OpenApiModule } from "./docs/openapi";
import type { Mailer } from "./notifications/mailer";
import { PublicModule } from "./public/public.module";
import { ServicesModule } from "./services.module";

/** The feature modules the running API mounts; tests pass a memory mailer. B4 adds the admin modules here. */
export function featureModules(options: { mailer?: Mailer } = {}): FeatureFactory {
  return (env) => [
    { module: AuthModule },
    ServicesModule.register(options),
    { module: PublicModule },
    ...(env.NODE_ENV === "production" ? [] : [{ module: OpenApiModule }]),
  ];
}

export const features: FeatureFactory = featureModules();

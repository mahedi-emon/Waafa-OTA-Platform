import type { FeatureFactory } from "./app";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { OpenApiModule } from "./docs/openapi";
import type { GoogleFetch } from "./customers/googleOAuth";
import type { Mailer } from "./notifications/mailer";
import type { Fetcher } from "./providers/catalogAdapters";
import { FilesModule } from "./files/files.module";
import { MediaModule } from "./media/media.module";
import { ProvidersModule } from "./providers/providers.module";
import { PublicModule } from "./public/public.module";
import { ReviewsModule } from "./reviews/reviews.controller";
import { ServicesModule } from "./services.module";

/** The feature modules the running API mounts; tests pass a memory mailer and a fake fetch. */
export function featureModules(
  options: { mailer?: Mailer; fetcher?: Fetcher; googleFetch?: GoogleFetch } = {},
): FeatureFactory {
  return (env) => [
    { module: AuthModule },
    ServicesModule.register(options),
    { module: PublicModule },
    { module: AdminModule },
    // Reviews and product questions (issue 245).
    { module: ReviewsModule },
    ProvidersModule.register({ fetcher: options.fetcher, googleFetch: options.googleFetch }),
    { module: MediaModule },
    { module: FilesModule },
    ...(env.NODE_ENV === "production" ? [] : [{ module: OpenApiModule }]),
  ];
}

export const features: FeatureFactory = featureModules();

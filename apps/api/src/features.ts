import type { FeatureFactory } from "./app";
import { AuthModule } from "./auth/auth.module";

/** The feature modules the running API mounts (B2 auth; B3 public intake and B4 admin add theirs here). */
export const features: FeatureFactory = () => [{ module: AuthModule }];

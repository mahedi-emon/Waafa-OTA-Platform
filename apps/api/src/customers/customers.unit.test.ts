import { describe, expect, it } from "vitest";
import { EnvSchema, type Env } from "../config/env";
import type { PrismaService } from "../prisma/prisma.service";
import type { ProvidersService } from "../providers/providers.service";
import { CustomersService } from "./customers.service";

const baseEnv = {
  DATABASE_URL: "postgresql://localhost/test",
  JWT_SECRET: "j".repeat(40),
  REVALIDATE_SECRET: "r".repeat(40),
  INTAKE_KEY: "i".repeat(40),
  WEB_ORIGINS: "http://localhost:3000",
};

type Saved = { provider: string; isActive: boolean } | null;
type Config =
  | { status: "ready"; settings: { clientId?: string }; secrets: { clientSecret?: string } }
  | { status: "inactive" | "unknown" };

function service(config: Config, saved: Saved, extra: Record<string, string> = {}) {
  const env: Env = EnvSchema.parse({ ...baseEnv, ...extra });
  const prisma = {
    integrationSetting: { findUnique: async () => saved },
  } as unknown as PrismaService;
  const providers = {
    getIntegrationConfig: async () => config,
  } as unknown as ProvidersService;
  return new CustomersService(prisma, providers, (async () => new Response()) as never, env);
}

const googleEnv = {
  GOOGLE_CLIENT_ID: "env-123.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "env-secret",
};

describe("Google sign-in credentials (issue 149)", () => {
  it("uses Admin › Integrations when Google is connected there", async () => {
    const config = {
      status: "ready" as const,
      settings: { clientId: "admin-1.apps.googleusercontent.com" },
      secrets: { clientSecret: "admin-secret" },
    };
    const result = await service(
      config,
      { provider: "google", isActive: true },
      googleEnv,
    ).googleConfig();
    expect(result).toEqual({ enabled: true, clientId: "admin-1.apps.googleusercontent.com" });
  });

  it("falls back to the server environment when no Google record is saved", async () => {
    const result = await service({ status: "inactive" }, null, googleEnv).googleConfig();
    expect(result).toEqual({ enabled: true, clientId: "env-123.apps.googleusercontent.com" });
  });

  it("keeps Google off when an admin turned the saved record off", async () => {
    const result = await service(
      { status: "inactive" },
      { provider: "google", isActive: false },
      googleEnv,
    ).googleConfig();
    expect(result).toEqual({ enabled: false, clientId: null });
  });

  it("stays off with neither a record nor environment keys", async () => {
    const result = await service({ status: "inactive" }, null).googleConfig();
    expect(result).toEqual({ enabled: false, clientId: null });
  });
});

"use server";

import {
  ProviderConnectionInputSchema,
  ProviderEnvironmentSchema,
  ProviderIdSchema,
  type ProviderConnectionInput,
  type ProviderConnectionView,
  type ProviderEnvironment,
  type ProviderId,
} from "@waafa/shared";
import { adminWrite, type AdminResult } from "./adminApi";

const invalid = (message: string): AdminResult<never> => ({
  ok: false,
  problem: { status: 422, title: "Validation failed", detail: message },
});

function path(provider: ProviderId, environment: ProviderEnvironment): string | null {
  const id = ProviderIdSchema.safeParse(provider);
  const env = ProviderEnvironmentSchema.safeParse(environment);
  return id.success && env.success ? `/admin/providers/${id.data}/${env.data}` : null;
}

/** Saves an external API connection (Super Admin; the API checks the role and seals the secrets). */
export async function saveProvider(
  provider: ProviderId,
  environment: ProviderEnvironment,
  input: ProviderConnectionInput,
): Promise<AdminResult<ProviderConnectionView>> {
  const at = path(provider, environment);
  const parsed = ProviderConnectionInputSchema.safeParse(input);
  if (!at || !parsed.success) return invalid("Check the fields");
  return adminWrite<ProviderConnectionView>(at, "POST", parsed.data);
}

export async function testProvider(
  provider: ProviderId,
  environment: ProviderEnvironment,
): Promise<AdminResult<ProviderConnectionView>> {
  const at = path(provider, environment);
  if (!at) return invalid("Unknown provider");
  return adminWrite<ProviderConnectionView>(`${at}/test`, "POST");
}

export async function removeProvider(
  provider: ProviderId,
  environment: ProviderEnvironment,
): Promise<AdminResult<null>> {
  const at = path(provider, environment);
  if (!at) return invalid("Unknown provider");
  return adminWrite<null>(at, "DELETE");
}

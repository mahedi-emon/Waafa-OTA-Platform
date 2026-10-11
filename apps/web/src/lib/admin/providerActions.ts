"use server";

import {
  CustomProviderInputSchema,
  IntegrationSettingInputSchema,
  ProviderConnectionInputSchema,
  ProviderEnvironmentSchema,
  ProviderKeySchema,
  type CustomProviderInput,
  type IntegrationSettingInput,
  type IntegrationSettingView,
  type ProviderConnectionInput,
  type ProviderConnectionView,
  type ProviderEnvironment,
} from "@waafa/shared";
import { adminWrite, type AdminResult } from "./adminApi";

const invalid = (message: string): AdminResult<never> => ({
  ok: false,
  problem: { status: 422, title: "Validation failed", detail: message },
});

function base(provider: string): string | null {
  const key = ProviderKeySchema.safeParse(provider);
  return key.success ? `/admin/providers/${key.data}` : null;
}

function path(provider: string, environment: ProviderEnvironment): string | null {
  const at = base(provider);
  const env = ProviderEnvironmentSchema.safeParse(environment);
  return at && env.success ? `${at}/${env.data}` : null;
}

/** Saves an external API connection (Super Admin; the API checks the role and seals the secrets). */
export async function saveProvider(
  provider: string,
  environment: ProviderEnvironment,
  input: ProviderConnectionInput,
): Promise<AdminResult<ProviderConnectionView>> {
  const at = path(provider, environment);
  const parsed = ProviderConnectionInputSchema.safeParse(input);
  if (!at || !parsed.success) return invalid("Check the fields");
  return adminWrite<ProviderConnectionView>(at, "POST", parsed.data);
}

export async function testProvider(
  provider: string,
  environment: ProviderEnvironment,
): Promise<AdminResult<ProviderConnectionView>> {
  const at = path(provider, environment);
  if (!at) return invalid("Unknown provider");
  return adminWrite<ProviderConnectionView>(`${at}/test`, "POST");
}

export async function removeProvider(
  provider: string,
  environment: ProviderEnvironment,
): Promise<AdminResult<null>> {
  const at = path(provider, environment);
  if (!at) return invalid("Unknown provider");
  return adminWrite<null>(at, "DELETE");
}

/** Active, Sandbox or Live, markup (issue 107). */
export async function saveIntegrationSetting(
  provider: string,
  input: IntegrationSettingInput,
): Promise<AdminResult<IntegrationSettingView>> {
  const at = base(provider);
  const parsed = IntegrationSettingInputSchema.safeParse(input);
  if (!at) return invalid("Unknown provider");
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Check the fields");
  return adminWrite<IntegrationSettingView>(`${at}/setting`, "POST", parsed.data);
}

export async function addCustomProvider(
  input: CustomProviderInput,
): Promise<AdminResult<IntegrationSettingView>> {
  const parsed = CustomProviderInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Check the fields");
  return adminWrite<IntegrationSettingView>("/admin/providers", "POST", parsed.data);
}

export async function removeCustomProvider(provider: string): Promise<AdminResult<null>> {
  const at = base(provider);
  if (!at) return invalid("Unknown provider");
  return adminWrite<null>(at, "DELETE");
}

/** One saved secret for the Super Admin; the API writes the reveal to the audit log. */
export async function revealProviderSecret(
  provider: string,
  environment: ProviderEnvironment,
  field: string,
): Promise<AdminResult<{ field: string; value: string }>> {
  const at = path(provider, environment);
  if (!at || !/^[A-Za-z][A-Za-z0-9]{0,39}$/.test(field)) return invalid("Unknown field");
  return adminWrite<{ field: string; value: string }>(`${at}/reveal/${field}`, "POST");
}

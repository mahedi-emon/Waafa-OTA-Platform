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

/** "Find my group" on the Telegram card (issue 252): the groups the bot has seen; an empty token uses the saved one. */
export async function findTelegramGroups(
  botToken: string,
): Promise<AdminResult<{ groups: Array<{ id: string; title: string }> }>> {
  const token = botToken.trim();
  if (token.length > 100) return invalid("The bot token is too long");
  return adminWrite(`/admin/providers/telegram/groups`, "POST", token ? { botToken: token } : {});
}

/** A test SMS from an SMS card's saved values (issue 252). */
export async function sendTestSms(
  provider: string,
  environment: ProviderEnvironment,
  phone: string,
): Promise<AdminResult<{ ok: boolean; message: string }>> {
  const at = path(provider, environment);
  if (!at) return invalid("Unknown provider");
  return adminWrite(`${at}/test-sms`, "POST", { phone: phone.trim() });
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

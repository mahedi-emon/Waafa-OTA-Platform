import { validateProviderConnection, type ProviderDefinition } from "@waafa/shared";
import type { HealthResult, ProviderContext, ServiceProvider } from "./adapters";
import { checkConnection, isPublicHost, type Fetcher } from "./catalogAdapters";

/** Cloudflare's server-side check; a made-up token tells a wrong secret apart from a good one. */
export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const failed = (message: string): HealthResult => ({ ok: false, message });

function incomplete(definition: ProviderDefinition, context: ProviderContext): HealthResult | null {
  const problems = validateProviderConnection(definition, {
    settings: { ...context.settings },
    secrets: { ...context.secrets },
  });
  return problems.length > 0 ? failed(problems[0]?.message ?? "Incomplete") : null;
}

async function reach(
  address: string,
  fetcher: Fetcher,
  context: ProviderContext,
  method: "GET" | "HEAD" = "HEAD",
): Promise<{ status: number } | string> {
  let host = "";
  try {
    host = new URL(address).hostname;
  } catch {
    return "The address is not a full https:// link";
  }
  if (!isPublicHost(host)) return "The address must be a public internet host";
  try {
    return await fetcher(address, {
      method,
      redirect: "manual",
      signal: context.signal ?? AbortSignal.timeout(5_000),
    });
  } catch (error) {
    return `${host} ${error instanceof Error && error.name === "TimeoutError" ? "timed out" : "did not answer"}`;
  }
}

/** Turnstile: the secret goes to Cloudflare with a dummy token; "invalid-input-secret" means the secret is wrong. */
export async function checkTurnstile(
  definition: ProviderDefinition,
  context: ProviderContext,
  fetcher: Fetcher,
): Promise<HealthResult> {
  const missing = incomplete(definition, context);
  if (missing) return missing;
  try {
    const response = await fetcher(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({
        secret: context.secrets.secretKey ?? "",
        response: "waafa-check",
      }),
      signal: context.signal ?? AbortSignal.timeout(5_000),
    });
    const body = ((await response.json?.()) ?? {}) as { "error-codes"?: string[] };
    const codes = body["error-codes"] ?? [];
    if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret"))
      return failed("Cloudflare does not know this secret key");
    return {
      ok: true,
      message: "Cloudflare accepts the secret key. Forms ask for the check within a minute.",
    };
  } catch {
    return failed("Cloudflare's Turnstile service did not answer");
  }
}

/** Telegram: getMe with the bot token answers 200 for a real bot. */
async function checkTelegram(
  definition: ProviderDefinition,
  context: ProviderContext,
  fetcher: Fetcher,
): Promise<HealthResult> {
  const missing = incomplete(definition, context);
  if (missing) return missing;
  const answer = await reach(
    `https://api.telegram.org/bot${context.secrets.botToken ?? ""}/getMe`,
    fetcher,
    context,
    "GET",
  );
  if (typeof answer === "string") return failed("Telegram did not answer");
  if (answer.status === 401 || answer.status === 404)
    return failed("Telegram does not know this bot token");
  if (answer.status !== 200) return failed(`Telegram answered HTTP ${answer.status}`);
  return { ok: true, message: "The bot is real. Make sure it is a member of the sales group." };
}

/** Error tracking: the DSN's host must answer. */
async function checkDsn(
  definition: ProviderDefinition,
  context: ProviderContext,
  fetcher: Fetcher,
): Promise<HealthResult> {
  const missing = incomplete(definition, context);
  if (missing) return missing;
  const dsn = new URL(context.settings.dsn ?? "");
  const answer = await reach(`${dsn.protocol}//${dsn.host}/`, fetcher, context);
  if (typeof answer === "string") return failed(answer);
  return { ok: true, message: `${dsn.host} answers. Errors are sent with the release name.` };
}

/** Off-site storage: the S3 endpoint answers; the first backup copy proves the keys (issue 239). */
async function checkStorage(
  definition: ProviderDefinition,
  context: ProviderContext,
  fetcher: Fetcher,
): Promise<HealthResult> {
  const missing = incomplete(definition, context);
  if (missing) return missing;
  const endpoint =
    definition.id === "r2"
      ? `https://${context.settings.accountId ?? ""}.r2.cloudflarestorage.com`
      : (context.settings.endpoint ?? "");
  const answer = await reach(endpoint, fetcher, context);
  if (typeof answer === "string") return failed(answer);
  return {
    ok: true,
    message: "The storage address answers. The next backup copy confirms the keys and the bucket.",
  };
}

/** IDs and verification codes have nothing to call: the saved shape is the check. */
function checkShape(definition: ProviderDefinition, context: ProviderContext): HealthResult {
  return (
    incomplete(definition, context) ?? {
      ok: true,
      message: "Saved in the right form. It reaches the site within a minute.",
    }
  );
}

/** The adapter for a service added in issue 284 (captcha, measurement, monitoring, storage, alerts, courier). */
export function serviceProvider(definition: ProviderDefinition, fetcher: Fetcher): ServiceProvider {
  const healthCheck = (context: ProviderContext): Promise<HealthResult> => {
    switch (definition.kind) {
      case "captcha":
        return checkTurnstile(definition, context, fetcher);
      case "alerts":
        return checkTelegram(definition, context, fetcher);
      case "monitoring":
        return checkDsn(definition, context, fetcher);
      case "storage":
        return checkStorage(definition, context, fetcher);
      case "courier":
        return checkConnection(definition, context, fetcher);
      default:
        return Promise.resolve(checkShape(definition, context));
    }
  };
  return { id: definition.id, kind: definition.kind as ServiceProvider["kind"], healthCheck };
}

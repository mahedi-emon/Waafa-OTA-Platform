import { Socket } from "node:net";
import { serviceProvider } from "./serviceChecks";
import {
  providerDefinition,
  validateProviderConnection,
  type ProviderDefinition,
  type ProviderKey,
} from "@waafa/shared";
import {
  ProviderUnavailableError,
  type FlightProvider,
  type HealthResult,
  type HotelProvider,
  type MessagingProvider,
  type PaymentProvider,
  type ProviderAdapter,
  type ProviderContext,
  type SignInProvider,
} from "./adapters";

/*
 * Manual providers (working today) and the catalog stubs (contract-tested, waiting for certification). A stub checks
 * its saved connection and that the supplier's host answers; every booking call refuses with a clear reason, so a
 * connected but uncertified supplier can never take a booking or show a fare.
 */

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
];

/** Only public internet hosts: no single-label names (Docker services), localhost, private or IP v6 literals. */
export function isPublicHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal"))
    return false;
  if (host.startsWith("[")) return false;
  if (!host.includes(".")) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return !PRIVATE_V4.some((range) => range.test(host));
  return true;
}

/** `json` is read only where the answer's body matters (Turnstile, issue 284). */
export type Fetcher = (
  url: string,
  init: RequestInit,
) => Promise<{ status: number; json?: () => Promise<unknown> }>;

/** Opens a TCP connection and closes it: is something listening on host:port (SMTP)? */
export type PortProbe = (host: string, port: number, timeoutMs: number) => Promise<void>;

export const probePort: PortProbe = (host, port, timeoutMs) =>
  new Promise<void>((resolve, reject) => {
    const socket = new Socket();
    const done = (error?: Error) => {
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };
    socket.setTimeout(timeoutMs, () =>
      done(Object.assign(new Error("timed out"), { name: "TimeoutError" })),
    );
    socket.once("error", (error) => done(error));
    socket.connect(port, host, () => done());
  });

/** SMTP: fields complete, a public host, and the port accepts a connection within five seconds. */
export async function checkSmtp(
  definition: ProviderDefinition,
  context: ProviderContext,
  probe: PortProbe = probePort,
): Promise<HealthResult> {
  const missing = validateProviderConnection(definition, {
    settings: { ...context.settings },
    secrets: { ...context.secrets },
  });
  if (missing.length > 0) return { ok: false, message: missing[0]?.message ?? "Incomplete" };
  const host = context.settings.host ?? "";
  const port = Number(context.settings.port);
  if (!isPublicHost(host))
    return { ok: false, message: "The SMTP host must be a public internet host" };
  try {
    await probe(host, port, 5_000);
    return {
      ok: true,
      message: `Saved and reachable (${host}:${port}). Email uses it while it is active.`,
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "TimeoutError" ? "timed out" : "did not answer";
    return { ok: false, message: `${host}:${port} ${reason}` };
  }
}

/** Saved fields complete, the host public, and the host answers within five seconds (any HTTP status counts). */
export async function checkConnection(
  definition: ProviderDefinition,
  context: ProviderContext,
  fetcher: Fetcher = fetch,
): Promise<HealthResult> {
  const missing = validateProviderConnection(definition, {
    settings: { ...context.settings },
    secrets: { ...context.secrets },
  });
  if (missing.length > 0) return { ok: false, message: missing[0]?.message ?? "Incomplete" };
  const baseUrl = context.settings.baseUrl ?? "";
  const host = new URL(baseUrl).hostname;
  if (!isPublicHost(host))
    return { ok: false, message: "The API address must be a public internet host" };
  try {
    const response = await fetcher(baseUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: context.signal ?? AbortSignal.timeout(5_000),
    });
    return {
      ok: true,
      message: `Saved and reachable (HTTP ${response.status}). Searches and bookings start once the certified adapter is installed and Live is unlocked.`,
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "TimeoutError" ? "timed out" : "did not answer";
    return { ok: false, message: `${host} ${reason}` };
  }
}

const reject = (definition: ProviderDefinition) => () =>
  Promise.reject(
    new ProviderUnavailableError(
      definition.id,
      `${definition.name} is connected but its certified adapter is not installed yet (Phase E)`,
    ),
  );

export function stubFlightProvider(
  definition: ProviderDefinition,
  fetcher?: Fetcher,
): FlightProvider {
  const no = reject(definition);
  return {
    id: definition.id,
    kind: "flight",
    healthCheck: (context) => checkConnection(definition, context, fetcher),
    search: no,
    revalidate: no,
    fareRules: no,
    book: no,
    issueTicket: no,
    cancel: no,
    retrieve: no,
  };
}

export function stubHotelProvider(
  definition: ProviderDefinition,
  fetcher?: Fetcher,
): HotelProvider {
  const no = reject(definition);
  return {
    id: definition.id,
    kind: "hotel",
    healthCheck: (context) => checkConnection(definition, context, fetcher),
    search: no,
    hotelDetail: no,
    rates: no,
    book: no,
    cancel: no,
    retrieve: no,
  };
}

export function messagingProvider(
  definition: ProviderDefinition,
  fetcher?: Fetcher,
  probe?: PortProbe,
): MessagingProvider {
  return {
    id: definition.id,
    kind: definition.kind === "email" ? "email" : "sms",
    healthCheck: (context) =>
      definition.id === "smtp"
        ? checkSmtp(definition, context, probe)
        : checkConnection(definition, context, fetcher),
  };
}

export function stubPaymentProvider(
  definition: ProviderDefinition,
  fetcher?: Fetcher,
): PaymentProvider {
  const no = reject(definition);
  return {
    id: definition.id,
    kind: "payment",
    healthCheck: (context) => checkConnection(definition, context, fetcher),
    initiate: no,
    verifyCallback: no,
    refund: no,
    query: no,
  };
}

/** Google publishes its sign-in endpoints here; reaching it shows the server can talk to Google. */
export const GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";

/** Google sign-in (issue 134): both fields saved, a Google client ID, and Google's sign-in service answers. */
export async function checkGoogleSignIn(
  definition: ProviderDefinition,
  context: ProviderContext,
  fetcher: Fetcher = fetch,
): Promise<HealthResult> {
  const missing = validateProviderConnection(definition, {
    settings: { ...context.settings },
    secrets: { ...context.secrets },
  });
  if (missing.length > 0) return { ok: false, message: missing[0]?.message ?? "Incomplete" };
  if (!/\.apps\.googleusercontent\.com$/.test(context.settings.clientId ?? "")) {
    return { ok: false, message: "A Google client ID ends in .apps.googleusercontent.com" };
  }
  try {
    const response = await fetcher(GOOGLE_DISCOVERY_URL, {
      method: "GET",
      redirect: "manual",
      signal: context.signal ?? AbortSignal.timeout(5_000),
    });
    if (response.status !== 200) {
      return { ok: false, message: `Google's sign-in service answered HTTP ${response.status}` };
    }
    return {
      ok: true,
      message:
        "Saved; Google answers. Customers can sign in while this is active and Settings › Accounts live is on.",
    };
  } catch {
    return { ok: false, message: "Google's sign-in service did not answer" };
  }
}

export function signInProvider(definition: ProviderDefinition, fetcher?: Fetcher): SignInProvider {
  return {
    id: definition.id,
    kind: "auth",
    healthCheck: (context) => checkGoogleSignIn(definition, context, fetcher),
  };
}

/**
 * The adapter for a catalog or custom provider; a certified adapter replaces its stub here in Phase E. Pass the
 * definition for a custom provider (its name lives in its setting).
 */
export function adapterFor(
  provider: ProviderKey | ProviderDefinition,
  fetcher?: Fetcher,
  probe?: PortProbe,
): ProviderAdapter {
  const definition = typeof provider === "string" ? providerDefinition(provider) : provider;
  if (!definition) throw new Error(`Unknown provider ${String(provider)}`);
  switch (definition.kind) {
    case "flight":
      return stubFlightProvider(definition, fetcher);
    case "hotel":
      return stubHotelProvider(definition, fetcher);
    case "payment":
      return stubPaymentProvider(definition, fetcher);
    case "sms":
    case "email":
      return messagingProvider(definition, fetcher, probe);
    case "auth":
      return signInProvider(definition, fetcher);
    default:
      return serviceProvider(definition, fetcher ?? fetch);
  }
}

const manualRefusal = (provider: string) => () =>
  Promise.reject(
    new ProviderUnavailableError(
      provider,
      "Manual mode: the request becomes a lead and an expert confirms the fare before payment",
    ),
  );

/**
 * Manual mode (the launch product): no live offers, so the page shows the request form and the admin's indicative
 * group fares; every booking call refuses and the request is saved as a lead instead (FR-GS-01, FR-GS-07).
 */
export const manualFlightProvider: FlightProvider = {
  id: "manual-flight",
  kind: "flight",
  healthCheck: () => Promise.resolve({ ok: true, message: "Manual mode is always available" }),
  search: () => Promise.resolve([]),
  revalidate: () => Promise.resolve(null),
  fareRules: () => Promise.resolve([]),
  book: manualRefusal("manual-flight"),
  issueTicket: manualRefusal("manual-flight"),
  cancel: manualRefusal("manual-flight"),
  retrieve: manualRefusal("manual-flight"),
};

export const manualHotelProvider: HotelProvider = {
  id: "manual-hotel",
  kind: "hotel",
  healthCheck: () => Promise.resolve({ ok: true, message: "Manual mode is always available" }),
  search: () => Promise.resolve([]),
  hotelDetail: () => Promise.resolve(null),
  rates: () => Promise.resolve([]),
  book: manualRefusal("manual-hotel"),
  cancel: manualRefusal("manual-hotel"),
  retrieve: manualRefusal("manual-hotel"),
};

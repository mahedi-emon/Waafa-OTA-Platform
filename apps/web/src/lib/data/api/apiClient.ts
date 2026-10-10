import "server-only";

/** Where the API lives; the site runs on the API when both are set, on the Sample fixtures otherwise (D136). */
export type ApiConfig = { baseUrl: string; intakeKey: string };

export function apiConfig(): ApiConfig | null {
  const baseUrl = process.env.WAAFA_API_URL?.trim();
  const intakeKey = process.env.WAAFA_INTAKE_KEY?.trim();
  if (!baseUrl || !intakeKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), intakeKey };
}

/** What the visitor's request carries to the API: their address for rate limits and the form's idempotency key. */
export type IntakeContext = { clientIp?: string; idempotencyKey?: string };

/** A refusal or failure from the API, with its status and problem body. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: Record<string, unknown>,
  ) {
    super(`API answered ${status}`);
    this.name = "ApiError";
  }
}

type CallOptions = IntakeContext & {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

/**
 * Calls the API server to server with the intake key. 2xx answers return the parsed body (null for 204); anything
 * else throws ApiError; network failures and timeouts throw as they are.
 */
export async function callApi<T>(
  config: ApiConfig,
  path: string,
  options: CallOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-intake-key": config.intakeKey,
    ...options.headers,
  };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.clientIp && options.clientIp !== "unknown") headers["x-client-ip"] = options.clientIp;
  if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
  });
  if (response.status === 204) return null as T;
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { detail: text.slice(0, 200) };
  }
  if (!response.ok) {
    throw new ApiError(response.status, (parsed ?? {}) as Record<string, unknown>);
  }
  return parsed as T;
}

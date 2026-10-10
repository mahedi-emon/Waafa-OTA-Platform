import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiConfig, callApi } from "./apiClient";

const config = { baseUrl: "https://api.example.test", intakeKey: "intake-key-0123456789-abcdef" };

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("apiConfig (D136)", () => {
  it("is on only when the URL and the intake key are both set", () => {
    vi.stubEnv("WAAFA_API_URL", "");
    vi.stubEnv("WAAFA_INTAKE_KEY", "key");
    expect(apiConfig()).toBeNull();
    vi.stubEnv("WAAFA_API_URL", "https://api.example.test///");
    expect(apiConfig()).toEqual({ baseUrl: "https://api.example.test", intakeKey: "key" });
  });
});

describe("callApi", () => {
  it("sends the intake key, the visitor address and the idempotency key", async () => {
    const fetchMock = mockFetch(201, { reference: "FLT-261011-0001" });
    const result = await callApi(config, "/api/v1/public/leads", {
      body: { a: 1 },
      clientIp: "203.0.113.7",
      idempotencyKey: "3f2a7c1e-9b4d-4e6f-8a1b-2c3d4e5f6a7b",
    });
    expect(result).toEqual({ reference: "FLT-261011-0001" });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.example.test/api/v1/public/leads");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "x-intake-key": config.intakeKey,
      "x-client-ip": "203.0.113.7",
      "idempotency-key": "3f2a7c1e-9b4d-4e6f-8a1b-2c3d4e5f6a7b",
      "content-type": "application/json",
    });
  });

  it("leaves out an unknown visitor address and answers null for 204", async () => {
    const fetchMock = mockFetch(204);
    expect(
      await callApi(config, "/api/v1/public/subscribers", { body: {}, clientIp: "unknown" }),
    ).toBeNull();
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty("x-client-ip");
  });

  it("throws ApiError with the problem body on a refusal", async () => {
    mockFetch(409, { code: "changed", quote: { ready: false } });
    const error = await callApi(config, "/api/v1/public/orders", { body: {} }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).body).toMatchObject({ code: "changed" });
  });
});

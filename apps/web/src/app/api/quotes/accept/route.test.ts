import { beforeEach, describe, expect, it, vi } from "vitest";

const acceptQuote = vi.fn();
const verifyTurnstile = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/quotes", () => ({ acceptQuote }));
vi.mock("@/lib/leads/turnstile", () => ({ verifyTurnstile }));

const TOKEN = `clquote0000000000000001-${"a".repeat(32)}`;

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/quotes/accept", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "10.9.0.1", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quotes/accept (issue 298)", () => {
  beforeEach(() => {
    acceptQuote.mockReset();
    verifyTurnstile.mockReset().mockResolvedValue(true);
  });

  it("accepts a signed link and an option after the Turnstile check", async () => {
    const { POST } = await import("./route");
    acceptQuote.mockResolvedValue({ ok: true, quote: { state: "accepted" } });
    const response = await POST(post({ token: TOKEN, optionId: "o2", turnstileToken: "t" }));
    expect(response.status).toBe(200);
    expect(acceptQuote).toHaveBeenCalledWith(TOKEN, "o2", expect.any(Object));
    expect(verifyTurnstile).toHaveBeenCalledWith("t", expect.any(String));
  });

  it("refuses cross-site posts, bad links and a failed check before reaching the API", async () => {
    const { POST } = await import("./route");
    expect(
      (await POST(post({ token: TOKEN, optionId: "o1" }, { "sec-fetch-site": "cross-site" })))
        .status,
    ).toBe(403);
    expect((await POST(post({ token: "not-a-quote", optionId: "o1" }))).status).toBe(422);
    verifyTurnstile.mockResolvedValue(false);
    expect((await POST(post({ token: TOKEN, optionId: "o1" }))).status).toBe(400);
    expect(acceptQuote).not.toHaveBeenCalled();
  });

  it("passes on the API's refusals: another option, expired", async () => {
    const { POST } = await import("./route");
    acceptQuote.mockResolvedValueOnce({ ok: false, status: 409, error: "conflict" });
    const conflict = await POST(
      post({ token: TOKEN, optionId: "o1" }, { "x-forwarded-for": "10.9.0.2" }),
    );
    expect(conflict.status).toBe(409);
    acceptQuote.mockResolvedValueOnce({ ok: false, status: 410, error: "expired" });
    const expired = await POST(
      post({ token: TOKEN, optionId: "o1" }, { "x-forwarded-for": "10.9.0.3" }),
    );
    expect(await expired.json()).toEqual({ error: "expired" });
  });
});

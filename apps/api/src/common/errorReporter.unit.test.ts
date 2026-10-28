import { describe, expect, it, vi } from "vitest";
import { envelopeFor, ErrorReporter, parseDsn } from "./errorReporter";

const DSN = "https://abc123@o1.ingest.sentry.io/456";

describe("error reporter (issue 238)", () => {
  it("reads a Sentry or GlitchTip DSN and refuses anything else", () => {
    expect(parseDsn(DSN)).toEqual({
      endpoint: "https://o1.ingest.sentry.io/api/456/envelope/",
      key: "abc123",
      raw: DSN,
    });
    expect(parseDsn("https://k1@app.glitchtip.com/7")?.endpoint).toBe(
      "https://app.glitchtip.com/api/7/envelope/",
    );
    expect(parseDsn("http://abc@host/1")).toBeNull();
    expect(parseDsn("")).toBeNull();
  });

  it("builds one envelope with the release, the source and the stack frames", () => {
    const dsn = parseDsn(DSN);
    if (!dsn) throw new Error("dsn");
    const error = new Error("Database not reachable");
    const [head, type, event] = envelopeFor(dsn, error, {
      source: "worker",
      release: "abc1234",
      path: "queue:email",
      now: new Date("2026-10-29T04:00:00Z"),
    })
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(head).toMatchObject({ dsn: DSN, sent_at: "2026-10-29T04:00:00.000Z" });
    expect(type).toEqual({ type: "event" });
    expect(event).toMatchObject({
      release: "abc1234",
      server_name: "worker",
      transaction: "queue:email",
      exception: { values: [{ type: "Error", value: "Database not reachable" }] },
    });
  });

  it("sends nothing while off and at most 30 reports a minute", async () => {
    const send = vi.fn(() => Promise.resolve({}));
    const reporter = new ErrorReporter("api", "abc1234", send);
    reporter.report(new Error("off"));
    reporter.configure(DSN);
    const now = new Date("2026-10-29T04:00:00Z");
    for (let index = 0; index < 40; index += 1) reporter.report(new Error(`e${index}`), {}, now);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(send).toHaveBeenCalledTimes(30);
    reporter.report(new Error("next minute"), {}, new Date("2026-10-29T04:01:00Z"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(send).toHaveBeenCalledTimes(31);
    const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://o1.ingest.sentry.io/api/456/envelope/");
    expect((init.headers as Record<string, string>)["x-sentry-auth"]).toContain(
      "sentry_key=abc123",
    );
  });
});

import { PROVIDER_CATALOG } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import type { Fetcher } from "./catalogAdapters";
import { serviceProvider, TURNSTILE_VERIFY_URL } from "./serviceChecks";

const context = (settings: Record<string, string>, secrets: Record<string, string> = {}) => ({
  environment: "production" as const,
  settings,
  secrets,
});

describe("service checks (issue 284)", () => {
  it("Turnstile: a secret Cloudflare does not know fails, a known one passes", async () => {
    const seen: string[] = [];
    const answer =
      (codes: string[]): Fetcher =>
      (url) => {
        seen.push(url);
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({ "error-codes": codes }),
        });
      };
    const keys = context({ siteKey: "0x4AAAAAAAAbcdefghijkl" }, { secretKey: "secret" });
    const wrong = serviceProvider(PROVIDER_CATALOG.turnstile, answer(["invalid-input-secret"]));
    expect(await wrong.healthCheck(keys)).toMatchObject({ ok: false });
    const right = serviceProvider(PROVIDER_CATALOG.turnstile, answer(["invalid-input-response"]));
    expect(await right.healthCheck(keys)).toMatchObject({ ok: true });
    expect(seen).toEqual([TURNSTILE_VERIFY_URL, TURNSTILE_VERIFY_URL]);
  });

  it("Telegram: a refused token fails with plain words", async () => {
    const refuse: Fetcher = () => Promise.resolve({ status: 401 });
    const telegram = serviceProvider(PROVIDER_CATALOG.telegram, refuse);
    expect(
      await telegram.healthCheck(
        context(
          { chatId: "-1001234567890" },
          { botToken: "123456789:AAEabcdefghijklmnopqrstuvwxyz012345" },
        ),
      ),
    ).toEqual({
      ok: false,
      message: "Telegram does not know this bot token. Copy it again from @BotFather.",
    });
  });

  it("measurement IDs pass on their form alone; a wrong form fails without a call", async () => {
    const calls: string[] = [];
    const record: Fetcher = (url) => {
      calls.push(url);
      return Promise.resolve({ status: 200 });
    };
    const ga4 = serviceProvider(PROVIDER_CATALOG.ga4, record);
    expect(await ga4.healthCheck(context({ measurementId: "G-ABC1234567" }))).toMatchObject({
      ok: true,
    });
    expect(await ga4.healthCheck(context({ measurementId: "UA-1" }))).toMatchObject({ ok: false });
    expect(calls).toEqual([]);
  });

  it("error tracking reaches the DSN host; storage refuses private hosts", async () => {
    const calls: string[] = [];
    const record: Fetcher = (url) => {
      calls.push(url);
      return Promise.resolve({ status: 200 });
    };
    const sentry = serviceProvider(PROVIDER_CATALOG.sentry, record);
    expect(
      await sentry.healthCheck(context({ dsn: "https://abc123@o1.ingest.sentry.io/456" })),
    ).toMatchObject({ ok: true });
    expect(calls).toEqual(["https://o1.ingest.sentry.io/"]);
    const b2 = serviceProvider(PROVIDER_CATALOG.b2, record);
    expect(
      await b2.healthCheck(
        context(
          { endpoint: "https://10.0.0.5", bucket: "waafa-backups", keyId: "k" },
          { applicationKey: "s" },
        ),
      ),
    ).toMatchObject({ ok: false });
  });
});

import {
  PROVIDER_CATALOG,
  PROVIDER_IDS,
  providerDefinition,
  type FlightOffer,
  type FlightSearch,
} from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { GATEWAY_ADAPTERS } from "../payments/gateways";
import { ProviderUnavailableError, type FlightProvider, type ProviderContext } from "./adapters";
import {
  adapterFor,
  checkConnection,
  checkSmtp,
  isPublicHost,
  manualFlightProvider,
  manualHotelProvider,
} from "./catalogAdapters";
import { dedupeOffers, searchFlights } from "./registry";
import { lastFour, SecretBox } from "./secretBox";

const KEY = "unit-test-provider-key-0123456789-abcdef";

describe("SecretBox (AES-256-GCM)", () => {
  it("seals and opens; every seal is different", () => {
    const box = new SecretBox(KEY);
    const a = box.seal("client-secret-value");
    const b = box.seal("client-secret-value");
    expect(a).not.toBe(b);
    expect(a.startsWith("v1.")).toBe(true);
    expect(a).not.toContain("client-secret-value");
    expect(box.open(a)).toBe("client-secret-value");
  });

  it("refuses a tampered value or another key", () => {
    const box = new SecretBox(KEY);
    const sealed = box.seal("abc");
    const parts = sealed.split(".");
    const tampered = [parts[0], parts[1], parts[2], Buffer.from("xyz").toString("base64url")].join(
      ".",
    );
    expect(() => box.open(tampered)).toThrow();
    expect(() => new SecretBox(`${KEY}-other`).open(sealed)).toThrow();
    expect(() => box.open("plain-text")).toThrow();
  });

  it("needs a long key and masks short secrets completely", () => {
    expect(() => new SecretBox("short")).toThrow();
    expect(lastFour("abcdefghijkl1234")).toBe("1234");
    expect(lastFour("short")).toBeNull();
  });
});

describe("isPublicHost", () => {
  it.each([
    ["api.sabre.com", true],
    ["203.0.113.10", true],
    ["localhost", false],
    ["postgres", false],
    ["api", false],
    ["10.0.0.5", false],
    ["172.20.1.1", false],
    ["192.168.1.1", false],
    ["127.0.0.1", false],
    ["169.254.169.254", false],
    ["[::1]", false],
    ["metadata.internal", false],
  ])("%s → %s", (host, expected) => {
    expect(isPublicHost(host)).toBe(expected);
  });
});

const sabreContext: ProviderContext = {
  environment: "sandbox",
  settings: { baseUrl: "https://api.cert.example.com", clientId: "id", pcc: "AB12" },
  secrets: { clientSecret: "secret" },
};

describe("catalog adapters (contract)", () => {
  it.each(PROVIDER_IDS)(
    "%s implements its kind's interface and refuses booking calls",
    async (id) => {
      const adapter = adapterFor(id, () => Promise.resolve({ status: 200 }));
      const kind = PROVIDER_CATALOG[id].kind;
      expect(adapter.kind).toBe(kind);
      expect(adapter.id).toBe(id);
      const methods =
        kind === "flight"
          ? ["search", "revalidate", "fareRules", "book", "issueTicket", "cancel", "retrieve"]
          : kind === "hotel"
            ? ["search", "hotelDetail", "rates", "book", "cancel", "retrieve"]
            : kind === "payment"
              ? ["initiate", "verifyCallback", "refund", "query"]
              : [];
      expect(typeof adapter.healthCheck).toBe("function");
      for (const method of methods) {
        const call = (
          adapter as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>
        )[method];
        expect(typeof call).toBe("function");
        // The three online gateways are real now; their calls are covered in gateways.unit.test.ts.
        if (id in GATEWAY_ADAPTERS) continue;
        await expect(call?.({}, sabreContext)).rejects.toBeInstanceOf(ProviderUnavailableError);
      }
    },
  );

  it("health check: complete and reachable", async () => {
    const result = await checkConnection(PROVIDER_CATALOG.sabre, sabreContext, () =>
      Promise.resolve({ status: 404 }),
    );
    expect(result.ok).toBe(true);
    expect(result.message).toContain("HTTP 404");
  });

  it("health check: missing field, private host, no answer", async () => {
    const reachable = () => Promise.resolve({ status: 200 });
    expect(
      (await checkConnection(PROVIDER_CATALOG.sabre, { ...sabreContext, secrets: {} }, reachable))
        .ok,
    ).toBe(false);
    const internal = await checkConnection(
      PROVIDER_CATALOG.sabre,
      { ...sabreContext, settings: { ...sabreContext.settings, baseUrl: "https://10.0.0.8" } },
      reachable,
    );
    expect(internal).toEqual({
      ok: false,
      message: "The API address must be a public internet host",
    });
    const down = await checkConnection(PROVIDER_CATALOG.sabre, sabreContext, () =>
      Promise.reject(new Error("ECONNREFUSED")),
    );
    expect(down).toEqual({ ok: false, message: "api.cert.example.com did not answer" });
  });

  it("custom providers get their kind's stub", () => {
    const definition = providerDefinition("custom-hotel-agoda-b2b", "Agoda B2B");
    expect(definition && adapterFor(definition).kind).toBe("hotel");
    expect(() => adapterFor("custom-nothing" as never)).toThrow();
  });

  it("SMTP health check: open port, private host, no answer", async () => {
    const smtp = PROVIDER_CATALOG.smtp;
    const context: ProviderContext = {
      environment: "production",
      settings: { host: "smtp.example.com", port: "587", username: "u", from: "a@example.com" },
      secrets: { password: "p" },
    };
    expect((await checkSmtp(smtp, context, () => Promise.resolve())).ok).toBe(true);
    const internal = await checkSmtp(
      smtp,
      { ...context, settings: { ...context.settings, host: "192.168.0.2" } },
      () => Promise.resolve(),
    );
    expect(internal.ok).toBe(false);
    const down = await checkSmtp(smtp, context, () => Promise.reject(new Error("ECONNREFUSED")));
    expect(down).toEqual({ ok: false, message: "smtp.example.com:587 did not answer" });
  });

  it("Manual providers: no live offers, booking becomes a lead", async () => {
    expect(await manualFlightProvider.search({} as FlightSearch, sabreContext)).toEqual([]);
    expect(await manualHotelProvider.rates("h", {} as never, sabreContext)).toEqual([]);
    await expect(manualFlightProvider.book({} as never, sabreContext)).rejects.toThrow(
      /Manual mode/,
    );
  });
});

const segment = (code: string, number: string, departAt: string) => ({
  marketingCarrier: { code, name: code },
  flightNumber: number,
  from: "DAC",
  to: "DXB",
  departAt,
  arriveAt: "2026-11-14T14:00:00+06:00",
  durationMinutes: 300,
  cabin: "economy",
});

function offer(id: string, price: number, code = "EK", number = "585"): FlightOffer {
  return {
    id,
    providerRef: `ref-${id}`,
    slices: [
      { segments: [segment(code, number, "2026-11-14T09:00:00+06:00")], durationMinutes: 300 },
    ],
    validatingCarrier: { code, name: code },
    baggage: { cabin: "7 kg", checked: "30 kg" },
    refundable: false,
    fares: [
      { passengerType: "adult", count: 1, baseFare: price - 5000, taxes: 5000, total: price },
    ],
    totalPrice: price,
    rules: [],
    expiresAt: "2026-11-01T10:00:00+06:00",
    sample: true,
  } as FlightOffer;
}

function provider(id: string, search: FlightProvider["search"]): FlightProvider {
  return { ...manualFlightProvider, id: id as FlightProvider["id"], search };
}

describe("registry search", () => {
  it("keeps the cheaper copy of the same flight and sorts by price", () => {
    const result = dedupeOffers([
      offer("a", 60000),
      offer("b", 55000),
      offer("c", 70000, "QR", "639"),
    ]);
    expect(result.map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("merges providers in parallel; a failing, slow or malformed provider never blocks the rest", async () => {
    const result = await searchFlights(
      [
        {
          provider: provider("sabre", () => Promise.resolve([offer("a", 61000)])),
          context: sabreContext,
        },
        {
          provider: provider("amadeus", () => Promise.reject(new Error("HTTP 500"))),
          context: sabreContext,
        },
        {
          provider: provider("travelport", () => new Promise<FlightOffer[]>(() => undefined)),
          context: sabreContext,
        },
        {
          provider: provider("flyhub", () =>
            Promise.resolve([offer("b", 59000), { id: "broken" } as unknown as FlightOffer]),
          ),
          context: sabreContext,
        },
      ],
      {} as FlightSearch,
      50,
    );
    expect(result.offers.map((item) => item.id)).toEqual(["b"]);
    expect(result.failures).toEqual([
      { provider: "amadeus", message: "HTTP 500" },
      { provider: "travelport", message: "No answer within 0.05 s" },
      { provider: "flyhub", message: "1 offers did not match the schema" },
    ]);
  });
});

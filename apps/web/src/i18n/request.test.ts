import { describe, expect, it, vi } from "vitest";

// The root param as Next gives it: a value on a page, a throw inside a Server Action (issue 322).
const root = vi.hoisted(() => ({ read: async (): Promise<string | undefined> => "en" }));
vi.mock("next/root-params", () => ({ locale: () => root.read() }));
vi.mock("next-intl/server", () => ({
  getRequestConfig: (factory: unknown) => factory,
}));

type Config = { locale: string; messages: Record<string, unknown> };
const { default: requestConfig } = (await import("./request")) as unknown as {
  default: (input: { locale?: string }) => Promise<Config>;
};

describe("i18n request config", () => {
  it("uses the page's locale root param", async () => {
    root.read = async () => "bn";
    const config = await requestConfig({});
    expect(config.locale).toBe("bn");
    expect(config.messages).toHaveProperty("Admin");
  });

  it("falls back to English inside a Server Action, where Next refuses root params", async () => {
    root.read = async () => {
      throw new Error("locale() was used inside a Server Action. This is not supported.");
    };
    const config = await requestConfig({});
    expect(config.locale).toBe("en");
  });

  it("keeps the locale next-intl already knows", async () => {
    root.read = async () => {
      throw new Error("not reached");
    };
    expect((await requestConfig({ locale: "bn" })).locale).toBe("bn");
  });
});

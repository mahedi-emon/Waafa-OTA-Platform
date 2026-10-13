import { describe, expect, it, vi } from "vitest";
import type { Resolver } from "react-hook-form";
import { lazyResolver } from "./lazyResolver";

type Values = { name: string };

const options = { fields: {}, shouldUseNativeValidation: false } as Parameters<Resolver<Values>>[2];

describe("lazyResolver", () => {
  it("loads the validation on the first check only, then reuses it", async () => {
    const inner = vi.fn<Resolver<Values>>(async (values) => ({ values, errors: {} }));
    const load = vi.fn(async () => inner);
    const resolver = lazyResolver(load);
    expect(load).not.toHaveBeenCalled();

    await resolver({ name: "Rahim" }, undefined, options);
    await resolver({ name: "Karim" }, undefined, options);

    expect(load).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledTimes(2);
  });

  it("returns what the loaded resolver returns, errors included", async () => {
    const resolver = lazyResolver<Values>(async () => async () => ({
      values: {},
      errors: { name: { type: "custom", message: "nameRequired" } },
    }));
    const result = await resolver({ name: "" }, undefined, options);
    expect(result.errors.name?.message).toBe("nameRequired");
  });

  it("shares one load between checks that start together", async () => {
    const load = vi.fn(
      async () => (async (values: Values) => ({ values, errors: {} })) as Resolver<Values>,
    );
    const resolver = lazyResolver(load);
    await Promise.all([
      resolver({ name: "A" }, undefined, options),
      resolver({ name: "B" }, undefined, options),
    ]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});

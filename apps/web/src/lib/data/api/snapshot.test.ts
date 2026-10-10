import { loadFixtures } from "@waafa/fixtures";
import { describe, expect, it } from "vitest";
import { createFixtureRepositories } from "../fixtures/createFixtureRepositories";
import { parseSnapshot } from "./snapshot";

describe("parseSnapshot (D130)", () => {
  it("reads the API snapshot into the shape the repositories were built on", async () => {
    const wire = JSON.parse(JSON.stringify(loadFixtures())) as Record<string, unknown>;
    const data = parseSnapshot(wire);
    const repositories = createFixtureRepositories(data);
    expect((await repositories.settings.getSiteSettings()).storeName).toBe("Waafas World");
    expect((await repositories.travel.listPackages()).total).toBeGreaterThan(0);
  });

  it("treats a missing collection as empty and names a broken key", () => {
    const wire = JSON.parse(JSON.stringify(loadFixtures())) as Record<string, unknown>;
    delete wire.orders;
    expect(parseSnapshot(wire).orders).toEqual([]);
    expect(() => parseSnapshot({ ...wire, siteSettings: { storeName: 1 } })).toThrow(
      /siteSettings/,
    );
  });
});

import { describe, expect, it } from "vitest";
import { formerStoreNames, schemaName } from "./schemaNames";

describe("schemaName", () => {
  it("writes the store name with a plain apostrophe for structured data", () => {
    expect(schemaName("Waafa’s World")).toBe("Waafa's World");
  });

  it("keeps names without an apostrophe as they are", () => {
    expect(schemaName("Waafa Tours and Travel")).toBe("Waafa Tours and Travel");
  });
});

describe("formerStoreNames", () => {
  it("keeps the old name so search still finds it", () => {
    expect(formerStoreNames("Waafa’s World")).toEqual(["Waafas World"]);
  });

  it("drops a former name the admin has chosen again", () => {
    expect(formerStoreNames("Waafas World")).toEqual([]);
  });
});

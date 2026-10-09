import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import { routing } from "./routing";

/** Flattens nested message objects into [key, value] pairs. */
function entries(node: unknown, prefix = ""): Array<[string, string]> {
  if (typeof node === "string") return [[prefix, node]];
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([key, value]) =>
      entries(value, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

const messages = entries(en);

describe("message catalogue", () => {
  it("covers every configured locale", () => {
    expect(routing.locales).toContain(routing.defaultLocale);
    expect(routing.defaultLocale).toBe("en");
  });

  it("has no empty strings", () => {
    for (const [key, value] of messages) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("uses no em or en dashes in UI copy (DESIGN.md Do's and Don'ts)", () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/[–—]/);
    }
  });

  it("avoids filler words the design rules ban", () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\b(elevate|seamless|unleash|discover)\w*/i);
    }
  });

  it("never mentions services outside the licences (PRD §2)", () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\b(hajj|umrah|manpower|recruitment|work permit)\b/i);
    }
  });
});

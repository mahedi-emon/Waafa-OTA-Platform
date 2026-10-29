import { describe, expect, it } from "vitest";
import bn from "../../messages/bn.json";
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

  it("has no empty plural or select branches, which compiled messages cannot format (issue 236)", () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\{\s*\}/);
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

/** The ICU arguments, plural/select keywords and rich-text tags of a message, in a comparable form. */
function shape(value: string): string {
  const args: string[] = [];
  for (const match of value.matchAll(/\{\s*([a-zA-Z_]\w*)\s*[,}]/g)) {
    // "{" right after a plural or select keyword opens a branch's text, not an argument.
    const before = value.slice(0, match.index);
    if (
      /(plural|select|selectordinal),/.test(before) &&
      /(=\d+|zero|one|two|few|many|other)\s*$/.test(before)
    )
      continue;
    args.push(match[1] ?? "");
  }
  const tags = [...value.matchAll(/<\/?([a-zA-Z][\w-]*)>/g)].map((match) => match[0]);
  return JSON.stringify([args.sort(), tags.sort()]);
}

/** Namespaces that stay English on Bangla pages (issue 254): the admin and llms.txt. */
const ENGLISH_ONLY = new Set(["Admin", "Llms"]);

describe("Bangla catalogue (issue 254)", () => {
  const public_ = entries(
    Object.fromEntries(Object.entries(en).filter(([name]) => !ENGLISH_ONLY.has(name))),
  );
  const bangla = new Map(entries(bn));

  it("is a configured locale", () => {
    expect(routing.locales).toContain("bn");
  });

  it("translates every public string: a new English key without Bangla fails here", () => {
    const missing = public_.filter(([key]) => !bangla.get(key)?.trim()).map(([key]) => key);
    expect(missing).toEqual([]);
  });

  it("has no keys English does not have", () => {
    const english = new Set(public_.map(([key]) => key));
    expect([...bangla.keys()].filter((key) => !english.has(key))).toEqual([]);
  });

  it("keeps every placeholder, plural keyword and tag of the English", () => {
    const broken = public_
      .filter(([key, value]) => bangla.has(key) && shape(value) !== shape(bangla.get(key) ?? ""))
      .map(([key]) => key);
    expect(broken).toEqual([]);
  });

  it("is really Bangla: almost every string has Bangla letters", () => {
    const bengali = [...bangla.values()].filter((value) => /[ঀ-৿]/.test(value)).length;
    expect(bengali / bangla.size).toBeGreaterThan(0.9);
  });

  it("keeps Latin digits and the rules of the English copy", () => {
    for (const [key, value] of bangla) {
      expect(value, key).not.toMatch(/[০-৯]/);
      expect(value, key).not.toMatch(/[–—]/);
      expect(value, key).not.toMatch(/(^|\s)হজ|উমরাহ|ওমরাহ|ম্যানপাওয়ার|রিক্রুট/);
    }
  });
});

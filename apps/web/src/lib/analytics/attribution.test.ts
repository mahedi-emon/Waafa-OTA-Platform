import { describe, expect, it } from "vitest";
import { readSource, rememberSource, SOURCE_COOKIE, sourceOf, withSource } from "./attribution";

const HOST = "waafasworld.com";

function jar(value?: string) {
  const written: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    cookies: { get: (name: string) => (name === SOURCE_COOKIE && value ? { value } : undefined) },
    response: {
      set: (name: string, next: string, options: Record<string, unknown>) =>
        written.push({ name, value: next, options }),
    },
    written,
  };
}

describe("attribution (issue 237)", () => {
  it("reads UTM tags and another site's address, never our own pages", () => {
    const url = new URL(
      "https://waafasworld.com/tour-packages?utm_source=facebook&utm_medium=cpc&utm_campaign=eid",
    );
    expect(sourceOf(url, "https://www.google.com/", HOST)).toEqual({
      utm: { source: "facebook", medium: "cpc", campaign: "eid" },
      referrer: "www.google.com",
      landing: "/tour-packages",
    });
    expect(
      sourceOf(new URL("https://waafasworld.com/visa"), "https://waafasworld.com/", HOST),
    ).toBeNull();
    expect(sourceOf(new URL("https://waafasworld.com/visa"), null, HOST)).toBeNull();
    expect(
      sourceOf(new URL("https://waafasworld.com/visa"), "https://m.facebook.com/groups/x", HOST),
    ).toEqual({ referrer: "m.facebook.com/groups/x", landing: "/visa" });
  });

  it("keeps the first referrer, lets a new campaign replace it, and is server-only", () => {
    const visit = new URL("https://waafasworld.com/");
    const empty = jar();
    rememberSource(visit, "https://www.google.com/", HOST, empty.cookies, empty.response, true);
    expect(empty.written[0]?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });

    const saved = jar(empty.written[0]?.value);
    rememberSource(visit, "https://bing.com/", HOST, saved.cookies, saved.response, true);
    expect(saved.written).toEqual([]);
    rememberSource(
      new URL("https://waafasworld.com/?utm_source=newsletter"),
      null,
      HOST,
      saved.cookies,
      saved.response,
      true,
    );
    expect(readSource(jar(saved.written[0]?.value).cookies)).toEqual({
      utm: { source: "newsletter" },
      landing: "/",
    });
  });

  it("ignores a cookie edited by hand and adds the source to an order once", () => {
    expect(readSource(jar('{"utm":{"x":"1"}}').cookies)).toBeNull();
    expect(readSource(jar("not json").cookies)).toBeNull();
    const source = { referrer: "www.google.com", landing: "/shop" };
    expect(withSource({ lines: [] }, source)).toEqual({
      lines: [],
      source: { channel: "web", referrer: "www.google.com", landing: "/shop" },
    });
    expect(withSource({ lines: [], source: { channel: "web" } }, source)).toEqual({
      lines: [],
      source: { channel: "web" },
    });
    expect(withSource({ lines: [] }, null)).toEqual({ lines: [] });
  });
});

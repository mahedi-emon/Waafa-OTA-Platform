import { describe, expect, it } from "vitest";
import { isSameOrigin, seeOther } from "./redirects";

const post = (headers: Record<string, string>) =>
  new Request("http://web:3000/api/account/sign-out", { method: "POST", headers });

describe("account form posts (issue 138)", () => {
  it("answers with a relative 303 that is never cached", () => {
    const response = seeOther("/login?deleted=1");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?deleted=1");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("accepts a post from the host it was sent to", () => {
    expect(isSameOrigin(post({ host: "waafasworld.com", origin: "https://waafasworld.com" }))).toBe(
      true,
    );
    expect(isSameOrigin(post({ host: "localhost", origin: "http://localhost" }))).toBe(true);
  });

  it("refuses another site, a null origin and a cross-site fetch", () => {
    expect(
      isSameOrigin(post({ host: "waafasworld.com", origin: "https://evil.example.com" })),
    ).toBe(false);
    expect(
      isSameOrigin(
        post({ host: "waafasworld.com", origin: "null", "sec-fetch-site": "cross-site" }),
      ),
    ).toBe(false);
    expect(isSameOrigin(post({ host: "waafasworld.com", "sec-fetch-site": "cross-site" }))).toBe(
      false,
    );
    expect(isSameOrigin(post({ host: "waafasworld.com", origin: "not a url" }))).toBe(false);
    expect(isSameOrigin(post({ host: "waafasworld.com", origin: "null" }))).toBe(false);
  });

  it("lets a post without browser headers through (the session cookie is still needed)", () => {
    expect(isSameOrigin(post({ host: "waafasworld.com" }))).toBe(true);
    expect(isSameOrigin(post({ host: "waafasworld.com", "sec-fetch-site": "same-origin" }))).toBe(
      true,
    );
  });
});

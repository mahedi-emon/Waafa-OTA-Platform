import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./securityHeaders";

describe("security headers (issue 102)", () => {
  it("locks down framing, plugins, base and form targets", () => {
    const csp = contentSecurityPolicy({ development: false, https: true });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("allows Turnstile and the analytics hosts, nothing else for scripts", () => {
    const csp = contentSecurityPolicy({ development: false, https: true });
    const scripts = csp.split("; ").find((part) => part.startsWith("script-src")) ?? "";
    expect(scripts.split(" ").slice(1)).toEqual([
      "'self'",
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://connect.facebook.net",
    ]);
  });

  it("keeps plain http working locally and dev tooling in development", () => {
    expect(contentSecurityPolicy({ development: false, https: false })).not.toContain(
      "upgrade-insecure-requests",
    );
    const dev = contentSecurityPolicy({ development: true, https: false });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("ws:");
  });

  it("lets only the site itself frame public pages (D0 R7 previews), and nobody frame the rest", () => {
    const publicPage = securityHeaders({ development: false, https: true, framing: "self" });
    const value = (key: string) => publicPage.find((header) => header.key === key)?.value ?? "";
    expect(value("Content-Security-Policy")).toContain("frame-ancestors 'self'");
    expect(value("X-Frame-Options")).toBe("SAMEORIGIN");
    const locked = securityHeaders({ development: false, https: true });
    expect(locked.find((header) => header.key === "X-Frame-Options")?.value).toBe("DENY");
  });

  it("lets only the admin show the site in a frame, and never be framed itself", () => {
    const admin = contentSecurityPolicy({ development: false, https: true, framesSite: true });
    const frames = admin.split("; ").find((part) => part.startsWith("frame-src")) ?? "";
    expect(frames.split(" ").slice(1)).toEqual([
      "'self'",
      "https://challenges.cloudflare.com",
      "https://www.googletagmanager.com",
    ]);
    expect(admin).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy({ development: false, https: true })).not.toContain(
      "frame-src 'self'",
    );
  });

  it("sends the standard hardening headers", () => {
    const keys = securityHeaders({ development: false, https: true }).map((header) => header.key);
    expect(keys).toEqual([
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Cross-Origin-Opener-Policy",
    ]);
  });
});

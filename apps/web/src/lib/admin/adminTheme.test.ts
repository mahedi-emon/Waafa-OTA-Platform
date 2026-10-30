import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { adminThemeCookie, parseAdminTheme } from "./adminTheme";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

describe("admin dark theme CSS", () => {
  it("is scoped to the attribute and never uses :has() (it slowed every public page, issue 257)", () => {
    expect(css).not.toMatch(/:root:has\(/);
    expect(css).toMatch(/\[data-admin-theme="dark"\]\s*\{\s*@apply admin-dark;/);
  });
});

describe("admin theme", () => {
  it("reads the saved choice and falls back to light", () => {
    expect(parseAdminTheme("dark")).toBe("dark");
    expect(parseAdminTheme("system")).toBe("system");
    expect(parseAdminTheme(undefined)).toBe("light");
    expect(parseAdminTheme("purple")).toBe("light");
  });

  it("remembers the choice for a year on the whole site path", () => {
    expect(adminThemeCookie("dark")).toBe(
      "waafa_admin_theme=dark; path=/; max-age=31536000; samesite=lax",
    );
  });
});

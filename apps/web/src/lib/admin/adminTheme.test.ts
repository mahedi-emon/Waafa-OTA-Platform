import { describe, expect, it } from "vitest";
import { adminThemeCookie, parseAdminTheme } from "./adminTheme";

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

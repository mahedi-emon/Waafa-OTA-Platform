import { describe, expect, it } from "vitest";
import { activeKey, navFor } from "./navigation";

describe("admin navigation by role", () => {
  it("shows a Content Editor content items but not orders or users", () => {
    const keys = navFor(["content-editor"]).flatMap((group) => group.items.map((item) => item.key));
    expect(keys).toContain("feedback");
    expect(keys).toContain("packages");
    expect(keys).not.toContain("orders");
    expect(keys).not.toContain("users");
    expect(keys).not.toContain("leads");
  });

  it("shows a Super Admin everything", () => {
    const keys = navFor(["super-admin"]).flatMap((group) => group.items.map((item) => item.key));
    expect(keys).toContain("users");
    expect(keys).toContain("orders");
  });

  it("marks the most specific item active", () => {
    const groups = navFor(["super-admin"]);
    expect(activeKey("/admin", "", groups)).toBe("dashboard");
    expect(activeKey("/admin/leads/abc", "", groups)).toBe("leads");
    expect(activeKey("/admin/leads", "?module=visa", groups)).toBe("visaLeads");
    expect(activeKey("/en/admin/content/products/x", "", groups)).toBe("products");
    expect(activeKey("/admin/content/faqs", "", groups)).toBe("allContent");
  });
});

import { describe, expect, it } from "vitest";
import { canEditContentKey, hasAnyRole, isManagerRole, leadModulesForRoles } from "./access";

describe("role access shared by the API and the admin", () => {
  it("gives managers every lead module and every content key", () => {
    expect(isManagerRole(["admin"])).toBe(true);
    expect(leadModulesForRoles(["super-admin"])).toHaveLength(10);
    expect(canEditContentKey(["admin"], "contactSettings")).toBe(true);
    expect(hasAnyRole(["admin"], "accounts")).toBe(true);
  });

  it("keeps each role to its own modules and content", () => {
    expect(leadModulesForRoles(["visa-officer"])).toEqual(["visa"]);
    expect(leadModulesForRoles(["content-editor"])).toEqual([]);
    expect(leadModulesForRoles(["travel-sales", "shop-manager"])).toEqual(
      expect.arrayContaining(["flights", "printing", "bulk"]),
    );
    expect(canEditContentKey(["travel-sales"], "tourPackages")).toBe(true);
    expect(canEditContentKey(["travel-sales"], "products")).toBe(false);
    expect(canEditContentKey(["shop-manager"], "shippingSettings")).toBe(true);
    expect(canEditContentKey(["shop-manager"], "contactSettings")).toBe(false);
    expect(canEditContentKey(["accounts"], "paymentSettings")).toBe(true);
    expect(canEditContentKey(["content-editor"], "announcements")).toBe(true);
    expect(hasAnyRole(["accounts"], "shop-manager")).toBe(false);
  });
});

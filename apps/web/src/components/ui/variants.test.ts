import { describe, expect, it } from "vitest";
import { badgeVariants } from "./badge";
import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("draws pills at the measured heights (Components board)", () => {
    expect(buttonVariants()).toContain("rounded-full");
    expect(buttonVariants({ size: "md" })).toContain("h-12");
    expect(buttonVariants({ size: "sm" })).toContain("h-[38px]");
    expect(buttonVariants({ size: "lg" })).toContain("h-14");
    expect(buttonVariants({ size: "icon" })).toContain("size-11");
  });

  it("defaults to the electric primary button", () => {
    expect(buttonVariants()).toContain("bg-primary");
  });

  it("animates press and hover with transform and opacity only", () => {
    const classes = buttonVariants({ variant: "secondary" });
    expect(classes).toContain("active:scale-[0.975]");
    expect(classes).toContain("before:transition-opacity");
    expect(classes).not.toMatch(/transition-(all|colors)\b/);
  });

  it("lets links drop the pill height", () => {
    expect(buttonVariants({ variant: "link" })).toContain("h-auto");
  });
});

describe("badgeVariants", () => {
  it("uses the navy premium badge and a solid discount badge", () => {
    expect(badgeVariants({ variant: "premium" })).toContain("bg-navy-900");
    expect(badgeVariants({ variant: "discount" })).toContain("bg-danger-600");
  });

  it("keeps every badge 24 px tall with a 6 px radius", () => {
    expect(badgeVariants()).toContain("h-6");
    expect(badgeVariants()).toContain("rounded-xs");
  });
});

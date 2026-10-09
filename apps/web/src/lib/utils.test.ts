import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("lets the later class win when two utilities conflict", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("bg-primary", false && "bg-muted", "bg-secondary")).toBe("bg-secondary");
  });

  it("treats WAAFA palette colours as colours, not sizes", () => {
    expect(cn("text-mist-600", "text-navy-900")).toBe("text-navy-900");
    expect(cn("text-sm text-mist-600", "text-navy-900")).toBe("text-sm text-navy-900");
  });

  it("drops falsy values", () => {
    expect(cn("rounded-md", undefined, null, "", "shadow-md")).toBe("rounded-md shadow-md");
  });
});

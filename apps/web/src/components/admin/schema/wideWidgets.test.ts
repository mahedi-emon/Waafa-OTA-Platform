import { describe, expect, it } from "vitest";
import type { ResolvedField } from "@/lib/admin/blueprints/types";
import { isWide } from "./wideWidgets";

const field = (widget: ResolvedField["widget"], extra: Partial<ResolvedField> = {}) =>
  ({ widget, label: "Field", ...extra }) as ResolvedField;

describe("isWide", () => {
  it("gives long texts and web addresses the full width, short texts half", () => {
    expect(isWide(field("text"), { type: "string", maxLength: 200 })).toBe(true);
    expect(isWide(field("text"), { type: "string", format: "uri" })).toBe(true);
    expect(isWide(field("text"), { type: "string", maxLength: 40 })).toBe(false);
    expect(isWide(field("text"), { type: "string" })).toBe(false);
  });

  it("keeps lists, long words and radio cards wide", () => {
    expect(isWide(field("repeater"))).toBe(true);
    expect(isWide(field("textarea"))).toBe(true);
    const two = [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ];
    expect(isWide(field("choice", { choices: two }))).toBe(false);
    expect(isWide(field("choice", { choices: [...two, { value: "c", label: "C" }] }))).toBe(true);
    expect(isWide(field("switch", { help: "Shown on the home page" }))).toBe(true);
    expect(isWide(field("number"))).toBe(false);
    expect(isWide(field("text", { wide: true }), { type: "string", maxLength: 10 })).toBe(true);
  });
});

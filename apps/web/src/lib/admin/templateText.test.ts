import { describe, expect, it } from "vitest";
import { fillTemplate, insertAt, templateVariables } from "./templateText";

describe("message templates", () => {
  it("read the details a template may carry, once each and only well-formed ones", () => {
    expect(
      templateVariables(["{{reference}}", "{{name}}", "{{reference}}", "name", "{{Bad}}"]),
    ).toEqual(["reference", "name"]);
    expect(templateVariables(undefined)).toEqual([]);
  });

  it("fill each detail for the preview and leave other words alone", () => {
    const sample = (name: string) =>
      ({ reference: "FLT-261025-0001", name: "Sample Customer" })[name] ?? name;
    expect(
      fillTemplate("Hi {{name}}, your request {{reference}} is in. {{missing}} {not}", sample),
    ).toBe("Hi Sample Customer, your request FLT-261025-0001 is in. missing {not}");
  });

  it("put a detail where the cursor is, replace a selection, and keep words apart", () => {
    expect(insertAt("Request received", "{{reference}}", 7, 7)).toEqual({
      text: "Request {{reference}} received",
      cursor: 21,
    });
    expect(insertAt("Hi there", "{{name}}", 3, 8)).toEqual({ text: "Hi {{name}}", cursor: 11 });
    expect(insertAt("", "{{name}}", 0, 0)).toEqual({ text: "{{name}}", cursor: 8 });
    // A cursor past the end (stale) lands at the end.
    expect(insertAt("Order", "{{order_number}}", 99, 99).text).toBe("Order {{order_number}}");
  });
});

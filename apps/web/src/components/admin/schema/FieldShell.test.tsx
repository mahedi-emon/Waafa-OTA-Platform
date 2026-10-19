import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/en.json";
import { FieldShell } from "./FieldShell";
import { SectionLabelContext, type SectionLabel } from "./useQuietLabel";

const render = (section: SectionLabel | null) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SectionLabelContext.Provider value={section}>
        <FieldShell id="field-zones" label="Delivery zones" group>
          <p>Dhaka, Outside Dhaka</p>
        </FieldShell>
      </SectionLabelContext.Provider>
    </NextIntlClientProvider>,
  );

describe("FieldShell", () => {
  it("shows a field's label above the control", () => {
    const markup = render(null);
    expect(markup).toMatch(
      /<span id="field-zones-label" class="text-\[14px\][^"]*">Delivery zones/,
    );
    expect(markup).not.toContain("sr-only");
  });

  it("keeps the label for screen readers only when it is the one field of a section with the same name", () => {
    const markup = render({ title: "Delivery zones", id: "field-zones" });
    expect(markup).toMatch(/<span id="field-zones-label" class="sr-only">Delivery zones/);
    expect(markup).toContain('role="group" aria-labelledby="field-zones-label"');
  });

  it("shows the label when the section has another name or the field is not its one field", () => {
    expect(render({ title: "Shipping", id: "field-zones" })).not.toContain("sr-only");
    expect(render({ title: "Delivery zones", id: "field-price" })).not.toContain("sr-only");
  });
});

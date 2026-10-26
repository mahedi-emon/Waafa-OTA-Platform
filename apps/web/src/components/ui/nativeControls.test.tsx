import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Switch } from "./switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

// Native controls behind the shadcn API (issue 236). Keyboard behaviour is covered by e2e/native-controls.spec.ts.

/** The input tag whose value attribute is `value` (attribute order is React's, so tests look inside the tag). */
const inputWith = (html: string, value: string) =>
  [...html.matchAll(/<input [^>]*>/g)]
    .map((m) => m[0])
    .find((tag) => tag.includes(`value="${value}"`)) ?? "";

describe("RadioGroup", () => {
  const markup = renderToStaticMarkup(
    <RadioGroup aria-labelledby="cabin" value="business">
      <label>
        <RadioGroupItem value="economy" />
        Economy
      </label>
      <label>
        <RadioGroupItem value="business" />
        Business
      </label>
    </RadioGroup>,
  );

  it("is a labelled radiogroup of native radios that share one name", () => {
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-labelledby="cabin"');
    const names = [...markup.matchAll(/type="radio"[^>]*name="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(1);
  });

  it("checks only the item that matches the value and marks its state", () => {
    const business = inputWith(markup, "business");
    expect(business).toContain('data-state="checked"');
    expect(business).toContain('checked=""');
    expect(inputWith(markup, "economy")).toContain('data-state="unchecked"');
    expect(markup.match(/ checked=""/g)).toHaveLength(1);
  });

  it("starts from defaultValue when uncontrolled and passes required and disabled down", () => {
    const html = renderToStaticMarkup(
      <RadioGroup defaultValue="b" name="pay" required disabled>
        <RadioGroupItem value="a" aria-label="A" />
        <RadioGroupItem value="b" aria-label="B" />
      </RadioGroup>,
    );
    const b = inputWith(html, "b");
    for (const attribute of ['name="pay"', 'checked=""', 'required=""', 'disabled=""'])
      expect(b).toContain(attribute);
    expect(inputWith(html, "a")).not.toContain('checked=""');
    expect(html).toContain('aria-required="true"');
  });
});

describe("Checkbox", () => {
  it("renders a native checkbox that reflects a controlled value", () => {
    const on = renderToStaticMarkup(<Checkbox id="consent" checked onCheckedChange={() => {}} />);
    expect(on).toMatch(/<input type="checkbox"[^>]*data-state="checked"[^>]*checked=""/);
    expect(on).toContain('id="consent"');
    const off = renderToStaticMarkup(<Checkbox checked={false} onCheckedChange={() => {}} />);
    expect(off).toContain('data-state="unchecked"');
    expect(off).not.toContain('checked=""');
  });

  it("marks the mixed state for a partly selected list", () => {
    const html = renderToStaticMarkup(
      <Checkbox checked="indeterminate" aria-label="Select all" onCheckedChange={() => {}} />,
    );
    expect(html).toContain('data-state="indeterminate"');
    expect(html).toContain("checkbox-tick");
  });

  it("works uncontrolled inside a plain form", () => {
    const html = renderToStaticMarkup(
      <Checkbox name="confirm" value="yes" required defaultChecked />,
    );
    for (const attribute of ['checked=""', 'name="confirm"', 'value="yes"', 'required=""'])
      expect(html).toContain(attribute);
    expect(html).not.toContain("data-state");
  });
});

describe("Switch", () => {
  it("is a native checkbox with the switch role", () => {
    const html = renderToStaticMarkup(
      <Switch checked aria-label="Refundable only" onCheckedChange={() => {}} />,
    );
    expect(html).toMatch(
      /<input type="checkbox" role="switch"[^>]*data-state="checked"[^>]*checked=""/,
    );
    expect(html).toContain('aria-label="Refundable only"');
  });
});

describe("Tabs", () => {
  const markup = renderToStaticMarkup(
    <Tabs defaultValue="tourist">
      <TabsList aria-label="Visa type">
        <TabsTrigger value="tourist">Tourist</TabsTrigger>
        <TabsTrigger value="business">Business</TabsTrigger>
      </TabsList>
      <TabsContent value="tourist">Tourist papers</TabsContent>
      <TabsContent value="business">Business papers</TabsContent>
    </Tabs>,
  );

  it("links every tab to its panel both ways", () => {
    const tab = /role="tab" id="([^"]+)" aria-selected="true" aria-controls="([^"]+)"/.exec(markup);
    expect(tab).not.toBeNull();
    const [, tabId, panelId] = tab!;
    expect(markup).toContain(`role="tabpanel" id="${panelId}" aria-labelledby="${tabId}"`);
    expect(markup.match(/role="tabpanel"/g)).toHaveLength(2);
  });

  it("gives the active tab the only tab stop and the active styles", () => {
    expect(markup).toMatch(
      /aria-selected="true"[^>]*tabindex="0"[^>]*data-state="active" data-active=""/,
    );
    expect(markup).toMatch(/aria-selected="false"[^>]*tabindex="-1"[^>]*data-state="inactive"/);
  });

  it("renders only the open panel's content; the others stay hidden and empty", () => {
    expect(markup).toContain("Tourist papers");
    expect(markup).not.toContain("Business papers");
    expect(markup).toMatch(/hidden=""[^>]*data-state="inactive"/);
  });
});

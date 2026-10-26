import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useSubmitOnce } from "./useSubmitOnce";

/** Renders the hook once and hands back its handle (the ref lives on in the closures). */
function handle() {
  let once: ReturnType<typeof useSubmitOnce> | undefined;
  function Probe() {
    once = useSubmitOnce();
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return once!;
}

describe("useSubmitOnce (issue 236)", () => {
  it("lets only the first of two quick taps through", () => {
    const once = handle();
    const first = once.start();
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(once.start()).toBeNull();
  });

  it("reuses the key for a retry after a failed attempt", () => {
    const once = handle();
    const first = once.start();
    once.finished();
    expect(once.start()).toBe(first);
  });

  it("takes a new key after a success", () => {
    const once = handle();
    const first = once.start();
    once.renew();
    once.finished();
    const next = once.start();
    expect(next).not.toBeNull();
    expect(next).not.toBe(first);
  });
});

import { describe, expect, it } from "vitest";
import { pickMessagePaths, pickMessages } from "./pickMessages";

describe("pickMessages", () => {
  const messages = { Common: { a: "A" }, Search: { b: "B" }, Footer: { c: "C" } };

  it("keeps only the requested namespaces", () => {
    expect(pickMessages(messages, ["Search"])).toEqual({ Search: { b: "B" } });
    expect(pickMessages(messages, ["Common", "Footer"])).toEqual({
      Common: { a: "A" },
      Footer: { c: "C" },
    });
  });

  it("ignores namespaces that do not exist", () => {
    expect(pickMessages(messages, ["Missing"])).toEqual({});
  });
});

describe("pickMessagePaths", () => {
  const messages = {
    Admin: {
      bell: { title: "Notifications" },
      nav: { leads: "Leads" },
      content: { keys: { faqs: "FAQs" }, title: "Content" },
      users: { title: "Users" },
    },
    Footer: { c: "C" },
  };

  it("keeps nested branches in place and nothing else", () => {
    expect(pickMessagePaths(messages, ["Admin.bell", "Admin.content.keys"])).toEqual({
      Admin: { bell: { title: "Notifications" }, content: { keys: { faqs: "FAQs" } } },
    });
  });

  it("merges siblings under the same parent and skips missing paths", () => {
    expect(
      pickMessagePaths(messages, ["Admin.nav", "Admin.bell", "Admin.missing", "Nope.x"]),
    ).toEqual({
      Admin: { nav: { leads: "Leads" }, bell: { title: "Notifications" } },
    });
  });
});

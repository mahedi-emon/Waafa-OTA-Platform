import { describe, expect, it } from "vitest";
import { auditTarget, nameOf, verbPath } from "./auditText";

const row = (
  action: string,
  entity: string,
  entityId: string,
  after: unknown = null,
  before: unknown = null,
) => ({
  action,
  entity,
  entityId,
  after,
  before,
});

describe("audit sentences", () => {
  it("name a content record by its title, a setting by its key and a list change as an order change", () => {
    expect(
      auditTarget(
        row("content.update", "tourPackages", "bali", { title: "Bali temples and beaches" }),
      ),
    ).toEqual({
      kind: "record",
      key: "tourPackages",
      name: "Bali temples and beaches",
    });
    expect(auditTarget(row("settings.update", "contactSettings", "contactSettings"))).toEqual({
      kind: "setting",
      key: "contactSettings",
    });
    expect(auditTarget(row("content.reorder", "faqs", "faqs"))).toEqual({
      kind: "list",
      key: "faqs",
    });
    // A deleted record keeps its name from before.
    expect(
      auditTarget(row("content.delete", "faqs", "q1", null, { question: "Can I pay later?" })),
    ).toMatchObject({
      name: "Can I pay later?",
    });
  });

  it("name leads, people and connections by what staff recognise, never a database id", () => {
    expect(
      auditTarget(
        row("lead.contact", "lead", "cmh0abcdefghijklmnopqrstu", { reference: "FLT-261025-0001" }),
      ),
    ).toEqual({
      kind: "lead",
      name: "FLT-261025-0001",
    });
    expect(auditTarget(row("lead.contact", "lead", "cmh0abcdefghijklmnopqrstu"))).toEqual({
      kind: "lead",
    });
    expect(auditTarget(row("staff.create", "staff", "rafi@example.com"))).toEqual({
      kind: "staff",
      name: "rafi@example.com",
    });
    expect(auditTarget(row("provider.reveal", "provider", "Sabre"))).toEqual({
      kind: "integration",
      name: "Sabre",
    });
    expect(auditTarget(row("seed.patch", "content", "2026-10-25-x", { changed: 2 }))).toEqual({
      kind: "update",
      changed: 2,
    });
    expect(auditTarget(row("backup.run", "setting", "x"))).toEqual({ kind: "other" });
  });

  it("shorten long names and pick the area's words when an action has none of its own", () => {
    expect(nameOf({ title: "x".repeat(90) })?.length).toBe(70);
    expect(nameOf(null, { name: "  Rafi  " })).toBe("Rafi");
    const known = new Set(["lead.convert", "lead.other", "other"]);
    expect(verbPath("lead.convert", (path) => known.has(path))).toBe("lead.convert");
    expect(verbPath("lead.askPayment", (path) => known.has(path))).toBe("lead.other");
    expect(verbPath("seed.patch", (path) => known.has(path))).toBe("other");
  });

  it("name a customer account by its email for the account controls (issue 241)", () => {
    const row = {
      action: "customer.attach",
      entity: "customer",
      entityId: "ckabcdefghijklmnopqrstuvw",
      before: { email: "rahim@example.com", record: "FLT-261027-0001", customerId: null },
      after: { email: "rahim@example.com", record: "FLT-261027-0001", customerId: "c1" },
    };
    expect(auditTarget(row)).toEqual({ kind: "customer", name: "rahim@example.com" });
    expect(auditTarget({ ...row, before: null, after: null })).toEqual({ kind: "customer" });
  });
});

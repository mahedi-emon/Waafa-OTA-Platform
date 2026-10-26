import { CONTENT_MODEL, isContentKey, type ContentKey } from "@waafa/shared";

/** What an audit row is about, in the terms a sentence needs (D0 R9). */
export type AuditTarget =
  | { kind: "record"; key: ContentKey; name?: string }
  | { kind: "setting"; key: ContentKey }
  | { kind: "list"; key: ContentKey }
  | {
      kind:
        | "lead"
        | "order"
        | "proof"
        | "staff"
        | "media"
        | "integration"
        | "feedback"
        | "subscriber"
        | "customer";
      name?: string;
    }
  | { kind: "update"; changed: number }
  | { kind: "other" };

type Row = { action: string; entity: string; entityId: string; before: unknown; after: unknown };

/** Fields that name a record, most telling first. */
const NAME_FIELDS = [
  "title",
  "name",
  "headline",
  "question",
  "heading",
  "label",
  "text",
  "reference",
  "code",
  "alt",
  "filename",
  "email",
] as const;

const MAX = 70;

/** A record's name from its saved data ("Bali temples and beaches"), shortened for one line. */
export function nameOf(...versions: unknown[]): string | undefined {
  for (const data of versions) {
    if (!data || typeof data !== "object") continue;
    const record = data as Record<string, unknown>;
    for (const field of NAME_FIELDS) {
      const value = record[field];
      if (typeof value === "string" && value.trim() !== "") {
        const text = value.trim();
        return text.length > MAX ? `${text.slice(0, MAX - 1)}…` : text;
      }
    }
  }
  return undefined;
}

const KINDS: Record<
  string,
  Exclude<AuditTarget["kind"], "record" | "setting" | "list" | "update" | "other">
> = {
  lead: "lead",
  order: "order",
  "payment-proof": "proof",
  staff: "staff",
  media: "media",
  integration: "integration",
  provider: "integration",
  feedback: "feedback",
  subscriber: "subscriber",
  customer: "customer",
};

/**
 * What a row changed: a content record (with its name), a whole setting, the order of a list, or a lead, order, proof,
 * person, file or connection (named by its reference, email or file name).
 */
export function auditTarget(row: Row): AuditTarget {
  const [area = ""] = row.action.split(".");
  if ((area === "content" || area === "trash" || area === "settings") && isContentKey(row.entity)) {
    const key = row.entity;
    if (row.action === "content.reorder") return { kind: "list", key };
    if (CONTENT_MODEL[key].kind === "singleton") return { kind: "setting", key };
    const name = nameOf(row.after, row.before);
    return name ? { kind: "record", key, name } : { kind: "record", key };
  }
  // A one-time site update that shipped with a deploy: how many records it changed.
  if (area === "seed") {
    const changed = (row.after as { changed?: unknown } | null)?.changed;
    return { kind: "update", changed: typeof changed === "number" ? changed : 0 };
  }
  const kind = KINDS[area];
  if (!kind) return { kind: "other" };
  const name =
    nameOf(row.after, row.before) ??
    (row.entityId && !/^c[a-z0-9]{20,}$/.test(row.entityId) ? row.entityId : undefined);
  return name ? { kind, name } : { kind };
}

/** The message under Admin.audit.verbs for an action, or the area's general one ("lead.contact" → lead.other). */
export function verbPath(action: string, known: (path: string) => boolean): string {
  const [area = "", step = ""] = action.split(".");
  const exact = `${area}.${step}`;
  if (known(exact)) return exact;
  if (known(`${area}.other`)) return `${area}.other`;
  return "other";
}

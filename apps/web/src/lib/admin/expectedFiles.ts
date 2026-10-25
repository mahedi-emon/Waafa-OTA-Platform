import type { ExpectedFile } from "@/components/admin/files/CustomerFiles";

/**
 * The files a stored form named (issue 232): visa documents and printing or trading attachments in a lead's payload,
 * a payment slip, a feedback photo. Anything that isn't a file reference is skipped.
 */
export function expectedFiles(...sources: unknown[]): ExpectedFile[] {
  const out: ExpectedFile[] = [];
  const add = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const file = value as Record<string, unknown>;
    if (typeof file.fileName !== "string") return;
    out.push({
      fileName: file.fileName,
      kind: typeof file.kind === "string" ? file.kind : "other",
      ...(typeof file.storageKey === "string" ? { storageKey: file.storageKey } : {}),
    });
  };
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const record = source as Record<string, unknown>;
    if ("fileName" in record) {
      add(record);
      continue;
    }
    for (const key of ["documents", "attachments"]) {
      if (Array.isArray(record[key])) (record[key] as unknown[]).forEach(add);
    }
    // An order's payment carries its slip as `proof`; feedback its `photo`.
    add(record.proof);
    add(record.photo);
  }
  return out;
}

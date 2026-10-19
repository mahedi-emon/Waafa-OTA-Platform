import type { FieldError } from "./validate";

/** Who saved last, sent with a stale-version conflict (409 "stale"). */
export type CurrentVersion = { version: number; updatedBy: string | null; updatedAt: string };

/** The parts of an API problem the editor reads. */
export type ProblemLike = {
  status: number;
  code?: string;
  fields?: Array<{ path: string; message: string }>;
  current?: CurrentVersion;
};

/** What the editor shows for a failed save, in plain words (Admin.editor.errors.<code>). */
export type ProblemView =
  | { kind: "fields"; errors: Map<string, FieldError> }
  | { kind: "stale"; current?: CurrentVersion }
  | { kind: "signedOut" }
  | {
      kind: "message";
      code: "forbidden" | "notFound" | "exists" | "liveLocked" | "server" | "offline";
    };

/**
 * Turns an API problem into what staff should read and do. Field errors from the API use the form's own wording when
 * the form already knows what's wrong with that field, else a plain "check it" sentence.
 */
export function viewOfProblem(
  problem: ProblemLike,
  known: ReadonlyMap<string, FieldError> = new Map(),
): ProblemView {
  if (problem.status === 0) return { kind: "message", code: "offline" };
  if (problem.status === 401) return { kind: "signedOut" };
  if (problem.status === 403) return { kind: "message", code: "forbidden" };
  if (problem.status === 404) return { kind: "message", code: "notFound" };
  if (problem.status === 409) {
    if (problem.code === "stale")
      return { kind: "stale", ...(problem.current ? { current: problem.current } : {}) };
    if (problem.code === "live-locked") return { kind: "message", code: "liveLocked" };
    return { kind: "message", code: "exists" };
  }
  if (problem.fields?.length) {
    const errors = new Map<string, FieldError>();
    for (const field of problem.fields)
      errors.set(field.path, known.get(field.path) ?? { code: "invalid" });
    return { kind: "fields", errors };
  }
  return { kind: "message", code: "server" };
}

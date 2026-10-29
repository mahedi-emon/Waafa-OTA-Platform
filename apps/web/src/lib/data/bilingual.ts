import "server-only";
import { locale as rootLocale } from "next/root-params";
import { withBangla } from "@waafa/shared";

/**
 * The page's language for the data layer (issue 255). Inside a cached accessor the locale becomes part of its cache
 * key; where root params cannot be read (route handlers, build-time helpers) the data stays English.
 */
async function pageLocale(): Promise<string> {
  try {
    return (await rootLocale()) ?? "en";
  } catch {
    return "en";
  }
}

/**
 * Wraps the repositories so every answer on a /bn page carries each record's Bangla text where staff wrote it, and
 * English everywhere else (FR-GLB-07). Nothing changes for English pages, and stored records are never changed.
 */
export function bilingual<T extends object>(target: T): T {
  return new Proxy(target, {
    get(object, key, receiver) {
      const value: unknown = Reflect.get(object, key, receiver);
      if (typeof value === "function") {
        return async (...args: unknown[]) => {
          const result: unknown = await (value as (...input: unknown[]) => unknown).apply(
            object,
            args,
          );
          return (await pageLocale()) === "bn" ? withBangla(result) : result;
        };
      }
      if (value && typeof value === "object") return bilingual(value);
      return value;
    },
  });
}

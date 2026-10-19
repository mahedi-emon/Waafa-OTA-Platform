import type { AbstractIntlMessages } from "next-intl";

/**
 * Picks top-level namespaces from the message catalogue for a scoped NextIntlClientProvider, so a client
 * component receives only the strings it renders (the root provider passes none).
 */
export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const namespace of namespaces) {
    const value = messages[namespace];
    if (value !== undefined) picked[namespace] = value;
  }
  return picked;
}

/**
 * Like pickMessages, for nested namespaces ("Admin.bell"): copies only those branches, keeping their place in the
 * tree, so `useTranslations("Admin.bell")` works in the client leaf without sending the whole Admin catalogue.
 */
export function pickMessagePaths(
  messages: AbstractIntlMessages,
  paths: readonly string[],
): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const path of paths) {
    const keys = path.split(".");
    let source: AbstractIntlMessages | string | undefined = messages;
    for (const key of keys) source = typeof source === "object" ? source[key] : undefined;
    if (source === undefined) continue;
    const value = source;
    const leaf = keys.at(-1);
    if (leaf === undefined) continue;
    let target = picked;
    for (const key of keys.slice(0, -1)) {
      const next = target[key];
      if (typeof next === "object") target = next;
      else {
        const branch: AbstractIntlMessages = {};
        target[key] = branch;
        target = branch;
      }
    }
    target[leaf] = value;
  }
  return picked;
}

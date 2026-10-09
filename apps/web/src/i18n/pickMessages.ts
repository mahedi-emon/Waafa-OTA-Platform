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

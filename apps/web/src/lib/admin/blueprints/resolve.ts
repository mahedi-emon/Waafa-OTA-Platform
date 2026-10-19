import "server-only";
import { getTranslations } from "next-intl/server";
import type { ContentKey } from "@waafa/shared";
import { editorSchema } from "../editorSchema";
import type { JsonSchema } from "../schema";
import { buildResolvedBlueprint } from "./build";
import type { ResolvedBlueprint } from "./types";

type LooseTranslator = ((key: string) => string) & { has: (key: string) => boolean };

/** The schema and the resolved blueprint the editor of one content key needs, words in the request's locale. */
export async function resolveBlueprint(
  key: ContentKey,
): Promise<{ schema: JsonSchema; blueprint: ResolvedBlueprint }> {
  // Blueprint words are looked up by computed keys, so the translator is used untyped here.
  const t = (await getTranslations("Admin")) as unknown as LooseTranslator;
  const schema = editorSchema(key);
  return {
    schema,
    blueprint: buildResolvedBlueprint(key, schema, (path) => (t.has(path) ? t(path) : undefined)),
  };
}

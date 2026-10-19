import { z } from "zod";
import { CONTENT_MODEL, type ContentKey } from "@waafa/shared";
import type { JsonSchema } from "./schema";

/** The JSON Schema the editor draws for a content key (input side, so defaults stay optional). */
export function editorSchema(key: ContentKey): JsonSchema {
  const { $schema: _schema, ...schema } = z.toJSONSchema(CONTENT_MODEL[key].schema, {
    io: "input",
    unrepresentable: "any",
  }) as JsonSchema & { $schema?: string };
  return schema;
}

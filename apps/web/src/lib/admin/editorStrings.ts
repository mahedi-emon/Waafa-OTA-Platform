import "server-only";
import { getTranslations } from "next-intl/server";
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

/** Every label the generic editor shows, from messages. */
export async function getEditorStrings() {
  const [t, tc] = await Promise.all([
    getTranslations("Admin.content"),
    getTranslations("Admin.common"),
  ]);
  return {
    addItem: t("addItem"),
    removeItem: t("removeItem"),
    itemUp: t("itemUp"),
    itemDown: t("itemDown"),
    optional: t("optional"),
    unset: t("unset"),
    setValue: t("setValue"),
    clear: t("clear"),
    choose: t("choose"),
    variant: t("variant"),
    emptyList: t("emptyList"),
    jsonInvalid: t("jsonInvalid"),
    yes: tc("yes"),
    no: tc("no"),
    fieldsTab: t("fieldsTab"),
    jsonTab: t("jsonTab"),
    jsonHint: t("jsonHint"),
    save: tc("save"),
    saved: tc("saved"),
    failed: tc("failed"),
    conflict: tc("conflict"),
    forbidden: tc("forbidden"),
    unsaved: t("unsaved"),
    richText: {
      toolbar: t("richText.toolbar"),
      paragraph: t("richText.paragraph"),
      heading3: t("richText.heading3"),
      bold: t("richText.bold"),
      italic: t("richText.italic"),
      bulletList: t("richText.bulletList"),
      orderedList: t("richText.orderedList"),
      quote: t("richText.quote"),
      link: t("richText.link"),
      unlink: t("richText.unlink"),
      linkPrompt: t("richText.linkPrompt"),
      undo: t("richText.undo"),
      redo: t("richText.redo"),
    },
  };
}

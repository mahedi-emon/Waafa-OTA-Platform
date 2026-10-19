import "server-only";
import { getTranslations } from "next-intl/server";

export { editorSchema } from "./editorSchema";

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

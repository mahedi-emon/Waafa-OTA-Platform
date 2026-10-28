import "server-only";
import { getTranslations } from "next-intl/server";

/** The quote editor's words (issue 298), for a new quote ("create") or changes to one ("save"). */
export async function editorLabels(submit: "create" | "save") {
  const t = await getTranslations("Admin.quotes.editor");
  return {
    title: t("title"),
    lead: t("lead"),
    // "{number}" stays for the editor to fill in per option.
    option: t("option", { number: "{number}" }),
    optionTitle: t("optionTitle"),
    optionTitleHint: t("optionTitleHint"),
    details: t("details"),
    detailsHint: t("detailsHint"),
    baggage: t("baggage"),
    baggageHint: t("baggageHint"),
    price: t("price"),
    addOption: t("addOption"),
    removeOption: t("removeOption", { number: "{number}" }),
    validUntil: t("validUntil"),
    validUntilHint: t("validUntilHint"),
    notes: t("notes"),
    notesHint: t("notesHint"),
    submit: t(submit),
    saved: t("saved"),
    failed: t("failed"),
  };
}

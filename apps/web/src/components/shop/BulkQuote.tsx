import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/pickMessages";
import { getContactSettings, getLeadFormSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { BulkQuoteDialog } from "./BulkQuoteDialog";

type BulkQuoteProps = {
  trigger: ReactNode;
  /** On a product page: its title prefills the list and its slug travels with the lead. */
  product?: { title: string; slug: string };
};

/** Server wrapper for the corporate quote dialog: contact settings, lead form rules and the strings it needs. */
async function BulkQuote({ trigger, product }: BulkQuoteProps) {
  const [contact, leadForm, messages, t] = await Promise.all([
    getContactSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("Shop.bulk"),
  ]);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));

  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["Leads"])}>
      <BulkQuoteDialog
        trigger={trigger}
        {...(product
          ? {
              productSlug: product.slug,
              initialItems: t("itemsForProduct", { title: product.title }),
            }
          : {})}
        countries={countries}
        emailRequired={leadForm.emailRequired}
        consentText={leadForm.consentText}
        phoneDisplay={contact.phoneDisplay}
        whatsappE164={contact.whatsappE164}
        labels={{
          kicker: t("kicker"),
          title: t("title"),
          lead: t("lead"),
          step: t("step"),
          stepTitle: t("stepTitle"),
          company: t("company"),
          items: t("items"),
          itemsPlaceholder: t("itemsPlaceholder"),
          notes: t("notes"),
          submit: t("submit"),
          contactTitle: t("contactTitle"),
          emailHint: t("emailHint"),
          errors: {
            companyRequired: t("errors.companyRequired"),
            itemsRequired: t("errors.itemsRequired"),
          },
          success: {
            title: t("success.title"),
            lead: t("success.lead"),
            steps: [
              { title: t("success.step1Title"), body: t("success.step1Body") },
              { title: t("success.step2Title"), body: t("success.step2Body") },
              { title: t("success.step3Title"), body: t("success.step3Body") },
            ],
            whatsappMessage: t("success.whatsappMessage", { reference: "{reference}" }),
            again: t("success.again"),
          },
        }}
      />
    </NextIntlClientProvider>
  );
}

export { BulkQuote };

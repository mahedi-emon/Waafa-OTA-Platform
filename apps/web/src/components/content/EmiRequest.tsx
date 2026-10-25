import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CalendarClock } from "lucide-react";
import { formatTaka } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { pickMessages } from "@/i18n/pickMessages";
import { getContactSettings, getLeadFormSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { EmiRequestDialog } from "./EmiRequestDialog";

type EmiRequestProps = {
  minimum: number;
  tenures: number[];
  banks: Array<{ id: string; name: string }>;
};

/**
 * "Request an EMI plan" on /emi (PRD §11 EMI, issue 233): a short card with the button that opens the two-step request.
 * Contact settings, lead form rules and the words come from the server; the form loads when the dialog opens.
 */
async function EmiRequest({ minimum, tenures, banks }: EmiRequestProps) {
  const [contact, leadForm, messages, t] = await Promise.all([
    getContactSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("Emi.request"),
  ]);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));

  return (
    <section
      aria-labelledby="emi-request"
      className="flex flex-col gap-3 rounded-[24px] border border-mist-200 bg-white p-6"
    >
      <h2 id="emi-request" className="font-display text-[20px] font-extrabold text-navy-900">
        {t("cardTitle")}
      </h2>
      <p className="text-[14.5px] text-mist-700">{t("cardLead")}</p>
      <NextIntlClientProvider messages={pickMessages(messages, ["Leads"])}>
        <EmiRequestDialog
          trigger={
            <Button size="lg" className="self-start">
              <CalendarClock aria-hidden="true" />
              {t("open")}
            </Button>
          }
          minimum={minimum}
          tenures={tenures}
          banks={banks}
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
            amount: t("amount"),
            amountHint: t("amountHint", { minimum: formatTaka(minimum) }),
            months: t("months"),
            monthsOption: t("monthsOption", { months: "{months}" }),
            bank: t("bank"),
            bankUnsure: t("bankUnsure"),
            notes: t("notes"),
            notesPlaceholder: t("notesPlaceholder"),
            submit: t("submit"),
            contactTitle: t("contactTitle"),
            emailHint: t("emailHint"),
            errors: {
              amountRequired: t("errors.amountRequired"),
              amountBelowMinimum: t("errors.amountBelowMinimum", { minimum: formatTaka(minimum) }),
              monthsRequired: t("errors.monthsRequired"),
              bankRequired: t("errors.bankRequired"),
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
    </section>
  );
}

export { EmiRequest };

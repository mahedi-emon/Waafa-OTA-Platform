import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { PrintingRequest } from "@/components/services/PrintingRequest";
import { ServicePageView } from "@/components/services/ServicePageView";
import { pickMessages } from "@/i18n/pickMessages";
import { getServicePage } from "@/lib/data/content";
import { getContactSettings, getLeadFormSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getServicePage("printing");
  if (!page) return {};
  return { title: page.seo.title ?? page.title, description: page.seo.description ?? page.lead };
}

/** /shop/printing-solutions (Printing, Printing-done, Printing-m): service page with its request form. */
export default async function PrintingPage() {
  const [page, contact, leadForm, messages] = await Promise.all([
    getServicePage("printing"),
    getContactSettings(),
    getLeadFormSettings(),
    getMessages(),
  ]);
  if (!page) notFound();
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));

  return (
    <ServicePageView
      page={page}
      path="/shop/printing-solutions"
      form={
        <NextIntlClientProvider messages={pickMessages(messages, ["Services", "Leads"])}>
          <PrintingRequest
            title={page.formTitle}
            lead={page.formLead}
            countries={countries}
            emailRequired={leadForm.emailRequired}
            consentText={leadForm.consentText}
            phoneDisplay={contact.phoneDisplay}
            whatsappE164={contact.whatsappE164}
          />
        </NextIntlClientProvider>
      }
    />
  );
}

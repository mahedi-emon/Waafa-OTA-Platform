import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { DHAKA_TIME_ZONE } from "@waafa/shared";
import { routing } from "./routing";

/**
 * With one locale the answer is known without reading the URL, so shared layouts stay part of the static App Shell
 * (Partial Prefetching flags any URL read outside <Suspense>). When Bangla joins (P1) the root param is read again.
 */
async function requestedLocale(override: string | undefined): Promise<string | undefined> {
  if (override) return override;
  if (routing.locales.length === 1) return routing.defaultLocale;
  return rootLocale();
}

export default getRequestConfig(async ({ locale: override }) => {
  const requested = await requestedLocale(override);
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: DHAKA_TIME_ZONE,
  };
});

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { DHAKA_TIME_ZONE } from "@waafa/shared";
import { routing } from "./routing";

/**
 * The locale root param (/bn/…); next-intl passes it as the override where it already knows it. Server Actions and
 * route handlers have no root params (Next throws there), so they get English (issue 322).
 */
async function requestedLocale(override: string | undefined): Promise<string | undefined> {
  if (override) return override;
  try {
    return await rootLocale();
  } catch {
    return undefined;
  }
}

export default getRequestConfig(async ({ locale: override }) => {
  const requested = await requestedLocale(override);
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const english = (await import("../../messages/en.json")).default;
  // Bangla has every public namespace; the admin (English only) and llms.txt come from English (issue 254).
  const messages =
    locale === "en"
      ? english
      : { ...english, ...(await import(`../../messages/${locale}.json`)).default };

  return { locale, messages, timeZone: DHAKA_TIME_ZONE };
});

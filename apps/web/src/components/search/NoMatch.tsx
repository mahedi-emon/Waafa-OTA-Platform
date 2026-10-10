"use client";

import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { whatsappLink } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { useSearchCard } from "./SearchCardContext";

type NoMatchProps = { query: string };

/** Empty state for every picker list: say what failed and offer the travel expert on WhatsApp. */
function NoMatch({ query }: NoMatchProps) {
  const t = useTranslations("Search.noMatch");
  const { data } = useSearchCard();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-mist-100 text-mist-600">
        <SearchX aria-hidden="true" className="size-5" />
      </span>
      <p className="font-display text-[17px] font-bold text-navy-900">{t("title", { query })}</p>
      <p className="max-w-[34ch] text-[14px] leading-relaxed text-mist-600">{t("body")}</p>
      <Button asChild variant="whatsapp" size="sm">
        <a
          href={whatsappLink(data.whatsappE164, t("whatsappMessage", { query }))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          {t("whatsapp")}
        </a>
      </Button>
    </div>
  );
}

export { NoMatch };

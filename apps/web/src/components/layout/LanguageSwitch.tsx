"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { WithPathname } from "./WithPathname";

type LanguageSwitchProps = {
  /** "বাংলা" on English pages, "English" on Bangla pages: each language named in its own script. */
  labels: { en: string; bn: string; switchTo: string };
  className?: string;
  /** The compact header button shows the icon and the other language's name. */
  variant?: "header" | "inline";
};

/**
 * English ⇄ Bangla (issue 254): a link to the same page in the other language. The shell renders a link to the other
 * language's home; the current path is filled in right after hydration (shared layouts stay static).
 */
function LanguageSwitch({ labels, className, variant = "inline" }: LanguageSwitchProps) {
  const locale = useLocale();
  const other = locale === "bn" ? "en" : "bn";
  const name = other === "bn" ? labels.bn : labels.en;
  return (
    <WithPathname>
      {(pathname) => (
        <Link
          href={pathname ?? "/"}
          locale={other}
          hrefLang={other}
          lang={other}
          aria-label={`${labels.switchTo}: ${name}`}
          prefetch={false}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40",
            variant === "header"
              ? "min-w-11 px-3 text-[14px] text-navy-900 hover:bg-mist-100"
              : "px-3 text-[14px] text-mist-700 underline-offset-4 hover:text-navy-900 hover:underline",
            className,
          )}
        >
          <Languages aria-hidden="true" className="size-[18px]" />
          <span>{name}</span>
        </Link>
      )}
    </WithPathname>
  );
}

export { LanguageSwitch };

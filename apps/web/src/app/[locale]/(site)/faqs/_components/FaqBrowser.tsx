"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { cn } from "cn";
import { whatsappLink, type FaqCategory } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  link?: { label: string; href: string };
};

type FaqBrowserProps = {
  faqs: FaqItem[];
  categories: Array<{ key: FaqCategory; label: string }>;
  whatsappE164: string;
  labels: {
    search: string;
    searchPlaceholder: string;
    clearSearch: string;
    categoriesLabel: string;
    all: string;
    /** "{count}" is replaced. */
    results: string;
    /** "{query}" is replaced. */
    noResultTitle: string;
    noResultBody: string;
    ask: string;
    /** "{query}" is replaced. */
    askMessage: string;
  };
};

const normalise = (value: string) => value.toLowerCase().normalize("NFKD");

/**
 * FAQs (Faqs, Faqs-search): instant search over questions and answers, topic chips with counts, and an accordion. A
 * search with no match offers WhatsApp with the question prefilled.
 */
function FaqBrowser({ faqs, categories, whatsappE164, labels }: FaqBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory | "all">("all");
  const deferred = useDeferredValue(query);

  const matching = useMemo(() => {
    const words = normalise(deferred).split(/\s+/).filter(Boolean);
    if (words.length === 0) return faqs;
    return faqs.filter((faq) => {
      const text = normalise(`${faq.question} ${faq.answer}`);
      return words.every((word) => text.includes(word));
    });
  }, [faqs, deferred]);

  const counts = useMemo(() => {
    const map = new Map<FaqCategory, number>();
    for (const faq of matching) map.set(faq.category, (map.get(faq.category) ?? 0) + 1);
    return map;
  }, [matching]);

  const shown = category === "all" ? matching : matching.filter((faq) => faq.category === category);
  const chips = categories.filter(
    (item) => (counts.get(item.key) ?? 0) > 0 || item.key === category,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="relative max-w-2xl">
        <label htmlFor="faq-search" className="sr-only">
          {labels.search}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-mist-500"
        />
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          autoComplete="off"
          className="h-14 w-full rounded-full border border-mist-300 bg-white pr-12 pl-12 text-base text-ink-900 shadow-xs outline-none placeholder:text-mist-500 focus-visible:border-electric-600 focus-visible:ring-4 focus-visible:ring-ring/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={labels.clearSearch}
            className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-mist-600 hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <div role="group" aria-label={labels.categoriesLabel} className="flex flex-wrap gap-2">
        {[{ key: "all" as const, label: labels.all }, ...chips].map((item) => {
          const count = item.key === "all" ? matching.length : (counts.get(item.key) ?? 0);
          const active = category === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(item.key)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                active
                  ? "border-electric-600 bg-electric-50 text-navy-900"
                  : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
              )}
            >
              {item.label}
              <span className="text-[12.5px] text-mist-600 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="text-[13.5px] text-mist-600">
        {labels.results.replace("{count}", String(shown.length))}
      </p>

      {shown.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          className="max-w-3xl rounded-2xl border border-mist-200 bg-white px-5"
        >
          {shown.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2.5">
                  {faq.answer.split(/\n\s*\n/).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {faq.link ? (
                    <Link
                      href={faq.link.href}
                      className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700 hover:underline"
                    >
                      {faq.link.label}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-dashed border-mist-300 bg-white p-6">
          <h2 className="font-display text-[19px] font-bold text-navy-900">
            {labels.noResultTitle.replace("{query}", deferred.trim())}
          </h2>
          <p className="text-[14.5px] text-mist-700">{labels.noResultBody}</p>
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(
                whatsappE164,
                labels.askMessage.replace("{query}", deferred.trim()),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {labels.ask}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

export { FaqBrowser };

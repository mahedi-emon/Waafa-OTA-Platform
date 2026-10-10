"use client";

import { useId, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "cn";
import { useRouter } from "@/i18n/navigation";

export type SearchEntry = {
  kind: "product" | "category" | "brand";
  label: string;
  sub?: string;
  href: string;
};

type ShopSearchBoxProps = {
  entries: SearchEntry[];
  initialQuery?: string;
  labels: {
    search: string;
    button: string;
    groups: Record<SearchEntry["kind"], string>;
    noSuggestions: string;
  };
};

const MAX_PER_GROUP = 4;

/**
 * Store search with suggestions (Shop-suggest): products, categories and brands that contain every typed word.
 * Arrow keys move through suggestions, Enter opens one, or searches everything when none is chosen.
 */
function ShopSearchBox({ entries, initialQuery = "", labels }: ShopSearchBoxProps) {
  const id = useId();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches =
    words.length === 0 || query.trim().length < 2
      ? []
      : (["product", "category", "brand"] as const).flatMap((kind) =>
          entries
            .filter((entry) => entry.kind === kind)
            .filter((entry) => {
              const haystack = `${entry.label} ${entry.sub ?? ""}`.toLowerCase();
              return words.every((word) => haystack.includes(word));
            })
            .slice(0, MAX_PER_GROUP),
        );
  const expanded = open && query.trim().length >= 2;

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <form
      role="search"
      action="/shop/search"
      method="get"
      className="relative w-full"
      onSubmit={(event) => {
        event.preventDefault();
        const chosen = matches[active];
        if (chosen) return go(chosen.href);
        if (query.trim()) go(`/shop/search?q=${encodeURIComponent(query.trim())}`);
      }}
    >
      <label htmlFor={`${id}-input`} className="sr-only">
        {labels.search}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-500"
      />
      <input
        id={`${id}-input`}
        name="q"
        type="search"
        role="combobox"
        autoComplete="off"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
        placeholder={labels.search}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, matches.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, -1));
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-12 w-full rounded-full border border-mist-300 bg-white pr-24 pl-11 text-base text-ink-900 outline-none focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/20"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 h-10 cursor-pointer rounded-full bg-primary px-4 text-[14px] font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {labels.button}
      </button>
      <div
        id={`${id}-list`}
        role="listbox"
        aria-label={labels.search}
        hidden={!expanded}
        className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-mist-200 bg-white p-2 shadow-lg"
      >
        {matches.length === 0 ? (
          <p className="px-3 py-2.5 text-[14px] text-mist-600">{labels.noSuggestions}</p>
        ) : (
          matches.map((entry, index) => {
            const first = index === 0 || matches[index - 1]?.kind !== entry.kind;
            return (
              <div key={`${entry.kind}-${entry.href}`}>
                {first ? (
                  <p
                    aria-hidden="true"
                    className="px-3 pt-2 pb-1 text-[11.5px] font-bold tracking-[0.12em] text-mist-500 uppercase"
                  >
                    {labels.groups[entry.kind]}
                  </p>
                ) : null}
                <div
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(entry.href)}
                  className={cn(
                    "flex min-h-11 cursor-pointer flex-col justify-center rounded-xl px-3 py-1.5",
                    index === active ? "bg-electric-50" : "hover:bg-mist-50",
                  )}
                >
                  <span className="text-[14.5px] font-medium text-ink-900">{entry.label}</span>
                  {entry.sub ? (
                    <span className="text-[12.5px] text-mist-600">{entry.sub}</span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </form>
  );
}

export { ShopSearchBox };

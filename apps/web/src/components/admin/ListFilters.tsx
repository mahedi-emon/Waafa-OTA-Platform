"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePathname, useRouter } from "@/i18n/navigation";

type FilterSelect = {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
};

type ListFiltersProps = {
  /** Current query (kept when filters change; `page` is dropped). */
  query: Record<string, string | undefined>;
  search?: { name: string; label: string; placeholder: string; value: string };
  selects?: FilterSelect[];
  strings: { apply: string; reset: string };
};

/**
 * Filters for admin lists, kept in the URL so views can be shared and reloaded: a search box and native selects (a
 * phone's own picker), applied on change or Enter.
 */
function ListFilters({ query, search, selects = [], strings }: ListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(search?.value ?? "");

  function go(changes: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...query, ...changes })) {
      if (value && key !== "page") params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (search) go({ [search.name]: text.trim() });
  }

  const active = Object.entries(query).some(
    ([key, value]) => key !== "view" && key !== "page" && Boolean(value),
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      {search ? (
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:min-w-[260px]">
          <Label htmlFor={`filter-${search.name}`} className="sr-only">
            {search.label}
          </Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-500"
            />
            <Input
              id={`filter-${search.name}`}
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={search.placeholder}
              className="pl-10"
            />
          </div>
        </div>
      ) : null}
      {selects.map((select) => (
        <div key={select.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`filter-${select.name}`} className="text-[12.5px] text-mist-600">
            {select.label}
          </Label>
          <select
            id={`filter-${select.name}`}
            value={select.value}
            onChange={(event) => go({ [select.name]: event.target.value })}
            className="h-12 min-w-[170px] cursor-pointer rounded-xl border border-mist-300 bg-white px-3 text-[15px] text-ink-900 focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex gap-2">
        {search ? (
          <Button type="submit" variant="navy" size="md">
            {strings.apply}
          </Button>
        ) : null}
        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => router.push(query.view ? `${pathname}?view=${query.view}` : pathname)}
          >
            {strings.reset}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { ListFilters };

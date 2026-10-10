"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useRouter } from "@/i18n/navigation";
import type { AdminNavGroup } from "@/lib/admin/navigation";
import { AdminNavIcon } from "./AdminNavIcon";

type AdminCommandProps = {
  groups: AdminNavGroup[];
  labels: Record<string, string>;
  strings: {
    search: string;
    searchShort: string;
    title: string;
    empty: string;
    pages: string;
    find: string;
    openReference: string;
    referenceHint: string;
  };
};

const REFERENCE = /^[a-z]{3}-\d{6}-\d{4}$/i;

/**
 * The command palette (AdminCmd board): Ctrl K or Cmd K anywhere in Admin, every page this person can open, and a
 * reference such as FLT-261011-0001 or ORD-261011-0003 jumps to that lead or order.
 */
function AdminCommand({ groups, labels, strings }: AdminCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const reference = query.trim().toUpperCase();
  const isReference = REFERENCE.test(reference);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full max-w-md cursor-pointer items-center gap-2.5 rounded-full border border-mist-200 bg-mist-50 px-4 text-left text-[14.5px] text-mist-600 transition-colors duration-150 hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden truncate sm:inline">{strings.search}</span>
        <span className="truncate sm:hidden">{strings.searchShort}</span>
        <span className="ml-auto hidden items-center gap-1 md:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={strings.title}
        description={strings.search}
      >
        <CommandInput placeholder={strings.search} value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{isReference ? null : strings.empty}</CommandEmpty>
          {isReference ? (
            <CommandGroup heading={strings.find}>
              <CommandItem
                value={`reference ${reference}`}
                onSelect={() =>
                  go(
                    reference.startsWith("ORD-")
                      ? `/admin/orders?q=${encodeURIComponent(reference)}`
                      : `/admin/leads?q=${encodeURIComponent(reference)}`,
                  )
                }
              >
                <Search aria-hidden="true" />
                {strings.openReference} {reference}
              </CommandItem>
            </CommandGroup>
          ) : null}
          <CommandGroup heading={strings.pages}>
            {groups.flatMap((group) =>
              group.items.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${labels[item.label] ?? item.label} ${labels[group.label] ?? ""}`}
                  onSelect={() => go(item.href)}
                >
                  <AdminNavIcon name={item.icon} className="size-4" />
                  {labels[item.label] ?? item.label}
                </CommandItem>
              )),
            )}
          </CommandGroup>
          {!isReference ? (
            <p className="px-4 pt-1 pb-3 text-[12.5px] text-mist-500">{strings.referenceHint}</p>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export { AdminCommand };

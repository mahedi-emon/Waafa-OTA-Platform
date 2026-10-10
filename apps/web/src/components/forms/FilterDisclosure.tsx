"use client";

import { useId, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

type FilterDisclosureProps = { label: string; count: number; children: ReactNode };

/** Filters: always shown in the desktop rail; behind one button on phones and tablets (Packages-m-filters, ShopList-m-filters). */
function FilterDisclosure({ label, count, children }: FilterDisclosureProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" />
        {label}
        {count > 0 ? (
          <span className="rounded-full bg-navy-900 px-1.5 text-[12px] text-white tabular-nums">
            {count}
          </span>
        ) : null}
      </Button>
      <div id={id} className={cn("mt-4 lg:mt-0 lg:block", open ? "block" : "hidden")}>
        {children}
      </div>
    </div>
  );
}

export { FilterDisclosure };

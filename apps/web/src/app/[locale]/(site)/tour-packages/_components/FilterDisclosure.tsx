"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

type FilterDisclosureProps = { label: string; count: number; children: ReactNode };

/** Filters: always shown in the desktop rail; behind one button on phones and tablets (Packages-m-filters). */
function FilterDisclosure({ label, count, children }: FilterDisclosureProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        aria-expanded={open}
        aria-controls="package-filters"
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
      <div id="package-filters" className={cn("mt-4 lg:mt-0 lg:block", open ? "block" : "hidden")}>
        {children}
      </div>
    </div>
  );
}

export { FilterDisclosure };

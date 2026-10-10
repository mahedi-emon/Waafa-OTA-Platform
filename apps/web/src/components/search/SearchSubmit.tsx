"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useSearchCard } from "./SearchCardContext";

type SearchSubmitProps = { pending: boolean; className?: string };

/**
 * The card's one primary action (56 px on phones, 64 px in the desktop row). On desktop pointers a sheen crosses it
 * every 4.6 s, never while pressed and never under reduced motion.
 */
function SearchSubmit({ pending, className }: SearchSubmitProps) {
  const t = useTranslations("Search.submit");
  const { state } = useSearchCard();

  return (
    <Button
      type="submit"
      size="lg"
      loading={pending}
      className={cn(
        "h-14 w-full overflow-hidden px-7 text-[16px] xl:h-16 xl:w-auto xl:shrink-0",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-[inherit] group-active/button:opacity-0 motion-reduce:hidden! pointer-fine:lg:block"
      >
        <span className="absolute inset-y-0 left-0 w-1/3 animate-sheen bg-linear-to-r from-transparent via-white/30 to-transparent" />
      </span>
      <Search aria-hidden="true" />
      {t(state.tab)}
    </Button>
  );
}

export { SearchSubmit };

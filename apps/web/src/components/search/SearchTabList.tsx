"use client";

import { BedDouble, Map, Plane, Stamp, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SearchTab } from "@/lib/search/searchState";

const TABS: Array<{ value: SearchTab; icon: LucideIcon }> = [
  { value: "flight", icon: Plane },
  { value: "hotel", icon: BedDouble },
  { value: "tour", icon: Map },
  { value: "visa", icon: Stamp },
];

type SearchTabListProps = { active: SearchTab };

/**
 * Flight / Hotel / Tour / Visa with a white pill that slides to the active tab on the spring.tab curve (CSS
 * transform, so no layout animation bundle is needed). Icons sit above the labels on phones.
 */
function SearchTabList({ active }: SearchTabListProps) {
  const t = useTranslations("Search");
  const index = TABS.findIndex((tab) => tab.value === active);

  return (
    <TabsList
      aria-label={t("tabsLabel")}
      className="relative grid h-[60px] w-full grid-cols-4 gap-0 overflow-visible rounded-[18px] p-1 sm:h-12 sm:w-auto sm:min-w-[440px] sm:rounded-full"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc((100%-8px)/4)] rounded-[14px] bg-white shadow-sm transition-transform duration-350 ease-spring sm:rounded-full"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {TABS.map(({ value, icon: Icon }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="relative z-10 flex-col gap-0.5 rounded-[14px]! px-1! text-[13px] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none sm:flex-row sm:gap-1.5 sm:rounded-full! sm:px-3! sm:text-[14.5px] data-active:bg-transparent! data-active:shadow-none! [&_svg]:size-[18px] sm:[&_svg]:size-4"
        >
          <Icon aria-hidden="true" />
          {t(`tabs.${value}`)}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export { SearchTabList };

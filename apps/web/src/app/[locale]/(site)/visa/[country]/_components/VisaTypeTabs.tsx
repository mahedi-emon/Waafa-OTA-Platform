"use client";

import type { ReactNode } from "react";
import type { VisaTypeKey } from "@waafa/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisaType } from "./useVisaType";

type VisaTypeTabsProps = {
  label: string;
  tabs: Array<{ type: VisaTypeKey; label: string; panel: ReactNode }>;
};

/** One tab per visa type (VisaCountry, VisaCountry-medical); panels are server-rendered. */
function VisaTypeTabs({ label, tabs }: VisaTypeTabsProps) {
  const { type, setType } = useVisaType();
  return (
    <Tabs value={type} onValueChange={(value) => setType(value as VisaTypeKey)}>
      <TabsList aria-label={label} className="w-full overflow-x-auto sm:w-fit">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.type} value={tab.type} className="min-h-11">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.type} value={tab.type} className="pt-2">
          {tab.panel}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { VisaTypeTabs };

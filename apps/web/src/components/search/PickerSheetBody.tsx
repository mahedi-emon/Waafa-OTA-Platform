"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerTitle } from "@/components/ui/drawer";
import { PickerBody } from "./PickerBody";
import { usePickerTitle } from "./usePickerTitle";

/** Sheet header (title + close) and the open picker, inside the phone sheet. */
function PickerSheetBody() {
  const t = useTranslations("Search.pickers");
  const title = usePickerTitle();
  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-3">
        <DrawerTitle className="font-display text-[18px] leading-tight font-bold text-navy-900">
          {title}
        </DrawerTitle>
        <DrawerClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("close")}
            className="-mr-2"
          >
            <X aria-hidden="true" />
          </Button>
        </DrawerClose>
      </div>
      <PickerBody title={title} />
    </>
  );
}

export { PickerSheetBody };

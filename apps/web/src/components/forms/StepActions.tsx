"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

type StepActionsProps = {
  submitLabel: string;
  sending: boolean;
  onBack: () => void;
};

/** Back and submit at the end of a lead step (the same wording as every other Manual request). */
function StepActions({ submitLabel, sending, onBack }: StepActionsProps) {
  const t = useTranslations("Leads");
  return (
    <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        {t("back")}
      </Button>
      <Magnetic>
        <Button type="submit" size="lg" loading={sending} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </Magnetic>
    </div>
  );
}

export { StepActions };

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { FocalPoint } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FocalPointPicker } from "./FocalPointPicker";

export type FocalPointDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  value: FocalPoint | undefined;
  /** undefined: back to the centre (the default, so nothing is stored). */
  onChange: (next: FocalPoint | undefined) => void;
};

/** Sets the part of a photo that stays in view in every crop of it (cards, heroes, phone screens). */
function FocalPointDialog({
  open,
  onOpenChange,
  src,
  alt,
  value,
  onChange,
}: FocalPointDialogProps) {
  const t = useTranslations("Admin.media.focal");
  const [point, setPoint] = useState<FocalPoint | undefined>(value);
  // Each opening starts from the photo's stored point.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPoint(value);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("lead")}</DialogDescription>
        </DialogHeader>
        <FocalPointPicker
          src={src}
          alt={alt}
          value={point}
          onChange={setPoint}
          strings={{
            point: (x, y) => t("point", { x, y }),
            hint: t("hint"),
            previews: t("previews"),
          }}
        />
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setPoint(undefined)}>
            {t("centre")}
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                onChange(point && (point.x !== 50 || point.y !== 50) ? point : undefined);
                onOpenChange(false);
              }}
            >
              {t("apply")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { FocalPointDialog };

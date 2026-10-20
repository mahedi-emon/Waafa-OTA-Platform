"use client";

import { useState, useTransition } from "react";
import { Cropper } from "@origin-space/image-cropper";
import { Minus, Plus, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { MediaAsset } from "@waafa/shared";
import { clampCrop, type CropArea } from "@waafa/shared/helpers/media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cropMedia } from "@/lib/admin/mediaActions";
import { markSignedOut } from "../sessionStore";

export type ImageCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The library photo being cropped. */
  id: string;
  src: string;
  /** The photo's own size, when the field knows it (keeps the crop inside the photo). */
  size?: { width: number; height: number } | undefined;
  /** The field's frame (width / height); null lets staff pick a shape. */
  aspect: number | null;
  minWidth?: number | undefined;
  onCropped: (asset: MediaAsset) => void;
};

const SHAPES = [
  { value: "16:9", ratio: 16 / 9 },
  { value: "4:3", ratio: 4 / 3 },
  { value: "1:1", ratio: 1 },
  { value: "3:4", ratio: 3 / 4 },
] as const;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Crop a library photo to its frame (ADMIN.md §11; the originui/image-crop pattern on @origin-space/image-cropper,
 * D207): drag or use the arrow keys to move, the slider, wheel or pinch to zoom. The crop is saved as a new library
 * photo, so the original stays for every other place that shows it.
 */
function ImageCropDialog({
  open,
  onOpenChange,
  id,
  src,
  size,
  aspect,
  minWidth,
  onCropped,
}: ImageCropDialogProps) {
  const t = useTranslations("Admin.media.crop");
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<CropArea | null>(null);
  const [shape, setShape] = useState<string>(size && size.width >= size.height ? "16:9" : "3:4");
  const [saving, startSaving] = useTransition();
  const ratio = aspect ?? SHAPES.find((item) => item.value === shape)?.ratio ?? 4 / 3;
  const crop = area ? (size ? clampCrop(area, size) : roundArea(area)) : null;
  const small = crop !== null && minWidth !== undefined && crop.width < minWidth;

  const apply = () => {
    if (!crop) return;
    startSaving(async () => {
      const result = await cropMedia(id, crop);
      if (!result.ok) {
        if (result.problem.status === 401) markSignedOut();
        toast.error(t("failed"));
        return;
      }
      onCropped(result.data);
      toast.success(t("done"));
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? undefined : onOpenChange(next))}>
      <DialogContent className="flex max-h-[94dvh] max-w-[calc(100%-1rem)] flex-col gap-4 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("lead")}</DialogDescription>
        </DialogHeader>

        {aspect === null ? (
          <div className="flex flex-col gap-1.5">
            <span id={`${id}-shape`} className="text-[14px] font-semibold text-navy-900">
              {t("shape")}
            </span>
            <ToggleGroup
              type="single"
              variant="segment"
              value={shape}
              onValueChange={(next) => (next ? setShape(next) : undefined)}
              aria-labelledby={`${id}-shape`}
            >
              {SHAPES.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value} className="tabular-nums">
                  {item.value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : null}

        <Cropper.Root
          key={ratio}
          image={src}
          aspectRatio={ratio}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          zoom={zoom}
          onZoomChange={setZoom}
          onCropChange={(pixels) => setArea(pixels)}
          aria-label={t("area")}
          aria-valuemin={undefined}
          aria-valuemax={undefined}
          aria-valuenow={undefined}
          aria-valuetext={undefined}
          className="relative flex h-[min(56dvh,26rem)] w-full cursor-move touch-none items-center justify-center overflow-hidden rounded-xl bg-midnight-950 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
        >
          <Cropper.Description className="sr-only">{t("keys")}</Cropper.Description>
          <Cropper.Image className="pointer-events-none size-full object-cover" />
          <Cropper.CropArea className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgb(1_6_32/0.6)]" />
        </Cropper.Root>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("zoomOut")}
            disabled={zoom <= MIN_ZOOM}
            onClick={() =>
              setZoom((now) => Math.max(MIN_ZOOM, Math.round((now - 0.25) * 100) / 100))
            }
          >
            <Minus aria-hidden="true" className="size-4" />
          </Button>
          <Slider
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={[zoom]}
            onValueChange={([next]) => (next === undefined ? undefined : setZoom(next))}
            thumbLabels={[t("zoom")]}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("zoomIn")}
            disabled={zoom >= MAX_ZOOM}
            onClick={() =>
              setZoom((now) => Math.min(MAX_ZOOM, Math.round((now + 0.25) * 100) / 100))
            }
          >
            <Plus aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <p className="flex items-start gap-2 text-[13.5px] text-mist-600 tabular-nums">
          {crop ? t("size", { width: crop.width, height: crop.height }) : t("loading")}
          {small && minWidth ? (
            <span className="inline-flex items-start gap-1 font-medium text-warning-800">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {t("small", { min: minWidth })}
            </span>
          ) : null}
        </p>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" loading={saving} disabled={!crop} onClick={apply}>
            {t("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function roundArea(area: CropArea): CropArea {
  return {
    x: Math.max(0, Math.round(area.x)),
    y: Math.max(0, Math.round(area.y)),
    width: Math.max(16, Math.round(area.width)),
    height: Math.max(16, Math.round(area.height)),
  };
}

export { ImageCropDialog };

"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { objectPositionOf, type FocalPoint } from "@waafa/shared/helpers/media";
import { cn } from "cn";

type FocalPointPickerProps = {
  src: string;
  alt: string;
  value: FocalPoint | undefined;
  onChange: (next: FocalPoint) => void;
  strings: {
    /** "Focal point, {x}% across, {y}% down" with the numbers filled in. */
    point: (x: number, y: number) => string;
    hint: string;
    previews: string;
  };
};

const PREVIEWS = [
  { label: "16:9", className: "aspect-video" },
  { label: "1:1", className: "aspect-square" },
  { label: "4:5", className: "aspect-[4/5]" },
] as const;

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/**
 * The part of a photo kept in view wherever it is cropped to fit (D0 R3, in-house): tap or drag on the photo, or use
 * the arrow keys on the marker (5 % a step, 1 % with Shift). Three small previews show the crops the site uses.
 */
function FocalPointPicker({ src, alt, value, onChange, strings }: FocalPointPickerProps) {
  const box = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const point = value ?? { x: 50, y: 50 };

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    onChange({
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100),
    });
  };
  const nudge = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 1 : 5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({ x: clamp(point.x + move[0]), y: clamp(point.y + move[1]) });
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p id={hintId} className="text-[13.5px] text-mist-600">
        {strings.hint}
      </p>
      <div
        ref={box}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pick(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event);
        }}
        className="relative mx-auto w-fit max-w-full cursor-crosshair touch-none overflow-hidden rounded-xl bg-mist-100 select-none"
      >
        {/* The library's own file: next/image would add nothing in a staff-only editor preview. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block h-auto max-h-[min(48dvh,26rem)] w-auto max-w-full"
        />
        <button
          type="button"
          aria-label={strings.point(point.x, point.y)}
          aria-describedby={hintId}
          onKeyDown={nudge}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          className="absolute size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-[3px] border-white bg-electric-600/35 shadow-[0_0_0_1px_rgb(0_0_0/0.35)] focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none active:cursor-grabbing"
        >
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full bg-white"
          />
        </button>
      </div>
      <div>
        <p className="mb-1.5 text-[12.5px] font-semibold text-mist-600">{strings.previews}</p>
        <ul className="grid grid-cols-3 gap-2">
          {PREVIEWS.map((preview) => (
            <li key={preview.label} className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                style={{ objectPosition: objectPositionOf(point) }}
                className={cn("w-full rounded-lg object-cover", preview.className)}
              />
              <span className="text-[12px] text-mist-600 tabular-nums">{preview.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { FocalPointPicker };

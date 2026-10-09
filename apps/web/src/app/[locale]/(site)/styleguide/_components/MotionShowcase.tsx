"use client";

import { useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { CountUp } from "@/components/motion/CountUp";
import { DrawCheck } from "@/components/motion/DrawCheck";
import { Marquee } from "@/components/motion/Marquee";
import { PressScale } from "@/components/motion/PressScale";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/motion/Stagger";
import { StaggerItem } from "@/components/motion/StaggerItem";
import { Button } from "@/components/ui/button";

const airlines = [
  "Biman Bangladesh",
  "US-Bangla",
  "Emirates",
  "flydubai",
  "Qatar Airways",
  "Kuwait Airways",
];

/** MotionKit specimens. Toggle reduced motion in the OS or DevTools to see the 150 ms fades. */
function MotionShowcase() {
  const [checkKey, setCheckKey] = useState(0);

  return (
    <div className="grid grid-cols-1 gap-10">
      <Stagger as="ul" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["Reveal", "Stagger", "Once", "50 ms"].map((label, index) => (
          <StaggerItem key={label} as="li" index={index}>
            <div className="rounded-lg border border-mist-200 bg-white p-4 text-sm font-semibold text-navy-900">
              {label}
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-6 sm:grid-cols-3">
        <Reveal className="rounded-lg bg-mist-50 p-5">
          <p className="font-display text-4xl font-extrabold text-navy-900">
            <CountUp value={16} />
          </p>
          <p className="text-sm text-mist-600">Count up once in view (sample number)</p>
        </Reveal>
        <div className="flex items-center gap-4 rounded-lg bg-mist-50 p-5">
          <DrawCheck key={checkKey} size={64} />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Replay the success check"
            onClick={() => setCheckKey((key) => key + 1)}
          >
            <RotateCcwIcon />
          </Button>
        </div>
        <PressScale>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-mist-200 bg-white p-5 text-left text-sm font-semibold text-navy-900"
          >
            Press me: scales to 0.98
          </button>
        </PressScale>
      </div>

      <Marquee label="Airlines we book (sample)">
        {airlines.map((airline) => (
          <span key={airline} className="text-lg font-semibold whitespace-nowrap text-mist-600">
            {airline}
          </span>
        ))}
      </Marquee>
    </div>
  );
}

export { MotionShowcase };

"use client";

import { useState } from "react";
import { cn } from "cn";

type JsonDetailsProps = {
  rows: Array<{ label: string; value: string }>;
  json: string;
  strings: { readable: string; raw: string };
};

/** The customer's request as label and value rows, with a raw JSON toggle (AdminLead board). */
function JsonDetails({ rows, json, strings }: JsonDetailsProps) {
  const [raw, setRaw] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 self-start rounded-full bg-mist-100 p-1" role="group">
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={raw === value}
            onClick={() => setRaw(value)}
            className={cn(
              "min-h-9 cursor-pointer rounded-full px-3.5 text-[13px] font-semibold",
              raw === value ? "bg-white text-navy-900 shadow-sm" : "text-mist-600",
            )}
          >
            {value ? strings.raw : strings.readable}
          </button>
        ))}
      </div>
      {raw ? (
        <pre className="max-h-[420px] overflow-auto rounded-xl bg-midnight-950 p-4 font-mono text-[12.5px] leading-relaxed text-white/90">
          {json}
        </pre>
      ) : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[12.5px] font-semibold text-mist-600">{row.label}</dt>
              <dd className="mt-0.5 text-[14.5px] break-words text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export { JsonDetails };

"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

type CopyButtonProps = {
  value: string;
  /** Accessible name, e.g. "Copy phone number". */
  label: string;
  /** Toast text after copying, e.g. "Phone number copied". */
  copiedLabel: string;
  failedLabel: string;
  className?: string;
};

/** Copies a phone number or email; the icon turns into a check for 1.5 s and a toast confirms. */
function CopyButton({ value, label, copiedLabel, failedLabel, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(copiedLabel);
    } catch {
      toast.error(failedLabel);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={cn(
        "relative z-10 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-mist-600 transition-colors duration-150 hover:bg-mist-100 hover:text-navy-900",
        className,
      )}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-[18px] text-success-600" />
      ) : (
        <Copy aria-hidden="true" className="size-[18px]" />
      )}
    </button>
  );
}

export { CopyButton };

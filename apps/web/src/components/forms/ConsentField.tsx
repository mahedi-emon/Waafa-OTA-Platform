"use client";

import type { Ref } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type ConsentFieldProps = {
  id: string;
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  inputRef?: Ref<HTMLButtonElement>;
};

/** The consent checkbox that ends every lead step: the admin-set wording, an error under it, a 44 px target. */
function ConsentField({ id, text, checked, onChange, error, inputRef }: ConsentFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          ref={inputRef}
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5"
        />
        <label htmlFor={id} className="cursor-pointer text-[14px] leading-relaxed text-ink-900">
          {text}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="pl-8 text-[13px] text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { ConsentField };

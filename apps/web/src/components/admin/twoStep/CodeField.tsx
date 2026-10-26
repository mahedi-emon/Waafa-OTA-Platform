"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

type CodeFieldProps = {
  id: string;
  label: string;
  name?: string;
  invalid?: boolean;
  describedBy?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Sends the form when the sixth digit is typed. */
  onComplete?: () => void;
  autoFocus?: boolean;
};

/**
 * The 6-digit authenticator code (issue 234): six boxes, digits only, filled from the phone's one-time-code
 * suggestion where the browser offers it. Narrower boxes below 390 px keep all six on a 320 px phone.
 */
function CodeField({
  id,
  label,
  name = "code",
  invalid,
  describedBy,
  value,
  onChange,
  onComplete,
  autoFocus,
}: CodeFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputOTP
        id={id}
        name={name}
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        {...(value === undefined ? {} : { value })}
        {...(onChange ? { onChange } : {})}
        {...(onComplete ? { onComplete } : {})}
      >
        <InputOTPGroup className="gap-1.5 has-aria-invalid:ring-0 min-[390px]:gap-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className="w-9 min-[390px]:w-10"
              aria-invalid={invalid ? true : undefined}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export { CodeField };

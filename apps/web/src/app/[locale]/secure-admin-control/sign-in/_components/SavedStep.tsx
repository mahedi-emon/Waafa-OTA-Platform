"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { RecoveryCodesPanel } from "@/components/admin/twoStep/RecoveryCodesPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SignInState } from "@/lib/admin/sessionActions";
import type { SignInStrings } from "./signInStrings";

type SavedStepProps = {
  state: SignInState;
  action: (form: FormData) => void;
  pending: boolean;
  strings: SignInStrings;
};

/** Two-step sign-in is on (issue 234): the recovery codes, shown once, before going on to the admin. */
function SavedStep({ state, action, pending, strings }: SavedStepProps) {
  const [saved, setSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="stage" value="saved" />
      <div className="flex gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success-50 text-success-700">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2
            ref={heading}
            tabIndex={-1}
            className="font-display text-[19px] leading-snug font-bold text-navy-900 focus:outline-none"
          >
            {strings.savedTitle}
          </h2>
          <p className="mt-1 text-[14.5px] text-mist-600">{strings.savedLead}</p>
        </div>
      </div>
      <RecoveryCodesPanel
        codes={state.recoveryCodes ?? []}
        email={state.email}
        strings={strings.codes}
      />
      <div className="flex items-center gap-3">
        <Checkbox
          id="admin-saved"
          checked={saved}
          onCheckedChange={(value) => setSaved(value === true)}
        />
        <Label htmlFor="admin-saved" className="min-h-11 items-center font-semibold text-ink-900">
          {strings.savedConfirm}
        </Label>
      </div>
      <Button type="submit" size="lg" loading={pending} disabled={!saved} className="w-full">
        {strings.continue}
      </Button>
    </form>
  );
}

export { SavedStep };

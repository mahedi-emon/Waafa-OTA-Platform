"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvite, type WelcomeState } from "@/lib/admin/inviteActions";

type WelcomeFormProps = {
  token: string;
  strings: {
    password: string;
    passwordHint: string;
    again: string;
    show: string;
    hide: string;
    submit: string;
    short: string;
    different: string;
    expired: string;
    tooMany: string;
    unavailable: string;
  };
};

const INITIAL: WelcomeState = { error: null };

/** Choose a password from an invite link: two boxes, Show password, and plain words for each problem (D0 R9). */
function WelcomeForm({ token, strings }: WelcomeFormProps) {
  const [state, action, pending] = useActionState(acceptInvite, INITIAL);
  const [visible, setVisible] = useState(false);
  const message = state.error ? strings[state.error] : null;
  const fieldError = state.error === "short" || state.error === "different";

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="token" value={token} />
      {message ? (
        <div
          role="alert"
          id="welcome-error"
          className="flex gap-2.5 rounded-2xl border border-danger-700/15 bg-danger-50 p-3.5 text-[14px] font-semibold text-danger-700"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
          <p>{message}</p>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="welcome-password">{strings.password}</Label>
        <div className="relative">
          <Input
            id="welcome-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            minLength={12}
            required
            aria-invalid={fieldError || undefined}
            aria-describedby={["welcome-hint", fieldError ? "welcome-error" : ""]
              .filter(Boolean)
              .join(" ")}
            className="h-12 pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? strings.hide : strings.show}
            aria-pressed={visible}
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
          >
            {visible ? (
              <EyeOff aria-hidden="true" className="size-[18px]" />
            ) : (
              <Eye aria-hidden="true" className="size-[18px]" />
            )}
          </Button>
        </div>
        <p id="welcome-hint" className="text-[13px] text-mist-600">
          {strings.passwordHint}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="welcome-again">{strings.again}</Label>
        <Input
          id="welcome-again"
          name="again"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          aria-invalid={state.error === "different" || undefined}
          className="h-12"
        />
      </div>
      <Button type="submit" size="lg" loading={pending}>
        {strings.submit}
      </Button>
    </form>
  );
}

export { WelcomeForm };

"use client";

import { useState } from "react";
import { CircleCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignInState } from "@/lib/admin/sessionActions";
import type { SignInStrings } from "./signInStrings";
import { SignInMessage } from "./SignInMessage";

type PasswordStepProps = {
  state: SignInState;
  action: (form: FormData) => void;
  pending: boolean;
  strings: SignInStrings;
  next: string;
  /** Back from the welcome page with a new password (D0 R9). */
  welcome: boolean;
};

/**
 * Email and password: plain messages for a wrong password (with the 5-tries rule), a paused sign-in after too many
 * tries, a code step that took too long, a missing field or an API that didn't answer; Show password; Keep me signed
 * in with what it means.
 */
function PasswordStep({ state, action, pending, strings, next, welcome }: PasswordStepProps) {
  const [visible, setVisible] = useState(false);
  const fieldError = state.error === "wrong" || state.error === "missing";
  const message =
    state.error === "wrong"
      ? strings.wrong
      : state.error === "unavailable"
        ? strings.unavailable
        : state.error === "missing"
          ? strings.missing
          : state.error === "expired"
            ? strings.expired
            : null;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="stage" value="password" />
      <input type="hidden" name="next" value={next} />
      {welcome ? (
        <div
          role="status"
          className="flex gap-2.5 rounded-2xl border border-success-700/15 bg-success-50 p-3.5 text-[14px] font-semibold text-success-700"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
          <p>{strings.welcome}</p>
        </div>
      ) : null}
      {state.error === "locked" ? (
        <SignInMessage tone="warning" title={strings.lockedTitle} body={strings.lockedBody} />
      ) : message ? (
        <SignInMessage
          id="sign-in-error"
          tone="danger"
          title={message}
          body={state.error === "wrong" ? strings.wrongTries : undefined}
        />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-email">{strings.email}</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email ?? ""}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={message ? "sign-in-error" : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-password">{strings.password}</Label>
        <div className="relative">
          <Input
            id="admin-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-14"
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={message ? "sign-in-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-pressed={visible}
            aria-label={visible ? strings.hidePassword : strings.showPassword}
            className="absolute inset-y-0 right-1 my-auto flex size-11 cursor-pointer items-center justify-center rounded-xl text-mist-600 transition-colors duration-150 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {visible ? (
              <EyeOff aria-hidden="true" className="size-[18px]" />
            ) : (
              <Eye aria-hidden="true" className="size-[18px]" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="admin-remember"
          name="remember"
          className="mt-3"
          aria-describedby="admin-remember-hint"
        />
        <div className="flex flex-col">
          <Label
            htmlFor="admin-remember"
            className="min-h-11 items-center font-semibold text-ink-900"
          >
            {strings.remember}
          </Label>
          <p id="admin-remember-hint" className="-mt-1.5 text-[13.5px] text-mist-600">
            {strings.rememberHint}
          </p>
        </div>
      </div>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {strings.submit}
      </Button>
    </form>
  );
}

export { PasswordStep };

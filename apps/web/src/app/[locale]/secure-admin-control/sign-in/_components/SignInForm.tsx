"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type SignInState } from "@/lib/admin/sessionActions";

type SignInFormProps = {
  strings: {
    email: string;
    password: string;
    showPassword: string;
    hidePassword: string;
    remember: string;
    rememberHint: string;
    submit: string;
    wrong: string;
    wrongTries: string;
    lockedTitle: string;
    lockedBody: string;
    unavailable: string;
    missing: string;
    /** After the welcome page: the new password is set, sign in with it (D0 R9). */
    welcome: string;
  };
};

const INITIAL: SignInState = { error: null };

/**
 * The sign-in form: plain messages for a wrong password (with the 5-tries rule), a paused sign-in after too many tries,
 * a missing field or an API that didn't answer; Show password; Keep me signed in with what it means.
 */
function SignInForm({ strings }: SignInFormProps) {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  const [visible, setVisible] = useState(false);
  const search = useSearchParams();
  const next = search.get("next") ?? "/secure-admin-control";
  const welcome = search.get("welcome") === "1" && state.error === null;
  const fieldError = state.error === "wrong" || state.error === "missing";

  const message =
    state.error === "wrong"
      ? strings.wrong
      : state.error === "unavailable"
        ? strings.unavailable
        : state.error === "missing"
          ? strings.missing
          : null;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
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
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-warning-800/15 bg-warning-50 p-4 text-warning-800"
        >
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{strings.lockedTitle}</p>
            <p className="mt-1 text-[14px] leading-relaxed">{strings.lockedBody}</p>
          </div>
        </div>
      ) : message ? (
        <div
          role="alert"
          id="sign-in-error"
          className="flex gap-2.5 rounded-2xl border border-danger-700/15 bg-danger-50 p-3.5 text-[14px] text-danger-700"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
          <div>
            <p className="font-semibold">{message}</p>
            {state.error === "wrong" ? <p className="mt-0.5">{strings.wrongTries}</p> : null}
          </div>
        </div>
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

export { SignInForm };

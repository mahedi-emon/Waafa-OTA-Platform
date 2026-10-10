"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type SignInState } from "@/lib/admin/sessionActions";

type SignInFormProps = {
  strings: {
    email: string;
    password: string;
    remember: string;
    submit: string;
    wrong: string;
    lockedTitle: string;
    lockedBody: string;
    unavailable: string;
    missing: string;
  };
};

const INITIAL: SignInState = { error: null };

/** The sign-in form: wrong-password and locked states from the API (5 tries, then 15 minutes). */
function SignInForm({ strings }: SignInFormProps) {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  const next = useSearchParams().get("next") ?? "/admin";

  const message =
    state.error === "wrong"
      ? strings.wrong
      : state.error === "unavailable"
        ? strings.unavailable
        : state.error === "missing"
          ? strings.missing
          : null;

  return (
    <form action={action} className="mt-6 flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error === "locked" ? (
        <div role="alert" className="flex gap-3 rounded-2xl bg-warning-50 p-4 text-warning-700">
          <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{strings.lockedTitle}</p>
            <p className="mt-0.5 text-[14px]">{strings.lockedBody}</p>
          </div>
        </div>
      ) : message ? (
        <p
          role="alert"
          className="flex gap-2 rounded-2xl bg-danger-50 p-3.5 text-[14px] text-danger-600"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
          {message}
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-email">{strings.email}</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={state.email ?? ""}
          aria-invalid={state.error === "wrong" || state.error === "missing" ? true : undefined}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-password">{strings.password}</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error === "wrong" || state.error === "missing" ? true : undefined}
        />
      </div>
      <div className="flex min-h-11 items-center gap-3">
        <Checkbox id="admin-remember" name="remember" />
        <Label htmlFor="admin-remember" className="font-normal text-mist-700">
          {strings.remember}
        </Label>
      </div>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {strings.submit}
      </Button>
    </form>
  );
}

export { SignInForm };

"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/lib/admin/sessionActions";
import { CodeStep } from "./CodeStep";
import { EnrolStep } from "./EnrolStep";
import { PasswordStep } from "./PasswordStep";
import { SavedStep } from "./SavedStep";
import type { SignInStrings } from "./signInStrings";

type SignInStepsProps = {
  strings: SignInStrings;
  next: string;
  welcome: boolean;
  onRestart: () => void;
};

const INITIAL: SignInState = { stage: "password", error: null };

/** One sign-in, step by step (issue 234): password, then a code or the authenticator setup, then recovery codes. */
function SignInSteps({ strings, next, welcome, onRestart }: SignInStepsProps) {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  const shared = { state, action, pending, strings };
  if (state.stage === "code") return <CodeStep {...shared} onRestart={onRestart} />;
  if (state.stage === "enrol") return <EnrolStep {...shared} onRestart={onRestart} />;
  if (state.stage === "saved") return <SavedStep {...shared} />;
  return <PasswordStep {...shared} next={next} welcome={welcome && state.error === null} />;
}

export { SignInSteps };

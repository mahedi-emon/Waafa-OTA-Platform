"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignInSteps } from "./SignInSteps";
import type { SignInStrings } from "./signInStrings";

type SignInFormProps = {
  strings: SignInStrings;
};

/** The sign-in card. "Start again" from the code step remounts the steps with a fresh, empty form. */
function SignInForm({ strings }: SignInFormProps) {
  const [round, setRound] = useState(0);
  const search = useSearchParams();
  const next = search.get("next") ?? "/secure-admin-control";
  return (
    <SignInSteps
      key={round}
      strings={strings}
      next={next}
      welcome={round === 0 && search.get("welcome") === "1"}
      onRestart={() => setRound((value) => value + 1)}
    />
  );
}

export { SignInForm };

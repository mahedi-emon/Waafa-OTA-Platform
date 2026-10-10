"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPassword } from "@/lib/admin/opsActions";

type PasswordFormProps = {
  strings: {
    current: string;
    next: string;
    nextHint: string;
    change: string;
    changed: string;
    wrong: string;
    failed: string;
  };
};

/** Change my password: other devices sign out, this one stays signed in. */
function PasswordForm({ strings }: PasswordFormProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await changeOwnPassword(current, next);
      if (!result.ok) {
        const message =
          result.problem.code === "wrong-password"
            ? strings.wrong
            : (result.problem.fields?.[0]?.message ?? strings.failed);
        setError(message);
        return;
      }
      toast.success(strings.changed);
      setCurrent("");
      setNext("");
    });
  }

  return (
    <form
      className="flex max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-current">{strings.current}</Label>
        <Input
          id="account-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-next">{strings.next}</Label>
        <Input
          id="account-next"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          aria-describedby="account-next-hint"
        />
        <p id="account-next-hint" className="text-[12.5px] text-mist-600">
          {strings.nextHint}
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-[14px] font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" loading={pending} disabled={!current || next.length < 12}>
          {strings.change}
        </Button>
      </div>
    </form>
  );
}

export { PasswordForm };

"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { formatDate, PASSWORD_MIN, type SignInEntry } from "@waafa/shared";
import { FormField } from "@/components/forms/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { accountError, postAccount, type AccountErrors } from "./postAccount";

export type SettingsLabels = {
  offers: string;
  offersHint: string;
  offersSaved: string;
  passwordTitle: string;
  passwordLead: string;
  passwordNew: string;
  passwordHint: string;
  passwordSet: string;
  passwordChange: string;
  passwordRemove: string;
  passwordSaved: string;
  passwordRemoved: string;
  passwordShort: string;
  signInsTitle: string;
  thisDevice: string;
  signedOut: string;
  signOutOthers: string;
  signedOutNone: string;
  signedOutOne: string;
  /** "{count}" is replaced with the number of devices signed out. */
  signedOutMany: string;
};

type AccountSettingsProps = {
  notifyOffers: boolean;
  hasPassword: boolean;
  signIns: SignInEntry[];
  labels: SettingsLabels;
  errors: AccountErrors;
};

const h3 = "font-display text-[17px] font-bold text-navy-900";
const card = "flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5";

/** My account settings (issue 278): offer emails, an optional password, recent sign-ins and signing out other devices. */
function AccountSettings({
  notifyOffers,
  hasPassword,
  signIns,
  labels,
  errors,
}: AccountSettingsProps) {
  const offersId = useId();
  // Password and sign-ins follow each answer here, so a change never reloads the page.
  const [passwordSet, setPasswordSet] = useState(hasPassword);
  const [entries, setEntries] = useState(signIns);
  const [offers, setOffers] = useState(notifyOffers);
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleOffers(next: boolean) {
    setOffers(next);
    startTransition(async () => {
      const answer = await postAccount("preferences", { notifyOffers: next });
      if (!answer.ok) {
        setOffers(!next);
        toast.error(accountError(answer, errors));
        return;
      }
      toast.success(labels.offersSaved);
    });
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < PASSWORD_MIN) {
      setProblem(labels.passwordShort);
      return;
    }
    setProblem(null);
    startTransition(async () => {
      const answer = await postAccount("password.set", { password });
      if (!answer.ok) {
        setProblem(accountError(answer, errors));
        return;
      }
      setPassword("");
      setPasswordSet(true);
      toast.success(labels.passwordSaved);
    });
  }

  function removePassword() {
    startTransition(async () => {
      const answer = await postAccount("password.remove");
      if (!answer.ok) {
        toast.error(accountError(answer, errors));
        return;
      }
      setPasswordSet(false);
      toast.success(labels.passwordRemoved);
    });
  }

  function signOutOthers() {
    startTransition(async () => {
      const answer = await postAccount("signOutOthers");
      if (!answer.ok) {
        toast.error(accountError(answer, errors));
        return;
      }
      const count = typeof answer.ended === "number" ? answer.ended : 0;
      const words =
        count === 0
          ? labels.signedOutNone
          : count === 1
            ? labels.signedOutOne
            : labels.signedOutMany;
      setEntries((list) =>
        list.map((entry) => (entry.current ? entry : { ...entry, active: false })),
      );
      toast.success(words.replace("{count}", String(count)));
    });
  }

  const others = entries.some((entry) => entry.active && !entry.current);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className={card}>
        <div className="flex min-h-11 items-center justify-between gap-4">
          <label htmlFor={offersId} className="text-[15px] font-semibold text-navy-900">
            {labels.offers}
          </label>
          <Switch
            id={offersId}
            checked={offers}
            disabled={pending}
            onCheckedChange={toggleOffers}
            aria-describedby={`${offersId}-hint`}
          />
        </div>
        <p id={`${offersId}-hint`} className="text-[14px] text-mist-700">
          {labels.offersHint}
        </p>
      </div>

      <form onSubmit={savePassword} noValidate className={card}>
        <h3 className={h3}>{labels.passwordTitle}</h3>
        <p className="text-[14px] leading-relaxed text-mist-700">{labels.passwordLead}</p>
        <FormField
          id="account-password"
          label={labels.passwordNew}
          hint={labels.passwordHint}
          {...(problem ? { error: problem } : {})}
        >
          {(describedBy) => (
            <Input
              id="account-password"
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={describedBy}
              aria-invalid={problem ? true : undefined}
            />
          )}
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={pending}>
            {passwordSet ? labels.passwordChange : labels.passwordSet}
          </Button>
          {passwordSet ? (
            <Button type="button" variant="ghost" disabled={pending} onClick={removePassword}>
              {labels.passwordRemove}
            </Button>
          ) : null}
        </div>
      </form>

      <div className={`${card} lg:col-span-2`}>
        <h3 className={h3}>{labels.signInsTitle}</h3>
        <ul className="flex flex-col divide-y divide-mist-100">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="min-w-0 text-[14.5px] text-ink-900">
                {entry.device}
                <span className="block text-[13px] text-mist-600 tabular-nums">
                  {formatDate(entry.at)}
                </span>
              </span>
              {entry.current ? (
                <Badge variant="neutral">{labels.thisDevice}</Badge>
              ) : entry.active ? null : (
                <span className="text-[13px] text-mist-600">{labels.signedOut}</span>
              )}
            </li>
          ))}
        </ul>
        {others ? (
          <Button
            type="button"
            variant="secondary"
            className="self-start"
            disabled={pending}
            onClick={signOutOthers}
          >
            {labels.signOutOthers}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { AccountSettings };

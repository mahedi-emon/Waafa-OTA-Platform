"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert, MailCheck } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { useSubmitOnce } from "@/components/forms/useSubmitOnce";
import { useTurnstile } from "@/components/forms/useTurnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics/track";

export type EmailSignInLabels = {
  email: string;
  emailHint: string;
  sendCode: string;
  sending: string;
  sentTo: string;
  code: string;
  codeHint: string;
  signIn: string;
  checking: string;
  otherEmail: string;
  resend: string;
  resent: string;
  profileTitle: string;
  profileLead: string;
  name: string;
  phone: string;
  phoneHint: string;
  country: string;
  create: string;
  creating: string;
  usePassword: string;
  useCode: string;
  password: string;
  passwordSignIn: string;
  errors: {
    email: string;
    code: string;
    wrongCode: string;
    expired: string;
    locked: string;
    disabled: string;
    busy: string;
    unavailable: string;
    name: string;
    phone: string;
    signUpExpired: string;
    password: string;
  };
};

type Step = "email" | "code" | "profile" | "password";

type EmailSignInProps = {
  labels: EmailSignInLabels;
  /** Where to go once signed in (already checked on the server). */
  next: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  defaultCountry: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function post(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, json };
}

/**
 * Email code sign-in and sign-up on one screen (issue 241, D301): email, then the 6-digit code from the email, then
 * name and phone for a new address. The server answers the same for every address; the session and the sign-up
 * ticket live in httpOnly cookies.
 */
function EmailSignIn({ labels, next, countries, defaultCountry }: EmailSignInProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const turnstile = useTurnstile();
  const once = useSubmitOnce();
  // The new step's heading (or the email box on the first step) takes focus.
  const heading = useRef<HTMLElement | null>(null);
  const firstStep = useRef(true);

  // Each new step takes focus, so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  async function sendCode(isResend: boolean) {
    const key = once.start();
    if (!key) return;
    setBusy(true);
    setError(null);
    try {
      const { status } = await post("/api/auth/email/code", {
        idempotencyKey: key,
        email,
        turnstileToken: await turnstile.getToken(),
      });
      turnstile.reset();
      if (status === 202) {
        once.renew();
        setCode("");
        setNotice(isResend ? labels.resent : null);
        setStep("code");
        return;
      }
      if (status !== 429) once.renew();
      setError(
        status === 429
          ? labels.errors.busy
          : status === 422
            ? labels.errors.email
            : labels.errors.unavailable,
      );
    } catch {
      setError(labels.errors.unavailable);
    } finally {
      once.finished();
      setBusy(false);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError(labels.errors.email);
      return;
    }
    await sendCode(false);
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) {
      setError(labels.errors.code);
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { status, json } = await post("/api/auth/email/verify", { email, code: clean });
      if (status === 200 && json.status === "signed-in") {
        track("login");
        window.location.assign(next);
        return;
      }
      if (status === 200 && json.status === "new") {
        setStep("profile");
        return;
      }
      const reason = typeof json.error === "string" ? json.error : "unavailable";
      const left = typeof json.triesLeft === "number" ? json.triesLeft : undefined;
      setError(
        reason === "wrong-code"
          ? left === undefined
            ? labels.errors.wrongCode.replace("{tries}", "")
            : labels.errors.wrongCode.replace("{tries}", String(left))
          : reason === "expired"
            ? labels.errors.expired
            : reason === "locked"
              ? labels.errors.locked
              : reason === "disabled"
                ? labels.errors.disabled
                : reason === "busy"
                  ? labels.errors.busy
                  : labels.errors.unavailable,
      );
    } catch {
      setError(labels.errors.unavailable);
    } finally {
      setBusy(false);
    }
  }

  /** Password sign-in for an account that set one in My account (issue 278); the email code stays the way back in. */
  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError(labels.errors.email);
      return;
    }
    if (!password || busy) {
      if (!password) setError(labels.errors.password);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { status, json } = await post("/api/auth/password", { email: email.trim(), password });
      if (status === 200 && json.status === "signed-in") {
        track("login");
        window.location.assign(next);
        return;
      }
      setError(
        status === 429
          ? labels.errors.busy
          : json.error === "refused"
            ? labels.errors.password
            : labels.errors.unavailable,
      );
    } catch {
      setError(labels.errors.unavailable);
    } finally {
      setBusy(false);
    }
  }

  function switchTo(target: Step) {
    setStep(target);
    setError(null);
    setNotice(null);
    setPassword("");
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError(labels.errors.name);
      return;
    }
    if (phone.replace(/\D/g, "").length < 6) {
      setError(labels.errors.phone);
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { status, json } = await post("/api/auth/email/complete", {
        name,
        phone,
        phoneCountry: country,
      });
      if (status === 200 && json.status === "signed-in") {
        track("sign_up");
        window.location.assign(next);
        return;
      }
      if (json.error === "expired") {
        setError(labels.errors.signUpExpired);
        setStep("email");
        return;
      }
      const fields = Array.isArray(json.fields) ? json.fields : [];
      setError(
        status === 429
          ? labels.errors.busy
          : fields.includes("phone")
            ? labels.errors.phone
            : fields.includes("name")
              ? labels.errors.name
              : labels.errors.unavailable,
      );
    } catch {
      setError(labels.errors.unavailable);
    } finally {
      setBusy(false);
    }
  }

  const alert = error ? (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-danger-50 px-3 py-2.5 text-[14px] text-danger-700"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {error}
    </p>
  ) : null;

  if (step === "email") {
    return (
      <form
        noValidate
        onSubmit={submitEmail}
        onFocus={turnstile.activate}
        className="flex flex-col gap-4"
      >
        <FormField id="signin-email" label={labels.email} hint={labels.emailHint}>
          {(describedBy) => (
            <Input
              ref={(node) => {
                heading.current = node;
              }}
              id="signin-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error === labels.errors.email ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </FormField>
        {alert}
        {turnstile.field}
        <Button type="submit" size="lg" disabled={busy} aria-busy={busy || undefined}>
          {busy ? labels.sending : labels.sendCode}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="self-center"
          onClick={() => switchTo("password")}
        >
          {labels.usePassword}
        </Button>
      </form>
    );
  }

  if (step === "password") {
    return (
      <form noValidate onSubmit={submitPassword} className="flex flex-col gap-4">
        <FormField id="signin-email" label={labels.email}>
          {(describedBy) => (
            <Input
              ref={(node) => {
                heading.current = node;
              }}
              id="signin-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error === labels.errors.email ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </FormField>
        <FormField id="signin-password" label={labels.password}>
          {(describedBy) => (
            <Input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error === labels.errors.password ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </FormField>
        {alert}
        <Button type="submit" size="lg" disabled={busy} aria-busy={busy || undefined}>
          {busy ? labels.checking : labels.passwordSignIn}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="self-center"
          onClick={() => switchTo("email")}
        >
          {labels.useCode}
        </Button>
      </form>
    );
  }

  if (step === "code") {
    return (
      <form noValidate onSubmit={submitCode} className="flex flex-col gap-4">
        <h2
          ref={(node) => {
            heading.current = node;
          }}
          tabIndex={-1}
          className="flex items-start gap-2 font-sans text-[15px] leading-relaxed font-normal text-navy-900 outline-none"
        >
          <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success-600" />
          <span>{labels.sentTo.replace("{email}", email.trim().toLowerCase())}</span>
        </h2>
        {notice ? (
          <p role="status" className="text-[14px] text-mist-700">
            {notice}
          </p>
        ) : null}
        <FormField id="signin-code" label={labels.code} hint={labels.codeHint}>
          {(describedBy) => (
            <Input
              id="signin-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="max-w-48 text-center font-mono text-[22px] tracking-[0.4em] tabular-nums"
            />
          )}
        </FormField>
        {alert}
        <Button type="submit" size="lg" disabled={busy} aria-busy={busy || undefined}>
          {busy ? labels.checking : labels.signIn}
        </Button>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Button type="button" variant="ghost" onClick={() => void sendCode(true)} disabled={busy}>
            {labels.resend}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep("email");
              setError(null);
              setNotice(null);
            }}
          >
            {labels.otherEmail}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={submitProfile} className="flex flex-col gap-4">
      <div>
        <h2
          ref={(node) => {
            heading.current = node;
          }}
          tabIndex={-1}
          className="font-display text-[18px] font-bold text-navy-900 outline-none"
        >
          {labels.profileTitle}
        </h2>
        <p className="text-[14px] text-mist-600">{labels.profileLead}</p>
      </div>
      <FormField id="signup-name" label={labels.name}>
        {(describedBy) => (
          <Input
            id="signup-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error === labels.errors.name ? true : undefined}
            aria-describedby={describedBy}
          />
        )}
      </FormField>
      <FormField id="signup-phone" label={labels.phone} hint={labels.phoneHint}>
        {(describedBy) => (
          <PhoneField
            id="signup-phone"
            countries={countries}
            country={country}
            onCountryChange={setCountry}
            countryLabel={labels.country}
            invalid={error === labels.errors.phone}
            describedBy={describedBy}
            inputProps={{
              name: "phone",
              value: phone,
              onChange: (event) => setPhone(event.target.value),
              autoComplete: "tel-national",
              "aria-required": true,
            }}
          />
        )}
      </FormField>
      {alert}
      <Button type="submit" size="lg" disabled={busy} aria-busy={busy || undefined}>
        {busy ? labels.creating : labels.create}
      </Button>
    </form>
  );
}

export { EmailSignIn };

"use client";

import { useState, type ReactNode } from "react";
import { CircleAlert, Home, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { whatsappLink, type LeadCreateInput, type LeadCreated } from "@waafa/shared";
import { useSubmitOnce } from "@/components/forms/useSubmitOnce";
import { useTurnstile } from "@/components/forms/useTurnstile";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ContactStepValues } from "@/lib/leads/contactForm";
import { ContactStep } from "./ContactStep";
import { LeadCardHeader } from "./LeadCardHeader";
import { LeadSuccess } from "./LeadSuccess";
import { uploadsInFlight } from "@/lib/forms/uploadsInFlight";

type LeadRequestCardProps<T> = {
  /** id of the card heading (names the region). */
  titleId: string;
  kicker: string;
  title: string;
  lead: string;
  /** Shown under the header, e.g. the chosen group fare or package. */
  banner?: ReactNode;
  secondStepLabel: string;
  /** Overrides the travel wording of step 1 (title, email hint). */
  contactCopy?: { title?: string; emailHint?: string };
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  phoneDisplay: string;
  whatsappE164: string;
  /** Turns the two steps into the shared lead contract (the server validates again). */
  buildLead: (
    contact: ContactStepValues,
    values: T,
    page: string,
  ) => LeadCreateInput | Promise<LeadCreateInput>;
  renderSecondStep: (step: {
    sending: boolean;
    goBack: () => void;
    submit: (values: T) => void;
  }) => ReactNode;
  success: {
    title: string;
    lead: string;
    steps: Array<{ title: string; body: ReactNode }>;
    whatsappMessage: (reference: string) => string;
    againHref: string;
    /** Defaults to "Search again"; packages say "More packages". */
    againLabel?: string;
  };
};

type Phase = "contact" | "second" | "sent";

/**
 * The two-step lead request used by every Manual module (flights, hotels, packages, visa…): contact first, then the
 * module's own step, sent to POST /api/leads with one idempotency key per request (a double tap or a retry makes
 * one lead), then the boarding-pass success with the reference.
 */
function LeadRequestCard<T>(props: LeadRequestCardProps<T>) {
  const t = useTranslations("Leads");
  const [phase, setPhase] = useState<Phase>("contact");
  const [contact, setContact] = useState<ContactStepValues>({
    name: "",
    phoneCountry: props.countries[0]?.code ?? "BD",
    phone: "",
    email: "",
  });
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<"retry" | "rate" | "uploading" | null>(null);
  const [created, setCreated] = useState<LeadCreated | null>(null);
  // One request at a time, one idempotency key per request: a double tap or a retry reuses it (issue 236).
  const once = useSubmitOnce();
  const turnstile = useTurnstile();

  const goTo = (next: Phase) => {
    setPhase(next);
    window.requestAnimationFrame(() =>
      document
        .getElementById(`${props.titleId}-card`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };

  const submit = async (values: T) => {
    // A file still uploading would be left out of the request (issue 232).
    if (uploadsInFlight()) {
      setFailure("uploading");
      return;
    }
    const key = once.start();
    if (!key) return;
    setSending(true);
    setFailure(null);
    try {
      const lead = await props.buildLead(contact, values, window.location.pathname);
      const turnstileToken = await turnstile.getToken();
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: key, lead, turnstileToken }),
      });
      turnstile.reset();
      if (!response.ok) {
        setFailure(response.status === 429 ? "rate" : "retry");
        return;
      }
      setCreated((await response.json()) as LeadCreated);
      once.renew();
      goTo("sent");
    } catch {
      setFailure("retry");
    } finally {
      once.finished();
      setSending(false);
    }
  };

  if (phase === "sent" && created) {
    return (
      <div id={`${props.titleId}-card`} className="scroll-mt-28">
        <LeadSuccess
          title={props.success.title}
          lead={props.success.lead}
          reference={created.reference}
          labels={{
            reference: t("success.reference"),
            copy: t("success.copy"),
            copied: t("success.copied"),
            copyFailed: t("success.copyFailed"),
          }}
          steps={props.success.steps}
          actions={
            <>
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(
                    props.whatsappE164,
                    props.success.whatsappMessage(created.reference),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {t("success.whatsapp")}
                </a>
              </Button>
              <Button asChild variant="secondary">
                <Link href={props.success.againHref}>
                  <Search aria-hidden="true" />
                  {props.success.againLabel ?? t("success.again")}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">
                  <Home aria-hidden="true" />
                  {t("success.home")}
                </Link>
              </Button>
            </>
          }
          footnote={contact.email ? t("success.emailCopy") : undefined}
        />
      </div>
    );
  }

  return (
    <div id={`${props.titleId}-card`} className="scroll-mt-28">
      <section
        aria-labelledby={props.titleId}
        className="overflow-hidden rounded-[20px] border border-mist-200 bg-white shadow-sm"
      >
        <LeadCardHeader
          kicker={props.kicker}
          title={props.title}
          lead={props.lead}
          badges={[t("noPayment"), t("priceConfirmed")]}
          titleId={props.titleId}
        />
        {props.banner}
        <ol aria-label={t("steps.label")} className="flex gap-2 px-5 pt-5 md:px-7">
          {(["contact", "second"] as const).map((step, index) => {
            const current = phase === step;
            const done = step === "contact" && phase === "second";
            return (
              <li
                key={step}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold",
                  current
                    ? "bg-navy-900 text-white"
                    : done
                      ? "bg-success-50 text-success-600"
                      : "bg-mist-100 text-mist-600",
                )}
              >
                <span className="grid size-5 place-items-center rounded-full bg-white/20 tabular-nums">
                  {index + 1}
                </span>
                {step === "contact" ? t("steps.contact") : props.secondStepLabel}
              </li>
            );
          })}
        </ol>
        <div className="px-5 pt-5 pb-6 md:px-7" onFocusCapture={turnstile.activate}>
          {failure ? (
            <div
              role="alert"
              className="mb-5 flex gap-3 rounded-xl border border-danger-600/30 bg-danger-25 p-4"
            >
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger-600" />
              <div>
                <p className="text-[15px] font-semibold text-navy-900">
                  {failure === "uploading" ? t("failure.waitTitle") : t("failure.title")}
                </p>
                <p className="text-[14px] text-mist-700">
                  {failure === "uploading"
                    ? t("failure.waitBody")
                    : failure === "rate"
                      ? t("failure.tooMany")
                      : t("failure.body", { phone: props.phoneDisplay })}
                </p>
              </div>
            </div>
          ) : null}
          {phase === "contact" ? (
            <ContactStep
              defaultValues={contact}
              emailRequired={props.emailRequired}
              countries={props.countries}
              {...(props.contactCopy ? { copy: props.contactCopy } : {})}
              onSubmit={(values) => {
                setContact(values);
                goTo("second");
              }}
            />
          ) : (
            props.renderSecondStep({ sending, goBack: () => goTo("contact"), submit })
          )}
          {turnstile.field}
        </div>
      </section>
    </div>
  );
}

export { LeadRequestCard };

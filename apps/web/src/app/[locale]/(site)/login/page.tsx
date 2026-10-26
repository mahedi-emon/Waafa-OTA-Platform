import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Check } from "@/components/icons/server/Check";
import { CircleAlert } from "@/components/icons/server/CircleAlert";
import { CircleCheck } from "@/components/icons/server/CircleCheck";
import { ShieldCheck } from "@/components/icons/server/ShieldCheck";
import { EmailSignIn } from "@/components/account/EmailSignIn";
import { GoogleSignInButton } from "@/components/account/GoogleSignInButton";
import { RibbonLine } from "@/components/brand/RibbonLine";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { emailSignInReady, googleSignInConfig, readAccount } from "@/lib/account/accountApi";
import { SESSION_COOKIE, safeNext } from "@/lib/account/googleOAuth";
import { getLeadFormSettings, getSiteSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account.login");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const ERRORS = ["off", "cancelled", "expired", "refused", "busy", "unavailable"] as const;
type LoginError = (typeof ERRORS)[number];

const first = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

async function LoginContent({ searchParams }: Pick<PageProps<"/[locale]/login">, "searchParams">) {
  const site = await getSiteSettings();
  // Customer accounts stay hidden until Settings › Site › Accounts live is on (D46, issue 134).
  if (!site.accountsLive) notFound();
  const params = await searchParams;
  const next = safeNext(first(params.next) || undefined);
  const store = await cookies();
  if (await readAccount(store.get(SESSION_COOKIE)?.value).catch(() => null)) redirect(next);

  const [config, t, leadForm] = await Promise.all([
    googleSignInConfig(),
    getTranslations("Account.login"),
    getLeadFormSettings(),
  ]);
  const emailReady = emailSignInReady();
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));
  const e = (key: string) => t(`email.${key}` as "email.email");
  const emailLabels = {
    email: e("email"),
    emailHint: e("emailHint"),
    sendCode: e("sendCode"),
    sending: e("sending"),
    sentTo: t("email.sentTo", { email: "{email}" }),
    code: e("code"),
    codeHint: e("codeHint"),
    signIn: e("signIn"),
    checking: e("checking"),
    otherEmail: e("otherEmail"),
    resend: e("resend"),
    resent: e("resent"),
    profileTitle: e("profileTitle"),
    profileLead: e("profileLead"),
    name: e("name"),
    phone: e("phone"),
    phoneHint: e("phoneHint"),
    country: e("country"),
    create: e("create"),
    creating: e("creating"),
    errors: {
      email: e("errors.email"),
      code: e("errors.code"),
      wrongCode: t("email.errors.wrongCode", { tries: "{tries}" }),
      expired: e("errors.expired"),
      locked: e("errors.locked"),
      disabled: e("errors.disabled"),
      busy: e("errors.busy"),
      unavailable: e("errors.unavailable"),
      name: e("errors.name"),
      phone: e("errors.phone"),
      signUpExpired: e("errors.signUpExpired"),
    },
  };
  const error = ERRORS.find((code) => code === first(params.error)) as LoginError | undefined;
  const deleted = first(params.deleted) === "1";

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("kicker") }]} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-stretch lg:gap-10">
        <section
          aria-labelledby="login-title"
          className="flex flex-col gap-6 rounded-[24px] border border-mist-200 bg-white p-6 md:p-10"
        >
          <header className="flex flex-col gap-3">
            <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
              {t("kicker")}
            </p>
            <h1
              id="login-title"
              className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[40px]"
            >
              {t("title")}
            </h1>
            <p className="max-w-[52ch] text-[16px] leading-relaxed text-mist-700">{t("lead")}</p>
          </header>

          {deleted ? (
            <Alert variant="info">
              <CircleCheck aria-hidden="true" />
              <AlertDescription>{t("deleted")}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="warning" role="alert">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex max-w-sm flex-col gap-3">
            {emailReady ? (
              <EmailSignIn
                labels={emailLabels}
                next={next}
                countries={countries}
                defaultCountry={countries[0]?.code ?? "BD"}
              />
            ) : null}
            {emailReady && config.enabled ? (
              <p className="flex items-center gap-3 text-[13px] font-semibold text-mist-500 uppercase before:h-px before:flex-1 before:bg-mist-200 after:h-px after:flex-1 after:bg-mist-200">
                {t("or")}
              </p>
            ) : null}
            {config.enabled ? <GoogleSignInButton label={t("google")} next={next} /> : null}
            {!emailReady && !config.enabled ? (
              <p className="rounded-2xl bg-mist-50 p-4 text-[15px] leading-relaxed text-mist-700">
                {t("notReady")}
              </p>
            ) : null}
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[15px] font-semibold text-brand-700 underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {t("guest")}
            </Link>
          </div>

          {emailReady || config.enabled ? (
            <p className="flex max-w-[56ch] gap-2 text-[13.5px] leading-relaxed text-mist-600">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-600" />
              {t("privacy")}
            </p>
          ) : null}
        </section>

        <aside className="flex flex-col justify-between gap-8 rounded-[24px] bg-navy-900 p-6 text-white md:p-10">
          <RibbonLine className="w-24" />
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-[22px] font-bold">{t("benefitsTitle")}</h2>
            <ul className="flex flex-col gap-3">
              {[t("benefit1"), t("benefit2"), t("benefit3")].map((benefit) => (
                <li key={benefit} className="flex gap-3 text-[15.5px] leading-snug text-white/85">
                  <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cyan-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

/**
 * /login (issues 134 and 241): an email code (sign-in and sign-up on one screen) and Google when it is on, a guest
 * note otherwise; signed-in visitors go on to My account.
 */
export default function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  return (
    <Suspense
      fallback={
        <main
          id="main"
          aria-busy="true"
          className="site-container flex min-h-dvh flex-col gap-6 pt-6 pb-28"
        >
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-[420px] rounded-[24px]" />
        </main>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

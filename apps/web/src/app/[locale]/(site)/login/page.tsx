import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Check } from "@/components/icons/server/Check";
import { CircleAlert } from "@/components/icons/server/CircleAlert";
import { CircleCheck } from "@/components/icons/server/CircleCheck";
import { ShieldCheck } from "@/components/icons/server/ShieldCheck";
import { GoogleSignInButton } from "@/components/account/GoogleSignInButton";
import { RibbonLine } from "@/components/brand/RibbonLine";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { googleSignInConfig, readAccount } from "@/lib/account/accountApi";
import { SESSION_COOKIE, safeNext } from "@/lib/account/googleOAuth";
import { getSiteSettings } from "@/lib/data/settings";

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

  const [config, t] = await Promise.all([googleSignInConfig(), getTranslations("Account.login")]);
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
            {config.enabled ? (
              <GoogleSignInButton label={t("google")} next={next} />
            ) : (
              <p className="rounded-2xl bg-mist-50 p-4 text-[15px] leading-relaxed text-mist-700">
                {t("notReady")}
              </p>
            )}
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[15px] font-semibold text-brand-700 underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {t("guest")}
            </Link>
          </div>

          {config.enabled ? (
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

/** /login (issue 134): Google sign-in when it is on, a guest note otherwise; signed-in visitors go on to My account. */
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

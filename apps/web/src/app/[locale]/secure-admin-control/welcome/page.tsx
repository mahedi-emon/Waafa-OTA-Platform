import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { WelcomeForm } from "./_components/WelcomeForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.welcome");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

async function Welcome({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/welcome">["searchParams"];
}) {
  const [{ token }, t] = await Promise.all([searchParams, getTranslations("Admin.welcome")]);
  const valid = typeof token === "string" && TOKEN.test(token);
  return valid ? (
    <WelcomeForm
      token={token}
      strings={{
        password: t("password"),
        passwordHint: t("passwordHint"),
        again: t("again"),
        show: t("show"),
        hide: t("hide"),
        submit: t("submit"),
        short: t("short"),
        different: t("different"),
        expired: t("expired"),
        tooMany: t("tooMany"),
        unavailable: t("unavailable"),
      }}
    />
  ) : (
    <div
      role="alert"
      className="rounded-2xl border border-mist-200 bg-white p-5 text-[15px] text-mist-700"
    >
      <p className="font-semibold text-navy-900">{t("badLinkTitle")}</p>
      <p className="mt-1">{t("expired")}</p>
      <Link
        href="/secure-admin-control/sign-in"
        prefetch={false}
        className="mt-3 inline-block font-semibold text-brand-700 hover:underline"
      >
        {t("toSignIn")}
      </Link>
    </div>
  );
}

/** The welcome page an invite email links to (D0 R9): the page's one logo, a short welcome, choose a password. */
export default async function WelcomePage(
  props: PageProps<"/[locale]/secure-admin-control/welcome">,
) {
  const t = await getTranslations("Admin.welcome");
  return (
    <main
      id="main"
      className="flex min-h-dvh items-center justify-center bg-mist-50 px-4 py-10 sm:px-8"
    >
      <div className="flex w-full max-w-[420px] flex-col gap-7">
        <LogoLockup tagline={false} asLink={false} />
        <div>
          <h1 className="font-display text-[26px] leading-tight font-extrabold text-navy-900">
            {t("title")}
          </h1>
          <p className="mt-1.5 text-[15px] text-mist-600">{t("lead")}</p>
        </div>
        <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
          <Welcome searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

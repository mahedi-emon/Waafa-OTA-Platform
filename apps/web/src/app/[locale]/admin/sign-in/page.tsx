import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInForm } from "./_components/SignInForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.signIn");
  return { title: t("metaTitle") };
}

/** Staff sign-in (AdminLogin, AdminLogin-error, AdminLogin-locked, AdminLogin-m boards). */
export default async function SignInPage() {
  const t = await getTranslations("Admin.signIn");
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-mist-50 px-4 py-10">
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <LogoLockup tagline={false} asLink={false} />
        <section className="rounded-3xl border border-mist-200 bg-white p-6 shadow-[0_24px_48px_-32px_rgb(2_13_57/0.35)] md:p-8">
          <h1 className="font-display text-[26px] leading-tight font-extrabold text-navy-900">
            {t("title")}
          </h1>
          <p className="mt-1.5 text-[15px] text-mist-600">{t("lead")}</p>
          <Suspense fallback={<Skeleton className="mt-6 h-[300px] rounded-2xl" />}>
            <SignInForm
              strings={{
                email: t("email"),
                password: t("password"),
                remember: t("remember"),
                submit: t("submit"),
                wrong: t("wrong"),
                lockedTitle: t("lockedTitle"),
                lockedBody: t("lockedBody"),
                unavailable: t("unavailable"),
                missing: t("missing"),
              }}
            />
          </Suspense>
        </section>
        <div className="flex flex-col gap-2 px-1 text-[13.5px] text-mist-600">
          <p>{t("forgot")}</p>
          <p>{t("totp")}</p>
        </div>
      </div>
    </main>
  );
}

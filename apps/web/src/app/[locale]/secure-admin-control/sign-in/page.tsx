import { Suspense } from "react";
import type { Metadata } from "next";
import { Inbox, LayoutTemplate, PackageCheck, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { RibbonBand } from "@/components/brand/RibbonBand";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInForm } from "./_components/SignInForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.signIn");
  return { title: t("metaTitle") };
}

const POINTS: Array<{ key: "inbox" | "website" | "store"; icon: LucideIcon }> = [
  { key: "inbox", icon: Inbox },
  { key: "website", icon: LayoutTemplate },
  { key: "store", icon: PackageCheck },
];

/**
 * Staff sign-in (ADMIN.md, R1): a calm brand panel on midnight from 1024 px, and the form on white with the page's one
 * logo. Clear wrong-password and paused (locked) messages; "Keep me signed in" says what it does.
 */
export default async function SignInPage() {
  const t = await getTranslations("Admin.signIn");
  return (
    <main
      id="main"
      className="grid min-h-dvh bg-mist-50 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
    >
      <section
        aria-labelledby="sign-in-panel"
        className="relative hidden overflow-hidden bg-midnight-950 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-end"
      >
        <RibbonBand className="absolute inset-x-0 top-[18%] h-56 opacity-80" />
        <div className="relative flex max-w-md flex-col gap-6">
          <h2 id="sign-in-panel" className="font-display text-[30px] leading-tight font-extrabold">
            {t("panelTitle")}
          </h2>
          <ul className="flex flex-col gap-4">
            {POINTS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-3 text-[15.5px] text-mist-300">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-400">
                  <Icon aria-hidden="true" className="size-[18px]" />
                </span>
                <span className="pt-1.5">{t(`panelPoints.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-[420px] flex-col gap-7">
          <LogoLockup tagline={false} asLink={false} />
          <div>
            <h1 className="font-display text-[26px] leading-tight font-extrabold text-navy-900">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-[15px] text-mist-600">{t("lead")}</p>
          </div>
          <Suspense fallback={<Skeleton className="h-[340px] rounded-2xl" />}>
            <SignInForm
              strings={{
                email: t("email"),
                password: t("password"),
                showPassword: t("showPassword"),
                hidePassword: t("hidePassword"),
                remember: t("remember"),
                rememberHint: t("rememberHint"),
                submit: t("submit"),
                wrong: t("wrong"),
                wrongTries: t("wrongTries"),
                lockedTitle: t("lockedTitle"),
                lockedBody: t("lockedBody"),
                unavailable: t("unavailable"),
                missing: t("missing"),
              }}
            />
          </Suspense>
          <div className="flex flex-col gap-2 border-t border-mist-200 pt-5 text-[13.5px] text-mist-600">
            <p>{t("forgot")}</p>
            <p>{t("noindex")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

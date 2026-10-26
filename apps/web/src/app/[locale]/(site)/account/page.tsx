import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CircleAlert } from "@/components/icons/server/CircleAlert";
import { LogOut } from "@/components/icons/server/LogOut";
import { PackageOpen } from "@/components/icons/server/PackageOpen";
import { Plane } from "@/components/icons/server/Plane";
import { formatDate, formatTaka } from "@waafa/shared";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { readAccount } from "@/lib/account/accountApi";
import { SESSION_COOKIE } from "@/lib/account/googleOAuth";
import { getSiteSettings } from "@/lib/data/settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account.account");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const h2 = "font-display text-[20px] font-extrabold text-navy-900 md:text-[22px]";
const chip =
  "inline-flex items-center rounded-full bg-electric-50 px-2.5 py-1 text-[12.5px] font-semibold text-navy-900";

/** "Rahim Uddin" → "RU": no profile photo is loaded from Google. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "W"
  );
}

async function AccountContent({
  searchParams,
}: Pick<PageProps<"/[locale]/account">, "searchParams">) {
  const site = await getSiteSettings();
  if (!site.accountsLive) notFound();
  const store = await cookies();
  const account = await readAccount(store.get(SESSION_COOKIE)?.value);
  if (!account) redirect("/login?next=/account");
  const [params, t] = await Promise.all([searchParams, getTranslations("Account.account")]);
  const error = params.error === "confirm" || params.error === "delete" ? params.error : undefined;
  const { customer, requests, orders } = account;

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("kicker") }]} />

      <header className="flex flex-col gap-5 rounded-[24px] bg-navy-900 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10 font-display text-[20px] font-extrabold text-cyan-400"
          >
            {initials(customer.name)}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-[26px] leading-tight font-extrabold break-words md:text-[32px]">
              {t("greeting", { name: customer.name })}
            </h1>
            <p className="text-[14.5px] break-all text-white/75">
              {t("signedInWith", { email: customer.email })}
            </p>
          </div>
        </div>
        {/* Plain posts answered with a 303 (issue 138): the next page loads in full. */}
        <form method="post" action="/api/account/sign-out">
          <Button type="submit" variant="white" className="w-full md:w-auto">
            <LogOut aria-hidden="true" />
            {t("signOut")}
          </Button>
        </form>
      </header>

      {error ? (
        <Alert variant="warning" role="alert">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="account-requests" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="account-requests" className={h2}>
              {t("requestsTitle")}
            </h2>
            <p className="text-[14.5px] break-words text-mist-700">
              {t("requestsLead", { email: customer.email })}
            </p>
          </div>
          {requests.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {requests.map((request) => (
                <li
                  key={request.reference}
                  className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-mist-600">
                      {t(`modules.${request.module as "flights"}`)} ·{" "}
                      <span className="font-mono text-ink-900 tabular-nums">
                        {request.reference}
                      </span>
                    </span>
                    <span className={chip}>{t(`requestStatus.${request.status as "new"}`)}</span>
                  </div>
                  <p className="text-[15.5px] font-semibold text-navy-900">{request.summary}</p>
                  <p className="text-[13px] text-mist-600">
                    {t("sent", { date: formatDate(request.createdAt) })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-2xl bg-mist-50 p-5">
              <Plane aria-hidden="true" className="size-6 text-brand-700" />
              <p className="text-[15px] text-mist-700">{t("requestsEmpty")}</p>
              <Button asChild variant="secondary">
                <Link href="/tour-packages">{t("explore")}</Link>
              </Button>
            </div>
          )}
          <p className="text-[13.5px] leading-relaxed text-mist-600">{t("phoneNote")}</p>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="account-orders" className="flex flex-col gap-4">
            <h2 id="account-orders" className={h2}>
              {t("ordersTitle")}
            </h2>
            {orders.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {orders.map((order) => (
                  <li
                    key={order.reference}
                    className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-semibold text-ink-900 tabular-nums">
                        {order.reference}
                      </span>
                      <span className={chip}>{t(`orderStatus.${order.status as "placed"}`)}</span>
                    </div>
                    <p className="flex flex-wrap justify-between gap-2 text-[14px] text-mist-700">
                      <span>{t("placed", { date: formatDate(order.createdAt) })}</span>
                      <span className="font-semibold text-navy-900 tabular-nums">
                        {t("total", { total: formatTaka(order.total) })}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-2xl bg-mist-50 p-5">
                <PackageOpen aria-hidden="true" className="size-6 text-brand-700" />
                <p className="text-[15px] text-mist-700">{t("ordersEmpty")}</p>
                <Button asChild variant="secondary">
                  <Link href="/shop">{t("shop")}</Link>
                </Button>
              </div>
            )}
          </section>

          <section
            aria-labelledby="account-delete"
            className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
          >
            <h2 id="account-delete" className="font-display text-[17px] font-bold text-navy-900">
              {t("deleteTitle")}
            </h2>
            <p className="text-[14px] leading-relaxed text-mist-700">{t("deleteBody")}</p>
            <form method="post" action="/api/account/delete" className="flex flex-col gap-3">
              <div className="flex min-h-11 items-center gap-3">
                <Checkbox id="account-delete-confirm" name="confirm" value="yes" required />
                <Label htmlFor="account-delete-confirm" className="text-[14.5px] text-ink-900">
                  {t("deleteConfirm")}
                </Label>
              </div>
              <Button type="submit" variant="danger" className="self-start">
                {t("deleteButton")}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

/** /account (issue 134): who is signed in, their requests and orders by verified email, log out, delete account. */
export default function AccountPage({ searchParams }: PageProps<"/[locale]/account">) {
  return (
    <Suspense
      fallback={
        <main
          id="main"
          aria-busy="true"
          className="site-container flex min-h-dvh flex-col gap-6 pt-6 pb-28"
        >
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-[320px] rounded-2xl" />
        </main>
      }
    >
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}
